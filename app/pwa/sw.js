const CACHE_NAME = "dothis-v3";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/img/favicon.svg",
  "/img/favicon.ico",
  "/img/icon-192.png",
  "/img/icon-512.png",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the fresh response for offline use
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, fall back to cache
        return caches.match(event.request);
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Focus or open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("do-this.today") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    }),
  );
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TASK_TIMER_NOTIFICATION") {
    const { title, body, icon } = event.data;

    self.registration.showNotification(title, {
      body: body,
      icon: icon || "/img/icon-192.png",
      badge: "/img/favicon.ico",
      tag: "task-timer",
      requireInteraction: false,
      actions: [
        {
          action: "focus",
          title: "Open App",
        },
      ],
    });
  }
});
