const axios = require("axios")

const MODELS = [
   "gemini-2.5-flash",
   "gemini-flash-latest",
   "gemini-2.0-flash"
]

async function callModel(model, prompt){

    try{

        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                contents:[
                    {
                        parts:[{ text: prompt }]
                    }
                ]
            },
            { timeout:30000 }
        )

        const text =
        res.data?.candidates?.[0]?.content?.parts?.[0]?.text

        if(text) return text

        throw new Error("empty response")

    }catch(e){
        console.log("MODEL FAIL:",model)
        throw e
    }
}

async function callGemini(prompt){

    // ⭐ PARALLEL RACING ENGINE
    const racers = MODELS.map(m =>
        callModel(m,prompt)
            .then(res => ({ ok:true, res }))
            .catch(() => ({ ok:false }))
    )

    const winner = await Promise.race(racers)

    if(winner.ok) return winner.res

    // ⭐ FALLBACK SERIAL RETRY
    for(const model of MODELS){

        for(let retry=0; retry<2; retry++){

            try{
                const r = await callModel(model,prompt)
                if(r) return r
            }catch{}
        }
    }

    return "hmm… otak gua lagi hang bentar 😵 coba ulang dikit lagi ya bro"
}

module.exports = { callGemini }
