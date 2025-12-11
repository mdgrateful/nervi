"use client";

import { useState, useEffect } from "react";

export default function DebugPage() {
  const [status, setStatus] = useState({
    swRegistered: false,
    swState: "unknown",
    pushPermission: "unknown",
    subscription: null,
    vapidKey: "",
    userId: "",
    testResult: "",
  });

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    const userId = localStorage.getItem("nerviUserId") || "";
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "NOT SET";

    // Check service worker
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const swRegistered = !!registration;
      const swState = registration?.active?.state || "not registered";

      // Check push permission
      const pushPermission = Notification.permission;

      // Get current subscription
      let subscription = null;
      if (registration) {
        subscription = await registration.pushManager.getSubscription();
      }

      setStatus({
        swRegistered,
        swState,
        pushPermission,
        subscription: subscription ? JSON.stringify(subscription.toJSON(), null, 2) : null,
        vapidKey,
        userId,
        testResult: "",
      });
    }
  }

  async function testNotification() {
    setStatus(prev => ({ ...prev, testResult: "Testing..." }));

    try {
      // Request permission if needed
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(prev => ({ ...prev, testResult: "Permission denied" }));
          return;
        }
      }

      // Try to show a local notification
      if (Notification.permission === "granted") {
        new Notification("Test Notification", {
          body: "If you see this, local notifications work!",
          icon: "/icon-192.png",
        });
        setStatus(prev => ({ ...prev, testResult: "Local notification sent! Check if you saw it." }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, testResult: `Error: ${error.message}` }));
    }
  }

  async function registerPush() {
    setStatus(prev => ({ ...prev, testResult: "Registering..." }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(prev => ({ ...prev, testResult: "Permission denied" }));
        return;
      }

      // Register service worker if needed
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/notifications-sw.js");
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      // Save to database
      const userId = localStorage.getItem("nerviUserId");
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });

      if (res.ok) {
        setStatus(prev => ({ ...prev, testResult: "Push registered successfully!" }));
        checkStatus();
      } else {
        const error = await res.json();
        setStatus(prev => ({ ...prev, testResult: `API error: ${error.error}` }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, testResult: `Error: ${error.message}` }));
    }
  }

  async function testTaskTiming() {
    setStatus(prev => ({ ...prev, testResult: "Checking task timing..." }));

    try {
      const userId = localStorage.getItem("nerviUserId");
      if (!userId) {
        setStatus(prev => ({ ...prev, testResult: "No userId found in localStorage" }));
        return;
      }

      const res = await fetch(`/api/push/test-due?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus(prev => ({ ...prev, testResult: `Error: ${data.error}` }));
        return;
      }

      // Format the result nicely
      const result = `
📅 Debug Info:
- Server time (UTC): ${data.debug.serverTimeUTC}
- Eastern Time: ${data.debug.easternTime}
- Today's date (ET): ${data.debug.easternDate}
- Timezone: ${data.debug.timezone}
- Current minutes: ${data.debug.nowMinutes} (${data.debug.nowTime})
- Window: ${data.debug.windowMinutes} minutes
- Has push subscription: ${data.hasPushSubscription ? '✅' : '❌'}

📋 Tasks:
- Total tasks today: ${data.totalTasks}
- Tasks in 5-min window: ${data.tasksInWindow.length}

${data.tasks.map(t => `
  ${t.wouldTrigger ? '🔔' : '⏰'} ${t.activity}
  Time: ${t.time} (${t.taskMinutes === Number.POSITIVE_INFINITY ? 'not parseable' : t.taskMinutes + ' mins'})
  Minutes until: ${t.minutesUntil === Number.POSITIVE_INFINITY ? 'N/A' : t.minutesUntil}
  Completed: ${t.completed ? '✅' : '❌'}
  Would trigger: ${t.wouldTrigger ? 'YES' : 'NO'}
`).join('\n')}
      `.trim();

      setStatus(prev => ({ ...prev, testResult: result }));
    } catch (error) {
      setStatus(prev => ({ ...prev, testResult: `Error: ${error.message}` }));
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "monospace" }}>
      <div style={{ marginBottom: "20px" }}>
        <a
          href="/dashboard"
          style={{
            color: "#007bff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          ← Back to Dashboard
        </a>
      </div>
      <h1>Notification Debug</h1>

      <div style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>
        <h2>Status</h2>
        <p><strong>User ID:</strong> {status.userId || "NOT SET"}</p>
        <p><strong>VAPID Key:</strong> {status.vapidKey.substring(0, 20)}...</p>
        <p><strong>Service Worker Registered:</strong> {status.swRegistered ? "✅ Yes" : "❌ No"}</p>
        <p><strong>Service Worker State:</strong> {status.swState}</p>
        <p><strong>Push Permission:</strong> {status.pushPermission}</p>
        <p><strong>Push Subscription:</strong> {status.subscription ? "✅ Active" : "❌ Not subscribed"}</p>

        {status.subscription && (
          <details>
            <summary>Subscription Details</summary>
            <pre style={{ fontSize: "10px", overflow: "auto" }}>{status.subscription}</pre>
          </details>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Actions</h2>
        <button
          onClick={testNotification}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Test Local Notification
        </button>

        <button
          onClick={registerPush}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Register/Re-register Push
        </button>

        <button
          onClick={testTaskTiming}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Test Task Timing
        </button>

        <button
          onClick={checkStatus}
          style={{
            padding: "10px 20px",
            margin: "5px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Refresh Status
        </button>
      </div>

      {status.testResult && (
        <div style={{
          marginTop: "20px",
          padding: "10px",
          background: status.testResult.includes("Error") ? "#ffebee" : "#e8f5e9",
          borderRadius: "4px"
        }}>
          <strong>Result:</strong> {status.testResult}
        </div>
      )}

      <div style={{ marginTop: "40px", padding: "10px", background: "#fff3cd", borderRadius: "4px" }}>
        <h3>Troubleshooting</h3>
        <ul>
          <li>Make sure you've added the app to your Home Screen (iOS PWA requirement)</li>
          <li>Check iOS Settings → Safari → Advanced → Experimental Features → Enable push notifications</li>
          <li>Permission must be "granted" (not "denied" or "default")</li>
          <li>Service worker must be registered and active</li>
          <li>Push subscription must exist</li>
        </ul>
      </div>
    </div>
  );
}
