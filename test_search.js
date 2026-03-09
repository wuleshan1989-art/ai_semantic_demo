const { search } = require('duck-duck-scrape');

async function testSearch() {
  try {
    const results = await search('test query', { safeSearch: 0 });
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Search failed:', error);
  }
}

testSearch();
