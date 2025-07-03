const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')

// 👇 Put your WhatsApp number here (no + sign)
const YOUR_NUMBER = '254738701209'

async function startGenesisBot () {
  // 1. Ensure session folder exists
  fs.mkdirSync(path.join(__dirname, 'session'), { recursive: true })

  // 2. Load multi-file auth
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  // 3. Start socket
  const sock = makeWASocket({
    auth: state,
    browser: ['GenesisBot', 'Chrome', '1.0.0'],
    printQRInTerminal: false // disable default QR
  })

  // 4. Save credentials
  sock.ev.on('creds.update', saveCreds)

  // 5. Handle connection update
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, isNewLogin }) => {
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error?.output?.statusCode ?? 0) !== DisconnectReason.loggedOut
      console.log('❌ Connection closed.', shouldReconnect ? 'Reconnecting…' : 'Logged out.')
      if (shouldReconnect) startGenesisBot()
    }

    if (connection === 'open') {
      console.log('✅ GenesisBot connected successfully!')
    }

    // 🟡 Generate pairing code
    if (isNewLogin) {
      const code = await sock.requestPairingCode(`${YOUR_NUMBER}@s.whatsapp.net`)
      console.log(`🔗 Your GenesisBot Pair Code:\n\n  ${code}\n`)
      console.log('📲 Open WhatsApp > Linked Devices > Link with code')
    }
  })

  // 6. Handle messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''

    console.log('📥', from, '→', text)

    if (text.toLowerCase() === '.ping') {
      await sock.sendMessage(from, { text: '*Pong!!* GenesisBot is alive 💡' }, { quoted: msg })
    }
  })
}

startGenesisBot()
