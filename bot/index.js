const TelegramBot = require("node-telegram-bot-api")

const { getHistory, pushHistory, setStyle, getStyle } = require("./memory")
const { price } = require("./crypto")
const { formatTelegram, splitMessage } = require("./formatter")
const { callGemini } = require("./aiCaller")

const bot = new TelegramBot(process.env.BOT_TOKEN,{ polling:true })

async function sendFast(id,text){
    const formatted = formatTelegram(text)
    const parts = splitMessage(formatted,2500)

    for(const p of parts){
        await bot.sendMessage(id,p,{
            parse_mode:"HTML",
            disable_web_page_preview:true
        })
    }
}

function detectPriceIntent(text){
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

    if(t.includes("santai") || t.includes("casual") || t.includes("kayak temen"))
        return "casual"

    if(t.includes("trader") || t.includes("analisa") || t.includes("crypto mode"))
        return "crypto"

    if(t.includes("formal") || t.includes("serius"))
        return "formal"

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
        return sendFast(id,`oke noted 👍 sekarang gua ngobrol mode **${newStyle}**`)
    }

    // ⭐ LIVE PRICE TOOL (SUPER CEPAT)
    const coin = detectPriceIntent(text)
    if(coin){
        try{
            const p = await price(coin)
            return sendFast(id,
                `hmm bentar gua cek 👀\n\n`+
                `**${coin} sekarang sekitar**\n💰 ${p} USDT\n\n`+
                `market lagi agak random sih… santai aja dulu 😅`
            )
        }catch{
            return bot.sendMessage(id,"gagal ambil price bro")
        }
    }

    // ⭐ THINKING UX
    bot.sendChatAction(id,"typing")

    const history = getHistory(id)
    pushHistory(id,"user",text)

    const style = getStyle(id)

    let persona = ""

    if(style === "casual"){
        persona =
        "Ngomong kayak temen crypto nongkrong. Natural. Insightful. Santai."
    }

    if(style === "crypto"){
        persona =
        "Ngomong kayak trader berpengalaman. Fokus probabilitas market."
    }

    if(style === "formal"){
        persona =
        "Ngomong profesional tapi tetap manusiawi."
    }

    const prompt =
`Lu AI crypto assistant yang pinter banget.
Ngobrol natural kayak manusia.
Jangan kaku.
Jangan tutorial.
Kasih opini & intuisi market.

${persona}

Conversation:
${history.map(h=>`${h.role}: ${h.content}`).join("\n")}
`

    try{

        const reply = await callGemini(prompt)

        pushHistory(id,"assistant",reply)

        await sendFast(id,reply)

    }catch(e){
        console.log(e)
        bot.sendMessage(id,"AI lagi sibuk bro 😅 coba bentar lagi")
    }

})

console.log("⚡ SUPER STABLE NATURAL AI AGENT READY")
