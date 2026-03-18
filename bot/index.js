const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

const { getHistory, pushHistory, setStyle, getStyle } = require("./memory")
const { price } = require("./crypto")
const { formatTelegram, splitMessage } = require("./formatter")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true })

async function fastSend(id,text){
    const formatted = formatTelegram(text)
    const parts = splitMessage(formatted,2500)

    for(const p of parts){
        await bot.sendMessage(id,p,{
            parse_mode:"HTML",
            disable_web_page_preview:true
        })
    }
}

function detectPrice(text){
    const t = text.toLowerCase()
    const coins = ["btc","eth","sol","bnb","arb","op","avax","link","doge"]

    for(const c of coins){
        if(t.includes(c) &&
          (t.includes("harga") ||
           t.includes("berapa") ||
           t.includes("price") ||
           t.includes("sekarang") ||
           t.includes("now"))){
            return c.toUpperCase()
        }
    }
    return null
}

function detectStyle(text){
    const t = text.toLowerCase()

    if(t.includes("santai") || t.includes("casual"))
        return "casual"

    if(t.includes("trader") || t.includes("analisa"))
        return "crypto"

    if(t.includes("formal"))
        return "formal"

    return null
}

bot.on("message", async (msg)=>{
    const text = msg.text
    const id = msg.chat.id
    if(!text) return

    // ⚡ STYLE SWITCH NATURAL
    const newStyle = detectStyle(text)
    if(newStyle){
        setStyle(id,newStyle)
        return fastSend(id,`oke noted 👍 sekarang gua ngobrol mode **${newStyle}**`)
    }

    // ⚡ LIVE PRICE ROUTER (SUPER CEPAT)
    const coin = detectPrice(text)
    if(coin){
        try{
            const p = await price(coin)
            return fastSend(id,
                `**${coin} sekarang** sekitar 💰 ${p} USDT\n`+
                `market lagi agak random sih… jangan gas dulu 😅`
            )
        }catch{
            return bot.sendMessage(id,"gagal ambil price bro")
        }
    }

    // ⚡ THINKING UX (instant feel)
    bot.sendChatAction(id,"typing")

    const history = getHistory(id)
    pushHistory(id,"user",text)

    const style = getStyle(id)

    let persona = ""

    if(style === "casual"){
        persona =
        "Ngomong kayak temen crypto nongkrong. Natural. Santai. Insightful."
    }

    if(style === "crypto"){
        persona =
        "Ngomong kayak trader berpengalaman. Fokus probabilitas."
    }

    if(style === "formal"){
        persona =
        "Ngomong profesional tapi tetap manusia."
    }

    const prompt =
`Lu AI crypto assistant yang smart banget.
Ngobrol natural kayak manusia.
Gak usah panjang.
Gak usah tutorial.
Kasih insight / opini / probabilitas.

${persona}

Conversation:
${history.map(h=>`${h.role}: ${h.content}`).join("\n")}
`

    try{
        const res = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+process.env.GOOGLE_API_KEY,
            {
                contents:[
                    {
                        parts:[{ text: prompt }]
                    }
                ]
            },
            { timeout:20000 }
        )

        const reply =
        res.data.candidates?.[0]?.content?.parts?.[0]?.text
        || "hmm otak gua ngeblank bentar 😅"

        pushHistory(id,"assistant",reply)

        await fastSend(id,reply)

    }catch(e){
        console.log(e.response?.data || e.message)
        bot.sendMessage(id,"AI lagi lemot / quota mungkin")
    }
})

console.log("⚡ ULTRA FAST SMART AI AGENT READY")
