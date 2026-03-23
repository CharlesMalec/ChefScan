import https from 'https';

https.get('https://chefscan.be/pwa-192x192.png', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Content-Length:', res.headers['content-length']);
});
