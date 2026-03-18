const axios = require("axios")

const GROQ_KEY = process.env.GROQ_API_KEY
const MODEL_FAST = "llama-3.1-8b-instant"
const MODEL_SMART = "llama-3.3-70b-versatile"

/* =========================
   DEBUG LOGGER
========================= */

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   DYNAMIC SYSTEM PROMPT
   (inject tanggal & waktu realtime)
========================= */

function getSystemPrompt() {
    const now = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

    return `Lu AI super pinter tapi ngobrol kayak temen tongkrongan Indo.
Natural. Savage halus. Santai. Realistis.
Gak corporate. Gak textbook.

Konteks waktu sekarang: ${now} WIB

Kalau ditanya hari/tanggal/tahun/jam → jawab berdasarkan info di atas, jangan ragu.
Kalau ditanya harga realtime → kasih estimasi + bilang bisa berubah.
Kalau gak tau → jujur, jangan ngarang.

Ngerti crypto, emas, saham, ekonomi, tech, hal random.
Jawaban harus enak dibaca di Telegram.
Jangan kebanyakan simbol atau formatting aneh.
Bikin user ngerasa ngobrol sama manusia pinter.`
}

/* =========================
   CORE GROQ CALLER
========================= */

async function callGroq(prompt, smart = false) {
    const model = smart ? MODEL_SMART : MODEL_FAST
    log("GROQ", `model: ${model} | prompt length: ${prompt.length}`)

    const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model,
            temperature: 0.7,
            max_tokens: 800,
            messages: [
                { role: "system", content: getSystemPrompt() },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                Authorization: `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 8000
        }
    )

    const result = res.data.choices[0].message.content.trim()
    log("GROQ", `response length: ${result.length} chars`)
    return result
}

/* =========================
   PUBLIC callAI
   fast → smart → error msg
========================= */

async function callAI(prompt) {
    // Try fast model
    try {
        return await callGroq(prompt, false)
    } catch (e) {
        log("FAST MODEL FAIL", e.message)
    }

    // Fallback smart model
    try {
        log("FALLBACK", "trying smart model...")
        return await callGroq(prompt, true)
    } catch (e) {
        log("SMART MODEL FAIL", e.message)
    }

    // Both failed
    return "lagi capek mikir cuy… coba lagi bentar."
}

module.exports = { callAI }
