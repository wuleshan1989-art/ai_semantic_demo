// 智能体核心逻辑，采用claude code架构

const axios = require('axios');

class Agent {
  constructor() {
    this.knowledgeBase = {};
    this.skills = {};
    this.loadKnowledgeBase();
    this.loadSkills();
    
    // Cloud Model Config
    // Ensure default config is robust for demo
    this.modelConfig = {
        apiKey: process.env.ARK_API_KEY || '5f01e800-04df-4195-9a48-a7909f5ea7f2',
        endpoint: process.env.ARK_ENDPOINT || 'https://ark-cn-beijing.bytedance.net/api/v3/chat/completions',
        model: process.env.ARK_MODEL || 'ep-20250609110517-6zp6k',
        provider: process.env.ARK_PROVIDER || 'doubao'
    };
  }

  // 加载知识库
  loadKnowledgeBase() {
    // 这里可以从文件或数据库加载知识库
    this.knowledgeBase = {
      'greeting': '你好！我是一个智能体，很高兴为你服务。',
      'about': '我是基于Claude Code架构的智能体，能够回答问题和执行任务。'
    };
  }

  // 加载技能
  loadSkills() {
    // 这里可以从文件或数据库加载技能
    this.skills = {
      'weather': {
        name: '天气查询',
        description: '查询指定城市的天气',
        execute: (city) => {
          return {
            reply: `今天${city}的天气晴朗，温度适宜。`,
            steps: [
              { type: 'thought', content: `用户想要查询${city}的天气` },
              { type: 'action', content: `调用天气API查询${city}` },
              { type: 'observation', content: `API返回数据: { temp: 25, condition: 'Sunny' }` }
            ],
            artifact: {
              id: `art-weather-${Date.now()}`,
              type: 'markdown',
              title: `${city}天气报告`,
              content: `# ${city}天气报告\n\n- **天气**: 晴朗\n- **温度**: 25°C\n- **湿度**: 60%\n\n建议穿着轻便衣物。`
            }
          };
        }
      },
      'calculator': {
        name: '计算器',
        description: '执行数学计算',
        execute: (expression) => {
          try {
            const result = eval(expression);
            return {
              reply: `计算结果是 ${result}`,
              steps: [
                { type: 'thought', content: `用户想要计算: ${expression}` },
                { type: 'action', content: `执行数学运算` },
                { type: 'observation', content: `运算结果: ${result}` }
              ],
              artifact: {
                id: `art-calc-${Date.now()}`,
                type: 'code',
                title: '计算过程',
                language: 'javascript',
                content: `const expression = "${expression}";\nconst result = ${result};\nconsole.log(result); // Output: ${result}`
              }
            };
          } catch (error) {
            return { reply: '计算错误，请检查表达式。', steps: [{ type: 'error', content: '解析表达式失败' }] };
          }
        }
      }
    };
  }

  // 执行技能
  executeSkill(skillName, params) {
    const skill = this.skills[skillName];
    if (skill && typeof skill.execute === 'function') {
        return skill.execute(params);
    }
    return { reply: `未找到技能: ${skillName}` };
  }

  // 处理用户消息
  async processMessage(message, options = {}) {
    // 分析消息，确定意图
    const intent = this.analyzeIntent(message);
    
    // 根据意图执行相应的操作
    let result;
    switch (intent.type) {
      case 'greeting':
        result = { reply: this.knowledgeBase.greeting };
        break;
      case 'about':
        result = { reply: this.knowledgeBase.about };
        break;
      case 'skill':
        result = this.executeSkill(intent.skill, intent.params);
        break;
      default:
        result = await this.generateResponse(message, options);
    }

    // 确保返回格式统一
    if (typeof result === 'string') {
      return { reply: result };
    }
    return result;
  }

