const axios = require("axios")

function mapSymbol(text){

    if(!text) return null

    const t = text.toLowerCase()

    const list = [
        "btc",
        "bitcoin",
        "eth",
        "ethereum",
        "sol",
        "solana",
        "bnb",
        "xrp"
    ]

    const found = list.find(s => t.includes(s))

    if(!found) return null

    if(found === "bitcoin") return "BTC"
    if(found === "ethereum") return "ETH"
    if(found === "solana") return "SOL"

    return found.toUpperCase()
}

async function getCryptoPrice(symbol="BTC"){

    const res = await axios.get(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
        {
            headers:{
                "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY
            },
            params:{
                symbol,
                convert:"USD,IDR"
            }
        }
    )

    const data = res.data.data[symbol].quote

    return {
        usd: data.USD.price,
        idr: data.IDR.price,
        change24h: data.USD.percent_change_24h
    }
}

async function getGoldPriceIdr(){

    const res = await axios.get(
        "https://www.goldapi.io/api/XAU/USD",
        {
            headers:{
                "x-access-token": process.env.GOLD_API_KEY,
                "Content-Type":"application/json"
            }
        }
    )

    const ounceUsd = res.data.price
    const perGramUsd = ounceUsd / 31.1035

    const fx = await axios.get(
        "https://api.exchangerate.host/latest?base=USD&symbols=IDR"
    )

    const rate = fx.data.rates.IDR

    return perGramUsd * rate
}

module.exports = {
    mapSymbol,
    getCryptoPrice,
    getGoldPriceIdr
}
