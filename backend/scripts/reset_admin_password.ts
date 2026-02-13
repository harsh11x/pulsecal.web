import * as dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase initialized with service account');
        } else {
            console.warn('Firebase service account not found, using default/mock');
            // Initialize with dummy project ID to allow syntax check, but auth calls will fail
            admin.initializeApp({ projectId: 'mock-project-id' });
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Proceed to try DB operations
    }
}

const prisma = new PrismaClient();

async function resetAdminPassword() {
    const email = 'admin@pulsecal.com'; // Default admin email
    const newPassword = 'Password123!';

    console.log(`Resetting credentials for admin: ${email}`);

    try {
        // 1. Check/Update Postgres User
        const user = await prisma.user.findUnique({ where: { email } });
        let firebaseUid = user?.firebaseUid;

        if (user) {
            console.log('User found in database:', user.id);
            if (user.role !== 'ADMIN') {
                console.log('Updating user role to ADMIN...');
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'ADMIN' },
                });
            } else {
                console.log('User already has ADMIN role.');
            }
        } else {
            console.log('User not found in database.');
        }

        // 2. Update/Create Firebase User (if credentials exist)
        const serviceAccountKeyExists = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKeyExists) {
            try {
                if (!firebaseUid) {
                    try {
                        const fbUser = await admin.auth().getUserByEmail(email);
                        firebaseUid = fbUser.uid;
                    } catch (e) {
                        // Not found
                    }
                }

                if (firebaseUid) {
                    console.log('Firebase user found:', firebaseUid);
                    await admin.auth().updateUser(firebaseUid, {
                        password: newPassword,
                        emailVerified: true,
                        disabled: false,
                    });
                    console.log('Firebase password updated.');
                } else {
                    console.log('Firebase user not found. Creating...');
                    const newUser = await admin.auth().createUser({
                        email,
                        password: newPassword,
                        emailVerified: true,
                        disabled: false,
                        displayName: 'Admin User',
                    });
                    firebaseUid = newUser.uid;
                    console.log('Firebase user created:', firebaseUid);
                }

                // Set custom claims
                await admin.auth().setCustomUserClaims(firebaseUid, { role: 'ADMIN' });
                console.log('Custom claims set to ADMIN.');

            } catch (error: any) {
                console.error('Firebase operation failed:', error.message);
            }
        } else {
            console.warn('\n!!! WARNING: Firebase Admin Credentials (FIREBASE_SERVICE_ACCOUNT_KEY) missing in .env !!!');
            console.warn('Skipping Firebase password reset.');
            console.warn('Please use "Forgot Password" on the login screen to reset your password.');
            console.warn('Your database role has been verified/updated if user exists.\n');
        }

        // 3. Ensure DB User Exists/Updated
        // We can only create DB user if we have a firebaseUid (either from existing user or created just now)
        if (!user && firebaseUid) {
            const newUser = await prisma.user.create({
                data: {
                    email,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    firebaseUid,
                    onboardingCompleted: true,
                    isActive: true,
                    isEmailVerified: true,
                },
            });
            console.log('Database user created:', newUser.id);
        } else if (user && firebaseUid && user.firebaseUid !== firebaseUid) {
            console.log('Updating firebaseUid in database...');
            await prisma.user.update({
                where: { id: user.id },
                data: { firebaseUid }
            });
        } else if (!user && !firebaseUid) {
            console.error('Cannot create DB user because Firebase User could not be found/created (missing credentials).');
        }

        console.log('\n==================================================');
        console.log('Admin check/update completed.');
        if (serviceAccountKeyExists) {
            console.log(`Email: ${email}`);
            console.log(`Password: ${newPassword}`);
        } else {
            console.log(`Admin Status: ${user ? 'Existing User Role Checked' : 'Failed (No User/No Creds)'}`);
        }
        console.log('==================================================\n');

    } catch (error) {
        console.error('Error resetting admin credentials:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
