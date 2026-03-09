const axios = require('axios');

class McpServer {
    constructor() {
        this.tools = [];
        this.externalServers = []; // { url, name, status }
        this.initBuiltInTools();
    }

    initBuiltInTools() {
        this.registerTool({
            name: 'web_search',
            description: 'Search the internet for real-time information, news, and data. Use this tool when you need information that is not available in the local knowledge base.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query keywords'
                    },
                    num_results: {
                        type: 'integer',
                        description: 'Number of results to return (default: 5)',
                        default: 5
                    }
                },
                required: ['query']
            },
            handler: async ({ query, num_results = 5 }) => {
                console.log(`[MCP] Executing web_search for: "${query}"`);
                
                // In a production environment, this would connect to a real search API
                // such as SerpApi, Bing Search API, or a self-hosted SearXNG instance.
                // For demonstration purposes in this offline/restricted environment,
                // we return simulated search results based on the query content.
                
                const q = query.toLowerCase();
                let results = [];
                
                if (q.includes('weather')) {
                    results = [
                        { title: 'Beijing Weather Forecast', link: 'https://weather.com/weather/today/l/Beijing', snippet: 'Today in Beijing: Sunny, High 25°C, Low 15°C. Winds SE at 10-15 km/h.' },
                        { title: 'Weather - The Weather Channel', link: 'https://weather.com/', snippet: 'National and Local Weather Radar, Daily Forecast, Hurricane and information from The Weather Channel and weather.com' },
                        { title: 'China Meteorological Administration', link: 'http://www.cma.gov.cn/en/', snippet: 'Official weather warnings and forecasts for all regions in China.' }
                    ];
                } else if (q.includes('stock') || q.includes('price')) {
                     results = [
                        { title: 'Apple Inc. (AAPL) Stock Price, News, Quote & History', link: 'https://finance.yahoo.com/quote/AAPL', snippet: 'Apple Inc. (AAPL) stock price, news, historical charts, analyst ratings and financial information.' },
                        { title: 'Google (GOOGL) Stock Price - CNBC', link: 'https://www.cnbc.com/quotes/GOOGL', snippet: 'Real-time stock quotes, news, and financial information for Alphabet Inc. Class A (GOOGL).' },
                        { title: 'Global Markets Data', link: 'https://www.bloomberg.com/markets', snippet: 'Overview of world stock markets, currencies, commodities, and bonds.' }
                    ];
                } else if (q.includes('news')) {
                     results = [
                        { title: 'Latest Technology News - TechCrunch', link: 'https://techcrunch.com/', snippet: 'Reporting on the business of technology, startups, venture capital funding, and Silicon Valley.' },
                        { title: 'World News - BBC', link: 'https://www.bbc.com/news/world', snippet: 'Get the latest BBC World News: international news, features and analysis from Africa, the Americas, Asia-Pacific, Europe, the Middle East, South Asia, and the UK.' },
                        { title: 'AI News: The Latest Artificial Intelligence Updates', link: 'https://www.wired.com/tag/artificial-intelligence/', snippet: 'Recent stories about Artificial Intelligence from WIRED. The latest developments in AI technology and its impact on society.' }
                    ];
                } else {
                     // Generic results
                     results = [
                        { title: `${query} - Wikipedia`, link: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, snippet: `${query} is a topic of interest. This is a generic description from Wikipedia about ${query}.` },
                        { title: `The Best Resources for ${query}`, link: `https://www.example.com/topic/${encodeURIComponent(query)}`, snippet: `A comprehensive guide to ${query}, including tutorials, examples, and best practices.` },
                        { title: `Latest News about ${query}`, link: `https://news.google.com/search?q=${encodeURIComponent(query)}`, snippet: `Breaking news and top stories concerning ${query} from around the world.` },
                        { title: `Images of ${query}`, link: `https://images.google.com/search?q=${encodeURIComponent(query)}`, snippet: `View high-quality images and photos related to ${query}.` },
                        { title: `Videos matching ${query}`, link: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, snippet: `Watch videos about ${query} on YouTube.` }
                     ];
                }
                
                return {
                    results: results.slice(0, num_results),
                    source: 'simulated_web_search',
                    note: 'These are simulated results for demonstration. In production, configure a real search provider.'
                };
            }
        });

        // 1. Semantic Search
        this.registerTool({
            name: 'semantic_search',
            source: 'Semantic Service',
            description: 'Performs a semantic search across the codebase, documentation, and data models using vector embeddings. Use this tool when the user asks a question about the project domain, business logic, or specific concepts to find relevant files or entities.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The natural language question or keywords describing what you are looking for. E.g., "how is revenue calculated" or "user retention logic".' },
                    topK: { type: 'number', description: 'The number of most relevant results to return. Default is 5. Increase this if you need broader coverage.' },
                    repository: { type: 'string', description: 'The ID of the repository to search within. Usually inferred from context.' },
                    branch: { type: 'string', description: 'The branch name to search within. Default is "main".' }
                },
                required: ['query']
            },
            handler: async (args, context) => {
                // Call internal logic directly or via HTTP loopback?
                // Direct call is better for performance, but loopback ensures consistency with API.
                // Let's use direct logic injection or assume context provides access.
                // For simplicity in this mono-repo setup, we'll use axios to call localhost API
                try {
                    const res = await axios.post('http://localhost:3001/api/semantic/search', args);
                    return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
                } catch (e) {
                    return { isError: true, content: [{ type: 'text', text: e.message }] };
                }
            }
        });

        // 2. Entity Detail
        this.registerTool({
            name: 'get_entity_detail',
            source: 'Semantic Service',
            description: 'Retrieves the full content, schema, and metadata of a specific semantic entity (such as a data model, metric, or dimension). Use this tool to inspect the implementation details of a specific item found via search.',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: 'The category of the entity. Common values: "model" (tables/cubes), "metric", "dimension", or "document".' },
                    name: { type: 'string', description: 'The exact name of the entity to retrieve, typically obtained from search results.' },
                    repository: { type: 'string', description: 'The ID of the repository where the entity is located.' },
                    branch: { type: 'string', description: 'The branch name.' }
                },
                required: ['type', 'name']
            },
            handler: async (args) => {
                try {
                    const res = await axios.get('http://localhost:3001/api/semantic/entity', { params: args });
                    return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
                } catch (e) {
                    return { isError: true, content: [{ type: 'text', text: e.message }] };
                }
            }
        });

        // 3. Terminal Command
        this.registerTool({
            name: 'run_terminal_command',
            source: 'System',
            description: 'Executes safe, read-only terminal commands to explore the file system of the repository. Use this to list directories, read file contents, or search for text patterns.',
            inputSchema: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'The shell command to execute. Supported commands: ls, cat, grep, find. Example: "ls -R models/", "cat models/orders.yml".' },
                    repository: { type: 'string', description: 'The ID of the repository to execute the command in.' },
                    branch: { type: 'string', description: 'The branch context for the command.' }
                },
                required: ['command']
            },
            handler: async (args) => {
                try {
                    const res = await axios.post('http://localhost:3001/api/semantic/terminal', args);
                    return { content: [{ type: 'text', text: res.data.output || '' }] };
                } catch (e) {
                    return { isError: true, content: [{ type: 'text', text: e.message }] };
                }
            }
        });

        // 4. Scheduled Task Manager
        this.registerTool({
            name: 'manage_schedule_task',
            source: 'System',
            description: 'Manage scheduled tasks (cron jobs) in the system. Use this tool to create, list, update, or delete tasks that run periodically. This tool allows the agent to autonomously set up automation jobs.',
            inputSchema: {
                type: 'object',
                properties: {
                    action: { 
                        type: 'string', 
                        enum: ['create', 'update', 'delete', 'list'],
                        description: 'The action to perform on scheduled tasks.' 
                    },
                    task_config: {
                        type: 'object',
                        description: 'Configuration for creating or updating a task.',
                        properties: {
                            name: { type: 'string', description: 'Name of the task.' },
                            schedule: { type: 'string', description: 'Cron expression (e.g., "0 0 * * *" for daily).' },
                            command: { type: 'string', description: 'Command to execute (e.g., "airs mine --all").' },
                            description: { type: 'string', description: 'Description of what the task does.' },
                            enabled: { type: 'boolean', description: 'Whether the task is enabled.' }
                        }
                    },
                    task_id: { type: 'string', description: 'The ID of the task to update or delete.' }
                },
                required: ['action']
            },
            handler: async (args) => {
                try {
                    const { action, task_config, task_id } = args;
                    let res;
                    const baseUrl = 'http://localhost:3001/api/tasks';

                    switch (action) {
                        case 'list':
                            res = await axios.get(baseUrl);
                            break;
                        case 'create':
                            if (!task_config) throw new Error('task_config is required for create action');
                            res = await axios.post(baseUrl, task_config);
                            break;
                        case 'update':
                            if (!task_id) throw new Error('task_id is required for update action');
                            res = await axios.put(`${baseUrl}/${task_id}`, task_config || {});
                            break;
                        case 'delete':
                            if (!task_id) throw new Error('task_id is required for delete action');
                            res = await axios.delete(`${baseUrl}/${task_id}`);
                            break;
                        default:
                            throw new Error(`Unknown action: ${action}`);
                    }
                    return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
                } catch (e) {
                    return { isError: true, content: [{ type: 'text', text: e.message }] };
                }
            }
        });

        // 5. Render Artifact
        this.registerTool({
            name: 'render_artifact',
            source: 'System',
            description: 'Renders content as a rich UI artifact in the side panel. Use this tool to visualize code, markdown documentation, or HTML previews instead of just outputting raw text. Useful for displaying search results, generated code, or reports.',
            inputSchema: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'The content to render (code, markdown text, or HTML).' },
                    type: { type: 'string', enum: ['code', 'markdown', 'html'], description: 'The type of artifact to render.' },
                    title: { type: 'string', description: 'A short title for the artifact tab.' },
                    language: { type: 'string', description: 'Programming language (only for type="code"). E.g., "python", "javascript", "json".' }
                },
                required: ['content', 'type', 'title']
            },
            handler: async (args) => {
                // Return the args directly but marked as an artifact for the agent to pick up
                return {
                    ...args,
                    _is_artifact: true,
                    message: 'Artifact rendered successfully in side panel.'
                };
            }
        });
    }

    registerTool(tool) {
        // Tool structure: { name, description, inputSchema, handler }
        const existing = this.tools.findIndex(t => t.name === tool.name);
        if (existing >= 0) {
            this.tools[existing] = { ...this.tools[existing], ...tool };
        } else {
            this.tools.push({
                ...tool,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
            });
        }
    }

    updateTool(id, metadata) {
        const tool = this.tools.find(t => t.id === id);
        if (tool) {
            if (metadata.name) tool.name = metadata.name;
            if (metadata.description) tool.description = metadata.description;
            if (metadata.inputSchema) tool.inputSchema = metadata.inputSchema;
            return tool;
        }
        return null;
    }

    async listTools() {
        // Return local tools
        const localTools = this.tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            id: t.id,
            source: t.source || 'local'
        }));

        // TODO: Fetch external tools if needed
        return localTools;
    }

    async callTool(name, args) {
        const tool = this.tools.find(t => t.name === name);
        if (tool) {
            console.log(`[MCP] Calling tool: ${name}`);
            return await tool.handler(args);
        }
        throw new Error(`Tool not found: ${name}`);
    }
}

module.exports = new McpServer();
