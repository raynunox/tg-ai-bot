const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

const { getHistory, pushHistory } = require("./memory")
const { price, signal } = require("./crypto")
const { formatTelegram, splitMessage } = require("./formatter")

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

async function sendFormatted(id, text){
    const formatted = formatTelegram(text)
    const parts = splitMessage(formatted)

    for(const p of parts){
        await bot.sendChatAction(id, "typing")
        await bot.sendMessage(id, p, {
            parse_mode: "HTML",
            disable_web_page_preview: true
        })
    }
}

bot.on("message", async (msg)=>{
    const text = msg.text
    const id = msg.chat.id

    if(!text) return

    // ⭐ PRICE COMMAND
    if(text.startsWith("/price")){
        try{
            const s = text.split(" ")[1] || "BTC"
            const p = await price(s.toUpperCase())
            return sendFormatted(id, `**${s.toUpperCase()} Price**\n💰 ${p} USDT`)
        }catch(e){
            return bot.sendMessage(id,"Price error")
        }
    }

    // ⭐ SIGNAL COMMAND
    if(text.startsWith("/signal")){
        try{
            const s = text.split(" ")[1] || "BTC"
            const sig = await signal(s.toUpperCase())
            return sendFormatted(id, sig)
        }catch(e){
            return bot.sendMessage(id,"Signal error")
        }
    }

    // ⭐ NORMAL AI CHAT
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
                                "You are smart crypto AI assistant.\n"+
                                "Use **bold headings**, short paragraphs, clean lists.\n"+
                                JSON.stringify(history)
                            }
                        ]
                    }
                ]
            },
            { timeout: 60000 }
        )

        const reply =
        res.data.candidates?.[0]?.content?.parts?.[0]?.text
        || "AI no response"

        pushHistory(id,"assistant",reply)

        await sendFormatted(id, reply)

    }catch(e){
        console.log(e.response?.data || e.message)
        bot.sendMessage(id,"AI error / quota limit")
    }
})

console.log("🤖 AI AGENT BOT STARTED")
