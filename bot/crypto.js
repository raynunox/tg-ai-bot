const axios = require("axios")

async function price(symbol){
    const r = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
    )
    return r.data.price
}

module.exports = { price }
