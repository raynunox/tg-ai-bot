const axios = require("axios")

const GNEWS_KEY = process.env.GNEWS_API_KEY

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   KEYWORD EXTRACTOR
========================= */

function extractKeyword(text) {
    const stopwords = ["kenapa", "apa", "yang", "terjadi", "gimana", "soal", "tentang", "update", "berita", "news"]
    const words = text.toLowerCase().split(/\s+/).filter(w => !stopwords.includes(w) && w.length > 2)
    return words.slice(0, 3).join(" ") || "global economy"
}

/* =========================
   GET GLOBAL NEWS
========================= */

async function getGlobalNews(query = "") {
    const keyword = extractKeyword(query)
    log("NEWS", `fetching gnews for: "${keyword}"`)

    if (!GNEWS_KEY) {
        log("NEWS", "GNEWS_API_KEY not set, skipping")
        return []
    }

    const res = await axios.get("https://gnews.io/api/v4/search", {
        params: {
            q: keyword,
            lang: "en",
            max: 5,
            sortby: "publishedAt",
            apikey: GNEWS_KEY
        },
        timeout: 10000
    })

    const articles = res.data?.articles ?? []

    if (!articles.length) {
        log("NEWS", "no articles found")
        return []
    }

    const results = articles
        .filter(a => a.title && a.description)
        .slice(0, 5)
        .map(a => `• ${a.title} — ${a.description}`)

    log("NEWS", `got ${results.length} articles`)
    return results
}

module.exports = { getGlobalNews }
