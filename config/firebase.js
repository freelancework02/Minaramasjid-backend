// utils/firebaseAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("../ajazgraphic-da740-firebase-adminsdk-ub7bu-a1134c5e65.json"); // adjust path

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
