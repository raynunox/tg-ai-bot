const axios = require("axios")

const GROQ_KEY = process.env.GROQ_API_KEY
const MODEL_FAST = process.env.MODEL || "llama-3.1-8b-instant"
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
   GEMINI FALLBACK
========================= */

async function callGemini(prompt) {
    log("GEMINI", `calling ${GEMINI_MODEL}`)

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
            systemInstruction: {
                parts: [{ text: getSystemPrompt() }]
            },
            contents: [
                { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
            }
        },
        { timeout: 10000 }
    )

    const result = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!result) throw new Error("empty Gemini response")

    log("GEMINI", `response length: ${result.length} chars`)
    return result
}

/* =========================
   PUBLIC callAI
   fast → smart → gemini → error msg
========================= */

async function callAI(prompt) {
    // 1. Try fast Groq
    try {
        return await callGroq(prompt, false)
    } catch (e) {
        log("FAST MODEL FAIL", e.message)
    }

    // 2. Fallback smart Groq
    try {
        log("FALLBACK", "trying smart Groq model...")
        return await callGroq(prompt, true)
    } catch (e) {
        log("SMART MODEL FAIL", e.message)
    }

    // 3. Fallback Gemini
    try {
        log("FALLBACK", "trying Gemini...")
        return await callGemini(prompt)
    } catch (e) {
        log("GEMINI FAIL", e.message)
    }

    // All failed
    return "lagi capek mikir cuy… coba lagi bentar."
}

module.exports = { callAI }
