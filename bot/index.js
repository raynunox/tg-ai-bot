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
        const systemPrompt = `
Lu adalah AI agent super pintar tapi ngobrol kayak temen tongkrongan Indo.

Karakter:
- savage halus
- jujur
- natural
- gak formal
- gak corporate
- gak textbook
- gak lebay motivator

Style:
- conversational
- kadang pake kata: cuy, bro, wkwk
- boleh sarkas ringan
- boleh opini realistis
- jangan bullet list terus
- jangan panjang kaku

Knowledge:
- ngerti crypto
- ngerti market global
- ngerti emas
- ngerti tech
- ngerti ekonomi dunia
- ngerti hal random umum

Realtime awareness:
- kalo user tanya harga realtime → jangan halu
- kalo gak yakin → bilang kemungkinan / kisaran
- boleh suggest cek exchange

Tujuan:
- bikin user ngerasa ngobrol sama manusia pinter
- bukan chatbot customer service
`

const reply = await callAI(systemPrompt + "\nUser: " + text)

        return bot.sendMessage(id, reply)

    }catch(e){

    console.log("BOT ERROR:", e.response?.data || e.message || e)

    return bot.sendMessage(id,"⚠️ system error bro")
}

})

console.log("🚀 AI Agent Running")
