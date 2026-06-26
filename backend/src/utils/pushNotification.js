/**
 * Push Notification Utility — Sends push alerts via Expo's push notification service.
 */

/**
 * Sends an Expo push notification.
 * @param {string} expoPushToken - The recipient's Expo push token.
 * @param {string} title - Title of the notification.
 * @param {string} body - Body content of the notification.
 * @param {object} [data] - Optional metadata payload.
 */
async function sendPushNotification(expoPushToken, title, body, data = {}, options = {}) {
  if (!expoPushToken || !/^Expo(nent)?PushToken/.test(expoPushToken)) {
    console.log('📢 Push notification skipped: No valid Expo Push Token registered for user');
    return null;
  }

  const payload = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: options.priority || 'high',
    channelId: options.channelId,
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📩 Push notification status:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('❌ Error sending push notification:', error.message);
    return null;
  }
}

module.exports = { sendPushNotification };
