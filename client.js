const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const express = require('express');

const app = express();
let latestQR = null; // store latest QR here

async function startGenesisBot() {
  fs.mkdirSync(path.join(__dirname, 'session'), { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    auth: state,
    browser: ['GenesisBot', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      latestQR = await qrcode.toDataURL(qr); // Save as base64 image
      console.log('📲 QR code updated!');
    }

    if (connection === 'open') {
      console.log('✅ GenesisBot connected successfully!');
      latestQR = null; // Clear QR once connected
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode ?? 0) !== DisconnectReason.loggedOut;
      console.log('Connection closed.', shouldReconnect ? 'Reconnecting…' : 'Logged out.');
      if (shouldReconnect) startGenesisBot();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    console.log('📥', from, '→', text);

    if (text.toLowerCase().startsWith('.ping')) {
      await sock.sendMessage(from, { text: '*Pong!!* GenesisBot is alive 💡' }, { quoted: msg });
    }
  });
}

startGenesisBot();

// ─────────────────────────────────────────────
// Serve the QR code on a webpage
app.get('/', (req, res) => {
  res.send('<h1>GenesisBot is running!</h1><p>Visit <a href="/qr">/qr</a> to get your QR</p>');
});

app.get('/qr', (req, res) => {
  if (latestQR) {
    res.send(`<h2>📲 Scan QR to connect WhatsApp</h2><img src="${latestQR}" style="width:300px">`);
  } else {
    res.send('<h2>✅ Already connected!</h2>');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
