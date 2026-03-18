const { spawn } = require("child_process")
const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

// start 9router server
spawn("npx", ["9router","start","--host","0.0.0.0","--port","20128","--no-ui"])

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

bot.on("message", async (msg)=>{
    try{
        const res = await axios.post(
            "http://127.0.0.1:20128/v1/chat/completions",
            {
                model:"gemini/gemini-2.5-flash",
                messages:[{role:"user",content:msg.text}]
            }
        )
        bot.sendMessage(msg.chat.id,res.data.choices[0].message.content)
    }catch(e){
        bot.sendMessage(msg.chat.id,"AI error")
    }
})
