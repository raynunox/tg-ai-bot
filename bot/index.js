const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

const { getHistory, pushHistory } = require("./memory")
const { price, signal } = require("./crypto")

const bot = new TelegramBot(process.env.BOT_TOKEN,{polling:true})

bot.on("message", async (msg)=>{
    const text = msg.text
    const id = msg.chat.id

    if(text.startsWith("/price")){
        const s = text.split(" ")[1] || "BTC"
        const p = await price(s.toUpperCase())
        return bot.sendMessage(id,`${s} = $${p}`)
    }

    if(text.startsWith("/signal")){
        const s = text.split(" ")[1] || "BTC"
        const sig = await signal(s.toUpperCase())
        return bot.sendMessage(id,sig)
    }

    const history = getHistory(id)

    pushHistory(id,"user",text)

    try{
        const res = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+process.env.GOOGLE_API_KEY,
            {
                contents:[
                    {
                        parts:[
                            {
                                text:
                                "You are crypto AI agent.\n"+
                                JSON.stringify(history)
                            }
                        ]
                    }
                ]
            }
        )

        const reply =
        res.data.candidates[0].content.parts[0].text

        pushHistory(id,"assistant",reply)

        bot.sendMessage(id,reply)

    }catch(e){
        bot.sendMessage(id,"AI error")
    }
})
