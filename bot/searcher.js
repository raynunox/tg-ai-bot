const axios = require("axios")

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   SEARCH INTENT DETECTOR
========================= */

function detectSearchIntent(text) {
    const t = text.toLowerCase()
    const keys = [
        "cari", "cariin", "coba cari", "search", "googling",
        "cek di web", "cariin di web", "cari di web", "cari di internet",
        "siapa itu", "apa itu", "gimana cara", "tutorial",
        "terbaru", "sekarang", "hari ini", "2024", "2025", "2026",
        "supplier", "rekomen", "rekomendasi", "list", "daftar",
        "dimana", "di mana", "review", "toko", "harga"
    ]
    return keys.some(k => t.includes(k))
}

/* =========================
   DUCKDUCKGO SEARCH
   No API key, totally free
========================= */

async function searchWeb(query, maxResults = 5) {
    log("SEARCH", `DDG query: "${query}"`)

    // DuckDuckGo HTML search endpoint
    const res = await axios.get("https://html.duckduckgo.com/html/", {
        params: { q: query },
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; tg-ai-bot/1.0)",
            "Accept-Language": "en-US,en;q=0.9"
        },
        timeout: 10000
    })

    const html = res.data

    // Extract result titles, snippets, and URLs
    const titleMatches = [...html.matchAll(/class="result__title"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs)]
    const snippetMatches = [...html.matchAll(/class="result__snippet"[^>]*>(.*?)<\/span>/gs)]

    const cleanHtml = str => str
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/\s+/g, " ")
        .trim()

    const results = []
    const count = Math.min(titleMatches.length, snippetMatches.length, maxResults)

    for (let i = 0; i < count; i++) {
        const url = titleMatches[i][1] || ""
        const title = cleanHtml(titleMatches[i][2])
        const snippet = cleanHtml(snippetMatches[i][1])
        if (title && snippet) {
            results.push(`• ${title}\n  ${snippet}${url ? `\n  🔗 ${url}` : ""}`)
        }
    }

    log("SEARCH", `got ${results.length} results`)
    return results
}

module.exports = { searchWeb, detectSearchIntent }
