/**
 * Genesis‑Bot (minimal echo demo)
 * – scans a QR in the Render logs
 * – replies “Pong!!” to .ping
 * – logs every inbound message for debugging
 */

const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const path = require('path')

// ─────────────────────────────────────────────
// entry‑point
async function startGenesisBot () {
  // 1) ensure ./session dir exists
  fs.mkdirSync(path.join(__dirname, 'session'), { recursive: true })

  // 2) load / save auth
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  // 3) create socket
  const sock = makeWASocket({
    auth: state,
    browser: ['GenesisBot', 'Chrome', '1.0.0']
  })

  // 4) persist credentials
  sock.ev.on('creds.update', saveCreds)

  // 5) connection / QR events
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
      console.log(
        'Connection closed.',
        shouldReconnect ? 'Reconnecting…' : 'Logged out.'
      )
      if (shouldReconnect) startGenesisBot()
    }
  })

  // 6) message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return   // ← allow messages from yourself while testing

    const from  = msg.key.remoteJid
    const text  = msg.message?.conversation
               ?? msg.message?.extendedTextMessage?.text
               ?? ''

    console.log('📥', from, '→', text) // debug log

    if (text.toLowerCase().startsWith('.ping')) {
      await sock.sendMessage(
        from,
        { text: '*Pong!!* GenesisBot is alive 💡' },
        { quoted: msg }
      )
    }
  })
}

startGenesisBot()

startGenesisBot()
