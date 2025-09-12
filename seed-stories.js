
require('dotenv').config({ path: './frontend/.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};

const storyId = "spotlight-sambit-kumar-mohanty";

const firstStoryData = {
  title: "Artisan Spotlight: Sambit Kumar Mohanty, Master of Handwoven Textiles",
  
  category: "Artisan Spotlights",
  author: "The Artisan's Loom",
  
  heroImageURL: "https://firebasestorage.googleapis.com/v0/b/annular-climate-469215-m0.firebasestorage.app/o/avatars%2Fw3Mdc9rF1LXtOBYb1401MN2dKFb2%2FScreenshot%202025-08-20%20212432.png?alt=media&token=b926055b-131d-4665-81d7-ab737c090edc",
  
  excerpt: "Discover the intricate world of Banarasi weaving through the eyes of Sambit Kumar Mohanty, an artisan dedicated to preserving timeless traditions passed down through generations.",
  
  body: "In the heart of India's rich textile heritage, Sambit Kumar Mohanty practices the age-old art of Banarasi weaving. Each thread he passes through the loom tells a story—a story of family, of dedication, and of a passion for creating beauty that transcends time. For Sambit, this is more than just a craft; it's a legacy. His work is a testament to the intricate patterns and luxurious materials that have made Banarasi textiles cherished for centuries, a tradition he is proud to carry forward for a new generation of admirers.",
  
  featuredProductIds: [
    "7CaOvXRT7jnpSNykSZ23",
    "ZtDnWXLeI2vgqzJg8nUt"
  ],
  
  featuredArtisanId: "w3Mdc9rF1LXtOBYb1401MN2dKFb2",
  
  createdAt: Timestamp.now(),
};

const seedStory = async () => {
    try {
        if (!firebaseConfig.apiKey) {
            throw new Error("Firebase config not found. Is your frontend/.env.local file correct?");
        }

        console.log("Initializing Firebase...");
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        console.log(`Preparing to seed story: "${firstStoryData.title}"...`);
        const storyRef = doc(db, "stories", storyId);
        
        await setDoc(storyRef, firstStoryData);
        
        console.log("\n✅ Story seeding complete! Your first article is now in the 'stories' collection.");

    } catch (error) {
        console.error("\n❌ Error during story seeding:", error);
    } finally {
        process.exit(0);
    }
};

seedStory();