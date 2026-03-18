function isRealtimeQuestion(text){

    const t = text.toLowerCase()

    const keywords = [
        "harga",
        "price",
        "berapa",
        "sekarang",
        "today",
        "realtime",
        "live",
        "naik",
        "turun",
        "market",
        "btc",
        "bitcoin",
        "emas",
        "gold",
        "saham",
        "stock"
    ]

    return keywords.some(k => t.includes(k))
}

function realtimeStyleAnswer(topic){

    return `Kalau ${topic} sekarang itu berubah terus tiap menit.

Gua bisa kasih gambaran kisaran / arah market,
tapi buat angka paling akurat lu harus cek sumber live kayak TradingView atau app market ya.`
}

module.exports = {
    isRealtimeQuestion,
    realtimeStyleAnswer
}
