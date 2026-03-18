const axios = require("axios")

const MODELS = [
   "gemini-2.5-flash",
   "gemini-flash-latest",
   "gemini-2.0-flash"
]

async function callModel(model, prompt){

   const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
         contents:[
            {
               parts:[{ text: prompt }]
            }
         ]
      },
      { timeout:35000 }
   )

   const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text

   if(!text) throw new Error("empty response")

   return text
}

async function raceModels(prompt){

   const racers = MODELS.map(m =>
      callModel(m,prompt)
         .then(r=>({ok:true,r}))
         .catch(()=>({ok:false}))
   )

   const winner = await Promise.race(racers)

   if(winner.ok) return winner.r

   throw new Error("race fail")
}

async function fallbackSerial(prompt){

   for(const model of MODELS){

      for(let retry=0; retry<2; retry++){

         try{
            const r = await callModel(model,prompt)
            if(r) return r
         }catch{}
      }

   }

   return null
}

async function callGemini(prompt){

   // ⭐ PARALLEL FIRST
   try{
      return await raceModels(prompt)
   }catch(e){
      console.log("⚠️ parallel fail → serial fallback")
   }

   // ⭐ SERIAL RETRY
   const serial = await fallbackSerial(prompt)
   if(serial) return serial

   return "hmm… otak gua lagi lemot bentar 😵 coba ulang ya"
}

module.exports = { callGemini }
