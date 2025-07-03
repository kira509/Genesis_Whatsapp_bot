// index.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { default as makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import pino from 'pino'

// ⛓ Recreate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SESSION_DIR = './sessions'

// 🧹 Clean old sessions
fs.rmSync(path.join(__dirname, SESSION_DIR), { recursive: true, force: true })

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Using Baileys v${version.join('.')}, latest: ${isLatest}`)

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['GenesisBot', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, isNewLogin, pairingCode } = update

    if (connection === 'open') {
      console.log('✅ GenesisBot connected successfully!')
    }

    if (connection === 'close') {
      console.log('❌ Connection closed. Trying to reconnect...')
    }

    if (isNewLogin && !pairingCode) {
      try {
        let code = await sock.requestPairingCode("254XXXXXXXXX") // ← put your phone number here
        console.log(`\n🔗 Your GenesisBot Pair Code: ${code}`)
      } catch (e) {
        console.error('❌ Error generating pair code:', e)
      }
    }
  })
}

startBot()

