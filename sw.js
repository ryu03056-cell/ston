importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCkYznuSYHcnvVHhmrnh6oj2ad55OHjLHQ",
  authDomain: "stoneng-3team.firebaseapp.com",
  databaseURL: "https://stoneng-3team-default-rtdb.firebaseio.com",
  projectId: "stoneng-3team",
  storageBucket: "stoneng-3team.firebasestorage.app",
  messagingSenderId: "933097103151",
  appId: "1:933097103151:web:9459005d7bff91c57f8bda"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || '현장조사팀', {
    body: body || '새 메시지가 있어요',
    icon: 'https://em-content.zobj.net/source/apple/391/school_1f3eb.png',
    badge: 'https://em-content.zobj.net/source/apple/391/school_1f3eb.png',
    data: payload.data || {}
  });
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const room = event.notification.data?.room;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('ryu03056-cell.github.io') && 'focus' in client) {
          if (room) client.postMessage({ type: 'openRoom', room });
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
