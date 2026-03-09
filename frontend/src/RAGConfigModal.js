import React, { useState } from 'react';
import { X, Save, Settings, Layers, ChevronDown, ChevronRight } from './Icons';
import { useApp } from './AppContext';

const RAGConfigModal = ({ config, graphRagConfig, onSave, onClose, readOnly }) => {
  const { t } = useApp();
  const [ragFormData, setRagFormData] = useState({
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 512,
    chunkOverlap: 50,
    strategy: 'recursive',
    ...config
  });

  const [graphRagFormData, setGraphRagFormData] = useState({
    enabled: false,
    entityTypes: ['Organization', 'Person', 'Location', 'Event'],
    maxGleanIterations: 1,
    communityLevel: 2,
    extractionPrompt: 'default',
    clusteringAlgorithm: 'leiden',
    maxClusterSize: 10,
    ...graphRagConfig
  });

  const [showGraphRag, setShowGraphRag] = useState(graphRagConfig?.enabled || false);

  const availableEntityTypes = ['Organization', 'Person', 'Location', 'Event', 'Product', 'Concept', 'Spacecraft'];

  const handleRagChange = (e) => {
    const { name, value } = e.target;
    setRagFormData(prev => ({
      ...prev,
      [name]: name === 'chunkSize' || name === 'chunkOverlap' ? parseInt(value) || 0 : value
    }));
  };

  const handleGraphRagChange = (e) => {
    const { name, value } = e.target;
    setGraphRagFormData(prev => ({
      ...prev,
      [name]: ['maxGleanIterations', 'communityLevel', 'maxClusterSize'].includes(name) ? parseInt(value) || 0 : value
    }));
  };

  const handleEntityTypeToggle = (type) => {
    setGraphRagFormData(prev => {
      const current = prev.entityTypes || [];
      if (current.includes(type)) {
        return { ...prev, entityTypes: current.filter(t => t !== type) };
      } else {
        return { ...prev, entityTypes: [...current, type] };
      }
    });
  };

  const toggleGraphRag = () => {
    const newState = !showGraphRag;
    setShowGraphRag(newState);
    setGraphRagFormData(prev => ({ ...prev, enabled: newState }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ragConfig: ragFormData,
      graphRagConfig: { ...graphRagFormData, enabled: showGraphRag }
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px var(--shadow-color)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{t('rag.title')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Standard RAG Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', margin: '0 0 16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {t('rag.standard_settings')}
            </h4>
            {/* Embedding Model */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t('rag.embedding_model')}
              </label>
              <select
                name="embeddingModel"
                value={ragFormData.embeddingModel}
                onChange={handleRagChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '14px'
                }}
              >
                <option value="text-embedding-3-small">OpenAI text-embedding-3-small</option>
                <option value="text-embedding-3-large">OpenAI text-embedding-3-large</option>
                <option value="bge-m3">BAAI bge-m3 (Multilingual)</option>
                <option value="bge-large-zh-v1.5">BAAI bge-large-zh-v1.5</option>
              </select>
            </div>

            {/* Chunk Strategy */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t('rag.chunk_strategy')}
              </label>
              <select
                name="strategy"
                value={ragFormData.strategy}
                onChange={handleRagChange}
                disabled={readOnly}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: readOnly ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '14px',
                  cursor: readOnly ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="recursive">{t('rag.strategy.recursive')}</option>
                <option value="fixed">{t('rag.strategy.fixed')}</option>
                <option value="markdown">{t('rag.strategy.markdown')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Chunk Size */}
              <div style={{ flex: 1, marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {t('rag.chunk_size')}
                </label>
                <input
                  type="number"
                  name="chunkSize"
                  value={ragFormData.chunkSize}
                  onChange={handleRagChange}
                  readOnly={readOnly}
                  min="64"
                  max="8192"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: readOnly ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '14px',
                    cursor: readOnly ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              {/* Chunk Overlap */}
              <div style={{ flex: 1, marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {t('rag.chunk_overlap')}
                </label>
                <input
                  type="number"
                  name="chunkOverlap"
                  value={ragFormData.chunkOverlap}
                  onChange={handleRagChange}
                  readOnly={readOnly}
                  min="0"
                  max={ragFormData.chunkSize}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: readOnly ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '14px',
                    cursor: readOnly ? 'not-allowed' : 'text'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Graph RAG Section (Toggleable) */}
          <div style={{ 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            overflow: 'hidden',
            marginBottom: '24px' 
          }}>
            <div 
              onClick={!readOnly ? toggleGraphRag : undefined}
              style={{
                padding: '16px',
                backgroundColor: showGraphRag ? 'var(--bg-tertiary)' : 'transparent',
                cursor: readOnly ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: showGraphRag ? '1px solid var(--border-color)' : 'none',
                opacity: readOnly ? 0.7 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} color="var(--primary-color)" />
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{t('rag.graph_rag')}</span>
                {showGraphRag && <span style={{ fontSize: '12px', color: 'var(--primary-color)', backgroundColor: 'rgba(var(--primary-rgb), 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{t('rag.enabled')}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '20px', 
                  backgroundColor: showGraphRag ? 'var(--primary-color)' : 'var(--border-color)', 
                  borderRadius: '10px',
                  position: 'relative',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: showGraphRag ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: 'left 0.2s'
                  }} />
                </div>
                {showGraphRag ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>

            {showGraphRag && (
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                {/* Entity Extraction Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', margin: '0 0 12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} /> {t('rag.extraction')}
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('rag.target_entities')}
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableEntityTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleEntityTypeToggle(type)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            border: `1px solid ${graphRagFormData.entityTypes?.includes(type) ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            backgroundColor: graphRagFormData.entityTypes?.includes(type) ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                            color: graphRagFormData.entityTypes?.includes(type) ? 'var(--primary-color)' : 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('rag.max_glean_iterations')}
                    </label>
                    <input
                      type="number"
                      name="maxGleanIterations"
                      value={graphRagFormData.maxGleanIterations}
                      onChange={handleGraphRagChange}
                      min="0"
                      max="5"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Community Detection Section */}
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', margin: '0 0 12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} /> {t('rag.community_detection')}
                  </h4>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                     <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {t('rag.algorithm')}
                      </label>
                      <select
                        name="clusteringAlgorithm"
                        value={graphRagFormData.clusteringAlgorithm}
                        onChange={handleGraphRagChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '13px'
                        }}
                      >
                        <option value="leiden">Leiden (Hierarchical)</option>
                        <option value="louvain">Louvain</option>
                        <option value="girvan_newman">Girvan-Newman</option>
                      </select>
                     </div>
                     <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {t('rag.max_cluster_size')}
                      </label>
                      <input
                        type="number"
                        name="maxClusterSize"
                        value={graphRagFormData.maxClusterSize}
                        onChange={handleGraphRagChange}
                        min="5"
                        max="100"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '13px'
                        }}
                      />
                     </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('rag.community_levels')}: {graphRagFormData.communityLevel}
                    </label>
                    <input
                      type="range"
                      name="communityLevel"
                      value={graphRagFormData.communityLevel}
                      onChange={handleGraphRagChange}
                      min="0"
                      max="3"
                      step="1"
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>{t('rag.level.fine')}</span>
                      <span>{t('rag.level.global')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}
            >
              {t('rag.cancel')}
            </button>
            {!readOnly && (
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} /> {t('rag.save')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RAGConfigModal;
