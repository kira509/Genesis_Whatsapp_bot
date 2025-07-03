/// index.js
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import { Boom } from '@hapi/boom'
import P from 'pino'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SESSION_DIR = path.join(__dirname, 'auth_info_baileys')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['GenesisBot', 'Chrome', '1.0.0'],
    printQRInTerminal: false
  })

  // ✅ Show pair code
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, pairingCode } = update

    if (pairingCode) {
      console.log(`🔗 Your GenesisBot Pair Code: ${pairingCode}`)
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Disconnected: ${reason}`)
      if (reason !== DisconnectReason.loggedOut) startBot()
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!')
    }
  })

  sock.ev.on('creds.update', saveCreds)
}

startBot()

