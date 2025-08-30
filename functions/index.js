const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { VertexAI } = require("@google-cloud/vertexai");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();
const vertexAi = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: "us-central1",
});

const model = "gemini-2.5-pro";

const generativeModel = vertexAi.getGenerativeModel({
  model: model,
  systemInstruction: {
    parts: [
      {
        text: "You are Craft Mitra, a friendly and knowledgeable AI assistant for 'The Artisan's Loom', an online marketplace for Indian artisans. Your goal is to help artisans with questions about selling their crafts, using the platform, and getting advice on their art. Respond in a supportive and concise manner.",
      },
    ],
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

      const aiResponseText =
        result.response.candidates[0].content.parts[0].text ||
        "Sorry, I couldn’t generate a response.";

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
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to use Craft Mitra."
    );
  }

  const audioBase64 = request.data.audioData;
  const history = request.data.history || [];

  if (!audioBase64) {
    throw new HttpsError("invalid-argument", "Missing audio data.");
  }

  let userTranscript = "";

  try {
    const languageCode = request.data.languageCode || "en-IN";
    const voiceName = request.data.voiceName || "en-IN-Wavenet-C";

    const transcriptionRequest = {
      audio: { content: audioBase64 },
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: languageCode,
        alternativeLanguageCodes: ["en-IN", "hi-IN", "bn-IN", "ta-IN", "mr-IN"],
        enableAutomaticPunctuation: true,
      },
    };

    const [resp] = await speechClient.recognize(transcriptionRequest);
    logger.info("Speech-to-Text API Response:", JSON.stringify(resp));
    userTranscript = resp.results
      .map((r) => r.alternatives[0].transcript)
      .join("\n");

    if (!userTranscript || userTranscript.trim() === "") {
      userTranscript = "I didn't hear anything.";
      logger.info("Transcription was empty, skipping AI call.");

      const speechRequest = {
        input: { text: "I didn't quite catch that, could you please say it again?" },
        voice: { languageCode: languageCode, name: voiceName },
        audioConfig: { audioEncoding: "MP3" },
      };

      const [ttsResponse] = await textToSpeechClient.synthesizeSpeech(speechRequest);

      return {
        transcript: userTranscript,
        responseText: "I didn't quite catch that, could you please say it again?",
        responseAudio: ttsResponse.audioContent.toString("base64"),
      };
    }
  } catch (error) {
    logger.error("ERROR during transcription:", error);
    throw new HttpsError("internal", "Error during transcription.");
  }

  let aiResponseText = "Sorry, I couldn't think of a response.";

  try {
    const chat = generativeModel.startChat({ history });
    const result = await chat.sendMessage(userTranscript);

    if (result.response.candidates[0].content.parts[0].text) {
      aiResponseText = result.response.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    logger.error("ERROR during Vertex AI call:", error);

    if (error.response) {
      logger.error("Vertex AI response details:", JSON.stringify(error.response));
    }

    throw new HttpsError("internal", "Error getting response from AI model.");
  }

  try {
    const languageCode = request.data.languageCode || "en-IN";
    const voiceName = request.data.voiceName || "en-IN-Wavenet-C";

    const speechRequest = {
      input: { text: aiResponseText },
      voice: { languageCode: languageCode, name: voiceName },
      audioConfig: { audioEncoding: "MP3" },
    };

    const [resp] = await textToSpeechClient.synthesizeSpeech(speechRequest);

    return {
      transcript: userTranscript,
      responseText: aiResponseText,
      responseAudio: resp.audioContent.toString("base64"),
    };
  } catch (error) {
    logger.error("ERROR during speech synthesis:", error);
    throw new HttpsError("internal", "Error during speech synthesis.");
  }
});

