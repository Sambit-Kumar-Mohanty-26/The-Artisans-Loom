require('dotenv').config({ path: './frontend/.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Build the Firebase config object using the securely loaded environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID
};

// Define the categories you want to create in your database
const categoriesToSeed = [
    { name: "Techniques & Craftsmanship" },
    { name: "Business & Marketing Advice" },
    { name: "Sourcing Materials" },
    { name: "Events & Exhibitions" },
    { name: "General Discussion" },
];

// The main function that runs the seeding process
const seedDatabase = async () => {
    try {
        // Check if the Firebase configuration was loaded correctly
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.error("\n❌ Error: Missing Firebase configuration.");
            console.error("Please ensure your 'frontend/.env.local' file exists and contains all the necessary VITE_ variables.");
            process.exit(1); // Exit with an error
        }

        console.log("Initializing Firebase app...");
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        console.log("Starting to seed 'forumCategories' collection...");

        // Create a promise for each document creation
        const promises = categoriesToSeed.map(async (category) => {
            // Generate a URL-friendly ID from the name (e.g., "Business & Marketing Advice" -> "business-marketing-advice")
            const docId = category.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
            const docRef = doc(db, "forumCategories", docId);
            
            // Set the document in Firestore
            await setDoc(docRef, category);
            console.log(`  ✅ Successfully created category: ${category.name}`);
        });

        // Wait for all the documents to be created
        await Promise.all(promises);
        
        console.log("\n🚀 Seeding complete! Your forum categories have been created in Firestore.");

    } catch (error) {
        console.error("\n❌ An error occurred during the seeding process:", error);
    } finally {
        // Exit the script once it's done, otherwise the terminal will hang
        process.exit(0);
    }
};

// Execute the function
seedDatabase();