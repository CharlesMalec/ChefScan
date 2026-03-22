import https from 'https';

https.get('https://chefscan.be/pwa-192x192-v2.png', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
});
