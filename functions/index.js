const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { VertexAI } = require("@google-cloud/vertexai");
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const {Translate} = require('@google-cloud/translate').v2;
const cors = require("cors")({ origin: true });

admin.initializeApp();

const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();
const translate = new Translate();
const corsOptions = { cors: true };
const vertexAi = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: "us-central1",
});
const visionClient = new ImageAnnotatorClient();

const model = "gemini-2.5-pro";

const generativeModel = vertexAi.getGenerativeModel({
  model: model,
  systemInstruction: {
    parts: [
      {
        text: `You are Craft Mitra, a helpful AI assistant for 'The Artisan's Loom'. Your primary job is to help users by calling functions.

        **CRITICAL RULE:** When a user asks to navigate, you MUST prioritize using the 'navigateTo' tool. Do NOT just say you will navigate in words; you MUST call the function.

        - User says: "browse all products" -> Correct action: call \`navigateTo({ path: '/shop' })\`.
        - User says: "go to the craft atlas" -> Correct action: call \`navigateTo({ path: '/regions' })\`.
        - User says: "take me to my dashboard" -> Correct action: call \`navigateTo({ path: '/dashboard' })\`.
        - User says: "I need to sign in" -> Correct action: call \`navigateTo({ path: '/auth' })\`.
        
        **INCORRECT BEHAVIOR (DO NOT DO THIS):**
        - User: "Take me to the shop."
        - You (Incorrect): "Of course, I can take you to the shop." (This is wrong because no function was called).

        **CORRECT BEHAVIOR:**
        - User: "Take me to the shop."
        - You (Correct): Call the function \`navigateTo({ path: '/shop' })\` and respond with a simple confirmation like "Certainly, heading to the shop."`,
      },
    ],
  },
  tools: [
    {
      functionDeclarations: [
        {
          name: "navigateTo",
          description: "Navigates the user to a specific page. Use only the following valid paths: '/shop', '/artisans', '/regions', '/gifting-assistant', '/dashboard', '/add-product', '/cart', '/map.html'. The '/regions' path is also called the 'Craft Atlas'.",
          parameters: {
            type: "OBJECT",
            properties: {
              path: {
                type: "STRING",
                description: "A valid path from the allowed list. For example, to go to the interactive map, use '/map.html'.",
              },
            },
            required: ["path"],
          },
      },
      {
        name: "getArtisanAnalytics",
        description: "Retrieves business analytics for an artisan, including best-selling item and monthly sales data. This function should be called when an artisan asks for insights into their sales performance, such as 'What's my best-selling item?' or 'How were my sales last month?'.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
  ],
});

// ------------------ Gemini Proxy---------------------------
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

// ------------------ Craft Mitra Voice---------------------------
exports.getCraftMitraResponse = onCall(corsOptions, async (request) => {
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
        speechContexts: [{
          phrases: [
            "sign in",
            "dashboard",
            "shop",
            "products",
            "craft atlas",
            "regions",
            "interactive map",
            "add product",
            "my cart",
            "go to",
            "take me to",
            "show me"
          ],
          boost: 15 
        }],
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
  let functionCall=null;

  try {
    const chat = generativeModel.startChat({ history });
    const result = await chat.sendMessage(userTranscript);

    const candidate = result.response.candidates[0];
    if (candidate.content.parts && candidate.content.parts.length > 0) {
      if (candidate.content.parts[0].text) {
        aiResponseText = candidate.content.parts[0].text;
      } else if (candidate.content.parts[0].functionCall) {
        functionCall = candidate.content.parts[0].functionCall;
        if (functionCall.name === "navigateTo" && functionCall.args.path) {
          const pageName = functionCall.args.path.replace(/\//g, ' ').trim() || 'home';
          aiResponseText = `Navigating you to the ${pageName} page.`;
        } else if (functionCall.name === "getArtisanAnalytics") {
          logger.info("Calling getArtisanAnalytics function...");
          if (!request.auth || !request.auth.uid) {
            throw new HttpsError("unauthenticated", "User ID not available.");
          }
          const analyticsResult = await _getArtisanAnalyticsLogic(request.auth.uid);

          let analyticsResponse = "Here are your business insights: ";

          if (analyticsResult.bestSellingItem) {
            analyticsResponse += `Your best-selling item is '${analyticsResult.bestSellingItem.name}' with ${analyticsResult.bestSellingItem.quantitySold} units sold.`;
          } else {
            analyticsResponse += "We couldn't determine your best-selling item yet.";
          }

          if (analyticsResult.monthlySales && analyticsResult.monthlySales.length > 0) {
            analyticsResponse += " For monthly sales: ";
            analyticsResult.monthlySales.forEach((data, index) => {
              analyticsResponse += `${data.month}: ₹${data.sales.toFixed(2)}`;
              if (index < analyticsResult.monthlySales.length - 1) {
                analyticsResponse += ", ";
              } else {
                analyticsResponse += ".";
              }
            });
          } else {
            analyticsResponse += " No monthly sales data available yet.";
          }
          aiResponseText = analyticsResponse;
        } else {
          aiResponseText = "I've performed an action based on your request.";
        }
      }
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
      functionCall: functionCall,
    };
  } catch (error) {
    logger.error("ERROR during speech synthesis:", error);
    throw new HttpsError("internal", "Error during speech synthesis.");
  }
});

// ------------------ Get Artisan Analytics-------------------------
/**
 * Fetches and calculates analytics for a given artisan.
 * @param {string} userId The UID of the artisan to get analytics for.
 * @return {Promise<object>} A promise that resolves to an object containing
 * the best selling item and monthly sales data.
 */
async function _getArtisanAnalyticsLogic(userId) {
  try {
    const [productsSnap, ordersSnap] = await Promise.all([
      admin.firestore().collection("products").where("artisanId", "==", userId).get(),
      admin.firestore().collection("orders").where("artisanIds", "array-contains", userId).get(),
    ]);

    const products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.artisanId === userId) {
          productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        }
      });
    });

    let bestSellingItem = null;
    let maxQuantitySold = 0;
    for (const productId in productSales) {
      if (productSales[productId] > maxQuantitySold) {
        maxQuantitySold = productSales[productId];
        bestSellingItem = products.find((p) => p.id === productId);
      }
    }

    const monthlySales = {}; 
    orders.forEach((order) => {
      if (order.createdAt) {
        const date = order.createdAt.toDate();
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        order.items.forEach((item) => {
          if (item.artisanId === userId) {
            monthlySales[yearMonth] = (monthlySales[yearMonth] || 0) + (item.price * item.quantity);
          }
        });
      }
    });

    const formattedMonthlySales = Object.entries(monthlySales).map(([month, sales]) => ({
      month,
      sales: sales / 100, 
    })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      bestSellingItem: bestSellingItem ? {
        id: bestSellingItem.id,
        name: bestSellingItem.name,
        quantitySold: maxQuantitySold,
      } : null,
      monthlySales: formattedMonthlySales,
    };

  } catch (error) {
    logger.error("Error fetching artisan analytics:", error);
    throw new HttpsError("internal", "Failed to fetch artisan analytics.");
  }
}

