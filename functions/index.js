const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { VertexAI } = require('@google-cloud/vertexai');
const cors = require("cors")({ origin: true });

admin.initializeApp();

const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();
const vertexAi = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });

const model = "gemini-2.5-pro";

const generativeModel = vertexAi.getGenerativeModel({
  model: model,
  systemInstruction: {
    parts: [{
      text: "You are Craft Mitra, a friendly and knowledgeable AI assistant for 'The Artisan's Loom', an online marketplace for Indian artisans. Your goal is to help artisans with questions about selling their crafts, using the platform, and getting advice on their art. Respond in a supportive and concise manner.",
    }],
  },
});

// ------------------ Gemini Proxy (Gen 2) ------------------
exports.getGeminiResponseProxy = onRequest((request, response) => {
  cors(request, response, async () => {
    if (request.method !== "POST") {
      return response.status(405).send("Method Not Allowed");
    }
    try {
      const userPrompt = request.body.prompt;
      if (!userPrompt) {
        return response.status(400).json({ error: "Missing prompt." });
      }
      const chat = generativeModel.startChat({});
      const result = await chat.sendMessage(userPrompt);

      const aiResponseText = result.response.candidates[0].content.parts[0].text || "Sorry, I couldn’t generate a response.";
      return response.status(200).json({ response: aiResponseText });
    } catch (error) {
      logger.error("Error in Gemini proxy function:", error);
      return response.status(500).json({ error: error.message });
    }
  });
});

// ------------------ Craft Mitra Voice (Gen 2) ------------------
exports.getCraftMitraResponse = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to use Craft Mitra.");
  }

  const audioBase64 = request.data.audioData;
  if (!audioBase64) {
    throw new HttpsError("invalid-argument", "Missing audio data.");
  }

  // 1. Transcribe Audio to Text
  let userTranscript = "";
  try {
    const transcriptionRequest = {
      audio: { content: audioBase64 },
      config: { encoding: "WEBM_OPUS", sampleRateHertz: 48000, languageCode: "en-US" },
    };
    const [resp] = await speechClient.recognize(transcriptionRequest);
    userTranscript = resp.results.map((r) => r.alternatives[0].transcript).join("\n");
    if (!userTranscript) userTranscript = "I didn't hear anything.";
  } catch (error) {
    logger.error("ERROR during transcription:", error);
    throw new HttpsError("internal", "Error during transcription.");
  }

  // 2. Get AI Response from Text
  let aiResponseText = "Sorry, I couldn't think of a response.";
  try {
    const chat = generativeModel.startChat({});
    const result = await chat.sendMessage(userTranscript);
    if (result.response.candidates[0].content.parts[0].text) {
        aiResponseText = result.response.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    logger.error("ERROR during Vertex AI call:", error);
    throw new HttpsError("internal", "Error getting response from AI model.");
  }

  // 3. Synthesize AI Text to Speech
  try {
    const speechRequest = {
      input: { text: aiResponseText },
      voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
      audioConfig: { audioEncoding: "MP3" },
    };
    const [resp] = await textToSpeechClient.synthesizeSpeech(speechRequest);
    return {
      transcript: userTranscript,
      responseAudio: resp.audioContent.toString("base64"),
    };
  } catch (error) {
    logger.error("ERROR during speech synthesis:", error);
    throw new HttpsError("internal", "Error during speech synthesis.");
  }
});

// ------------------ Product Creation (Gen 2) ------------------
exports.createProduct = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to create a product.");
  }
  const userId = request.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  if (!userDoc.exists || userDoc.data().role !== "artisan") {
    throw new HttpsError("permission-denied", "You must be an artisan to create a product.");
  }

  const { name, description, price, category, stock, imageUrl, region, materials } = request.data;
  if (!name || !description || !price || !category || !stock || !imageUrl) {
    throw new HttpsError("invalid-argument", "Missing required product information.");
  }

  const newProduct = {
    name, description, price: Number(price) * 100, category: category.toLowerCase(),
    stock: Number(stock), imageUrl, region: region ? region.toLowerCase() : "", materials: materials || [],
    artisanId: userId, artisanName: userDoc.data().displayName || userDoc.data().email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(), isFeatured: false,
  };

  try {
    const ref = await admin.firestore().collection("products").add(newProduct);
    return { success: true, productId: ref.id };
  } catch (error) {
    logger.error("Error creating product:", error);
    throw new HttpsError("internal", "Failed to create product.");
  }
});

// ------------------ Product Search (Gen 2) ------------------
exports.searchProducts = onCall(async (request) => {
  const { category, region, minPrice, maxPrice } = request.data;
  let query = admin.firestore().collection("products");

  if (category) {
    query = query.where("category", "==", category.toLowerCase());
  }
  if (region) {
    query = query.where("region", "==", region.toLowerCase());
  }
  if (minPrice) {
    query = query.where("price", ">=", Number(minPrice) * 100);
  }
  if (maxPrice) {
    query = query.where("price", "<=", Number(maxPrice) * 100);
  }

  try {
    const snap = await query.get();
    return { products: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    logger.error("Error searching products:", error);
    throw new HttpsError("internal", "Failed to search products.", error);
  }
});

// ------------------ Dashboard Summary (Gen 2) ------------------
exports.getDashboardSummary = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to view the dashboard.");
  }
  const userId = request.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  if (!userDoc.exists || userDoc.data().role !== "artisan") {
    throw new HttpsError("permission-denied", "You do not have permission to view this dashboard.");
  }

  try {
    const [productsSnap, ordersSnap] = await Promise.all([
      admin.firestore().collection("products").where("artisanId", "==", userId).get(),
      admin.firestore().collection("orders").where("artisanId", "==", userId).get(),
    ]);

    const totalProducts = productsSnap.size;
    const totalOrders = ordersSnap.size;
    let totalSales = 0;
    
    ordersSnap.forEach((doc) => {
      totalSales += doc.data().orderTotal || 0;
    });

    const recentOrdersSnap = await admin.firestore().collection("orders")
      .where("artisanId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const recentActivity = recentOrdersSnap.docs.map((doc) => {
      const docData = doc.data();
      return {
        id: doc.id, type: "NEW_ORDER", customerName: docData.customerName,
        timestamp: docData.createdAt ? docData.createdAt.toDate().toISOString() : null,
      };
    });

    return {
      summaryStats: {
        totalSales: totalSales / 100, totalProducts,
        activeArtisans: 1, totalOrders,
      },
      recentActivity,
    };
  } catch (error) {
    logger.error("Error fetching dashboard summary:", error);
    throw new HttpsError("internal", "Failed to fetch dashboard summary.");
  }
});

// ------------Review Submission (Gen 2)---------------
exports.submitReview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to leave a review.");
  }
  const { artisanId, rating, comment } = request.data;
  const customerId = request.auth.uid;
  const customerName = request.auth.token.name || "Anonymous";

  if (!artisanId || !rating || !comment) {
    throw new HttpsError("invalid-argument", "Missing required review information.");
  }

  try {
    const artisanRef = admin.firestore().collection("users").doc(artisanId);
    const reviewRef = artisanRef.collection("reviews").doc();
    await reviewRef.set({
      rating: Number(rating), comment: comment, customerId: customerId,
      customerName: customerName, createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: "Review submitted successfully!" };
  } catch (error) {
    logger.error("Error submitting review:", error);
    throw new HttpsError("internal", "Failed to submit review.");
  }
});