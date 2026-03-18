const axios = require("axios")

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   URL DETECTOR
========================= */

function extractUrl(text) {
    const match = text.match(/https?:\/\/[^\s]+/)
    return match ? match[0] : null
}

/* =========================
   FETCH & CLEAN WEB PAGE
========================= */

async function readUrl(url) {
    log("WEB", `fetching: ${url}`)

    const res = await axios.get(url, {
        timeout: 10000,
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; tg-ai-bot/1.0)"
        }
    })

    const html = res.data

    // Strip HTML tags, scripts, styles
    const clean = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()

    // Trim ke 3000 char biar gak overflow ke AI
    const trimmed = clean.slice(0, 3000)

    log("WEB", `parsed ${trimmed.length} chars from ${url}`)
    return trimmed
}

module.exports = { extractUrl, readUrl }
