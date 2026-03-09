const axios = require('axios');

async function searchDDG(query) {
    try {
        const response = await axios.post('https://html.duckduckgo.com/html/', `q=${encodeURIComponent(query)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const html = response.data;
        // Simple regex to extract titles and links
        const results = [];
        const regex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            results.push({
                title: match[2],
                link: match[1]
            });
            if (results.length >= 5) break;
        }
        
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Search failed:', error.message);
    }
}

searchDDG('test query');
