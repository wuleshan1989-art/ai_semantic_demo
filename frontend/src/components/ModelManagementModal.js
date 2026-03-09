import React, { useState } from 'react';
import { X, Edit3 } from '../Icons';
import { useApp } from '../AppContext';

const ModelManagementModal = ({ onClose, models, onSave, onRemove }) => {
    const { t } = useApp();
    const [modelConfig, setModelConfig] = useState({
        name: '',
        provider: 'doubao',
        modelName: '',
        baseUrl: '',
        apiKey: ''
    });

    const handleModelConfigChange = (e) => {
        const { name, value } = e.target;
        setModelConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleEditModel = (model) => {
        setModelConfig(model);
    };

    const handleSave = async () => {
        const result = await onSave(modelConfig);
        if (result.success) {
            alert(t('management.save_success') || 'Model saved');
            setModelConfig({ name: '', provider: 'doubao', modelName: '', baseUrl: '', apiKey: '' });
        } else {
            alert(t('management.save_failed') || 'Failed to save model');
        }
    };

    const handleRemove = async (id) => {
        if (window.confirm(t('management.model.confirm_remove') || 'Are you sure?')) {
            const result = await onRemove(id);
            if (!result.success) {
                alert('Failed to remove model');
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(2px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                width: '600px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px var(--shadow-color)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                maxHeight: '85vh'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-tertiary)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{t('management.models.title') || 'Manage Models'}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    {/* List */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{t('management.models.connected') || 'Connected Models'}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {models.map(m => (
                                <div key={m.id} style={{
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '6px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '16px'
                                        }}>
                                            🤖
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{m.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.provider} • {m.modelName}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEditModel(m)}
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
                                            title={t('common.edit')}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRemove(m.id)}
                                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            title={t('common.delete')}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Form */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {modelConfig.id ? (t('management.models.edit') || 'Edit Model') : (t('management.models.add') || 'Add New Model')}
                        </h4>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{t('management.models.name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={modelConfig.name}
                                    onChange={handleModelConfigChange}
                                    placeholder="e.g. My GPT-4"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{t('management.llm.provider')}</label>
                                    <select
                                        name="provider"
                                        value={modelConfig.provider}
                                        onChange={handleModelConfigChange}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="doubao">Doubao (Ark)</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="azure">Azure OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="ollama">Ollama</option>
                                        <option value="vllm">vLLM</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{t('management.llm.model_name')}</label>
                                    <input
                                        type="text"
                                        name="modelName"
                                        value={modelConfig.modelName}
                                        onChange={handleModelConfigChange}
                                        placeholder="gpt-4o"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{t('management.llm.api_key')}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        name="apiKey"
                                        value={modelConfig.apiKey}
                                        onChange={handleModelConfigChange}
                                        placeholder="sk-..."
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{t('management.llm.base_url')}</label>
                                <input
                                    type="text"
                                    name="baseUrl"
                                    value={modelConfig.baseUrl}
                                    onChange={handleModelConfigChange}
                                    placeholder="https://api.openai.com/v1"
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--bg-tertiary)' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelManagementModal;
