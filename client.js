const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')

async function startGenesisBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  // Create session folder if missing (top of file)
const path = require('path')
fs.mkdirSync(path.join(__dirname, 'session'), { recursive: true })

// Better QR handler (replace printQRInTerminal)
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update

  if (qr) console.log(`\n📲  Scan this QR:\n${qr}\n`)

  if (connection === 'close') {
    const shouldReconnect =
      (lastDisconnect?.error?.output?.statusCode ?? 0) !== DisconnectReason.loggedOut
    console.log('Connection closed.', shouldReconnect ? 'Reconnecting…' : 'Logged out.')
    if (shouldReconnect) startGenesisBot()
  }

  if (connection === 'open') console.log('✅ GenesisBot connected successfully!')
})


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

