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

// ⭐ SMART NEWS INTENT
function detectNewsIntent(text){

    const t = text.toLowerCase()

    return (
        t.includes("news") ||
        t.includes("berita") ||
        t.includes("kenapa") ||
        t.includes("apa yang terjadi") ||
        t.includes("update") ||
        t.includes("global") ||
        t.includes("ekonomi")
    )
}

// ⭐ SAFE AI CALL (ANTI CRASH)
async function safeAI(prompt){

    try{
        return await callAI(prompt)
    }catch(e){
        console.log("AI FAIL:", e.response?.data || e.message)
        return "otak gua ngehang bentar cuy… coba ulang."
    }
}

bot.on("message", async (msg)=>{

    const text = msg.text
    const id = msg.chat.id

    if(!text) return

    try{

        // ⭐ CRYPTO ROUTER (FAST PATH)
        const symbol = mapSymbol(text)

        if(symbol){

            const p = await getCryptoPrice(symbol)

            return bot.sendMessage(id,
`💰 ${symbol}

USD : $${p.usd.toFixed(2)}
IDR : Rp ${Math.round(p.idr).toLocaleString()}
24h : ${p.change24h.toFixed(2)}%`)
        }

        // ⭐ GOLD ROUTER (FAST PATH)
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

Jelaskan santai ke temen:
apa yang terjadi + dampaknya.`

                const ai = await safeAI(prompt)

                return bot.sendMessage(id, ai)
            }
        }

        // ⭐ GENERAL AI MODE (DEFAULT SAVAGE HUMAN)

        const systemPrompt = `
Lu AI super pinter tapi ngobrol kayak temen tongkrongan Indo.

Natural.
Savage halus.
Santai.
Conversational.
Kadang sarkas tipis.

Ngerti crypto, emas, ekonomi dunia, tech, hal random umum.

Kalau user tanya realtime:
jangan sok yakin.
Kasih kisaran / kemungkinan.

Jawaban jangan textbook.
Jangan formal.
Jangan bullet list mulu.
Bikin feel ngobrol hidup.
`

        const reply = await safeAI(systemPrompt + "\nUser: " + text)

        return bot.sendMessage(id, reply)

    }catch(e){

        console.log("BOT ERROR:", e.response?.data || e.message || e)

        return bot.sendMessage(id,"⚠️ system error bro")
    }
})
