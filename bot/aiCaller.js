const axios = require("axios")

const GROQ_KEY = process.env.GROQ_API_KEY

const MODEL_FAST = "llama-3.1-8b-instant"
const MODEL_SMART = "llama-3.3-70b-versatile"

async function callGroq(prompt, smart=false){

    const model = smart ? MODEL_SMART : MODEL_FAST

    const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model,
            temperature: 0.7,
            max_tokens: 800,
            messages: [
                {
                    role:"system",
                    content:
`Lu AI super pinter tapi ngobrol kayak temen tongkrongan Indo.

Natural.
Savage halus.
Santai.
Gak corporate.
Gak textbook.

Kalau realtime info gak yakin → bilang kisaran / kemungkinan.

Jawaban harus enak dibaca di Telegram.
Jangan kebanyakan simbol aneh.`
                },
                {
                    role:"user",
                    content: prompt
                }
            ]
        },
        {
            headers:{
                Authorization:`Bearer ${GROQ_KEY}`,
                "Content-Type":"application/json"
            },
            timeout:15000
        }
    )

    return res.data.choices[0].message.content.trim()
}

async function callAI(prompt){

    try{

        // first try fast
        return await callGroq(prompt,false)

    }catch(e){

        console.log("FAST MODEL FAIL → fallback smart")

        try{
            return await callGroq(prompt,true)
        }catch(err){

            console.log("SMART MODEL FAIL")

            return "lagi capek mikir cuy… coba lagi bentar."
        }
    }
}

module.exports = { callAI }