// ------------------ Save Conversation (Gen 2) ------------------
exports.saveConversation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to save a conversation.");
  }

  const userId = request.auth.uid;
  const { history } = request.data;

  if (!history || !Array.isArray(history) || history.length === 0) {
    logger.info("Skipping save for empty history.");
    return { success: true, message: "No history to save." };
  }

  try {
    const conversationCollection = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("conversations");

    await conversationCollection.add({
      history,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    logger.error("Error saving conversation:", error);
    throw new HttpsError("internal", "Failed to save conversation.");
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

  const { name, description, price, category, stock, imageUrl, region, materials } =
    request.data;

  if (!name || !description || !price || !category || !stock || !imageUrl) {
    throw new HttpsError("invalid-argument", "Missing required product information.");
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
    logger.error("Error creating product:", error);
    throw new HttpsError("internal", "Failed to create product.");
  }
});

// ------------------ Product Search (Gen 2) ------------------
exports.searchProducts = onCall(async (request) => {
  const { category, region, minPrice, maxPrice, sortBy, materials } = request.data;

  let query = admin.firestore().collection("products");

  if (category) {
    query = query.where("category", "==", category.toLowerCase());
  }
  if (region) {
    query = query.where("region", "==", region.toLowerCase());
  }
  if (minPrice) {
    query = query.where("price", ">=", Number(minPrice));
  }
  if (maxPrice) {
    query = query.where("price", "<=", Number(maxPrice));
  }
  if (materials) {
    query = query.where("materials", "array-contains", materials.toLowerCase());
  }

  if (sortBy === 'price_asc') {
    query = query.orderBy('price', 'asc');
  } else if (sortBy === 'price_desc') {
    query = query.orderBy('price', 'desc');
  } else {
    query = query.orderBy('createdAt', 'desc');
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

    const recentOrdersSnap = await admin
      .firestore()
      .collection("orders")
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
    logger.error("Error fetching dashboard summary:", error);
    throw new HttpsError("internal", "Failed to fetch dashboard summary.");
  }
});

// ------------------ Review Submission (Gen 2) ------------------
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
      rating: Number(rating),
      comment: comment,
      customerId: customerId,
      customerName: customerName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Review submitted successfully!" };
  } catch (error) {
    logger.error("Error submitting review:", error);
    throw new HttpsError("internal", "Failed to submit review.");
  }
});

// ------------------ Marketing Copy Generation (Gen 2) ------------------
exports.generateMarketingCopy = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }

  const userId = request.auth.uid;
  const { productId } = request.data;

  if (!productId) {
    throw new HttpsError("invalid-argument", "Missing productId.");
  }

  try {
    const productRef = admin.firestore().collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new HttpsError("not-found", "Product not found.");
    }

    if (productDoc.data().artisanId !== userId) {
      throw new HttpsError("permission-denied", "You can only generate copy for your own products.");
    }

    const product = productDoc.data();
    // eslint-disable-next-line no-unused-vars
    const artisanName = product.artisanName || "a skilled artisan";

    const marketingPrompt = `
      You are a marketing expert for an e-commerce platform selling authentic Indian handicrafts called "The Artisan's Loom".
      Generate marketing copy for the following product. The tone should be evocative, respectful, and focused on storytelling and craftsmanship.

      Product Details:
      - Name: ${product.name}
      - Description: ${product.description}
      - Category: ${product.category}
      - Materials: ${product.materials.join(", ")}
      - Region of Origin: ${product.region}
      - Artisan's Name: ${artisanName}

      Generate the following content, formatted as a single, clean JSON object with four keys: "title", "productDescription", "socialMediaPost", and "emailSubject".
      1. "title": A creative and catchy product title (under 10 words).
      2. "productDescription": A compelling 2-paragraph product description for an e-commerce website.
      3. "socialMediaPost": A short, engaging post for Instagram or Facebook, including 3-5 relevant hashtags.
      4. "emailSubject": An array of three creative and enticing subject line strings for an email marketing campaign.

      Important: Respond with only the raw JSON object. Do not include any introductory text, greetings, explanations, or markdown formatting like \`\`\`json.
    `;

    const result = await generativeModel.generateContent(marketingPrompt);
    const responseText = result.response.candidates[0].content.parts[0].text;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("AI response did not contain a valid JSON object:", responseText);
      throw new HttpsError("internal", "AI response was not in the expected format.");
    }

    const cleanedJson = jsonMatch[0];
    const marketingData = JSON.parse(cleanedJson);

    await productRef.update({
      marketingCopy: marketingData,
      hasGeneratedCopy: true,
    });

    return marketingData;
  } catch (error) {
    logger.error("Error generating marketing copy:", error);
    throw new HttpsError("internal", "Failed to generate or parse marketing copy.");
  }
});

// ------------------ Get Artisan's Products (Gen 2) ------------------
exports.getArtisanProducts = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to view your products.");
  }

  const userId = request.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();

  if (!userDoc.exists || userDoc.data().role !== "artisan") {
    throw new HttpsError("permission-denied", "Only artisans can view their products.");
  }

  try {
    const productsRef = admin.firestore().collection("products");
    const q = productsRef.where("artisanId", "==", userId).orderBy("createdAt", "desc");
    const snapshot = await q.get();

    if (snapshot.empty) {
      return { products: [] };
    }

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { products: products };
  } catch (error) {
    logger.error("Error fetching artisan products:", error);
    throw new HttpsError("internal", "Failed to fetch products.");
  }
});