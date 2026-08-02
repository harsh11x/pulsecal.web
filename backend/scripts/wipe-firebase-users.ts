/**
 * Delete ALL users from Firebase Authentication.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY to be set in backend/.env
 * (a service account JSON from the Firebase Console). Without it, the
 * Firebase Admin SDK cannot authenticate.
 *
 * WARNING: This permanently deletes every Firebase account. There is no undo.
 *
 * Run with: tsx scripts/wipe-firebase-users.ts
 */
import admin from 'firebase-admin';

const CONFIRM_PROMPT = 'This will PERMANENTLY DELETE all Firebase users. Type "WIPE" to confirm: ';

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
}

async function main() {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountRaw) {
    console.error(
      '❌ FIREBASE_SERVICE_ACCOUNT_KEY is not set in backend/.env.\n' +
        '   Get one from Firebase Console → Project Settings → Service Accounts → Generate new private key,\n' +
        '   then add it to backend/.env as FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
    process.exit(1);
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountRaw);
  } catch {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  // Count users first
  const listResult = await admin.auth().listUsers(1000);
  const totalUsers = listResult.users.length;
  console.log(`Found ${totalUsers} Firebase users.`);

  if (totalUsers === 0) {
    console.log('Firebase has no users. Nothing to delete.');
    return;
  }

  const answer = await ask(`\n${CONFIRM_PROMPT}`);
  if (answer !== 'WIPE') {
    console.log('Aborted. No users were deleted.');
    return;
  }

  // Delete all users in batches of 1000 (listUsers max page size)
  let pageToken: string | undefined;
  let deleted = 0;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    if (page.users.length === 0) break;

    const deleteResult = await admin.auth().deleteUsers(page.users.map((u) => u.uid));
    deleted += deleteResult.successCount;
    if (deleteResult.failureCount > 0) {
      console.error(`⚠️  Failed to delete ${deleteResult.failureCount} users:`, deleteResult.errors);
    }
    console.log(`Deleted ${deleted} users so far...`);
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(deleted === totalUsers ? `✅ Deleted all ${deleted} Firebase users.` : `⚠️  Deleted ${deleted}/${totalUsers} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
