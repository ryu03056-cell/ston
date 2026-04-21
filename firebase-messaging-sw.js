// Firebase Messaging 서비스워커
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCkYznuSYHcnvVHhmrnh6oj2ad55OHjLHQ",
  authDomain: "stoneng-3team.firebaseapp.com",
  databaseURL: "https://stoneng-3team-default-rtdb.firebaseio.com",
  projectId: "stoneng-3team",
  storageBucket: "stoneng-3team.appspot.com",
  messagingSenderId: "933097103151",
  appId: "1:933097103151:web:9459005d7bff91c57f8bda"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage(payload => {
  console.log('백그라운드 메시지:', payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '새 메시지', {
    body: body || '',
    icon: icon || 'https://em-content.zobj.net/source/apple/391/school_1f3eb.png',
    badge: 'https://em-content.zobj.net/source/apple/391/school_1f3eb.png',
    tag: payload.data?.room || 'chat',
    renotify: true,
    data: payload.data || {},
    vibrate: [200, 100, 200]
  });
});

// 알림 클릭 시
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'openRoom', room: event.notification.data?.room });
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
