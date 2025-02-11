// utils/userSync.js
const admin = require('./firebase_config');
const User = require('../model/user');

async function syncUserFromFirebase(uid) {
    try {
      // Get user from Firebase
      const firebaseUser = await admin.auth().getUser(uid);
      
      // Also get the additional data from Firebase Firestore
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      const userData = userDoc.data();
  
      // Create user object combining Auth and Firestore data
      const mongoUser = {
        _id: uid,
        fullName: userData.fullName || firebaseUser.displayName || 'Unknown',
        email: userData.email || firebaseUser.email || 'Not Available',
        phone: userData.phone || firebaseUser.phoneNumber || 'Not Available',
        password: 'FIREBASE_AUTH_USER',
        addresses: [{
          houseNumber: userData.address?.houseNumber || '',
          floor: userData.address?.floor || '',
          area: userData.address?.area || '',
          landmark: userData.address?.landmark || '',
          location: {
            latitude: userData.address?.location?.latitude || 0,
            longitude: userData.address?.location?.longitude || 0
          },
          isDefault: true
        }],
        createdAt: userData.createdAt ? new Date(userData.createdAt._seconds * 1000) : new Date(),
        status: userData.status || 'active'
      };
  
      // Create or update user in MongoDB
      const user = await User.findOneAndUpdate(
        { _id: uid },
        mongoUser,
        { upsert: true, new: true }
      );
  
      return user;
    } catch (error) {
      console.error(`Failed to sync user ${uid} from Firebase:`, error);
      return null;
    }
  }
  
module.exports = { syncUserFromFirebase };