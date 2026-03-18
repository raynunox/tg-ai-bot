require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")
const { mapSymbol, getCryptoPrice, getGoldPriceIdr } = require("./market")
const { getGlobalNews } = require("./news")
const { callAI } = require("./aiCaller")

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false })

/* =========================
   DEBUG LOGGER
========================= */

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

/* =========================
   SAFE TIMEOUT WRAPPER
========================= */

function withTimeout(promise, ms = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
        )
    ])
}

/* =========================
   TYPING HELPER
========================= */

async function typing(id) {
    try {
        await bot.sendChatAction(id, "typing")
    } catch (e) {
        log("TYPING", `fail: ${e.message}`)
    }
}

/* =========================
   START ENGINE (ANTI CONFLICT)
========================= */

async function start() {
    try {
        log("START", "Deleting webhook...")
        await bot.deleteWebHook()
        await bot.stopPolling().catch(() => {})

        await bot.startPolling({
            interval: 300,
            autoStart: true,
            params: { timeout: 10 }
        })

        log("START", "🚀 AI Agent Stable Running")
    } catch (e) {
        log("START ERROR", e.message)
    }
}

start()

/* =========================
   NEWS INTENT DETECTOR
========================= */

function detectNewsIntent(text) {
    const t = text.toLowerCase()
    const keys = [
        "news", "berita", "update", "kenapa",
        "apa yang terjadi", "global", "ekonomi dunia",
        "market kenapa", "perang", "inflasi"
    ]
    return keys.some(k => t.includes(k))
}

/* =========================
   MAIN MESSAGE ENGINE
========================= */

bot.on("message", async (msg) => {
    const text = msg?.text?.trim()
    const id = msg?.chat?.id

    if (!text || !id) return

    log("MSG", `from ${id}: "${text}"`)

    // Langsung kirim typing sebelum proses apapun
    await typing(id)

    try {

        /* ===== CRYPTO ROUTER ===== */
        const symbol = mapSymbol(text)

        if (symbol) {
            log("ROUTE", `crypto → ${symbol}`)
            try {
                const p = await withTimeout(getCryptoPrice(symbol), 8000)
                return bot.sendMessage(id,
`💰 ${symbol}

USD : $${p.usd.toFixed(2)}
IDR : Rp ${Math.round(p.idr).toLocaleString()}
24h : ${p.change24h.toFixed(2)}%`)
            } catch (e) {
                log("CRYPTO FAIL", `${e.message} → fallback AI`)
                await typing(id)
                const reply = await withTimeout(
                    callAI(`Berapa harga ${symbol} sekarang? Kasih estimasi terbaru yang kamu tau.`),
                    10000
                )
                return bot.sendMessage(id, reply)
            }
        }

        /* ===== GOLD ROUTER ===== */
        if (text.toLowerCase().includes("emas")) {
            log("ROUTE", "gold")
            try {
                const g = await withTimeout(getGoldPriceIdr(), 8000)
                return bot.sendMessage(id,
`💰 Emas spot

Rp ${g.toLocaleString()} / gram`)
            } catch (e) {
                log("GOLD FAIL", `${e.message} → fallback AI`)
                await typing(id)
                const reply = await withTimeout(
                    callAI("Berapa harga emas sekarang dalam rupiah per gram? Kasih estimasi."),
                    10000
                )
                return bot.sendMessage(id, reply)
            }
        }

        /* ===== NEWS ROUTER ===== */
        if (detectNewsIntent(text)) {
            log("ROUTE", "news")
            try {
                const news = await withTimeout(getGlobalNews(text), 10000)

                if (news && news.length) {
                    await typing(id)
                    const prompt =
`Ini berita global terbaru:

${news.join("\n")}

Jelaskan santai ke temen: apa yang terjadi + dampaknya.`

                    const ai = await withTimeout(callAI(prompt), 12000)
                    return bot.sendMessage(id, ai)
                } else {
                    log("NEWS", "empty result → fallback AI")
                    await typing(id)
                    const reply = await withTimeout(callAI(text), 10000)
                    return bot.sendMessage(id, reply)
                }
            } catch (e) {
                log("NEWS FAIL", `${e.message} → fallback AI`)
                await typing(id)
                const reply = await withTimeout(callAI(text), 10000)
                return bot.sendMessage(id, reply)
            }
        }

        /* ===== GENERAL AI CHAT ===== */
        log("ROUTE", "general AI")
        try {
            const reply = await withTimeout(callAI(text), 12000)
            return bot.sendMessage(id, reply)
        } catch (e) {
            log("AI FAIL", e.message)
            return bot.sendMessage(id, "otak gua lagi ngefreeze bentar cuy… coba ulang.")
        }

    } catch (e) {
        log("FATAL", e.message)
        return bot.sendMessage(id, "⚠️ system error parah bro")
    }
})

/* =========================
   GLOBAL CRASH GUARD
========================= */

process.on("uncaughtException", (err) => {
    log("UNCAUGHT EXCEPTION", err.message)
})

process.on("unhandledRejection", (err) => {
    log("UNHANDLED REJECTION", err?.message || err)
})
