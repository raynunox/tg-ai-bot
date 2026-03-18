const axios = require("axios")

const CMC_KEY = process.env.CMC_API_KEY
const GOLD_KEY = process.env.GOLD_API_KEY

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   SYMBOL MAPPER
   text → CMC symbol
========================= */

const SYMBOL_MAP = {
    btc: "BTC", bitcoin: "BTC",
    eth: "ETH", ethereum: "ETH",
    bnb: "BNB",
    sol: "SOL", solana: "SOL",
    xrp: "XRP", ripple: "XRP",
    doge: "DOGE", dogecoin: "DOGE",
    ada: "ADA", cardano: "ADA",
    dot: "DOT", polkadot: "DOT",
    avax: "AVAX", avalanche: "AVAX",
    matic: "MATIC", polygon: "MATIC",
    link: "LINK", chainlink: "LINK",
    ltc: "LTC", litecoin: "LTC",
    shib: "SHIB",
    ton: "TON",
    pepe: "PEPE",
    trx: "TRX", tron: "TRX",
    sui: "SUI",
    apt: "APT", aptos: "APT",
    arb: "ARB", arbitrum: "ARB",
    op: "OP", optimism: "OP",
}

function mapSymbol(text) {
    const t = text.toLowerCase().trim()
    return SYMBOL_MAP[t] || null
}

/* =========================
   CRYPTO PRICE (CoinMarketCap)
========================= */

async function getCryptoPrice(symbol) {
    log("MARKET", `fetching CMC: ${symbol}`)

    // Get USD price from CMC
    const cmcRes = await axios.get(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
        {
            params: { symbol, convert: "USD" },
            headers: { "X-CMC_PRO_API_KEY": CMC_KEY },
            timeout: 8000
        }
    )

    const data = cmcRes.data?.data?.[symbol]?.quote?.USD
    if (!data) throw new Error(`no CMC data for ${symbol}`)

    // Get IDR rate from USD
    const fxRes = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/USD",
        { timeout: 5000 }
    )
    const idrRate = fxRes.data?.rates?.IDR ?? 16000

    const usd = data.price
    const idr = usd * idrRate
    const change24h = data.percent_change_24h ?? 0

    log("MARKET", `${symbol} → $${usd.toFixed(2)} | Rp ${Math.round(idr).toLocaleString()}`)

    return { usd, idr, change24h }
}

/* =========================
   GOLD PRICE IDR (goldapi.io)
========================= */

async function getGoldPriceIdr() {
    log("MARKET", "fetching goldapi.io...")

    const res = await axios.get("https://www.goldapi.io/api/XAU/USD", {
        headers: {
            "x-access-token": GOLD_KEY,
            "Content-Type": "application/json"
        },
        timeout: 8000
    })

    const pricePerOz = res.data?.price
    if (!pricePerOz) throw new Error("gold data unavailable")

    // Get IDR rate
    const fxRes = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/USD",
        { timeout: 5000 }
    )
    const idrRate = fxRes.data?.rates?.IDR ?? 16000

    // 1 troy oz = 31.1035 gram
    const pricePerGram = (pricePerOz * idrRate) / 31.1035

    log("MARKET", `gold → $${pricePerOz}/oz | Rp ${Math.round(pricePerGram).toLocaleString()}/gram`)

    return Math.round(pricePerGram)
}

module.exports = { mapSymbol, getCryptoPrice, getGoldPriceIdr }
