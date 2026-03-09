// const fetch = require('node-fetch'); // Built-in fetch in Node 18+

const BASE_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        // 1. Get Eval Sets
        console.log('1. Fetching Eval Sets...');
        const setsRes = await fetch(`${BASE_URL}/eval-sets`);
        const sets = await setsRes.json();
        
        if (sets.length === 0) {
            console.error('No eval sets found.');
            return;
        }
        
        const evalSetId = sets[0].id;
        console.log(`Using Eval Set ID: ${evalSetId}`);

        // 2. Start a Run
        console.log('2. Starting a Run...');
        const runRes = await fetch(`${BASE_URL}/eval-sets/${evalSetId}/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { model: 'gpt-4o' } })
        });
        const run = await runRes.json();
        console.log('Run Started:', run);
        
        if (!run.id) {
            console.error('Failed to start run');
            return;
        }

        // 3. Poll Status
        console.log('3. Polling Status...');
        let status = run.status;
        let attempts = 0;
        
        // Wait for at least 3 seconds
        while (status === 'running' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const pollRes = await fetch(`${BASE_URL}/eval-runs/${run.id}`);
            const pollRun = await pollRes.json();
            status = pollRun.status;
            console.log(`Attempt ${attempts + 1}: Status is ${status}`);
            attempts++;
            
            if (status === 'completed') {
                console.log('Run Completed!');
                console.log('Summary:', pollRun.summary);
                if (pollRun.results && pollRun.results.length > 0) {
                    console.log('Results Count:', pollRun.results.length);
                    console.log('Sample Result:', pollRun.results[0]);
                } else {
                    console.log('No results found in completed run.');
                }
                break;
            }
        }
        
        // 4. List Runs
        console.log('4. Listing Runs for Eval Set...');
        const listRes = await fetch(`${BASE_URL}/eval-sets/${evalSetId}/runs`);
        const list = await listRes.json();
        console.log(`Found ${list.length} runs for set ${evalSetId}`);
        
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTest();
