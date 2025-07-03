const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const qrcode = require('qrcode-terminal')


async function startGenesisBot() {
  // Create session folder if missing
  fs.mkdirSync(path.join(__dirname, 'session'), { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    auth: state,
    browser: ['GenesisBot', 'Chrome', '1.0.0']
  })

  // Save creds on update
  sock.ev.on('creds.update', saveCreds)

  // QR & connection handler
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

   if (qr) {
  console.log('\n📲  Scan the QR below to pair:\n')
  qrcode.generate(qr, { small: true })
}

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error?.output?.statusCode ?? 0) !== DisconnectReason.loggedOut
      console.log('Connection closed.', shouldReconnect ? 'Reconnecting…' : 'Logged out.')
      if (shouldReconnect) startGenesisBot()
    }

    if (connection === 'open') console.log('✅ GenesisBot connected successfully!')
  })

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text

    if (text?.toLowerCase() === '.ping') {
      await sock.sendMessage(from, { text: '*Pong!!* GenesisBot is alive 💡' }, { quoted: msg })
    }
  })
}

startGenesisBot()
