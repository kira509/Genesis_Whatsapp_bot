require('dotenv').config()
console.clear()

const express = require('express')
const app = express()

app.get('/', (_, res) => res.send('Genesis WhatsApp Bot is running!'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))

// Bot starter
const { spawn } = require('child_process')
const path = require('path')
const CFonts = require('cfonts')

function startBot () {
   const args = [path.join(__dirname, 'client.js')]
   const bot = spawn('node', args, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] })

   bot.on('message', (msg) => {
      if (msg === 'reset') {
         console.log('🔁 Restarting bot...')
         bot.kill()
         startBot()
      }
   })

   bot.on('exit', code => {
      console.log('❌ Bot exited with code:', code)
      startBot()
   })
}

CFonts.say('GENESIS', { font: 'block', align: 'center', colors: ['system'] })
startBot()
