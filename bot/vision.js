const axios = require("axios")

const GEMINI_KEY = process.env.GOOGLE_API_KEY
const GEMINI_MODEL = "gemini-2.0-flash"

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   DOWNLOAD FILE AS BASE64
========================= */

async function downloadAsBase64(url) {
    log("VISION", `downloading: ${url}`)
    const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000
    })
    const base64 = Buffer.from(res.data).toString("base64")
    const mimeType = res.headers["content-type"]?.split(";")[0] || "image/jpeg"
    log("VISION", `downloaded ${base64.length} chars, mime: ${mimeType}`)
    return { base64, mimeType }
}

/* =========================
   ANALYZE IMAGE
========================= */

async function analyzeImage(fileUrl, userPrompt = "") {
    log("VISION", `analyzing image: ${fileUrl}`)

    const { base64, mimeType } = await downloadAsBase64(fileUrl)

    const prompt = userPrompt || "Jelaskan isi gambar ini secara detail dalam bahasa Indonesia yang santai."

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
            contents: [{
                parts: [
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64
                        }
                    },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
            }
        },
        { timeout: 20000 }
    )

    const result = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!result) throw new Error("empty Gemini Vision response")

    log("VISION", `image analyzed, ${result.length} chars`)
    return result
}

/* =========================
   ANALYZE PDF
========================= */

async function analyzePdf(fileUrl, userPrompt = "") {
    log("VISION", `analyzing PDF: ${fileUrl}`)

    const { base64 } = await downloadAsBase64(fileUrl)

    const prompt = userPrompt || "Rangkum isi dokumen ini dalam bahasa Indonesia yang santai dan to the point."

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
            contents: [{
                parts: [
                    {
                        inline_data: {
                            mime_type: "application/pdf",
                            data: base64
                        }
                    },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500
            }
        },
        { timeout: 30000 }
    )

    const result = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!result) throw new Error("empty Gemini PDF response")

    log("VISION", `PDF analyzed, ${result.length} chars`)
    return result
}

module.exports = { analyzeImage, analyzePdf }
