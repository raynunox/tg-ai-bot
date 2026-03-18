const axios = require("axios")

async function price(symbol){
    const r = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
    )
    return r.data.price
}

async function signal(symbol){
    const p = await price(symbol)
    return `AI Quick Signal ${symbol}\nPrice: $${p}\nBias: Neutral`
}

module.exports = { price, signal }
