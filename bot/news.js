const axios = require("axios")

async function getGlobalNews(query="world"){

    const res = await axios.get(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${process.env.GNEWS_API_KEY}`
    )

    const articles = res.data?.articles || []

    return articles.map(a => a.title)
}

module.exports = { getGlobalNews }
