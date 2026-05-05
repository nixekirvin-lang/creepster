const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'creepster-6cf9f';

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId
    });
  } else {
    const keyPath = path.join(__dirname, 'service-account-key.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = require(keyPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
      });
    } else {
      admin.initializeApp({ projectId });
    }
  }
}

const db = admin.firestore();

module.exports = { db, admin };
