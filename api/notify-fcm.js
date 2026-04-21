// FCM 알림 전송 Vercel 함수
// 환경변수: FIREBASE_SERVICE_ACCOUNT (JSON 전체를 base64로 인코딩한 값)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { title, body, tokens, room } = req.body || {};
  if (!title || !body || !tokens || tokens.length === 0) {
    return res.status(400).json({ error: 'title, body, tokens 필요' });
  }

  try {
    // 서비스 계정 JSON 파싱
    const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saBase64) return res.status(500).json({ error: '서비스 계정 없음' });
    const sa = JSON.parse(Buffer.from(saBase64, 'base64').toString('utf8'));

    // Google OAuth 토큰 직접 발급 (firebase-admin 패키지 없이)
    const accessToken = await getAccessToken(sa);

    // FCM v1 API로 각 토큰에 알림 전송
    const projectId = sa.project_id;
    let success = 0, fail = 0;

    await Promise.all(tokens.map(async token => {
      try {
        const r = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: { room: room || '' },
                webpush: {
                  notification: {
                    title, body,
                    icon: 'https://em-content.zobj.net/source/apple/391/school_1f3eb.png',
                    badge: 'https://em-content.zobj.net/source/apple/391/school_1f3eb.png',
                    renotify: true,
                    tag: `${room || 'chat'}_${Date.now()}`,
                    vibrate: [200, 100, 200],
                  },
                  fcm_options: { link: 'https://ryu03056-cell.github.io/' }
                }
              }
            })
          }
        );
        if (r.ok) success++;
        else { fail++; console.log('FCM 실패:', token.slice(0,20), await r.text()); }
      } catch(e) { fail++; }
    }));

    return res.status(200).json({ success, fail, total: tokens.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Google OAuth2 토큰 발급 (JWT 방식)
async function getAccessToken(sa) {
  const { privateKey, clientEmail } = { privateKey: sa.private_key, clientEmail: sa.client_email };
  const scope = 'https://www.googleapis.com/auth/firebase.messaging';
  const now = Math.floor(Date.now() / 1000);
  
  // JWT 생성 (Web Crypto API 사용)
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope
  };
  
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const toSign = `${b64(header)}.${b64(payload)}`;
  
  // PEM 키 파싱
  const pem = privateKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const keyData = Buffer.from(pem, 'base64');
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    Buffer.from(toSign)
  );
  
  const jwt = `${toSign}.${Buffer.from(sig).toString('base64url')}`;
  
  // 토큰 교환
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const { access_token } = await tokenRes.json();
  return access_token;
}
