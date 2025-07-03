const makeWASocket = require('@whiskeysockets/baileys').default
const {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys')

const { DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')


const { state, saveCreds } = await useMultiFileAuthState('./session')

async function startGenesisBot () {
   const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['GenesisBot', 'Chrome', '1.0.0']
   })

   sock.ev.on('creds.update', saveState)

   sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'close') {
         const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
         console.log('Connection closed due to', lastDisconnect.error, '| Reconnecting:', shouldReconnect)
         if (shouldReconnect) startGenesisBot()
      } else if (connection === 'open') {
         console.log('✅ GenesisBot connected successfully!')
      }
   })

   sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0]
      if (!msg.message || msg.key.fromMe) return

      const from = msg.key.remoteJid
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text

      if (text === '.ping') {
         await sock.sendMessage(from, { text: '*Pong!!* GenesisBot is alive 💡' }, { quoted: msg })
      }
   })
}

startGenesisBot()
