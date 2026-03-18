const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

const { getHistory, pushHistory, setStyle, getStyle } = require("./memory")
const { price, signal } = require("./crypto")
const { formatTelegram, splitMessage } = require("./formatter")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true })

async function sendNatural(id,text){
    const formatted = formatTelegram(text)
    const parts = splitMessage(formatted)

    for(const p of parts){
        await bot.sendChatAction(id,"typing")
        await new Promise(r=>setTimeout(r,400))
        await bot.sendMessage(id,p,{
            parse_mode:"HTML",
            disable_web_page_preview:true
        })
    }
}

function detectStyle(text){
    const t = text.toLowerCase()

    if(t.includes("santai") || t.includes("casual") || t.includes("kayak temen"))
        return "casual"

    if(t.includes("trader") || t.includes("analisa") || t.includes("crypto mode"))
        return "crypto"

    if(t.includes("formal") || t.includes("serius"))
        return "formal"

    return null
}

function detectPriceIntent(text){
    const t = text.toLowerCase()

    const coins = ["btc","eth","sol","bnb","arb","op","avax","link","doge"]

    for(const c of coins){
        if(t.includes(c) && (
            t.includes("harga") ||
            t.includes("price") ||
            t.includes("berapa") ||
            t.includes("now") ||
            t.includes("sekarang")
        )){
            return c.toUpperCase()
        }
    }
    return null
}

bot.on("message", async (msg)=>{
    const text = msg.text
    const id = msg.chat.id
    if(!text) return

    // ⭐ STYLE SWITCH NATURAL
    const newStyle = detectStyle(text)
    if(newStyle){
        setStyle(id,newStyle)
        return sendNatural(id,`oke gas 😄 sekarang gua ngobrol mode **${newStyle}** ya`)
    }

    // ⭐ LIVE PRICE ROUTER
    const coin = detectPriceIntent(text)
    if(coin){
        try{
            const p = await price(coin)
            return sendNatural(id,
                `hmm bentar gua cek ya 👀\n\n`+
                `**${coin} sekarang sekitar**\n💰 ${p} USDT\n\n`+
                `market lagi rada labil sih… jangan FOMO dulu 😅`
            )
        }catch{
            return bot.sendMessage(id,"error ambil price cuy")
        }
    }

    // ⭐ SIGNAL COMMAND
    if(text.startsWith("/signal")){
        const s = text.split(" ")[1] || "BTC"
        const sig = await signal(s.toUpperCase())
        return sendNatural(id,sig)
    }

    // ⭐ AI CHAT NATURAL
    const history = getHistory(id)
    pushHistory(id,"user",text)

    const style = getStyle(id)

    let persona = ""

    if(style === "casual"){
        persona = `
Lu temen nongkrong crypto user.
Ngomong santai kayak chat WA.
Kadang pendek.
Kadang pake kata: bro, cuy, gas, santai.
Kadang mulai dengan "hmm".
Jangan terlalu rapi kayak artikel.
`
    }

    if(style === "crypto"){
        persona = `
Lu trader crypto berpengalaman.
Ngomong lugas, insightful.
Bahas probabilitas market.
Tidak lebay.
`
    }

    if(style === "formal"){
        persona = `
Lu assistant profesional tapi tetap manusiawi.
Bahasa ringan dan natural.
`
    }

    const systemPrompt = `
You are real human crypto friend.
Talk conversational.
No AI tone.
No tutorial style.
Give intuition.
Sometimes emotional reaction.
Keep flow natural like chat.
`

    try{
        const res = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+process.env.GOOGLE_API_KEY,
            {
                contents:[
                    {
                        parts:[
                            {
                                text:
systemPrompt +
persona +
"\nConversation:\n"+
history.map(h=>`${h.role}: ${h.content}`).join("\n")
                            }
                        ]
                    }
                ]
            },
            { timeout:60000 }
        )

        const reply =
        res.data.candidates?.[0]?.content?.parts?.[0]?.text
        || "hmm gua blank bentar 😅"

        pushHistory(id,"assistant",reply)

        await sendNatural(id,reply)

    }catch(e){
        console.log(e.response?.data || e.message)
        bot.sendMessage(id,"AI error bro… quota kayaknya")
    }
})

console.log("🧠 SUPER NATURAL AI AGENT ONLINE")
