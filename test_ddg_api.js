const axios = require('axios');

async function testDDGAPI(query) {
    try {
        const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        const data = response.data;
        console.log('Abstract:', data.Abstract);
        console.log('RelatedTopics:', data.RelatedTopics.slice(0, 2));
    } catch (error) {
        console.error('API failed:', error.message);
    }
}

testDDGAPI('javascript');
