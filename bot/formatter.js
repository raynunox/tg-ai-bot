function escapeHTML(text){
    return text
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
}

function formatBold(text){
    return text.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")
}

function formatItalic(text){
    return text.replace(/\*(.*?)\*/g,"<i>$1</i>")
}

function formatCodeBlock(text){
    return text.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>")
}

function formatInlineCode(text){
    return text.replace(/`([^`]+)`/g,"<code>$1</code>")
}

function formatList(text){
    return text.replace(/^\s*[-•]\s+/gm,"• ")
}

function formatEmojiSpacing(text){
    return text.replace(/([🔥📈📉💰🚀])([^\s])/g,"$1 $2")
}

function splitMessage(text, limit=3900){
    const chunks=[]
    for(let i=0;i<text.length;i+=limit){
        chunks.push(text.slice(i,i+limit))
    }
    return chunks
}

function formatTelegram(text){
    text = escapeHTML(text)
    text = formatCodeBlock(text)
    text = formatInlineCode(text)
    text = formatBold(text)
    text = formatItalic(text)
    text = formatList(text)
    text = formatEmojiSpacing(text)
    return text
}

module.exports = { formatTelegram, splitMessage }