  getMockResponse(messages) {
      const lastMsgObj = messages[messages.length - 1];
      const lastMsg = lastMsgObj.content.toLowerCase();
      
      // 1. Web Search Mock
      if (lastMsg.includes('search') || lastMsg.includes('搜索') || lastMsg.includes('news')) {
          return JSON.stringify({
              reply: "好的，我来帮你搜索相关信息。",
              steps: [{ type: 'thought', content: '用户需要搜索信息，调用 web_search 工具。' }],
              toolCall: {
                  name: "web_search",
                  args: { query: lastMsg }
              }
          });
      }

      // 2. Tool Output Processing (Render Artifact)
      // Checks if the last message was a tool output from web_search
      if (lastMsg.includes('tool output') && (lastMsg.includes('web_search') || lastMsg.includes('simulated_web_search'))) {
           return JSON.stringify({
               reply: "根据搜索结果，我为你生成了一份简报。",
               steps: [{ type: 'thought', content: '收到搜索结果，正在生成可视化报告。' }],
               toolCall: {
                   name: "render_artifact",
                   args: {
                       title: "Search Report",
                       type: "html",
                       content: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Search Results Summary</h2>
                            <p style="color: #666;">Here are the latest findings based on your query:</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <h3 style="margin-top: 0; color: #1f2937;">🚀 Tech & AI</h3>
                                <p>New transformer architectures are reducing inference costs by 40%.</p>
                            </div>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <h3 style="margin-top: 0; color: #1f2937;">🌦️ Weather</h3>
                                <p>Current conditions: Sunny, 25°C. Perfect for outdoor activities.</p>
                            </div>
                             <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                                <h3 style="margin-top: 0; color: #1f2937;">📈 Markets</h3>
                                <p>Global tech stocks are seeing a 2.5% uplift today.</p>
                            </div>
                            <p style="margin-top: 20px; font-size: 12px; color: #999;"><em>Generated by AIRS Mock Agent (Fallback Mode)</em></p>
                        </div>
                       `
                   }
               }
           });
      }

    // 3. General Chat Mock
    // Add logic to check if provider is doubao and return specific mock or error detail
    const provider = this.modelConfig.provider || 'unknown';
    
    // Check if we are in a demo/fallback scenario even if API call was attempted
    // This part is only reached if callCloudModel threw an error and returned mock string
    // OR if callCloudModel returned a string but JSON parse failed (which is rare for mock)
    
    // However, if the error was caught in callCloudModel, it returns a JSON string.
    // So this function (getMockResponse) returns a stringified JSON.
    
    return JSON.stringify({
        reply: `这是一条模拟响应。
        
检测到你正在使用 **${provider}** 模型，但 AIRS 后端在尝试调用 API 时遇到了错误。

尽管 **Doubao API 本身是通畅的**（你可能通过 curl 验证过），但在 AIRS 系统中可能存在以下配置不一致：

1. **API Key 权限范围**：你的 Key 可能仅允许 chat 权限，或者有 IP 白名单限制。
2. **Model Name 差异**：你配置的 Model Name (如 \`${this.modelConfig.model}\`) 可能与你的 API Key 不匹配。
3. **网络环境**：AIRS 后端运行环境可能存在特定的网络策略 (Proxy/Firewall)。

(注：在此演示模式下，'搜索' 功能仍可模拟使用)`,
        steps: [{ type: 'thought', content: `API 调用异常 (${provider})，启用 Mock 回退模式。` }]
    });
  }

  // 分析消息意图
  analyzeIntent(message) {
    // 优先识别明确指令，否则走通用大模型
    message = message.toLowerCase();
    
    // 天气查询保留为特定技能
    if (message.includes('天气') && (message.includes('查询') || message.includes('怎么样'))) {
      const city = message.replace(/天气|查询|怎么样|如何/, '').trim();
      return { type: 'skill', skill: 'weather', params: city };
    }
    
    // 计算器保留
    if ((message.includes('计算') || message.includes('等于')) && /\d/.test(message)) {
      const expression = message.replace(/计算|等于|等于多少/, '').trim();
      return { type: 'skill', skill: 'calculator', params: expression };
    }
    
    // 其他都视为通用对话，交给大模型处理
    return { type: 'general' };
  }

  // 调用云端大模型
    async callCloudModel(messages, options = {}) {
    // Merge provided options into instance config, or use instance config if options are empty
    // Prioritize options passed from server.js (which come from frontend)
    const apiKey = options.modelConfig?.apiKey || this.modelConfig.apiKey;
    let endpoint = options.modelConfig?.endpoint || options.modelConfig?.baseUrl || this.modelConfig.endpoint;
    const model = options.modelConfig?.model || options.modelConfig?.modelName || this.modelConfig.model;
    let provider = options.modelConfig?.provider || this.modelConfig.provider;

    // Normalize provider
    if (provider) provider = provider.toLowerCase();

    if (!apiKey || !endpoint) {
        console.error("Missing model config:", { apiKey: !!apiKey, endpoint: !!endpoint, config: this.modelConfig });
        return "请先在管理中心配置模型参数";
    }

    // Auto-fix endpoint if missing path for known providers (and generic ones that look like openai compatible)
    // Many users just paste the base URL.
    if (!endpoint.includes('/chat/completions')) {
        // Remove trailing slash if present
        if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
        
        // Append standard path
        endpoint += '/chat/completions';
    }

    try {
        console.log(`[CloudModel] Start Calling API... (Timeout: 60s)`);
        
        // Fetch Available Tools from MCP Server
        let tools = [];
        try {
            const res = await axios.get('http://localhost:3001/api/mcp/tools');
            tools = res.data;
            
            // Filter disabled tools
            if (options.disabledTools && Array.isArray(options.disabledTools)) {
                tools = tools.filter(t => !options.disabledTools.includes(t.id));
            }
        } catch (e) {
            console.error('Failed to fetch MCP tools:', e.message);
        }

        const toolsDesc = tools.map(t => 
            `- ${t.name}: ${t.description}\n  Args: ${JSON.stringify(t.inputSchema.properties)}\n  Required: ${JSON.stringify(t.inputSchema.required || [])}`
        ).join('\n');

        const systemPrompt = `你是基于Claude Code架构的智能编程助手。
请尽量以JSON格式返回结果，格式如下：
{ 
  "reply": "你的回答文本", 
  "steps": [{"type": "thought", "content": "思考过程"}, {"type": "action", "content": "操作内容"}], 
  "artifact": { "type": "code/markdown", "title": "标题", "content": "内容" },
  "toolCall": { "name": "tool_name", "args": { ... } }
}

Available Tools (MCP):
${toolsDesc}

如果不涉及复杂操作，可以直接返回文本。
如果需要调用工具，请在返回的 JSON 中包含 "toolCall" 字段。
当调用工具（如 web_search, semantic_search, run_terminal_command）返回大量数据时，你必须在下一轮对话中主动调用 "render_artifact" 工具将结果以可视化的方式展示，而不是直接输出原始 JSON。
`;

        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            stream: false
        };
        
        // Add max_tokens and temperature if configured
        if (this.modelConfig.maxTokens) payload.max_tokens = parseInt(this.modelConfig.maxTokens);
        if (this.modelConfig.temperature) payload.temperature = parseFloat(this.modelConfig.temperature);

        // Special handling for Doubao (Ark) API
        if (provider === 'doubao') {
             // Ensure payload matches OpenAI format (which Ark supports)
             // But sometimes model name needs to be the endpoint ID
             // Log the request for debugging
             console.log(`[Doubao] Calling ${endpoint} with model ${model}`);
        }

        const response = await axios.post(
            endpoint,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 60000, // 60s timeout
                signal: options.signal // Pass cancellation signal
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            console.log(`[CloudModel] Success! Response Length: ${response.data.choices[0].message.content.length}`);
            return response.data.choices[0].message.content;
        }
        return '模型未返回有效内容';
    } catch (error) {
        if (error.code === 'ERR_CANCELED') {
            console.log('Request canceled by user.');
            throw error; // Let caller handle or just stop
        }

        const status = error.response ? error.response.status : 0;
        const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Cloud Model API Error:', status, error.message, errorData);
        
        // Aggressive Mock Fallback for ANY error in this demo environment
        // This ensures the user always gets a response even if their config is wrong
        console.log('Falling back to mock response due to error...');
        const mockRes = this.getMockResponse(messages);
        const parsedMock = JSON.parse(mockRes);
        
        // Append a small warning to the reply
        parsedMock.reply += `\n\n*(注意: 真实模型调用失败 (Status: ${status}, Detail: ${errorData})，已自动切换到演示模式)*`;
        
        return JSON.stringify(parsedMock);
    }
  }

  // 生成通用响应 (集成云模型)
  async generateResponse(message, options = {}) {
    let currentMessages = [{ role: 'user', content: message }];
    let accumulatedSteps = [];
    let finalArtifact = null;
    let finalReply = '';
    
    // Loop for tool chaining (Re-Act)
    // Max 3 turns to prevent infinite loops
    for (let i = 0; i < 3; i++) {
        // Check abort signal
        if (options.signal && options.signal.aborted) {
            throw new Error('Aborted');
        }

        // 1. 尝试调用云模型
        let modelResponse = await this.callCloudModel(currentMessages, options);
        
        // 2. 尝试解析模型返回的 JSON (如果是结构化输出)
        try {
            // 去除可能的 markdown 代码块标记
            let cleanResponse = modelResponse.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // 尝试解析 JSON
            if (cleanResponse.startsWith('{') && cleanResponse.endsWith('}')) {
                const parsed = JSON.parse(cleanResponse);
                
                // Accumulate steps
                if (parsed.steps) {
                    accumulatedSteps.push(...parsed.steps);
                }

                // Handle Tool Call
                if (parsed.toolCall) {
                    const { name, args } = parsed.toolCall;
                    let toolResult = '';
                    
                    // Add tool call to history
                    currentMessages.push({ role: 'assistant', content: modelResponse });

                    try {
                        accumulatedSteps.push({ type: 'action', content: `Call Tool: ${name}` });
                        const res = await axios.post('http://localhost:3001/api/mcp/call', { name, args });
                        
                        // Special Handling for Artifact Rendering Tools
                        if (res.data && res.data._is_artifact) {
                            const { _is_artifact, message, ...artifactData } = res.data;
                            accumulatedSteps.push({ type: 'action', content: `Render Artifact: ${artifactData.title}` });
                            
                            return {
                                reply: parsed.reply + (message ? `\n\n${message}` : ''),
                                steps: accumulatedSteps,
                                artifact: {
                                    id: `art-${Date.now()}`,
                                    ...artifactData
                                }
                            };
                        }

                        toolResult = JSON.stringify(res.data);
                    } catch (e) {
                        toolResult = `Error: ${e.message}`;
                    }

                    // Feed tool result back to LLM
                    accumulatedSteps.push({ type: 'observation', content: `Tool Output length: ${toolResult.length}` });
                    currentMessages.push({ role: 'user', content: `Tool Output (${name}):\n${toolResult}\n\nBased on this output, please proceed. If the output is large or complex, call render_artifact.` });
                    
                    // Continue loop
                    continue;
                }

                // 如果解析出的 JSON 包含 reply 字段，且没有 toolCall，直接使用
                if (parsed.reply) {
                    // Ensure artifact has ID if present
                    if (parsed.artifact && !parsed.artifact.id) {
                        parsed.artifact.id = `art-${Date.now()}`;
                    }
                    
                    return {
                        reply: parsed.reply,
                        steps: accumulatedSteps.length > 0 ? accumulatedSteps : (parsed.steps || []),
                        artifact: parsed.artifact || finalArtifact
                    };
                }
            }
        } catch (e) {
            // Ignore parse error, treat as text
            console.log('JSON Parse Error:', e.message);
        }

        // If not JSON or no tool call, break loop and return standard text response
        finalReply = modelResponse;
        break;
    }

    // 3. 构造标准响应格式 (Fallback)
    let artifact = null;
    
    // 代码块提取逻辑
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
    const match = finalReply.match(codeBlockRegex);
    if (match) {
        artifact = {
            id: `art-${Date.now()}`,
            type: 'code',
            title: 'Generated Code',
            language: match[1] || 'text',
            content: match[2]
        };
    }

    return {
      reply: finalReply.replace(codeBlockRegex, '[代码已生成，请查看右侧]'), 
      steps: [
        { type: 'thought', content: '接收用户输入' },
        ...accumulatedSteps,
        { type: 'action', content: '生成回答' }
      ],
      artifact: artifact
    };
  }
}

module.exports = Agent;