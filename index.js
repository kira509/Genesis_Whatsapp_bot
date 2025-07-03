/**
 * Genesis-Bot – Pair-code bootstrap
 * 1) Removes any previous creds
 * 2) Connects to WA
 * 3) Prints 8-digit pair-code
 * 4) Exits (so Render restarts only after you commit the normal bot again)
 */

import fs from 'fs'
import path from 'path'
import { Boom } from '@hapi/boom'
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'

// ─── 0. CONFIG ────────────────────────────────────────────────────────────────
const SESSION_DIR   = './session'                 // where creds are stored
const PHONE_NUMBER  = '254738701209'              // without “+”
// ──────────────────────────────────────────────────────────────────────────────

// 1) wipe any previous auth (only for this bootstrap!)
fs.rmSync(path.join(__dirname, SESSION_DIR), { recursive: true, force: true })
console.log('🧹  Old session deleted. Requesting fresh pair-code…')

// 2) create socket (no creds yet)
const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
const sock = makeWASocket({ auth: state, browser: ['GenesisBot','Chrome','1.0.0'] })
sock.ev.on('creds.update', saveCreds)

// 3) once the low-level connection is up, ask for the code
sock.ev.once('connection.update', async ({ connection, lastDisconnect }) => {
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (reason !== DisconnectReason.loggedOut) return console.error('❌  Connection closed, try again')
  }

  if (connection === 'open') {
    try {
      const code = await sock.requestPairingCode(PHONE_NUMBER)
      console.log('\n🔗  YOUR 8-DIGIT PAIR-CODE:\n\n   ', code, '\n')
      console.log('👉  WhatsApp » Linked devices » Link with phone number\n')
      process.exit(0)        // quit so the container doesn’t loop
    } catch (err) {
      console.error('❌  Could not get pair-code:', err?.message || err)
      process.exit(1)
    }
  }
})
