const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 443;

const privateKey = fs.readFileSync(path.resolve(__dirname, 'cert/key.pem'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, 'cert/cert.pem'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

https.createServer(credentials, app).listen(PORT, () => {
  console.log(`✅ HTTPS Server is running on https://localhost:${PORT}`);
});
