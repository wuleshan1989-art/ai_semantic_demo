import React, { useState } from 'react';
import { X, Search, FileText } from './Icons';
import { useApp } from './AppContext';

const ChunkViewer = ({ chunks, onClose, fileName }) => {
  const { t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChunks = chunks.filter(chunk => 
    chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chunk.id.toString().includes(searchQuery)
  );

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
        width: '80%',
        height: '80%',
        maxWidth: '1000px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px var(--shadow-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{t('chunk.title')}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('chunk.viewing', { count: filteredChunks.length })} <strong>{fileName}</strong>
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            maxWidth: '400px'
          }}>
            <div style={{ padding: '0 12px', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chunk.search_placeholder')}
              style={{
                width: '100%',
                padding: '10px 12px 10px 0',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Chunks List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredChunks.map((chunk) => (
              <div key={chunk.id} style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '250px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>#{chunk.id}</span>
                  <span>{chunk.tokenCount} {t('chunk.tokens')}</span>
                </div>
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  fontSize: '13px', 
                  lineHeight: '1.6', 
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"JetBrains Mono", monospace'
                }}>
                  {chunk.content}
                </div>
              </div>
            ))}
          </div>
          {filteredChunks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p>{t('chunk.no_results')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChunkViewer;
