const axios = require('axios');

async function test() {
    try {
        // 1. Create a run first to ensure we have one
        console.log('Fetching eval sets...');
        const setsRes = await axios.get('http://localhost:3001/api/eval-sets');
        const setId = setsRes.data[0].id;
        console.log(`Using Eval Set ID: ${setId}`);

        console.log('Starting a new run...');
        const runRes = await axios.post(`http://localhost:3001/api/eval-sets/${setId}/runs`, {
            config: JSON.stringify({ model: 'test' })
        });
        const runId = runRes.data.id;
        console.log(`Created Run ID: ${runId}`);

        // Wait a bit for run to complete (mock server has 3s delay)
        console.log('Waiting for run to complete...');
        await new Promise(resolve => setTimeout(resolve, 3500));

        // 2. Fetch run details
        console.log(`Fetching details for Run ID: ${runId}`);
        const detailRes = await axios.get(`http://localhost:3001/api/eval-runs/${runId}`);
        
        console.log('Run Detail Response Keys:', Object.keys(detailRes.data));
        if (detailRes.data.traces) {
            console.log('Traces found:', detailRes.data.traces.length);
            if (detailRes.data.traces.length > 0) {
                console.log('First trace keys:', Object.keys(detailRes.data.traces[0]));
                console.log('First trace score:', detailRes.data.traces[0].score);
            }
        } else {
            console.error('TRACES NOT FOUND IN RESPONSE!');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

test();
