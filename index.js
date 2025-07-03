// index.js
import { default as makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'

const SESSION_DIR = './auth_info_baileys'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version, isLatest } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' }),
    browser: ['GenesisBot', 'Chrome', '1.0.0']
  })

  // 🔐 Generate and show pair code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, pairingCode } = update

    if (pairingCode) {
      console.log(`🔗 Your GenesisBot Pair Code: ${pairingCode}`)
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`Connection closed. Reason: ${reason}`)
      if (reason !== 401) startBot()
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!')
    }
  })

  sock.ev.on('creds.update', saveCreds)
}

startBot()

