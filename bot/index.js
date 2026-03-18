const TelegramBot = require("node-telegram-bot-api")

const { mapSymbol, getCryptoPrice, getGoldPriceIdr } = require("./market")
const { getGlobalNews } = require("./news")
const { callAI } = require("./aiCaller")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:false })

async function start(){

    try{

        await bot.deleteWebHook()
        await bot.stopPolling().catch(()=>{})
        await bot.startPolling()

        console.log("🚀 AI Agent Running")

    }catch(e){
        console.log("START ERROR", e.message)
    }
}

start()

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
`💰 ${symbol}

USD : $${p.usd.toFixed(2)}
IDR : Rp ${Math.round(p.idr).toLocaleString()}
24h : ${p.change24h.toFixed(2)}%`)
        }

        // ⭐ GOLD ROUTER
        if(text.toLowerCase().includes("emas")){

            const g = await getGoldPriceIdr()

            return bot.sendMessage(id,
`💰 Emas Spot

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

Jelaskan santai apa yang terjadi dan dampaknya.`

                const ai = await callAI(prompt)

                return bot.sendMessage(id, ai)
            }
        }

        // ⭐ GENERAL AI CHAT (SAVAGE HUMAN MODE)

        const systemPrompt = `
Lu AI super pinter tapi ngobrol kayak temen tongkrongan Indo.

Natural.
Savage halus.
Gak formal.
Gak textbook.
Conversational.

Ngerti crypto, emas, ekonomi dunia, tech, hal random umum.

Kalau realtime → jangan halu.
Kalau gak yakin → bilang kemungkinan.
`

        const reply = await callAI(systemPrompt + "\nUser: " + text)

        return bot.sendMessage(id, reply)

    }catch(e){

        console.log("BOT ERROR:", e.response?.data || e.message || e)

        return bot.sendMessage(id,"⚠️ system error bro")
    }
})
