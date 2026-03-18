const axios = require("axios")

async function getGlobalNews(query = "world"){

    const key = process.env.GNEWS_API_KEY

    const res = await axios.get(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${key}`
    )

    const articles = res.data?.articles || []

    return articles.map(a => ({
        title: a.title,
        source: a.source?.name,
        url: a.url,
        time: a.publishedAt
    }))
}

module.exports = { getGlobalNews }
