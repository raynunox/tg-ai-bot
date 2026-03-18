const TelegramBot = require("node-telegram-bot-api")

const { getHistory, pushHistory, setStyle, getStyle } = require("./memory")
const { price } = require("./crypto")
const { formatTelegram, splitMessage } = require("./formatter")
const { callGemini } = require("./aiCaller")
const { getMood, setMood, getIdentity, detectMood } = require("./personality")

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
        if(
            t.includes(c) &&
            (
                t.includes("harga") ||
                t.includes("price") ||
                t.includes("berapa") ||
                t.includes("now") ||
                t.includes("sekarang")
            )
        ){
            return c.toUpperCase()
        }
    }
    return null
}

function detectStyle(text){
    const t = text.toLowerCase()

    if(t.includes("formal")) return "formal"
    if(t.includes("santai") || t.includes("casual")) return "casual"
    if(t.includes("serius") || t.includes("analisa")) return "deep"

    return null
}

bot.on("message", async (msg)=>{
    const text = msg.text
    const id = msg.chat.id
    if(!text) return

    // ⭐ STYLE SWITCH
    const newStyle = detectStyle(text)
    if(newStyle){
        setStyle(id,newStyle)
        return sendFast(id,`oke noted 👍 sekarang style ngobrol gua **${newStyle}**`)
    }

    // ⭐ PRICE TOOL (FAST ROUTER)
    const coin = detectPriceIntent(text)
    if(coin){
        try{
            const p = await price(coin)
            return sendFast(id,
                `bentar gua cek 👀\n\n`+
                `<b>${coin} sekarang sekitar</b>\n💰 ${p} USDT`
            )
        }catch{
            return bot.sendMessage(id,"gagal ambil price bro")
        }
    }

    // ⭐ THINKING UX
    bot.sendChatAction(id,"typing")

    const history = getHistory(id)
    pushHistory(id,"user",text)

    // ⭐ PERSONALITY ENGINE
    const mood = detectMood(text)
    setMood(id,mood)

    const userMood = getMood(id)
    const persona = getIdentity(id)
    const style = getStyle(id)

    let styleInstruction = ""

    if(style === "formal")
        styleInstruction = "Jawab lebih rapi dan profesional."

    if(style === "deep")
        styleInstruction = "Jawab lebih dalam, analitis, dan insightful."

    if(style === "casual")
        styleInstruction = "Jawab santai banget kayak temen nongkrong."

    const prompt =
`Lu adalah AI bernama ${persona.name}.

Karakter:
- sangat natural
- ngobrol kayak manusia real
- cerdas tapi santai
- kadang humor ringan
- gak textbook AI
- gak terlalu panjang

Mood user sekarang: ${userMood}

Behavior:
- kalau user low mood → empati
- kalau user high mood → fun & hype
- kalau neutral → chill normal

Lu bisa bahas topik apa aja:
hidup, teknologi, bisnis, crypto, game, relationship, random thoughts.

${styleInstruction}

Kasih opini real, perspektif, intuisi.
Jangan generik.
Jangan tutorial tone.

Conversation:
${history.map(h=>`${h.role}: ${h.content}`).join("\n")}
`

    try{

        const reply = await callGemini(prompt)

        pushHistory(id,"assistant",reply)

        await sendFast(id,reply)

    }catch(e){
        console.log(e)
        bot.sendMessage(id,"AI lagi sibuk bentar 😅 coba ulang ya")
    }

})

console.log("🌍 GLOBAL HUMAN AI ENGINE READY")
