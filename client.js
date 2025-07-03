const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const path = require('path')

async function startGenesisBot () {
  fs.mkdirSync(path.join(__dirname, 'session'), { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({
    auth: state,
    browser: ['GenesisBot', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📲  Scan the QR below to pair:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ GenesisBot connected successfully!')
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error?.output?.statusCode ?? 0) !== DisconnectReason.loggedOut
      console.log('Connection closed.', shouldReconnect ? 'Reconnecting…' : 'Logged out.')
      if (shouldReconnect) startGenesisBot()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const text = msg.message?.conversation
      ?? msg.message?.extendedTextMessage?.text
      ?? ''

    console.log('📥', from, '→', text)

    if (text.toLowerCase().startsWith('.ping')) {
      await sock.sendMessage(from, { text: '*Pong!!* GenesisBot is alive 💡' }, { quoted: msg })
    }
  })
}

startGenesisBot()
