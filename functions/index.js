const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { logger} = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require('@sendgrid/mail');
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { VertexAI } = require("@google-cloud/vertexai");
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const {Translate} = require('@google-cloud/translate').v2;
const cors = require("cors")({ origin: true });
const { defineSecret } = require('firebase-functions/params');
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();

const FROM_EMAIL = "contact.artisans.loom@gmail.com";

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
        text: `You are Craft Mitra, a helpful AI assistant for 'The Artisan's Loom'. Your primary job is to help users by calling functions and providing relevant information tailored to their role and familiarity with the website.

        **CRITICAL RULE:** When a user asks to navigate, you MUST prioritize using the 'navigateTo' tool. Do NOT just say you will navigate in words; you MUST call the function.

        **ABSOLUTELY CRITICAL CONTEXT RULE:** For every user message in our conversation (past and present), I will explicitly provide your current role and onboarding status within the message (e.g., "[CONTEXT: Role: artisan, Onboarding: complete] My query is: [user's actual query]"). You MUST rely on this explicit context as the SOLE AND AUTHORITATIVE source for the user's status for ALL responses in the conversation. You are explicitly instructed to IGNORE any internal assumptions or previous turns that might contradict this explicit context. If this explicit context indicates a logged-in user (artisan or customer), you MUST NOT ask them to log in or suggest they are unauthenticated. Your responses MUST always be consistent with the status provided in the current message's context.\n\n        **GUIDANCE BASED ON USER ROLE/STATUS (ALWAYS REFER TO THE EXPLICIT CONTEXT IN THE USER MESSAGE):**\n        - If the explicit context indicates an **unfamiliar artisan**: Provide a warm welcome to 'The Artisan's Loom', explain how the platform helps artisans showcase their craft, and offer to guide them through listing their first product. For example, you can say, "I can show you how to add a product if you like. Just ask, 'How do I add a product?'"\n        - If the explicit context indicates a **familiar artisan**: Provide a brief, welcoming message and offer assistance with product management, viewing their profile, or checking analytics.\n        - If the explicit context indicates a **customer**: Provide an engaging welcome to 'The Artisan's Loom', highlight the unique handcrafted products available, explain key sections like "curated collections", "artisans by region", and encourage exploration. For example, you can say, "Explore our diverse range of products by category or discover artisans from specific regions."\n        - If the explicit context indicates an **unauthenticated user**: Politey remind them that they need to log in or sign up to access the full features and personalized assistance of Craft Mitra.

        - User says: "browse all products" -> Correct action: call \`navigateTo({ path: '/shop' })\`.
        - User says: "go to the craft atlas" -> Correct action: call \`navigateTo({ path: '/regions' })\`.
        - User says: "take me to my dashboard" -> Correct action: call \`navigateTo({ path: '/dashboard' })\`.
        - User says: "I need to sign in" -> Correct action: call \`navigateTo({ path: '/auth' })\`.
        - User says: "How do I add a product?" (and is an unfamiliar artisan) -> Correct action: call \`navigateTo({ path: '/add-product' })\` and provide a helpful response like "Certainly, I'll take you to the Add Product page. There you can enter details about your craft."
        - User says: "Take me to the community forum" -> Correct action: call \`navigateTo({ path: '/dashboard/forum' })\`.
        
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
          description: "Navigates the user to a specific page. Use only the following valid paths: '/shop', '/artisans', '/regions', '/gifting-assistant', '/dashboard', '/add-product', '/cart', '/map.html', '/dashboard/forum'. The '/regions' path is also called the 'Craft Atlas'.",
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
            required: [],
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
        "Sorry, I couldn't generate a response.";

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
  const userRole = request.data.userRole; 
  const onboardingComplete = request.data.onboardingComplete; 

  logger.info("Backend received userRole:", userRole);
  logger.info("Backend received onboardingComplete:", onboardingComplete);

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
    let contextPrefix = "";
    if (userRole === 'artisan') {
      contextPrefix = `[CONTEXT: Role: artisan, Onboarding: ${onboardingComplete ? 'complete' : 'incomplete'}]`;
    } else if (userRole === 'customer') {
      contextPrefix = "[CONTEXT: Role: customer]";
    } else {
      contextPrefix = "[CONTEXT: Role: unauthenticated]";
    }

    const contextualizedHistory = history.map((item) => {
      if (item.role === 'user') {
        return { ...item, parts: [{ text: `${contextPrefix} My query is: ${item.parts[0].text}` }] };
      }
      return item;
    });
    const conversationParts = [
      ...contextualizedHistory, 
      { role: 'user', parts: [{ text: `${contextPrefix} My query is: ${userTranscript}` }] }, 
    ];

    logger.info("Conversation parts sent to Gemini.generateContent:", JSON.stringify(conversationParts));
    logger.info("User transcript (raw):", userTranscript);

    const result = await generativeModel.generateContent({ contents: conversationParts });

    const candidate = result.response.candidates[0];
    if (candidate.content.parts && candidate.content.parts.length > 0) {
      if (candidate.content.parts[0].text) {
        aiResponseText = candidate.content.parts[0].text;
      } else if (candidate.content.parts[0].functionCall) {
        functionCall = candidate.content.parts[0].functionCall;
        if (functionCall.name === "navigateTo" && functionCall.args.path) {
          let pageName = functionCall.args.path.replace(/\//g, ' ').trim();
          if (functionCall.args.path === '/dashboard/forum') {
            pageName = 'Community Forum';
          } else if (pageName === '') {
            pageName = 'home';
          }
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

  let requiresManualSort = false;
  if (minPrice || maxPrice) {
      requiresManualSort = true;
      if (minPrice) query = query.where("price", ">=", Number(minPrice));
      if (maxPrice) query = query.where("price", "<=", Number(maxPrice));
  }
  
  if (category) query = query.where("category", "==", category.toLowerCase());
  if (region) query = query.where("region", "==", region.toLowerCase());
  if (materials) query = query.where("materials", "array-contains", materials.toLowerCase());

  if (!requiresManualSort) {
    if (sortBy === 'price_asc') query = query.orderBy('price', 'asc');
    else if (sortBy === 'price_desc') query = query.orderBy('price', 'desc');
    else query = query.orderBy('createdAt', 'desc');
  } else {
    query = query.orderBy('price', 'asc');
  }

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

    if (requiresManualSort && sortBy) {
        if (sortBy === 'price_desc') {
            products.sort((a, b) => b.price - a.price);
        }
        if (sortBy === 'createdAt_desc') {
            products.sort((a, b) => b.createdAt.toMillis() - b.createdAt.toMillis());
        }
    }
    
    if (products.length === 0) {
      logger.info(`No results for query "${q || JSON.stringify(request.data)}", fetching fallback products.`);
      
      const productsRef = admin.firestore().collection("products");
      const randomId = productsRef.doc().id;
      const fallbackQuery = productsRef.where(admin.firestore.FieldPath.documentId(), '>=', randomId).limit(3);
      const fallbackSnap = await fallbackQuery.get();
      
      let fallbackProducts = fallbackSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      if (fallbackProducts.length < 3) {
          const needed = 3 - fallbackProducts.length;
          const wrapQuery = productsRef.where(admin.firestore.FieldPath.documentId(), '<', randomId).limit(needed);
          const wrapSnap = await wrapQuery.get();
          fallbackProducts = [...fallbackProducts, ...wrapSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))];
      }

      return { products: [], recommendations: fallbackProducts };
    }
    
    return { products: products, recommendations: [] };

  } catch (error) {
    logger.error("Error searching products:", error);
    throw new HttpsError("internal", "Failed to search products.", { details: error.message });
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
      const productText = `${product.name} ${product.description} ${product.category} ${product.artisanName || ''}
          ${product.region || ''}
          ${(product.materials || []).join(' ')}
        `.toLowerCase();
      
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
exports.getArtisanProfile = onCall(corsOptions, async (request) => {
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
// ------------------ Customer Dashboard Data ----------------------
exports.getCustomerDashboardData = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  const userId = request.auth.uid;

  try {
    const firestore = admin.firestore();
    const userDoc = await firestore.collection("users").doc(userId).get();
    const displayName = userDoc.exists ? userDoc.data().displayName : "Customer";
    const ordersQuery = firestore.collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(5);
    const ordersSnapshot = await ordersQuery.get();
    const recentOrders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const wishlistRef = firestore.collection("users").doc(userId).collection("wishlist");
    const wishlistSnapshot = await wishlistRef.get();
    const productIds = wishlistSnapshot.docs.map((doc) => doc.id);

    const wishlistItems = [];
    if (productIds.length > 0) {
      const productPromises = [];
      for (let i = 0; i < productIds.length; i += 30) {
        const chunk = productIds.slice(i, i + 30);
        const productsQuery = firestore.collection("products").where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
        productPromises.push(productsQuery);
      }
      
      const productSnapshots = await Promise.all(productPromises);
      productSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          wishlistItems.push({ id: doc.id, ...doc.data() });
        });
      });
    }
    const limitedWishlist = wishlistItems.slice(0, 10);

    return { displayName, recentOrders, wishlistItems: limitedWishlist };

  } catch (error) {
    logger.error(`Error fetching customer dashboard for user ${userId}:`, error);
    throw new HttpsError("internal", "Failed to fetch dashboard data.");
  }
});

// ------------------ Wishlist Management ----------------------
exports.toggleWishlistItem = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  const userId = request.auth.uid;
  const { productId } = request.data;

  if (!productId) {
    throw new HttpsError("invalid-argument", "A productId must be provided.");
  }

  try {
    const wishlistItemRef = admin.firestore().collection("users").doc(userId).collection("wishlist").doc(productId);
    const doc = await wishlistItemRef.get();

    if (doc.exists) {
      await wishlistItemRef.delete();
      return { status: 'removed' };
    } else {
      await wishlistItemRef.set({
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { status: 'added' };
    }
  } catch (error) {
    logger.error(`Error toggling wishlist item ${productId} for user ${userId}:`, error);
    throw new HttpsError("internal", "Failed to update wishlist.");
  }
});
// ------------------ Welcome Email on User Creation ----------------------
exports.sendWelcomeEmail = onDocumentCreated(
  {
    document: "users/{userId}", 
    secrets: [SENDGRID_API_KEY]
  },
  async (event) => {
    sgMail.setApiKey(SENDGRID_API_KEY.value());
    const snapshot = event.data;
    if (!snapshot) {
      logger.error(`No data for user ${event.params.userId}.`);
      return;
    }

    const userData = snapshot.data();
    const email = userData.email; 
    const displayName = userData.displayName || "Friend";

    if (!email) {
      logger.error(`User document ${event.params.userId} is missing an email.`);
      return;
    }

    const msg = {
      to: email,
      from: { name: "The Artisan's Loom", email: FROM_EMAIL },
      subject: "Welcome to The Artisan's Loom!",
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Welcome, ${displayName}!</h2>
          <p>Thank you for joining our community of artisans and art lovers. We are thrilled to have you with us.</p>
          <a href="https://annular-climate-469215-m0.web.app" style="background-color: #d96a3b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Shop Now</a>
          <p>Warmly,<br/>The Artisan's Loom Team</p>
        </div>
      `,
    };
    

    try {
      await sgMail.send(msg);
      return logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      return logger.error(
        "Error sending welcome email:",
        (error.response && error.response.body) || error
      );
    }
  }
);
// ------------------ Order Confirmation Emails ----------------------
exports.sendOrderEmails = onDocumentCreated({
    document: "orders/{orderId}",
    secrets: [SENDGRID_API_KEY]
  }, async (event) => {
    if (!process.env.SENDGRID_API_KEY) {
        logger.error("FATAL: SENDGRID_API_KEY secret is not loaded. Check function configuration.");
        return;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const orderId = event.params.orderId;
  const orderData = event.data.data();

  if (!orderData) {
    logger.error(`No data for order ${orderId}. Exiting function.`);
    return;
  }
  
  logger.info(`START: Processing order ${orderId}...`);

  const customerId = orderData.userId;
  const artisanIds = [...new Set(orderData.items.map((item) => item.artisanId))];
  try {
    const customerDoc = await admin.firestore().collection("users").doc(customerId).get();
    if (customerDoc.exists && customerDoc.data().email) {
      const customerEmail = customerDoc.data().email;
      const customerMsg = {
        to: customerEmail,
        from: { name: 'The Artisan\'s Loom Orders', email: FROM_EMAIL },
        subject: `Your Order #${orderId.substring(0, 8)} is Confirmed!`,
        html: `<div>Your order is confirmed.</div>`, 
      };

      logger.log(`Preparing to send CUSTOMER email for order ${orderId} to ${customerEmail}...`);
      await sgMail.send(customerMsg);
      logger.info(`SUCCESS: Sent CUSTOMER email for order ${orderId} to ${customerEmail}.`);

    } else {
       logger.error(`Data check failed for customer ${customerId} on order ${orderId}. Exists: ${customerDoc.exists}`);
    }
  } catch (error) {
      logger.error(`!!! FAILED TO SEND CUSTOMER EMAIL for order ${orderId} !!!`);
      logger.error("DETAILED SENDGRID ERROR (CUSTOMER):", JSON.stringify(error, null, 2));
  }


  // ---  Handle Artisan Emails ---
  for (const artisanId of artisanIds) {
    try {
        const artisanDoc = await admin.firestore().collection("users").doc(artisanId).get();
        if (artisanDoc.exists && artisanDoc.data().email) {
            const artisanEmail = artisanDoc.data().email;
            const artisanMsg = {
                to: artisanEmail,
                from: { name: 'The Artisan\'s Loom Sales', email: FROM_EMAIL },
                subject: "🎉 You have a new order!",
                html: `<div>You have a new order.</div>`, 
            };

            logger.log(`Preparing to send ARTISAN email for order ${orderId} to ${artisanEmail}...`);
            await sgMail.send(artisanMsg);
            logger.info(`SUCCESS: Sent ARTISAN email for order ${orderId} to ${artisanEmail}.`);

        } else {
            logger.error(`Data check failed for artisan ${artisanId} on order ${orderId}. Exists: ${artisanDoc.exists}`);
        }
    } catch (error) {
        logger.error(`!!! FAILED TO SEND ARTISAN EMAIL for order ${orderId} to artisan ${artisanId} !!!`);
        logger.error("DETAILED SENDGRID ERROR (ARTISAN):", JSON.stringify(error, null, 2));
    }
  }
  
  logger.info(`END: Finished processing order ${orderId}.`);
});
// ------------------ AI Curated Collections ----------------------
exports.getAiCuratedCollection = onCall({ cors: true, timeoutSeconds: 120 }, async (request) => {
  const { theme, budget, language } = request.data;
  if (!theme || !budget || !language) {
    throw new HttpsError("invalid-argument", "Theme, budget, and language are required.");
  }

  try {
    const prompt = `
      You are an expert interior designer and storyteller for "The Artisan's Loom", an Indian craft marketplace.
      A user wants to decorate a room with a budget of ₹${budget} and a theme of "${theme}".
      
      Your task is to act as their personal designer. Suggest 3 to 4 distinct TYPES of authentic Indian craft products that would fit this theme.

      For your response, you MUST generate a cohesive "look book" narrative.
      This entire response, including all names, regions, and reasons, must be in the ${language} language.
      
      Return your response as a single, raw JSON object with two main keys:
      1.  "collectionTitle": A creative and inspiring title for this curated collection.
      2.  "collectionDescription": A compelling paragraph describing how these craft types work together to create the desired theme.
      3.  "suggestedCrafts": An array of objects. Each object must have these three keys:
          - "name": The name of the craft TYPE (e.g., "Blue Pottery Vases", "Vasos de cerámica azul").
          - "region": The primary region it's from (e.g., "from Jaipur, Rajasthan", "de Jaipur, Rajasthan").
          - "reason": A short, evocative sentence explaining why this craft fits the theme.
          - "searchTerm": A simple, effective search query for this craft, **always in English** (e.g., "blue pottery").
      
      Do not include any other text, markdown, or explanations outside of the JSON object.
    `;
    
    const result = await generativeModel.generateContent(prompt);
    const responseText = result.response.candidates[0].content.parts[0].text;
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("AI response for curated collection was not valid JSON. Response:", responseText);
      throw new Error("AI response was not valid JSON.");
    }
    const aiResponse = JSON.parse(jsonMatch[0]);

    return aiResponse;

  } catch (error) {
    logger.error("Error generating AI curated collection:", error);
    throw new HttpsError("internal", "Failed to generate a curated collection.");
  }
});
// ------------------ Forum Post Moderation ----------------------
exports.moderateForumPost = onDocumentCreated("forumPosts/{postId}", async (event) => {
  const postData = event.data.data();
  const contentToCheck = `${postData.title} ${postData.content}`;
  
  const prompt = `
    Analyze the following text from a community forum for artisans. The text is written by artisans and is about arts and crafts.
    Text: "${contentToCheck}"
    Is this text inappropriate for a professional community forum? Consider hate speech, harassment, spam, explicit content, or severe profanity.
    Respond with a single word: "YES" if it is inappropriate, or "NO" if it is acceptable.
  `;

  try {
    const result = await generativeModel.generateContent(prompt);
    let decision = "NO"; 
    if (
      result.response &&
      result.response.candidates &&
      result.response.candidates[0] &&
      result.response.candidates[0].content &&
      result.response.candidates[0].content.parts &&
      result.response.candidates[0].content.parts[0] &&
      result.response.candidates[0].content.parts[0].text
    ) {
      decision = result.response.candidates[0].content.parts[0].text.trim().toUpperCase();
    }

    if (decision === "YES") {
      logger.warn(`Inappropriate post ${event.params.postId} was automatically flagged by AI.`);
      return event.data.ref.update({ isFlagged: true });
    } else {
      return event.data.ref.update({ isModerated: true });
    }
  } catch (error) {
    logger.error(`Error during content moderation for post ${event.params.postId}:`, error);
    return event.data.ref.update({ needsManualReview: true });
  }
});
// ------------------ AI Assistant "Mitra" for Forum ----------------------
exports.checkForMitraMention = onDocumentCreated("forumPosts/{postId}/replies/{replyId}", async (event) => {
  const replyData = event.data.data();
  const replyContent = replyData.content || '';

  if (replyData.isAiResponse || !replyContent.toLowerCase().includes("@mitra")) {
    return null;
  }

  const postId = event.params.postId;
  const authorName = "Craft Mitra (AI Assistant)";
  const authorId = "craft-mitra-ai";
  const authorPhotoURL = "https://firebasestorage.googleapis.com/v0/b/annular-climate-469215-m0.firebasestorage.app/o/Assets%2FGemini_Generated_Image_jrn6ecjrn6ecjrn6.png?alt=media&token=9e112c5b-8d26-42a1-aa40-081b0ab21fa7";

  try {
    const postRef = admin.firestore().collection('forumPosts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      throw new Error(`Original post ${postId} not found.`);
    }
    const postTitle = postDoc.data().title;
    const postContent = postDoc.data().content;

    const repliesRef = postRef.collection('replies');
    const repliesSnapshot = await repliesRef.orderBy('createdAt', 'asc').get();
    
    const conversationContext = repliesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const role = data.isAiResponse ? "AI Assistant" : data.authorName;
        return `${role}: ${data.content}`;
    }).join('\n\n');

    const expertPrompt = `
      You are Craft Mitra, a friendly expert on Indian handicrafts.
      You are participating in a forum discussion. An artisan has asked for your opinion. 
      Your task is to provide a helpful and encouraging answer based on the full context of the discussion.

      **Original Post Title:**
      "${postTitle}"

      **Original Post Content:**
      "${postContent}"

      **Full Conversation History (from oldest to newest):**
      ${conversationContext}

      Based on the original post and the entire conversation so far, provide a detailed and insightful response to the very last message.
    `;
    
    const result = await generativeModel.generateContent(expertPrompt);

    // --- THIS IS THE CORRECTED, "SAFER" WAY TO ACCESS THE RESPONSE ---
    let aiResponse = null;
    if (
      result.response &&
      result.response.candidates &&
      result.response.candidates[0] &&
      result.response.candidates[0].content &&
      result.response.candidates[0].content.parts &&
      result.response.candidates[0].content.parts[0] &&
      result.response.candidates[0].content.parts[0].text
    ) {
      aiResponse = result.response.candidates[0].content.parts[0].text;
    }
    // ------------------------------------------------------------------

    if (!aiResponse) {
      throw new Error("AI generated an empty response.");
    }

    await repliesRef.add({
      content: aiResponse,
      authorId: authorId,
      authorName: authorName,
      authorPhotoURL: authorPhotoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isAiResponse: true,
      parentId: replyData.parentId,
    });
    logger.info(`Craft Mitra successfully responded in post ${postId}.`);

  } catch (error) {
    logger.error(`Error handling @Mitra mention for post ${postId}:`, error);
    const repliesRef = admin.firestore().collection(`forumPosts/${postId}/replies`);
    await repliesRef.add({
      content: "Sorry, I encountered an error and couldn't answer your question. Please try asking again.",
      authorId: authorId,
      authorName: authorName,
      authorPhotoURL: authorPhotoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isAiResponse: true,
      parentId: replyData.parentId,
    });
  }
});
// ------------------ Trending Products ----------------------
exports.getTrendingProducts = onCall({ cors: true }, async (request) => {
  const { filter, limit = 10 } = request.data; 
  if (!filter) {
    throw new HttpsError("invalid-argument", "A 'filter' must be provided.");
  }

  const firestore = admin.firestore();
  const ordersRef = firestore.collection("orders");
  let query = ordersRef;
  const now = new Date();
  let startTime;

  if (filter === 'day') {
    startTime = new Date(now.setDate(now.getDate() - 1));
  } else if (filter === 'week') {
    startTime = new Date(now.setDate(now.getDate() - 7));
  } else if (filter === 'month') {
    startTime = new Date(now.setMonth(now.getMonth() - 1));
  } else if (filter === 'year') {
    startTime = new Date(now.setFullYear(now.getFullYear() - 1));
  }
  
  if (startTime) {
    query = query.where("createdAt", ">=", startTime);
  }
  
  try {
    const ordersSnapshot = await query.get();

    if (ordersSnapshot.empty) {
      return { products: [] };
    }
    const productCounts = new Map();
    
    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const currentCount = productCounts.get(item.productId) || 0;
          productCounts.set(item.productId, currentCount + item.quantity);
        });
      }
    });

    if (productCounts.size === 0) {
      return { products: [] };
    }
    const sortedProductIds = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1]) 
      .slice(0, limit) 
      .map((entry) => entry[0]); 

    if (sortedProductIds.length === 0) {
        return { products: [] };
    }
    const trendingProducts = [];
    const productPromises = [];
    for (let i = 0; i < sortedProductIds.length; i += 30) {
        const chunk = sortedProductIds.slice(i, i + 30);
        const productsQuery = firestore.collection("products").where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
        productPromises.push(productsQuery);
    }
    
    const productSnapshots = await Promise.all(productPromises);
    productSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
            trendingProducts.push({ id: doc.id, ...doc.data() });
        });
    });
    const finalSortedProducts = trendingProducts.sort((a, b) => {
        const countA = productCounts.get(a.id);
        const countB = productCounts.get(b.id);
        return countB - countA;
    });

    return { products: finalSortedProducts };

  } catch (error) {
    logger.error(`Error fetching trending products for filter "${filter}":`, error);
    throw new HttpsError("internal", "Failed to fetch trending products.");
  }
});

