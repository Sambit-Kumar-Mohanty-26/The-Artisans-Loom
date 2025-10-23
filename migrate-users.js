require('dotenv').config({ path: './frontend/.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};
const migrateUsers = async () => {
    try {
        if (!firebaseConfig.apiKey) {
            throw new Error("Firebase config not found. Is your frontend/.env.local file correct?");
        }

        console.log("Initializing Firebase...");
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        console.log("Fetching all user documents...");
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        if (snapshot.empty) {
            console.log("No users found to migrate.");
            return;
        }

        const updatePromises = [];
        let updatedCount = 0;

        snapshot.forEach(userDoc => {
            const userData = userDoc.data();
            const userId = userDoc.id;
            if (userData.isVerified === undefined) {
                console.log(`  - User ${userId} is missing verification fields. Scheduling update...`);
                
                const userDocRef = doc(db, "users", userId);
                updatePromises.push(
                    updateDoc(userDocRef, {
                        isVerified: false,
                        verificationSubmissionURL: ''
                    })
                );
                updatedCount++;
            }
        });

        if (updatePromises.length > 0) {
            console.log(`\nApplying updates to ${updatedCount} user(s)...`);
            await Promise.all(updatePromises);
            console.log("✅ All users updated successfully!");
        } else {
            console.log("\n✅ All user documents are already up-to-date. No migration needed.");
        }

    } catch (error) {
        console.error("\n❌ An error occurred during the migration:", error);
    } finally {
        process.exit(0);
    }
};
migrateUsers();