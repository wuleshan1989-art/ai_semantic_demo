import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database, X, Key } from '../../Icons';
import { useApp } from '../../AppContext';

const EditorTableNode = ({ data, selected }) => {
  const { onDelete, readOnly } = data; // Pass delete handler through data
  const { t } = useApp();

  return (
    <div style={{
      border: selected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-secondary)',
      minWidth: '220px',
      boxShadow: selected ? '0 0 0 2px rgba(var(--primary-rgb), 0.2)' : '0 4px 6px -1px var(--shadow-color)',
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.2s ease'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: selected ? 'var(--primary-color)' : 'var(--bg-tertiary)',
        color: selected ? 'white' : 'var(--text-primary)',
        fontWeight: '600',
        fontSize: '14px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={14} />
          <span>{data.label}</span>
        </div>
        {/* Remove Button */}
        {!readOnly && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(data.label);
                }}
                style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: selected ? 'white' : 'var(--text-secondary)',
                    opacity: 0.7,
                    display: 'flex',
                    padding: '2px'
                }}
                title={t('editor.table.remove_tooltip')}
            >
                <X size={14} />
            </button>
        )}
      </div>

      {/* Columns */}
      <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
        {data.columns && data.columns.slice(0, 5).map((col, idx) => (
          <div key={idx} style={{ 
            fontSize: '12px', 
            padding: '6px 12px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--text-primary)',
            backgroundColor: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent'
          }}>
            <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {col.name === data.cubeData?.primaryKey && (
                    <Key size={10} color="#f59e0b" style={{ minWidth: '10px' }} />
                )}
                {col.name}
            </span>
            <span style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '10px',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '2px 4px',
              borderRadius: '3px'
            }}>{col.type}</span>
          </div>
        ))}
        {data.columns && data.columns.length > 5 && (
          <div style={{ 
            padding: '8px 12px', 
            fontSize: '11px', 
            color: 'var(--text-secondary)', 
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            {t('editor.table.more_fields').replace('{count}', data.columns.length - 5)}
          </div>
        )}
        {(!data.columns || data.columns.length === 0) && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {t('editor.table.no_columns')}
            </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

export default EditorTableNode;