// ------------------ Trending Insights ----------------------
exports.getTrendingInsights = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const { trendingProducts, filter, language } = request.data;
  if (!Array.isArray(trendingProducts) || trendingProducts.length === 0 || !filter || !language) {
    throw new HttpsError("invalid-argument", "Missing required parameters: trendingProducts, filter, and language.");
  }

  const productNames = trendingProducts.map((p) => `"${p.name}"`).join(', ');
  const prompt = `
    You are 'Craft Mitra', an AI market analyst and cultural expert for 'The Artisan's Loom', an Indian craft marketplace.
    Your task is to write a short, insightful, and engaging market report (2-3 sentences) based on the current trending products.
    The entire response must be in the ${language} language.

    **Current Context:**
    - The filter applied is: "${filter}"
    - The top trending products are: ${productNames}
    - The current date is: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

    **Your Instructions:**
    - Analyze the list of trending products.
    - Identify any potential seasonal, cultural, or regional themes. For example, if it's October and 'Diyas' are trending, explain the connection to Diwali. If 'Pashmina Shawls' are trending in winter, explain the seasonal demand. If 'Blue Pottery' and 'Block Printing' are trending for Rajasthan, explain their shared heritage.
    - If no obvious theme exists, simply highlight the popularity of the craftsmanship.
    - Your tone should be warm, insightful, and encouraging.
    - **CRITICAL:** Respond with ONLY the single paragraph of the market report. Do not include greetings, titles, or any other text.
  `;

  try {
    const result = await generativeModel.generateContent(prompt);
    
    let insightText = "Our artisans' incredible work continues to captivate our community. Discover the pieces everyone is talking about!";
    if (
      result.response &&
      result.response.candidates &&
      result.response.candidates[0] &&
      result.response.candidates[0].content &&
      result.response.candidates[0].content.parts &&
      result.response.candidates[0].content.parts[0] &&
      result.response.candidates[0].content.parts[0].text
    ) {
      insightText = result.response.candidates[0].content.parts[0].text;
    }

    return { insight: insightText };

  } catch (error) {
    logger.error("Error generating trending insights:", error);
    throw new HttpsError("internal", "Failed to generate market insights.");
  }
});
// ------------------ Process Voice Listing ----------------------
exports.processVoiceListing = onCall({ cors: true, timeoutSeconds: 180 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }
  
  const { audioData, languageCode } = request.data;
  if (!audioData || !languageCode) {
    throw new HttpsError("invalid-argument", "Missing audioData or languageCode.");
  }

  try {
    logger.info(`Transcribing audio for language: ${languageCode}`);
    const transcriptionRequest = {
      audio: { content: audioData },
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
      },
    };
    const [transcriptionResponse] = await speechClient.recognize(transcriptionRequest);
    const originalTranscript = transcriptionResponse.results
      .map((result) => result.alternatives[0].transcript)
      .join('\n');

    if (!originalTranscript) {
      throw new HttpsError("not-found", "Could not understand the audio. Please try speaking more clearly.");
    }
    logger.info(`Original transcript (${languageCode}): ${originalTranscript}`);

    let englishTranscript = originalTranscript;
    if (languageCode !== 'en-IN') {
        logger.info("Translating transcript to English...");
        const [translateResponse] = await translate.translate(originalTranscript, 'en');
        englishTranscript = translateResponse;
        logger.info(`Translated transcript (en): ${englishTranscript}`);
    }

    logger.info("Extracting product data with Gemini AI...");

    const extractionPrompt = `
      You are an AI assistant for an e-commerce platform. Your task is to extract structured product information from the following text, which is a spoken description from an artisan. Extract the data into a valid JSON object.

      **Artisan's Description:**
      "${englishTranscript}"

      **Instructions:**
      - "name": A concise, marketable product name.
      - "description": A well-written, engaging product description based on the artisan's words.
      - "price": An integer representing the price in Indian Rupees (₹). If they say "two thousand eight hundred", extract 2800.
      - "stock": An integer representing the available quantity.
      - "category": Intelligently determine the most appropriate craft category (e.g., "Pottery", "Weaving", "Pashmina Shawl", "Wood Carving"). This should be a human-readable string.
      - "region": Extract the specific region, state, or city of origin mentioned (e.g., "Kashmir", "Uttar Pradesh", "Jaipur"). This should be a human-readable string.
      - "materials": An array of strings of the raw materials mentioned (e.g., ["silk", "zari", "cotton"]).
      
      Respond with ONLY the raw JSON object. Do not include any other text, greetings, or markdown formatting.
    `;

    const result = await generativeModel.generateContent(extractionPrompt);
    const responseText = result.response.candidates[0].content.parts[0].text;
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("AI data extraction failed to return valid JSON. Response:", responseText);
      throw new Error("Could not structure the product information from your description.");
    }
    
    const extractedData = JSON.parse(jsonMatch[0]);
    return { productData: extractedData };

  } catch (error) {
    logger.error("Error in processVoiceListing function:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message || "An unexpected error occurred.");
  }
});
// ------------------ AI Listing Suggestions ----------------------
exports.getListingSuggestions = onCall({ cors: true, timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
  }
  
  const { productDraft, language } = request.data;
  if (!productDraft || !language) {
    throw new HttpsError("invalid-argument", "A 'productDraft' object and 'language' must be provided.");
  }

  try {
    logger.info("Generating listing suggestions for:", productDraft.name);
    const expertPrompt = `
      You are an expert e-commerce copywriter and market analyst for "The Artisan's Loom," a marketplace for authentic Indian handicrafts. Your task is to help an artisan improve their product listing.

      **Artisan's Draft Listing:**
      - Title: "${productDraft.name}"
      - Description: "${productDraft.description}"
      - Category: "${productDraft.category}"
      - Materials: "${productDraft.materials.join(', ')}"
      - Region: "${productDraft.region}"

      **Your Instructions:**
      Based on the draft, generate the following content in the **${language}** language. Your tone should be warm, encouraging, and professional.

      1.  **"suggestedTitles"**: Provide an array of exactly 3 creative, evocative, and SEO-friendly alternative titles. These should be more descriptive and appealing than the original.
      2.  **"improvedDescription"**: Rewrite the description to be more story-driven. Focus on the heritage, the artisan's skill, and the sensory experience of the product. Keep it concise (around 2-3 short paragraphs).
      3.  **"pricingAnalysis"**: Provide a short paragraph of friendly pricing advice. Based on the product type, materials, and category, suggest a typical market price range in Indian Rupees (₹). Conclude with a suggested price for this platform that is fair to both the artisan and the customer.

      **CRITICAL:** Respond with ONLY the raw JSON object containing the three keys: "suggestedTitles", "improvedDescription", and "pricingAnalysis". Do not include any other text, greetings, or markdown formatting.
    `;

    const result = await generativeModel.generateContent(expertPrompt);
    const responseText = result.response.candidates[0].content.parts[0].text;
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("AI suggestions failed to return valid JSON. Response:", responseText);
      throw new Error("Could not generate suggestions from your product description.");
    }
    
    const suggestions = JSON.parse(jsonMatch[0]);

    return { suggestions };

  } catch (error) {
    logger.error("Error in getListingSuggestions function:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message || "An unexpected error occurred while generating suggestions.");
  }
});
// ------------------ Update Reply Count on New Reply ----------------------
exports.updateReplyCountOnCreate = onDocumentCreated("forumPosts/{postId}/replies/{replyId}", async (event) => {
    const postRef = admin.firestore().collection('forumPosts').doc(event.params.postId);
    try {
        await postRef.update({ replyCount: FieldValue.increment(1) });
        logger.info(`Successfully incremented reply count for post ${event.params.postId}.`);
    } catch (error) {
        logger.error(`Error incrementing reply count for post ${event.params.postId}:`, error);
    }
});
// ------------------ Update Reply Count on Reply Deletion ----------------------
exports.updateReplyCountOnDelete = onDocumentDeleted("forumPosts/{postId}/replies/{replyId}", async (event) => {
    const postRef = admin.firestore().collection('forumPosts').doc(event.params.postId);
    try {
        await postRef.update({ replyCount: FieldValue.increment(-1) });
        logger.info(`Successfully decremented reply count for post ${event.params.postId}.`);
    } catch (error) {
        logger.error(`Error decrementing reply count for post ${event.params.postId}:`, error);
    }
});
// ------------------ Delete Product ----------------------
exports.deleteProduct = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to delete a product.");
  }
  
  const userId = request.auth.uid;
  const { productId } = request.data;

  if (!productId) {
    throw new HttpsError("invalid-argument", "A 'productId' must be provided.");
  }

  const firestore = admin.firestore();
  const storage = admin.storage();
  const productRef = firestore.collection("products").doc(productId);

  try {
    const productDoc = await productRef.get();
    if (!productDoc.exists) {
      throw new HttpsError("not-found", "The product you are trying to delete does not exist.");
    }
    
    const productData = productDoc.data();

    if (productData.artisanId !== userId) {
      throw new HttpsError("permission-denied", "You do not have permission to delete this product.");
    }
    const imageUrl = productData.imageUrl;
    const filePathRegex = /o\/(.*?)\?/; 
    const matches = imageUrl.match(filePathRegex);
    
    if (matches && matches[1]) {
      const filePath = decodeURIComponent(matches[1]);
      const fileRef = storage.bucket().file(filePath);
      
      try {
        await fileRef.delete();
        logger.info(`Successfully deleted image from Storage: ${filePath}`);
      } catch (storageError) {
        logger.error(`Failed to delete image from Storage: ${filePath}`, storageError);
      }
    } else {
      logger.warn(`Could not extract file path from imageUrl for product ${productId}: ${imageUrl}`);
    }

    await productRef.delete();
    
    logger.info(`Successfully deleted product ${productId} by user ${userId}.`);
    
    return { success: true, message: "Product deleted successfully." };

  } catch (error) {
    logger.error(`Error deleting product ${productId} by user ${userId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An unexpected error occurred while deleting the product.");
  }
});