require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const { mapSymbol, getCryptoPrice, getGoldPriceIdr } = require("./market")
const { getGlobalNews } = require("./news")
const { callAI } = require("./aiCaller")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true })

function detectNewsIntent(text){

    const t = text.toLowerCase()

    const keys = [
        "news",
        "berita",
        "update",
        "kenapa",
        "apa yang terjadi",
        "global",
        "ekonomi dunia",
        "market kenapa"
    ]

    return keys.some(k => t.includes(k))
}

bot.on("message", async (msg)=>{

    const text = msg.text
    const id = msg.chat.id

    if(!text) return

    try{

        // ⭐ CRYPTO ROUTER
        const symbol = mapSymbol(text)

        if(symbol){

            const p = await getCryptoPrice(symbol)

            return bot.sendMessage(id,
`💰 ${symbol} sekarang

USD : $${p.usd.toFixed(2)}
IDR : Rp ${Math.round(p.idr).toLocaleString()}

24h : ${p.change24h.toFixed(2)}%`)
        }

        // ⭐ GOLD ROUTER
        if(text.toLowerCase().includes("emas")){

            const g = await getGoldPriceIdr()

            return bot.sendMessage(id,
`💰 harga emas spot

Rp ${g.toLocaleString()} / gram`)
        }

        // ⭐ NEWS ROUTER
        if(detectNewsIntent(text)){

            const news = await getGlobalNews(text)

            if(news.length){

                const context = news.join("\n")

                const prompt =
`Berita terbaru:

${context}

Jelaskan secara natural ke user:
apa yang terjadi dan dampaknya.`

                const ai = await callAI(prompt)

                return bot.sendMessage(id, ai)
            }
        }

        // ⭐ GENERAL AI CHAT
        const reply = await callAI(text)

        return bot.sendMessage(id, reply)

    }catch(e){

        return bot.sendMessage(id,"⚠️ system error bro")
    }

})

console.log("🚀 AI Agent Running")
