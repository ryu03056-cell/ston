// 현장조사팀 대시보드 서비스워커
// 알림 클릭 시 사이트로 포커스 이동

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const room = event.notification.data?.room;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'openRoom', room });
          return client.focus();
        }
      }
      // 없으면 새로 열기
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
