const functions = require("firebase-functions");
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


// ------------------ Gemini Proxy ------------------
exports.getGeminiResponseProxy = functions.https.onRequest((request, response) => {
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

      let aiResponseText = "Sorry, I couldn’t generate a response.";
      if (result && result.response && result.response.candidates && result.response.candidates[0] && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts[0]) {
        aiResponseText = result.response.candidates[0].content.parts[0].text;
      }

      return response.status(200).json({ response: aiResponseText });
    } catch (error) {
      console.error("Error in Gemini proxy function:", error);
      return response.status(500).json({ error: error.message });
    }
  });
});


// ------------------ Craft Mitra Voice ------------------
exports.getCraftMitraResponse = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to use Craft Mitra.");
  }

  const audioBase64 = data.audioData;
  if (!audioBase64) {
    throw new functions.https.HttpsError("invalid-argument", "Missing audio data.");
  }

  const transcriptionRequest = {
    audio: { content: audioBase64 },
    config: {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: "en-US",
    },
  };

  let userTranscript = "";
  try {
    const [resp] = await speechClient.recognize(transcriptionRequest);
    userTranscript = resp.results.map((r) => r.alternatives[0].transcript).join("\n");
    if (!userTranscript) {
      userTranscript = "I didn't hear anything.";
    }
  } catch (error) {
    console.error("ERROR during transcription:", error);
    throw new functions.https.HttpsError("internal", "Error during transcription.");
  }

  let aiResponseText = "Sorry, I couldn't think of a response.";
  try {
    const chat = generativeModel.startChat({});
    const result = await chat.sendMessage(userTranscript);
    if (result && result.response && result.response.candidates && result.response.candidates[0] && result.response.candidates[0].content && result.response.candidates[0].content.parts && result.response.candidates[0].content.parts[0]) {
      aiResponseText = result.response.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    console.error("ERROR during Vertex AI call:", error);
    throw new functions.https.HttpsError("internal", "Error getting response from AI model.");
  }

  const speechRequest = {
    input: { text: aiResponseText },
    voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
    audioConfig: { audioEncoding: "MP3" },
  };

  try {
    const [resp] = await textToSpeechClient.synthesizeSpeech(speechRequest);
    return {
      transcript: userTranscript,
      responseAudio: resp.audioContent.toString("base64"),
    };
  } catch (error) {
    console.error("ERROR during speech synthesis:", error);
    throw new functions.https.HttpsError("internal", "Error during speech synthesis.");
  }
});


// ------------------ Product Creation ------------------
exports.createProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a product.");
  }

  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  if (!userDoc.exists() || userDoc.data().role !== "artisan") {
    throw new functions.https.HttpsError("permission-denied", "You must be an artisan to create a product.");
  }

  const { name, description, price, category, stock, imageUrl, region, materials } = data;
  if (!name || !description || !price || !category || !stock || !imageUrl) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required product information.");
  }

  const newProduct = {
    name,
    description,
    price: Number(price) * 100,
    category: category.toLowerCase(),
    stock: Number(stock),
    imageUrl,
    region: region ? region.toLowerCase() : "",
    materials: materials || [],
    artisanId: userId,
    artisanName: userDoc.data().displayName || userDoc.data().email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isFeatured: false,
  };

  try {
    const ref = await admin.firestore().collection("products").add(newProduct);
    return { success: true, productId: ref.id };
  } catch (error) {
    console.error("Error creating product:", error);
    throw new functions.https.HttpsError("internal", "Failed to create product.");
  }
});


// ------------------ Product Search ------------------
exports.searchProducts = functions.https.onCall(async (data, context) => {
  const { category, region, minPrice, maxPrice } = data;
  let query = admin.firestore().collection("products");

  if (category) {
    query = query.where("category", "==", category.toLowerCase());
  }
  if (region) {
    query = query.where("region", "==", region.toLowerCase());
  }
  if (minPrice) {
    query = query.where("price", ">=", minPrice);
  }
  if (maxPrice) {
    query = query.where("price", "<=", maxPrice);
  }

  try {
    const snap = await query.get();
    return { products: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    console.error("Error searching products:", error);
    throw new functions.https.HttpsError("internal", "Failed to search products.", error);
  }
});


// ------------------ Dashboard Summary ------------------
exports.getDashboardSummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to view the dashboard.");
  }

  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  if (!userDoc.exists() || userDoc.data().role !== "artisan") {
    throw new functions.https.HttpsError("permission-denied", "You do not have permission to view this dashboard.");
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
        id: doc.id,
        type: "NEW_ORDER",
        customerName: docData.customerName,
        timestamp: docData.createdAt ? docData.createdAt.toDate().toISOString() : null,
      };
    });

    return {
      summaryStats: {
        totalSales: totalSales / 100,
        totalProducts,
        activeArtisans: 1,
        totalOrders,
      },
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch dashboard summary.");
  }
});

//------------Review Submission---------------

exports.submitReview = functions.https.onCall(async (request) => {
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
      rating: Number(rating),
      comment: comment,
      customerId: customerId,
      customerName: customerName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Review submitted successfully!" };

  } catch (error) {
    console.error("Error submitting review:", error);
    throw new HttpsError("internal", "Failed to submit review.");
  }
});

