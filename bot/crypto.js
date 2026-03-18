const axios = require("axios")

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   SUPPORTED COINS
========================= */

const COINS = {
    bitcoin: "BTC",
    ethereum: "ETH",
    binancecoin: "BNB",
    solana: "SOL",
    ripple: "XRP",
    dogecoin: "DOGE",
    cardano: "ADA",
    "avalanche-2": "AVAX",
    "matic-network": "MATIC",
    chainlink: "LINK",
    litecoin: "LTC",
    "shiba-inu": "SHIB",
    "the-open-network": "TON",
    pepe: "PEPE",
    tron: "TRX",
}

/* =========================
   FETCH SINGLE COIN
========================= */

async function fetchPrice(coinId) {
    log("CRYPTO", `fetching ${coinId}`)

    const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
            params: {
                ids: coinId,
                vs_currencies: "usd,idr",
                include_24hr_change: true
            },
            timeout: 8000
        }
    )

    const data = res.data?.[coinId]
    if (!data) throw new Error(`no price data for ${coinId}`)

    return {
        id: coinId,
        symbol: COINS[coinId] || coinId.toUpperCase(),
        usd: data.usd,
        idr: data.idr,
        change24h: data.usd_24h_change ?? 0
    }
}

/* =========================
   FETCH MULTIPLE COINS
========================= */

async function fetchMultiple(coinIds = []) {
    const ids = coinIds.join(",")
    log("CRYPTO", `fetching multiple: ${ids}`)

    const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
            params: {
                ids,
                vs_currencies: "usd,idr",
                include_24hr_change: true
            },
            timeout: 8000
        }
    )

    return Object.entries(res.data).map(([id, data]) => ({
        id,
        symbol: COINS[id] || id.toUpperCase(),
        usd: data.usd,
        idr: data.idr,
        change24h: data.usd_24h_change ?? 0
    }))
}

module.exports = { fetchPrice, fetchMultiple, COINS }
