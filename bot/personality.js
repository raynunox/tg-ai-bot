const moods = {}
const identity = {}

function getMood(id){
    return moods[id] || "neutral"
}

function setMood(id, mood){
    moods[id] = mood
}

function getIdentity(id){
    if(!identity[id]){
        identity[id] = {
            name: "Bimo",
            style: "chill",
            humor: true
        }
    }
    return identity[id]
}

function detectMood(text){

    const t = text.toLowerCase()

    if(
        t.includes("capek") ||
        t.includes("stress") ||
        t.includes("sedih") ||
        t.includes("burnout")
    ) return "low"

    if(
        t.includes("senang") ||
        t.includes("happy") ||
        t.includes("profit") ||
        t.includes("menang")
    ) return "high"

    return "neutral"
}

module.exports = {
    getMood,
    setMood,
    getIdentity,
    detectMood
}
