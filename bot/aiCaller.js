const axios = require("axios")

const MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite"
]

async function callGemini(prompt){

    for(const model of MODELS){

        for(let retry=0; retry<2; retry++){

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
                    { timeout:25000 }
                )

                const text =
                res.data?.candidates?.[0]?.content?.parts?.[0]?.text

                if(text) return text

            }catch(e){

                console.log("MODEL FAIL:",model,"retry:",retry)

                if(retry === 1){
                    console.log("SWITCH MODEL...")
                }

            }

        }

    }

    return "hmm otak gua lagi ngefreeze 😵 coba bentar lagi bro"
}

module.exports = { callGemini }
