const axios = require("axios")

async function callAI(prompt){

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`

    const res = await axios.post(url,{
        contents:[
            {
                parts:[
                    { text: prompt }
                ]
            }
        ]
    })

    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "AI error"
}

module.exports = { callAI }
