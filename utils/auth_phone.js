const admin = require('./firebase_config');
const jwt = require('jsonwebtoken');
const Rider = require('../model/my/rider');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

const createJWTToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find rider in database
    const rider = await Rider.findOne({ userId: decodedToken.uid })
                           .select('-password');
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Create custom JWT with rider data
    const jwtPayload = {
      uid: rider.userId,
      email: rider.email,
      phone: rider.phone_number,
      role: 'rider'
    };

    const jwtToken = createJWTToken(jwtPayload);

    // Attach rider and tokens to request
    req.rider = rider;
    req.firebaseToken = token;
    req.jwtToken = jwtToken;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyFirebaseToken, createJWTToken };
