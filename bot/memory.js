/* =========================
   MEMORY MODULE
   Per-user chat history (in-memory)
   Max 10 messages per user
========================= */

const store = new Map()
const MAX_HISTORY = 10

function log(tag, msg) {
    const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })
    console.log(`[${time}] [${tag}] ${msg}`)
}

function getHistory(userId) {
    return store.get(String(userId)) || []
}

function addMessage(userId, role, content) {
    const key = String(userId)
    const history = store.get(key) || []

    history.push({ role, content })

    // Trim ke MAX_HISTORY
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY)
    }

    store.set(key, history)
    log("MEMORY", `user ${userId} → ${history.length} messages stored`)
}

function clearHistory(userId) {
    store.delete(String(userId))
    log("MEMORY", `user ${userId} history cleared`)
}

function getStats() {
    return {
        totalUsers: store.size,
        totalMessages: [...store.values()].reduce((sum, h) => sum + h.length, 0)
    }
}

module.exports = { getHistory, addMessage, clearHistory, getStats }
