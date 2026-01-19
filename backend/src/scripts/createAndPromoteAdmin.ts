
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Override DATABASE_URL with DIRECT_URL if available for this script
if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const firebaseConfig = {
    apiKey: "AIzaSyAvP51E08sZXZdks8fkDBG6IgVZslhsfV4",
    authDomain: "pulsecal-72bb4.firebaseapp.com",
    projectId: "pulsecal-72bb4",
    storageBucket: "pulsecal-72bb4.firebasestorage.app",
    messagingSenderId: "375873590290",
    appId: "1:375873590290:web:847716fd25fc8f05de74cb",
    measurementId: "G-7SXLKFL822"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@pulsecal.com';
    const password = 'admin@pulsecal2025';

    console.log(`Attempting to create/find user: ${email}...`);

    let firebaseUid = '';

    try {
        // Try to create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUid = userCredential.user.uid;
        console.log('✅ User created in Firebase.');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('ℹ️ User already exists in Firebase. Attempting to sign in to get UID...');
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                firebaseUid = userCredential.user.uid;
                console.log('✅ Signed in successfully.');
            } catch (signInError: any) {
                console.error('❌ Failed to sign in with provided credentials:', signInError.message);
                process.exit(1);
            }
        } else {
            console.error('❌ Error creating user in Firebase:', error.message);
            process.exit(1);
        }
    }

    // Now ensure user exists in Postgres and promote to ADMIN
    // The backend usually syncs this via middleware/endpoints, but we'll force it here via Prisma
    try {
        console.log('Updating database...');

        // Check if user exists in DB
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            await prisma.user.update({
                where: { email },
                data: {
                    role: 'ADMIN',
                    firebaseUid: firebaseUid // Ensure UID matches
                }
            });
            console.log(`✅ User ${email} promoted to ADMIN in database.`);
        } else {
            // Create user in DB if missing (sync didn't happen)
            await prisma.user.create({
                data: {
                    email,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    firebaseUid: firebaseUid,
                    isActive: true,
                    isEmailVerified: true
                }
            });
            console.log(`✅ User ${email} created as ADMIN in database.`);
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
