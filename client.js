const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')

const { state, saveState } = useSingleFileAuthState('./session/auth.json') // Auto saves session

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
         console.log('Connection closed due to', lastDisconnect.error, '| Re

