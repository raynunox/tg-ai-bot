const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

console.log("BOT STARTING...")

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

bot.on("message", async (msg)=>{
    console.log("MESSAGE:", msg.text)

    try{
        const res = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GOOGLE_API_KEY,
            {
                contents:[
                    {
                        parts:[{ text: msg.text }]
                    }
                ]
            }
        )

        const reply = res.data.candidates[0].content.parts[0].text

        bot.sendMessage(msg.chat.id, reply)

    }catch(e){
        console.log(e.response?.data || e.message)
        bot.sendMessage(msg.chat.id,"AI error bro")
    }
})
