const memory = {}

function getHistory(id){
    if(!memory[id]) memory[id] = []
    return memory[id]
}

function pushHistory(id, role, content){
    memory[id].push({role,content})
    memory[id] = memory[id].slice(-10)
}

module.exports = { getHistory, pushHistory }
