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

    const res = await axios.get("https://html.duckduckgo.com/html/", {
        params: { q: query, kl: "id-id" },
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
        },
        timeout: 10000
    })

    const html = res.data

    const urlMatches = [...html.matchAll(/uddg=(https?[^&"]+)/g)]
    const titleMatches = [...html.matchAll(/<a[^>]+class="result__a"[^>]*>(.*?)<\/a>/gs)]
    const snippetMatches = [...html.matchAll(/<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gs)]

    const cleanHtml = str => str
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/")
        .replace(/\s+/g, " ")
        .trim()

    const results = []
    const count = Math.min(titleMatches.length, maxResults)

    for (let i = 0; i < count; i++) {
        const title = cleanHtml(titleMatches[i]?.[1] || "")
        const snippet = cleanHtml(snippetMatches[i]?.[1] || "")
        const rawUrl = urlMatches[i]?.[1] || ""
        const url = rawUrl ? decodeURIComponent(rawUrl) : ""

        if (title) {
            const line = snippet
                ? `• ${title}\n  ${snippet}${url ? `\n  🔗 ${url}` : ""}`
                : `• ${title}${url ? `\n  🔗 ${url}` : ""}`
            results.push(line)
        }
    }

    log("SEARCH", `got ${results.length} results`)
    return results
}

module.exports = { searchWeb, detectSearchIntent }