exports.getArtisanAnalytics = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to view analytics.");
  }
  const userId = request.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  if (!userDoc.exists || userDoc.data().role !== "artisan") {
    throw new HttpsError("permission-denied", "Only artisans can view analytics.");
  }
  return _getArtisanAnalyticsLogic(userId);
});


// ------------------ Save Conversation---------------------------
exports.saveConversation = onCall(corsOptions, async (request) => {
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

// ------------------ Product Creation ------------------
exports.createProduct = onCall(corsOptions, async (request) => {
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

// -------------------- Product Search ------------------------
exports.searchProducts = onCall(corsOptions, async (request) => {
  const { q, category, region, minPrice, maxPrice, sortBy, materials } = request.data;
  
  let query = admin.firestore().collection("products");

  if (category) query = query.where("category", "==", category.toLowerCase());
  if (region) query = query.where("region", "==", region.toLowerCase());
  if (minPrice) query = query.where("price", ">=", Number(minPrice));
  if (maxPrice) query = query.where("price", "<=", Number(maxPrice));
  if (materials) query = query.where("materials", "array-contains", materials.toLowerCase());

  if (sortBy === 'price_asc') query = query.orderBy('price', 'asc');
  else if (sortBy === 'price_desc') query = query.orderBy('price', 'desc');
  else query = query.orderBy('createdAt', 'desc');

  try {
    const snap = await query.get();
    let products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (q) {
      const searchTerm = q.toLowerCase().trim();
      
      products = products.filter((product) => {
        const productText = `
          ${product.name} 
          ${product.description} 
          ${product.category} 
          ${product.artisanName || ''}
          ${product.region || ''}
          ${(product.materials || []).join(' ')}
        `.toLowerCase();
        
        return productText.includes(searchTerm);
      });
    }
    
    return { products: products };

  } catch (error) {
    logger.error("Error searching products:", error);
    throw new HttpsError("internal", "Failed to search products.", error);
  }
});

// ------------------ Dashboard Summary ----------------------
exports.getDashboardSummary = onCall(corsOptions, async (request) => {
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
      admin.firestore().collection("orders").where("artisanIds", "array-contains", userId).get(),
    ]);
    const totalProducts = productsSnap.size;
    const totalOrders = ordersSnap.size;
    let totalSales = 0;
    ordersSnap.forEach((doc) => {
      const orderData = doc.data();
      orderData.items.forEach((item) => {
        if (item.artisanId === userId) {
            totalSales += item.price * item.quantity;
        }
      });
    });
    const recentOrdersSnap = await admin.firestore().collection("orders").where("artisanIds", "array-contains", userId).orderBy("createdAt", "desc").limit(5).get();
    const recentActivity = recentOrdersSnap.docs.map((doc) => {
      const docData = doc.data();
      return {
        id: doc.id,
        type: "NEW_ORDER",
        customerName: docData.shippingInfo.name, 
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

// ------------------ Review Submission------------------------
exports.submitReview = onCall(corsOptions, async (request) => {
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

// ------------------ Marketing Copy Generation------------------------
exports.generateMarketingCopy = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }
  const userId = request.auth.uid;
  const { productId, targetLanguage } = request.data;
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
    const artisanName = product.artisanName || "a skilled artisan";
    const marketingPrompt = `
      You are a marketing expert for an e-commerce platform selling authentic Indian handicrafts.
      Generate marketing copy for the following product. 
       The tone should be evocative, respectful, and focused on storytelling and craftsmanship.
      Use culturally relevant phrases and highlight the artisan's skill and the product's uniqueness.
      **IMPORTANT: The entire generated JSON response must be in the ${targetLanguage || 'English'} language.**

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

// ------------------ Get Artisan's Products------------------------
exports.getArtisanProducts = onCall(corsOptions, async (request) => {
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

// ------------------ Cart Management-----------------------
exports.updateCart = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to manage your cart.");
  }
  const userId = request.auth.uid;
  const { productId, quantity } = request.data;
  if (!productId || typeof quantity !== 'number' || quantity < 0) {
    throw new HttpsError("invalid-argument", "Invalid product or quantity provided.");
  }
  const cartRef = admin.firestore().collection("users").doc(userId).collection("cart").doc(productId);
  if (quantity === 0) {
    await cartRef.delete();
    return { success: true, message: "Item removed from cart." };
  }
  try {
    const productDoc = await admin.firestore().collection("products").doc(productId).get();
    if (!productDoc.exists) {
      throw new HttpsError("not-found", "Product not found.");
    }
    const productData = productDoc.data();
    if (productData.stock < quantity) {
      throw new HttpsError("out-of-range", `Not enough stock. Only ${productData.stock} items available.`);
    }
    await cartRef.set({
      productId: productId,
      quantity: quantity,
      name: productData.name,
      price: productData.price,
      imageUrl: productData.imageUrl,
      artisanId: productData.artisanId,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: "Cart updated successfully." };
  } catch (error) {
    logger.error("Error updating cart:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Failed to update cart.");
  }
});

// ------------------ Checkout and Order Creation---------------------
exports.createOrder = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to place an order.");
  }
  const userId = request.auth.uid;
  const { shippingInfo } = request.data;
  if (!shippingInfo) {
    throw new HttpsError("invalid-argument", "Missing shipping information.");
  }
  const userCartRef = admin.firestore().collection("users").doc(userId).collection("cart");
  const cartSnap = await userCartRef.get();
  if (cartSnap.empty) {
    throw new HttpsError("failed-precondition", "Your cart is empty.");
  }
  const cartItems = cartSnap.docs.map((doc) => doc.data());
  let orderTotal = 0;
  cartItems.forEach((item) => {
    orderTotal += item.price * item.quantity;
  });
  logger.info(`Simulating successful payment of ${orderTotal} for user ${userId}.`);
  const orderRef = admin.firestore().collection("orders").doc();
  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const productRefs = cartItems.map((item) => admin.firestore().collection("products").doc(item.productId));
      const productDocs = await transaction.getAll(...productRefs);
      productDocs.forEach((doc, index) => {
        const stock = doc.data().stock;
        const requested = cartItems[index].quantity;
        if (stock < requested) {
          throw new HttpsError("out-of-range", `Not enough stock for ${doc.data().name}.`);
        }
      });
      productDocs.forEach((doc, index) => {
        const newStock = doc.data().stock - cartItems[index].quantity;
        transaction.update(doc.ref, { stock: newStock });
      });
      const itemsByArtisan = cartItems.reduce((acc, item) => {
        (acc[item.artisanId] = acc[item.artisanId] || []).push(item);
        return acc;
      }, {});
      transaction.set(orderRef, {
        userId: userId,
        orderTotal: orderTotal,
        items: cartItems,
        itemsByArtisan: itemsByArtisan,
        artisanIds: Object.keys(itemsByArtisan),
        shippingInfo: shippingInfo,
        status: "Processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    const writeBatch = admin.firestore().batch();
    cartSnap.docs.forEach((doc) => writeBatch.delete(doc.ref));
    await writeBatch.commit();
    return { success: true, orderId: orderRef.id };
  } catch (error) {
    logger.error("Order creation failed:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Failed to create order.");
  }
});

// ------------------ Get Orders for Artisan Dashboard----------------------
exports.getArtisanOrders = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to view orders.");
  }
  const userId = request.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  if (!userDoc.exists || userDoc.data().role !== "artisan") {
    throw new HttpsError("permission-denied", "You must be an artisan to view orders.");
  }
  try {
    const ordersRef = admin.firestore().collection("orders");
    const q = ordersRef.where("artisanIds", "array-contains", userId).orderBy("createdAt", "desc");
    const snapshot = await q.get();
    if (snapshot.empty) {
      return { orders: [] };
    }
    const orders = snapshot.docs.map((doc) => {
      const orderData = doc.data();
      const artisanItems = orderData.items.filter((item) => item.artisanId === userId);
      return {
        id: doc.id,
        ...orderData,
        items: artisanItems,
      };
    });
    return { orders };
  } catch (error) {
    logger.error("Error fetching artisan orders:", error);
    throw new HttpsError("internal", "Failed to fetch orders.");
  }
});

// ------------------ Get Cart Contents----------------------
exports.getCart = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to view your cart.");
  }
  const userId = request.auth.uid;
  try {
    const cartRef = admin.firestore().collection("users").doc(userId).collection("cart");
    const snapshot = await cartRef.orderBy("addedAt", "desc").get();
    if (snapshot.empty) {
      return { cart: [] };
    }
    const cartItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { cart: cartItems };
  } catch (error) {
    logger.error("Error fetching cart:", error);
    throw new HttpsError("internal", "Failed to fetch cart.");
  }
});
// ------------- Visual Search for Products ---------------
exports.visualSearchForProducts = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to perform a visual search.");
  }
  
  const imageBase64 = request.data.imageData;
  if (!imageBase64) {
    throw new HttpsError("invalid-argument", "Missing image data.");
  }

  try {
    const [result] = await visionClient.labelDetection({
      image: { content: imageBase64 },
    });
    
    const labels = result.labelAnnotations;
    if (!labels || labels.length === 0) {
      return { products: [] };
    }
    const searchTerms = labels.slice(0, 5).map((label) => label.description.toLowerCase());
    logger.info("Visual search terms detected:", searchTerms);

    // This is a simplified search. For production, Algolia is better.
    const productsRef = admin.firestore().collection("products");
    const snapshot = await productsRef.get();
    
    const matchedProducts = [];
    snapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const productText = `${product.name} ${product.description} ${product.category} ${product.materials.join(' ')}`.toLowerCase();
      
      if (searchTerms.some((term) => productText.includes(term))) {
        matchedProducts.push(product);
      }
    });

    return { products: matchedProducts };

  } catch (error) {
    logger.error("Error during visual search:", error);
    throw new HttpsError("internal", "Failed to analyze image or find products.");
  }
});
// ----------------AI Recommendations-------------------
exports.getAiRecommendations = onCall(
  {
    cors: [
      /localhost:\d{4,5}$/,
      'https://annular-climate-469215-m0.web.app'
    ]
  },
  async (request) => {
    const { mainProduct } = request.data;
    if (!mainProduct || !mainProduct.category || !mainProduct.region) {
      throw new HttpsError("invalid-argument", "A valid main product with category and region is required.");
    }

    try {
      const productsRef = admin.firestore().collection("products");
      const recsQuery = productsRef
        .where('category', '==', mainProduct.category)
        .limit(10);

      const snapshot = await recsQuery.get();
      if (snapshot.empty) {
        return { recommendations: [] };
      }

      const candidateProducts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.region !== mainProduct.region)
        .slice(0, 3);

      if (candidateProducts.length === 0) {
        return { recommendations: [] };
      }
      const prompt = `
        A user is interested in "${mainProduct.name}", a ${mainProduct.category} craft from ${mainProduct.region}.
        Provide compelling, story-driven reasons to recommend the following products:
        ${candidateProducts.map((p) => `- Product Name: ${p.name}, Region: ${p.region}`).join('\n')}
        
        You MUST return your response as a single, raw JSON array of objects. Do not include markdown, greetings, or any other text.
        Each object must have these exact keys: "name" and "reason".
      `;
      const result = await generativeModel.generateContent(prompt);
      const response = result.response;

      if (!response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts[0]) {
        throw new Error("AI returned an empty or invalid response structure.");
      }
      
      const responseText = response.candidates[0].content.parts[0].text;
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      
      if (!jsonMatch) {
        logger.error("Could not find a valid JSON array in the AI's response. Raw response text:", responseText);
        throw new Error("AI response did not contain a valid JSON array.");
      }

      const recommendationsWithReasons = JSON.parse(jsonMatch[0]);
      const finalRecommendations = recommendationsWithReasons.map((rec) => {
          const fullProduct = candidateProducts.find((p) => p.name === rec.name);
          return fullProduct ? { ...fullProduct, reason: rec.reason } : null;
      }).filter(Boolean);

      return { recommendations: finalRecommendations };

    } catch (error) {
      logger.error("FATAL Error in getAiRecommendations:", error);
      throw new HttpsError("internal", "Failed to generate AI recommendations.");
    }
  }
);
// ----------------Dynamic Featured Products-------------------
exports.getFeaturedProducts = onCall(corsOptions, async (request) => {
  try {
    const productsRef = admin.firestore().collection("products");
    const limitNum = 3; 
    const randomId = productsRef.doc().id;
    const query1 = productsRef
      .where(admin.firestore.FieldPath.documentId(), '>=', randomId)
      .limit(limitNum);
      
    const snapshot1 = await query1.get();
    let products = snapshot1.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (products.length < limitNum) {
      const needed = limitNum - products.length;
      const query2 = productsRef
        .where(admin.firestore.FieldPath.documentId(), '<', randomId)
        .limit(needed);
        
      const snapshot2 = await query2.get();
      const moreProducts = snapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      products = [...products, ...moreProducts];
    }

    return { products };

  } catch (error) {
    logger.error("Error fetching featured products:", error);
    throw new HttpsError("internal", "Failed to fetch featured products.");
  }
});

// ----------------Translation Function(product)------------------
exports.translateProduct = onCall(corsOptions, async (request) => {
  const { productId, targetLanguageCode } = request.data;
  if (!productId || !targetLanguageCode) {
    throw new HttpsError("invalid-argument", "Missing required parameters.");
  }

  const productRef = admin.firestore().collection("products").doc(productId);

  try {
    const productDoc = await productRef.get();
    if (!productDoc.exists) {
      throw new HttpsError("not-found", "Product not found.");
    }

    const productData = productDoc.data();
    
    if (productData.translations && productData.translations[targetLanguageCode]) {
      return productData.translations[targetLanguageCode];
    }

    const stringsToTranslate = [productData.name, productData.description];
    const [translations] = await translate.translate(stringsToTranslate, targetLanguageCode);
    
    const translatedData = {
      name: translations[0],
      description: translations[1],
    };

    await productRef.update({
      [`translations.${targetLanguageCode}`]: translatedData
    });

    return translatedData;

  } catch (error) {
    logger.error(`Error translating product ${productId} to ${targetLanguageCode}:`, error);
    throw new HttpsError("internal", "Failed to translate product details.");
  }
});
// -----------------Translation Function-----------------------
exports.getTranslations = onCall(corsOptions, async (request) => {
  const { texts, targetLanguageCode } = request.data;

  if (!Array.isArray(texts) || texts.length === 0 || !targetLanguageCode) {
    throw new HttpsError("invalid-argument", "Invalid request parameters.");
  }

  try {
    const chunkSize = 100; 
    let allTranslations = [];

    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const [translationsChunk] = await translate.translate(chunk, targetLanguageCode);
      allTranslations = [...allTranslations, ...translationsChunk];
    }
    
    return { translations: allTranslations };

  } catch (error) {
    logger.error(`Failed to translate texts to ${targetLanguageCode}:`, error);
    throw new HttpsError("internal", "An error occurred during translation.");
  }
});
// ----------------Fetch Artisans-------------------------------
exports.getFeaturedArtisans = onCall(corsOptions, async (request) => {
  try {
    const usersRef = admin.firestore().collection("users");
    const limitNum = 3;
    const allArtisansSnapshot = await usersRef.where('role', '==', 'artisan').get();
    const totalArtisans = allArtisansSnapshot.size;
    
    if (totalArtisans === 0) {
        return { artisans: [] };
    }
    const randomIndexes = new Set();
    while (randomIndexes.size < Math.min(limitNum, totalArtisans)) {
        randomIndexes.add(Math.floor(Math.random() * totalArtisans));
    }     
    const artisanPromises = Array.from(randomIndexes).map((index) => {
        const randomQuery = usersRef.where('role', '==', 'artisan').limit(1).offset(index);
        return randomQuery.get();
    });

    const randomSnapshots = await Promise.all(artisanPromises);

    const artisans = randomSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || 'Unnamed Artisan',
          photoURL: data.photoURL || null,
          specialization: data.specialization || 'Master Artisan',
          location: data.location || 'India',
          story: data.story || '',
          age: data.age || null
        };
      })
    );

    return { artisans };

  } catch (error) {
    logger.error("Error fetching featured artisans:", error);
    throw new HttpsError("internal", "Failed to fetch featured artisans.");
  }
});
// ----------------Get All Artisans-------------------------
exports.getAllArtisans = onCall(corsOptions, async (request) => {
  try {
    const usersRef = admin.firestore().collection("users");
    const q = usersRef.where('role', '==', 'artisan');
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      return { artisans: [] };
    }
    const artisans = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { 
        id: doc.id,
        displayName: data.displayName || 'Unnamed Artisan',
        photoURL: data.photoURL || null,
        specialization: data.specialization || 'Master Artisan',
        location: data.location || 'India',
      };
    });

    return { artisans };

  } catch (error) {
    logger.error("Error fetching all artisans:", error);
    throw new HttpsError("internal", "Failed to fetch all artisans.");
  }
});
// -----------------get Artisan Profile--------------------------
exports.getArtisanProfile = onCall({ cors: true }, async (request) => {
  const { artisanId } = request.data;
  if (!artisanId) {
    throw new HttpsError("invalid-argument", "An artisanId must be provided.");
  }

  try {
    const firestore = admin.firestore();
    const artisanDocRef = firestore.collection("users").doc(artisanId);
    const artisanDoc = await artisanDocRef.get();

    if (!artisanDoc.exists) {
      throw new HttpsError("not-found", "This artisan could not be found.");
    }

    const artisanData = artisanDoc.data();
    const productsRef = firestore.collection("products");
    const productsQuery = productsRef.where("artisanId", "==", artisanId);
    const productsSnapshot = await productsQuery.get();

    const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return {
      artisan: {
        id: artisanDoc.id,
        displayName: artisanData.displayName,
        photoURL: artisanData.photoURL,
        location: artisanData.location,
        specialization: artisanData.specialization,
        story: artisanData.story,
      },
      products: products,
    };

  } catch (error) {
    logger.error(`Error fetching profile for artisan ${artisanId}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Failed to fetch artisan profile.");
  }
});