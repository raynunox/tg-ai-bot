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

module.exports = {
    mapSymbol,
    getCryptoPrice,
    getGoldPriceIdr
}
