// public/notifications-sw.js
// Version: 2.1 - Fixed VAPID_SUBJECT format (added mailto: prefix)

self.addEventListener("activate", (event) => {
  console.log("[SW] Activated version 2.0");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log("[SW] Clearing cache:", cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback if not JSON
    data = { title: "Nervi reminder", body: event.data && event.data.text() };
  }

  const title = data.title || "Nervi reminder";
  const options = {
    body: data.body || "Time for a small nervous-system practice.",
    icon: "/icon-192.png", // optional: add an icon in public/
    badge: "/icon-192.png", // optional
    tag: data.tag || "nervi-reminder",
    data: data.url || "/", // where to open on click
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clis) => {
      for (const client of clis) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
