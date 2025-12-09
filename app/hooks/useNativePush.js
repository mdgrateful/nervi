"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/**
 * Hook for handling native push notifications (iOS/Android via Capacitor)
 * Automatically detects if running in native app vs web browser
 */
export function useNativePush({ userId, onNotificationReceived }) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [deviceToken, setDeviceToken] = useState(null);

  useEffect(() => {
    // Check if we're running in a native app (not web browser)
    const isNative = Capacitor.isNativePlatform();
    setIsNativeApp(isNative);

    if (!isNative) {
      // Running in web browser - use web push instead
      return;
    }

    // We're in a native app - set up native push notifications
    initializeNativePush();

    return () => {
      // Cleanup listeners
      PushNotifications.removeAllListeners();
    };
  }, [userId]);

  async function initializeNativePush() {
    try {
      // Request permission for push notifications
      const permResult = await PushNotifications.requestPermissions();
      setPermissionStatus(permResult.receive);

      if (permResult.receive === "granted") {
        // Register with APNs (iOS) or FCM (Android)
        await PushNotifications.register();
      }

      // Set up listeners
      setupListeners();
    } catch (error) {
      console.error("Error initializing native push:", error);
    }
  }

  function setupListeners() {
    // Called when device is successfully registered with APNs/FCM
    PushNotifications.addListener("registration", async (token) => {
      console.log("Push registration success, token:", token.value);
      setDeviceToken(token.value);

      // Send token to backend to store in database
      if (userId) {
        await saveDeviceToken(token.value);
      }
    });

    // Called if registration fails
    PushNotifications.addListener("registrationError", (error) => {
      console.error("Error on registration:", error);
    });

    // Called when a push notification is received (app in foreground)
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push received (foreground):", notification);

        // Call custom handler if provided
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Called when user taps on a notification (app in background/closed)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("Push action performed:", notification);

        // Navigate based on notification data
        const data = notification.notification.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      }
    );
  }

  async function saveDeviceToken(token) {
    try {
      const response = await fetch("/api/push/register-native", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          deviceToken: token,
          platform: Capacitor.getPlatform(), // 'ios' or 'android'
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save device token");
      }

      console.log("Device token saved to backend");
    } catch (error) {
      console.error("Error saving device token:", error);
    }
  }

  async function requestPermission() {
    if (!isNativeApp) {
      console.warn("Not running in native app - use web push instead");
      return false;
    }

    try {
      const permResult = await PushNotifications.requestPermissions();
      setPermissionStatus(permResult.receive);

      if (permResult.receive === "granted") {
        await PushNotifications.register();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  }

  return {
    isNativeApp,
    permissionStatus,
    deviceToken,
    requestPermission,
  };
}
