/* =========================
   FORMATTER MODULE
   Format output biar rapi di Telegram
========================= */

function formatCrypto(symbol, usd, idr, change24h) {
    const arrow = change24h >= 0 ? "🟢" : "🔴"
    const sign = change24h >= 0 ? "+" : ""
    return `💰 ${symbol.toUpperCase()}

USD : $${usd.toFixed(2)}
IDR : Rp ${Math.round(idr).toLocaleString("id-ID")}
24h : ${arrow} ${sign}${change24h.toFixed(2)}%`
}

function formatGold(pricePerGram) {
    return `💰 Emas Spot

Rp ${Math.round(pricePerGram).toLocaleString("id-ID")} / gram
(estimasi, bisa berubah)`
}

function formatError(context = "") {
    const messages = [
        "waduh error nih cuy, coba lagi bentar.",
        "lagi ada gangguan, bentar ya.",
        "sistem lagi ngambek, coba ulang.",
    ]
    const msg = messages[Math.floor(Math.random() * messages.length)]
    return context ? `[${context}] ${msg}` : msg
}

function truncate(text, maxLen = 4000) {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + "\n\n…(dipotong)"
}

module.exports = { formatCrypto, formatGold, formatError, truncate }
