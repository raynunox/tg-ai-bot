const axios = require("axios")

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   SYMBOL MAPPER
========================= */

const SYMBOL_MAP = {
    btc: "bitcoin", bitcoin: "bitcoin",
    eth: "ethereum", ethereum: "ethereum",
    bnb: "binancecoin",
    sol: "solana", solana: "solana",
    xrp: "ripple", ripple: "ripple",
    doge: "dogecoin", dogecoin: "dogecoin",
    ada: "cardano", cardano: "cardano",
    dot: "polkadot", polkadot: "polkadot",
    avax: "avalanche-2",
    matic: "matic-network", polygon: "matic-network",
    link: "chainlink", chainlink: "chainlink",
    ltc: "litecoin", litecoin: "litecoin",
    shib: "shiba-inu",
    ton: "the-open-network",
    pepe: "pepe",
    trx: "tron", tron: "tron",
}

function mapSymbol(text) {
    const t = text.toLowerCase().trim()
    return SYMBOL_MAP[t] || null
}

/* =========================
   CRYPTO PRICE
========================= */

async function getCryptoPrice(coinId) {
    log("MARKET", `fetching crypto: ${coinId}`)
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,idr&include_24hr_change=true`

    const res = await axios.get(url, { timeout: 8000 })
    const data = res.data[coinId]

    if (!data) throw new Error(`no data for ${coinId}`)

    log("MARKET", `${coinId} → $${data.usd}`)

    return {
        usd: data.usd,
        idr: data.idr,
        change24h: data.usd_24h_change ?? 0
    }
}

/* =========================
   GOLD PRICE IDR
========================= */

async function getGoldPriceIdr() {
    log("MARKET", "fetching gold price...")

    // Gold via metals-api fallback ke estimasi manual
    const res = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=idr",
        { timeout: 8000 }
    )

    // tether-gold = 1 troy oz, konversi ke gram (1 troy oz = 31.1035g)
    const pricePerOz = res.data?.["tether-gold"]?.idr
    if (!pricePerOz) throw new Error("gold data unavailable")

    const pricePerGram = pricePerOz / 31.1035
    log("MARKET", `gold → Rp ${Math.round(pricePerGram).toLocaleString()}/gram`)

    return Math.round(pricePerGram)
}

module.exports = { mapSymbol, getCryptoPrice, getGoldPriceIdr }
