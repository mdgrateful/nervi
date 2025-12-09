import apn from "apn";

/**
 * Send a push notification to iOS devices via APNs (Apple Push Notification service)
 *
 * IMPORTANT: This requires Apple Developer account setup:
 * 1. Create an App ID in Apple Developer Portal (com.nervi.app)
 * 2. Create an APNs Key (.p8 file) for push notifications
 * 3. Download the .p8 key file
 * 4. Add these environment variables:
 *    - APNS_KEY_ID: The 10-character key identifier
 *    - APNS_TEAM_ID: Your Apple Team ID
 *    - APNS_KEY_PATH: Path to the .p8 key file (or use APNS_KEY_CONTENT)
 *    - APNS_KEY_CONTENT: Base64-encoded content of .p8 file (alternative to path)
 *
 * @param {string} deviceToken - The device token from APNs registration
 * @param {object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Custom data to send with notification
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendAPNsNotification(deviceToken, notification) {
  try {
    // Check if APNs is configured
    if (!process.env.APNS_KEY_ID || !process.env.APNS_TEAM_ID) {
      console.warn("APNs not configured - skipping iOS push notification");
      return {
        success: false,
        error: "APNs not configured",
        skipped: true
      };
    }

    // Create APNs provider
    const provider = new apn.Provider({
      token: {
        key: process.env.APNS_KEY_CONTENT
          ? Buffer.from(process.env.APNS_KEY_CONTENT, 'base64')
          : process.env.APNS_KEY_PATH, // Path to .p8 file
        keyId: process.env.APNS_KEY_ID,
        teamId: process.env.APNS_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production',
    });

    // Create notification
    const apnNotification = new apn.Notification();
    apnNotification.alert = {
      title: notification.title,
      body: notification.body,
    };
    apnNotification.badge = notification.badge || 1;
    apnNotification.sound = notification.sound || "default";
    apnNotification.topic = "com.nervi.app"; // Your app's bundle ID
    apnNotification.payload = notification.data || {};

    // Set expiry to 1 hour
    apnNotification.expiry = Math.floor(Date.now() / 1000) + 3600;

    // Send notification
    const result = await provider.send(apnNotification, deviceToken);

    // Check for failures
    if (result.failed && result.failed.length > 0) {
      const failure = result.failed[0];
      console.error("APNs send failed:", failure.response);
      return {
        success: false,
        error: failure.response?.reason || "Unknown APNs error",
      };
    }

    console.log("APNs notification sent successfully");
    provider.shutdown();

    return {
      success: true,
      sent: result.sent?.length || 0,
    };
  } catch (error) {
    console.error("Error sending APNs notification:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send push notifications to multiple iOS devices
 * @param {string[]} deviceTokens - Array of device tokens
 * @param {object} notification - Notification data (same format as sendAPNsNotification)
 * @returns {Promise<{success: boolean, sent: number, failed: number}>}
 */
export async function sendAPNsToMultiple(deviceTokens, notification) {
  const results = await Promise.allSettled(
    deviceTokens.map((token) => sendAPNsNotification(token, notification))
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const failed = results.length - sent;

  return {
    success: sent > 0,
    sent,
    failed,
  };
}
