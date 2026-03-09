import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApp } from './AppContext';
import { CloudLightning, Play, Activity, Database, Copy, Check, Edit2, Save, Cpu } from './Icons';

const CodeBlock = ({ code, language = 'json', title }) => {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', backgroundColor: '#1e1e1e', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 16px', 
        backgroundColor: '#252526',
        borderBottom: '1px solid #333'
      }}>
        <span style={{ fontSize: '12px', color: '#e5e7eb', fontWeight: '600', fontFamily: 'system-ui' }}>{title}</span>
        <button 
          onClick={handleCopy}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            color: copied ? '#4ade80' : '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            transition: 'color 0.2s'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t('sql.copied') : t('sql.copy')}
        </button>
      </div>
      <div className="syntax-highlighter-wrapper">
        <SyntaxHighlighter 
          language={language} 
          style={vscDarkPlus} 
          showLineNumbers={true}
          wrapLines={true}
          wrapLongLines={true}
          customStyle={{ margin: 0, padding: '16px', fontSize: '13px', maxHeight: '500px', lineHeight: '1.5' }}
          codeTagProps={{
            style: { whiteSpace: 'pre-wrap', wordBreak: 'break-all' }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const SemanticService = () => {
  const { t } = useApp();
  const [activeApi, setActiveApi] = useState(null);
  const [testParams, setTestParams] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [requestData, setRequestData] = useState(null); // Store the actual request sent
  const [isLoading, setIsLoading] = useState(false);
  
  // MCP Configuration State
  const [mcpTools, setMcpTools] = useState([]);
  const [editingMcp, setEditingMcp] = useState(null); // { id, name, description, params: { paramName: desc } }
  const [isSavingMcp, setIsSavingMcp] = useState(false);

  React.useEffect(() => {
    fetchMcpTools();
  }, []);

  const fetchMcpTools = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/mcp/tools');
      const data = await res.json();
      setMcpTools(data);
    } catch (e) {
      console.error('Failed to fetch MCP tools', e);
    }
  };

  const apiList = [
    {
      id: 'entity-detail',
      name: 'Get Entity Detail',
      method: 'GET',
      endpoint: '/api/semantic/entity',
      description: 'Retrieve detailed content and metadata for a specific semantic entity (Model, Metric, etc.) from the Knowledge Base.',
      mcpToolName: 'get_entity_detail',
      params: [
        { name: 'type', type: 'string', required: true, description: 'Type of entity (e.g., model, metric, dimension)' },
        { name: 'name', type: 'string', required: true, description: 'Name of the entity (e.g., orders, revenue)' },
        { name: 'repository', type: 'string', required: false, description: 'Repository ID to scope the search' },
        { name: 'branch', type: 'string', required: false, description: 'Target Branch (default: main)' }
      ]
    },
    {
      id: 'semantic-search',
      name: 'Semantic Search',
      method: 'POST',
      endpoint: '/api/semantic/search',
      description: 'Search for semantic entities and documents using natural language queries. Powered by vector embeddings and knowledge graph traversal.',
      mcpToolName: 'semantic_search',
      params: [
        { name: 'query', type: 'string', required: true, description: 'Natural language search query (e.g., "users in New York" or "SpaceX missions")' },
        { name: 'topK', type: 'number', required: false, description: 'Number of results to return (default: 5)' },
        { name: 'repository', type: 'string', required: false, description: 'Repository ID to scope the search' },
        { name: 'branch', type: 'string', required: false, description: 'Target Branch (default: main)' }
      ]
    },
    {
      id: 'semantic-terminal',
      name: 'Semantic Terminal',
      method: 'POST',
      endpoint: '/api/semantic/terminal',
      description: 'Execute terminal commands within the repository context. Supports standard commands like ls, cat, grep, find.',
      mcpToolName: 'run_terminal_command',
      params: [
        { name: 'command', type: 'string', required: true, description: 'Command to execute (e.g., "ls -R", "cat models/users.yml")' },
        { name: 'repository', type: 'string', required: false, description: 'Target Repository ID (default: all repos)' },
        { name: 'branch', type: 'string', required: false, description: 'Target Branch (default: main)' }
      ]
    }
  ];

  const handleTest = async () => {
    if (!activeApi) return;
    setIsLoading(true);
    setTestResult(null);
    setRequestData(null);

    // Prepare request data for display
    const currentParams = {};
    Object.entries(testParams).forEach(([key, value]) => {
      if (value) currentParams[key] = value;
    });
    setRequestData(currentParams);

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(currentParams).forEach(([key, value]) => {
        queryParams.append(key, value);
      });

      const url = `http://localhost:3001${activeApi.endpoint}${activeApi.method === 'GET' ? '?' + queryParams.toString() : ''}`;
      
      const options = {
        method: activeApi.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (activeApi.method !== 'GET') {
        options.body = JSON.stringify(currentParams);
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    } catch (error) {
      setTestResult({
        status: 500,
        statusText: 'Network Error',
        data: { error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMcp = async () => {
      const currentMcpTool = activeApi ? mcpTools.find(t => t.name === activeApi.mcpToolName) : null;
      if (!currentMcpTool || !editingMcp) return;
      setIsSavingMcp(true);
      
      try {
          // Construct new inputSchema
          const newInputSchema = JSON.parse(JSON.stringify(currentMcpTool.inputSchema));
          Object.keys(editingMcp.params).forEach(key => {
              if (newInputSchema.properties[key]) {
                  newInputSchema.properties[key].description = editingMcp.params[key];
              }
          });
  
          const res = await fetch(`http://localhost:3001/api/mcp/tools/${currentMcpTool.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: editingMcp.name,
                  description: editingMcp.description,
                  inputSchema: newInputSchema
              })
          });
          
          if (res.ok) {
              await fetchMcpTools(); // Refresh
              setEditingMcp(null);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingMcp(false);
      }
  };

  const currentMcpTool = activeApi ? mcpTools.find(t => t.name === activeApi.mcpToolName) : null;

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar: API List */}
      <div style={{
        width: '300px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-color)', height: '64px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
          <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <CloudLightning size={20} color="var(--primary-color)" />
            {t('semantic.title')}
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {apiList.map(api => (
            <div
              key={api.id}
              onClick={() => {
                setActiveApi(api);
                setTestParams({});
                setTestResult(null);
                setRequestData(null);
              }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: activeApi?.id === api.id ? 'var(--bg-tertiary)' : 'transparent',
                border: activeApi?.id === api.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  backgroundColor: api.method === 'GET' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: api.method === 'GET' ? '#3b82f6' : '#22c55e'
                }}>
                  {api.method}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{api.name}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {api.endpoint}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: API Details & Test */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeApi ? (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ margin: '0 0 12px', fontSize: '24px', color: 'var(--text-primary)' }}>{activeApi.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  backgroundColor: activeApi.method === 'GET' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: activeApi.method === 'GET' ? '#3b82f6' : '#22c55e'
                }}>
                  {activeApi.method}
                </span>
                <code style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace'
                }}>
                  {activeApi.endpoint}
                </code>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{activeApi.description}</p>
            </div>

            {/* MCP Configuration Section */}
            {currentMcpTool && (
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px var(--shadow-color)', marginBottom: '32px' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-tertiary)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cpu size={18} color="var(--primary-color)" />
                      <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{t('management.mcp.config_title')}</h3>
                   </div>
                   {!editingMcp ? (
                       <button 
                         onClick={() => {
                             const params = {};
                             if (currentMcpTool.inputSchema && currentMcpTool.inputSchema.properties) {
                                 Object.keys(currentMcpTool.inputSchema.properties).forEach(key => {
                                     params[key] = currentMcpTool.inputSchema.properties[key].description || '';
                                 });
                             }
                             setEditingMcp({
                                 id: currentMcpTool.id,
                                 name: currentMcpTool.name,
                                 description: currentMcpTool.description,
                                 params
                             });
                         }}
                         style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                       >
                           <Edit2 size={14} /> {t('mcp.edit_tool')}
                       </button>
                   ) : (
                       <div style={{ display: 'flex', gap: '8px' }}>
                           <button 
                             onClick={() => setEditingMcp(null)}
                             style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}
                           >
                               {t('common.cancel')}
                           </button>
                           <button 
                             onClick={handleSaveMcp}
                             disabled={isSavingMcp}
                             style={{ 
                                 background: 'var(--primary-color)', 
                                 border: 'none', 
                                 cursor: 'pointer', 
                                 color: 'white', 
                                 padding: '4px 12px', 
                                 borderRadius: '4px',
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '4px', 
                                 fontSize: '13px' 
                             }}
                           >
                               <Save size={14} /> {isSavingMcp ? t('common.loading') : t('common.save')}
                           </button>
                       </div>
                   )}
                </div>
                
                <div style={{ padding: '24px' }}>
                    {editingMcp ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('mcp.tool_name')}</label>
                                <input 
                                    type="text" 
                                    value={editingMcp.name} 
                                    onChange={e => setEditingMcp({...editingMcp, name: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('mcp.tool_desc')}</label>
                                <textarea 
                                    value={editingMcp.description} 
                                    onChange={e => setEditingMcp({...editingMcp, description: e.target.value})}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('semantic.request_params')}</label>
                                <div style={{ display: 'grid', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    {Object.keys(editingMcp.params).map(key => (
                                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{key}</span>
                                            <input 
                                                type="text" 
                                                value={editingMcp.params[key]} 
                                                onChange={e => setEditingMcp({
                                                    ...editingMcp, 
                                                    params: { ...editingMcp.params, [key]: e.target.value }
                                                })}
                                                placeholder="Parameter description..."
                                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('mcp.tool_name')}</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{currentMcpTool.name}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('mcp.tool_desc')}</span>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{currentMcpTool.description}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('semantic.request_params')}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {currentMcpTool.inputSchema && currentMcpTool.inputSchema.properties && Object.entries(currentMcpTool.inputSchema.properties).map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                                            <span style={{ fontFamily: 'monospace', fontWeight: '500', color: 'var(--primary-color)' }}>{key}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                            <span style={{ color: 'var(--text-primary)' }}>{value.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            )}

            {/* Test Console */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                <Activity size={18} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{t('semantic.test_console')}</h3>
              </div>
              
              <div style={{ padding: '24px' }}>
                {/* Parameters */}
                <h4 style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('semantic.request_params')}</h4>
                <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                  {activeApi.params.map(param => (
                    <div key={param.name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'start', gap: '16px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', paddingTop: '10px' }}>
                        {param.name}
                        {param.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          type="text"
                          placeholder={`${t('semantic.enter')} ${param.name}...`}
                          value={testParams[param.name] || ''}
                          onChange={(e) => setTestParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '14px',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{param.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={handleTest}
                    disabled={isLoading}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: isLoading ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                      color: isLoading ? 'var(--text-secondary)' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: isLoading ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    {isLoading ? t('semantic.sending') : <><Play size={16} fill="white" /> {t('semantic.send_request')}</>}
                  </button>
                </div>

                {/* Results Area */}
                {(requestData || testResult) && (
                  <div style={{ animation: 'fadeIn 0.3s ease-out', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                    
                    {/* Request Data Display */}
                    {requestData && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('semantic.request_body')}
                        </h4>
                        <CodeBlock 
                          code={JSON.stringify(requestData, null, 2)} 
                          title={t('semantic.json_payload')}
                        />
                      </div>
                    )}

                    {/* Response Data Display */}
                    {testResult && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('semantic.response_body')}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                color: testResult.status === 200 ? '#16a34a' : '#ef4444',
                                backgroundColor: testResult.status === 200 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                              {t('semantic.status')} {testResult.status} {testResult.statusText}
                            </span>
                          </div>
                        </div>
                        <CodeBlock 
                          code={JSON.stringify(testResult.data, null, 2)} 
                          title={t('semantic.json_response')}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%', marginBottom: '24px' }}>
                 <Database size={48} color="var(--primary-color)" style={{ opacity: 0.8 }} />
            </div>
            <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('semantic.select_hint')}</h2>
            <p style={{ maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>{t('semantic.select_desc')}</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Force line wrap in syntax highlighter */
        .syntax-highlighter-wrapper code, 
        .syntax-highlighter-wrapper span {
          white-space: pre-wrap !important;
          word-break: break-all !important;
        }
      `}</style>
    </div>
  );
};

export default SemanticService;