const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");

admin.initializeApp();

const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();

// --- LOGIC FOR createProduct RESTORED ---
exports.createProduct = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a product.");
  }

  // 2. Authorization Check
  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  
  if (!userDoc.exists() || userDoc.data().role !== 'artisan') {
    throw new functions.https.HttpsError("permission-denied", "You must be an artisan to create a product.");
  }

  // 3. Data Validation
  const { name, description, price, category, stock, imageUrl, region, materials } = data;
  if (!name || !description || !price || !category || !stock || !imageUrl) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required product information.");
  }

  // 4. Create the Product Document
  const newProduct = {
    name,
    description,
    price: Number(price) * 100,
    category: category.toLowerCase(),
    stock: Number(stock),
    imageUrl,
    region: region.toLowerCase(),
    materials: materials || [],
    artisanId: userId,
    artisanName: userDoc.data().displayName || userDoc.data().email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isFeatured: false,
  };

  try {
    const productRef = await admin.firestore().collection("products").add(newProduct);
    console.log(`New product created with ID: ${productRef.id} by artisan ${userId}`);
    return { success: true, productId: productRef.id };
  } catch (error) {
    console.error("Error creating product:", error);
    throw new functions.https.HttpsError("internal", "Failed to create product.");
  }
});


// --- transcribeAudio FUNCTION ---
exports.transcribeAudio = functions.https.onCall(async (request) => {
  const audioBase64 = request.data.audioData;

  if (!audioBase64 || typeof audioBase64 !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Request must include a valid 'audioData' string.");
  }

  const transcriptionRequest = {
    audio: { content: audioBase64 },
    config: {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: "en-US",
    },
  };

  let transcription = "";
  try {
    const [response] = await speechClient.recognize(transcriptionRequest);
    if (response.results && response.results.length > 0) {
      transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
    } else {
      return { transcript: "", responseAudio: null };
    }
  } catch (error) {
    console.error("ERROR during transcription:", error);
    throw new functions.https.HttpsError("internal", "Error during transcription.");
  }

  const responseText = `I heard you say: ${transcription}. How can I help with that?`;
  const speechRequest = {
    input: { text: responseText },
    voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await textToSpeechClient.synthesizeSpeech(speechRequest);
    const responseAudio = response.audioContent.toString('base64');
    return { transcript: transcription, responseAudio: responseAudio };
  } catch (error) {
    console.error("ERROR during speech synthesis:", error);
    throw new functions.https.HttpsError("internal", "Error during speech synthesis.");
  }
});

exports.searchProducts = functions.https.onCall(async (data, context) => {
  const { category, region, minPrice, maxPrice } = data;

  let query = admin.firestore().collection('products');

  if (category) {
    query = query.where('category', '==', category);
  }
  if (region) {
    query = query.where('region', '==', region);
  }
  if (minPrice) {
    query = query.where('price', '>=', minPrice);
  }
  if (maxPrice) {
    query = query.where('price', '<=', maxPrice);
  }

  try {
    const snapshot = await query.get();
  const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { products };

  } catch (error) {
    console.error("Error searching products:", error);
    throw new functions.https.HttpsError('internal', 'Failed to search products.', error);
  }
});