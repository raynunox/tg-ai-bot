require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")

const { mapSymbol, getCryptoPrice, getGoldPriceIdr } = require("./market")
const { getGlobalNews } = require("./news")
const { callAI } = require("./aiCaller")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:false })

/* =========================
   SAFE TIMEOUT WRAPPER
========================= */

function withTimeout(promise, ms=12000){

    return Promise.race([
        promise,
        new Promise((_,reject)=>
            setTimeout(()=>reject(new Error("timeout")),ms)
        )
    ])
}

/* =========================
   START ENGINE (ANTI CONFLICT)
========================= */

async function start(){

    try{

        await bot.deleteWebHook()
        await bot.stopPolling().catch(()=>{})

        await bot.startPolling({
            interval:300,
            autoStart:true,
            params:{ timeout:10 }
        })

        console.log("🚀 AI Agent Stable Running")

    }catch(e){
        console.log("START ERROR:", e.message)
    }
}

start()

/* =========================
   NEWS INTENT DETECTOR
========================= */

function detectNewsIntent(text){

    const t = text.toLowerCase()

    const keys = [
        "news","berita","update","kenapa",
        "apa yang terjadi","global","ekonomi dunia",
        "market kenapa","perang","inflasi"
    ]

    return keys.some(k=>t.includes(k))
}

/* =========================
   MAIN MESSAGE ENGINE
========================= */

bot.on("message", async (msg)=>{

    const text = msg.text
    const id = msg.chat.id

    if(!text) return

    try{

        /* ===== CRYPTO ROUTER ===== */

        const symbol = mapSymbol(text)

        if(symbol){

            try{

                const p = await withTimeout(getCryptoPrice(symbol),10000)

                return bot.sendMessage(id,
`💰 ${symbol}

USD : $${p.usd.toFixed(2)}
IDR : Rp ${Math.round(p.idr).toLocaleString()}
24h : ${p.change24h.toFixed(2)}%`)

            }catch(e){

                console.log("CRYPTO FAIL:", e.message)

                return bot.sendMessage(
                    id,
                    "market crypto lagi susah diambil datanya cuy… coba bentar lagi."
                )
            }
        }

        /* ===== GOLD ROUTER ===== */

        if(text.toLowerCase().includes("emas")){

            try{

                const g = await withTimeout(getGoldPriceIdr(),10000)

                return bot.sendMessage(
                    id,
                    `💰 emas spot kira2

Rp ${g.toLocaleString()} / gram`
                )

            }catch(e){

                console.log("GOLD FAIL:", e.message)

                return bot.sendMessage(
                    id,
                    "data emas lagi error cuy… API nya mungkin limit."
                )
            }
        }

        /* ===== NEWS ROUTER ===== */

        if(detectNewsIntent(text)){

            try{

                const news = await withTimeout(getGlobalNews(text),12000)

                if(news.length){

                    const prompt =
`Ini berita global terbaru:

${news.join("\n")}

Jelaskan santai ke temen:
apa yang terjadi + dampaknya.`

                    const ai = await withTimeout(callAI(prompt),15000)

                    return bot.sendMessage(id, ai)
                }

            }catch(e){
                console.log("NEWS FAIL:", e.message)
            }
        }

        /* ===== GENERAL AI CHAT ===== */

        const systemPrompt =
`Lu AI super pintar tapi ngobrol kayak temen tongkrongan Indo.

Natural.
Savage halus.
Santai.
Realistis.
Gak corporate.
Gak textbook.

Ngerti crypto, emas, saham, ekonomi dunia, tech, hal random.

Realtime awareness:
Kalau user tanya harga realtime → bilang kisaran.
Kalau gak yakin → jujur.

Tujuan:
bikin user ngerasa ngobrol sama manusia pinter.`

        try{

            const reply = await withTimeout(
                callAI(systemPrompt + "\nUser: " + text),
                15000
            )

            return bot.sendMessage(id, reply)

        }catch(e){

            console.log("AI FAIL:", e.message)

            return bot.sendMessage(
                id,
                "otak gua lagi ngefreeze bentar cuy… coba ulang."
            )
        }

    }catch(e){

        console.log("FATAL BOT ERROR:", e)

        return bot.sendMessage(
            id,
            "⚠️ system error parah bro"
        )
    }

})

/* =========================
   GLOBAL CRASH GUARD
========================= */

process.on("uncaughtException",(err)=>{
    console.log("UNCAUGHT:",err)
})

process.on("unhandledRejection",(err)=>{
    console.log("REJECTION:",err)
})
