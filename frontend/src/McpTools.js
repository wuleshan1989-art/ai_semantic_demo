import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from './AppContext';
import { Save, Plus, ExternalLink, Settings, Tool } from './Icons'; // Removed Cpu


const McpTools = () => {
    const { t } = useApp();
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTool, setEditingTool] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [newServer, setNewServer] = useState({ name: '', url: '' });

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/mcp/tools');
            setTools(res.data);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const handleSaveTool = async () => {
        if (!editingTool) return;
        try {
            await axios.post(`http://localhost:3001/api/mcp/tools/${editingTool.id}`, {
                name: editingTool.name,
                description: editingTool.description
            });
            setEditingTool(null);
            fetchTools();
            alert(t('mcp.save_success'));
        } catch (e) {
            console.error(e);
            alert('Error saving tool');
        }
    };

    const handleRegisterServer = async () => {
        if (!newServer.name || !newServer.url) return;
        try {
            await axios.post('http://localhost:3001/api/mcp/register', newServer);
            setShowRegisterModal(false);
            setNewServer({ name: '', url: '' });
            alert(t('mcp.register_success'));
            // In real app, we would refetch tools as they might include external ones now
        } catch (e) {
            console.error(e);
            alert('Error registering server');
        }
    };

    return (
        <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: 'var(--text-primary)' }}>{t('mcp.title')}</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('mcp.desc')}</p>
                </div>
                <button 
                    onClick={() => setShowRegisterModal(true)}
                    style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '500'
                    }}
                >
                    <Plus size={18} /> {t('mcp.register_server')}
                </button>
            </div>

            {/* Local Tools Section */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={20} /> {t('mcp.local_tools')}
                </h2>
                
                {loading ? (
                    <div>{t('common.loading')}</div>
                ) : tools.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                        {t('mcp.no_tools')}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {tools.map(tool => (
                            <div key={tool.id} style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '8px', 
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Tool size={18} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{tool.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setEditingTool(tool)}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                    >
                                        Edit
                                    </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    {tool.description}
                                </p>
                                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                    <code style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ID: {tool.id}</code>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingTool && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setEditingTool(null)}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', width: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{t('mcp.edit_tool')}</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('mcp.tool_name')}</label>
                            <input 
                                value={editingTool.name}
                                onChange={e => setEditingTool({...editingTool, name: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('mcp.tool_desc')}</label>
                            <textarea 
                                value={editingTool.description}
                                onChange={e => setEditingTool({...editingTool, description: e.target.value})}
                                rows={4}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setEditingTool(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
                            <button onClick={handleSaveTool} style={{ padding: '8px 16px', background: 'var(--primary-color)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>{t('common.save')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Register Server Modal */}
            {showRegisterModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowRegisterModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', width: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{t('mcp.register_server')}</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('mcp.server_name')}</label>
                            <input 
                                value={newServer.name}
                                onChange={e => setNewServer({...newServer, name: e.target.value})}
                                placeholder="e.g. Weather Service"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{t('mcp.server_url')}</label>
                            <input 
                                value={newServer.url}
                                onChange={e => setNewServer({...newServer, url: e.target.value})}
                                placeholder="e.g. https://mcp.example.com"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowRegisterModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>{t('common.cancel')}</button>
                            <button onClick={handleRegisterServer} style={{ padding: '8px 16px', background: 'var(--primary-color)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>{t('common.save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default McpTools;
