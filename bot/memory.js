const memory = {}
const styles = {}

function getHistory(id){
    if(!memory[id]) memory[id] = []
    return memory[id]
}

function pushHistory(id, role, content){
    if(!memory[id]) memory[id] = []
    memory[id].push({ role, content })

    // ⭐ ULTRA FAST MODE → limit 6 turn
    memory[id] = memory[id].slice(-6)
}

function setStyle(id, style){
    styles[id] = style
}

function getStyle(id){
    return styles[id] || "casual"
}

module.exports = {
    getHistory,
    pushHistory,
    setStyle,
    getStyle
}
