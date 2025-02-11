// services/notificationService.js
const admin = require('firebase-admin');

const notificationService = {
  async sendToRider(deviceToken, orderId, city, data) {
    return admin.messaging().send({
      token: deviceToken,
      notification: {
        title: 'New Order Available',
        body: `New order available in ${city}`
      },
      data
    });
  },

  async sendToCustomer(userId, title, body, data) {
    // Fetch customer's FCM token from your database
    const user = await User.findById(userId);
    if (!user?.deviceToken) return;

    return admin.messaging().send({
      token: user.deviceToken,
      notification: { title, body },
      data
    });
  }
};

module.exports = notificationService;