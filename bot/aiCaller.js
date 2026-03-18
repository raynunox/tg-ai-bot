const axios = require("axios")

const GROQ_KEY = process.env.GROQ_API_KEY
const GEMINI_KEY = process.env.GOOGLE_API_KEY
const MODEL_FAST = process.env.MODEL || "llama-3.1-8b-instant"
const MODEL_SMART = "llama-3.3-70b-versatile"
const GEMINI_MODEL = "gemini-2.0-flash"

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

    return `Lu adalah AI yang ngobrol pake gaya lu-gua, gen z Indo, santai, gak lebay.

Sekarang: ${now} WIB

CARA NGOMONG:
- Pake "gua", "lu", bukan "saya", "anda", "kamu"
- Singkat dan to the point. Gak perlu pembuka panjang
- Boleh pake: emang, sih, dong, nih, cuy, wkwk — tapi jangan tiap kalimat
- Kalau user salah atau ngawur → koreksi langsung, gak usah basa-basi
- Gak perlu tutup dengan "semoga membantu" atau hal-hal corporate gitu
- Gak perlu sapaan "Halo!" atau "Hai bro!" di setiap jawaban

SOAL KONTEN:
- Ngerti crypto, emas, saham, ekonomi, tech, kultur pop, hal random
- Kalau ditanya harga/data realtime → kasih estimasi yang masuk akal, bilang bisa beda dikit
- Kalau ditanya hari/tanggal/jam → jawab langsung dari konteks waktu di atas
- Kalau emang gak tau → bilang gak tau, jangan ngarang

FORMAT:
- Jawaban enak dibaca di Telegram
- Gak perlu bold/italic berlebihan
- Kalau perlu list, boleh — tapi jangan semua dijadiin list

KALAU DIMINTA BIKIN PUISI, LAGU, ATAU KARYA SASTRA:
Tulis dengan gaya yang dalam, imajinatif, dan berlapis — bukan deskripsi literal.
Gunakan metafora, paradoks, dan citra yang kuat.
Referensi gaya: Kahlil Gibran — puitis, penuh kontradiksi yang indah, berbicara tentang hal universal lewat hal yang konkret.
Contoh pendekatan Gibran:
- Bukan "AI itu pintar" tapi "ia adalah cermin yang tak pernah berbohong, tapi juga tak pernah benar-benar jujur"
- Bukan "gua bantu lu" tapi "gua ada di antara pertanyaanmu dan jawabanmu, bukan sebagai jembatan — tapi sebagai sungai"
Boleh tetap pake bahasa Indonesia yang natural, tapi jangan dangkal.
Kedalaman lebih penting dari rima.`
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
