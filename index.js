const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const cfonts = require('cfonts');

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['GenesisBot', 'Chrome', '1.0.0'],
  });

  // 🔄 Pair code generation
  if (!sock.authState.creds.registered) {
    const { code } = await sock.requestPairingCode('<YOUR_PHONE_NUMBER_WITH_COUNTRY_CODE>');
    console.log(`\n🔗 Your GenesisBot Pair Code: ${code}\n`);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ Bot connected successfully!');
    }
  });

  // Optional: fancy text on startup
  cfonts.say('Genesis Bot', {
    font: 'block',
    align: 'center',
    colors: ['blueBright'],
  });
};

startBot();
