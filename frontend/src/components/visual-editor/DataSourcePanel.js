import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useReactFlow } from 'reactflow';
import { Database, Plus, ChevronDown, ChevronRight, Layers } from '../../Icons';
import { MOCK_DATA_SOURCES } from './MockData';
import { useApp } from '../../AppContext';

const DataSourcePanel = ({ 
    selectedSourceId, 
    setSelectedSourceId, 
    expandedDBs, 
    setExpandedDBs, 
    onDragStart, 
    addTableToGraph,
    reactFlowWrapper 
}) => {
    const { t } = useApp();
    const { getViewport } = useReactFlow();
    const [dataSources, setDataSources] = useState(MOCK_DATA_SOURCES);

    useEffect(() => {
        const fetchDataSources = async () => {
            try {
                const res = await axios.get('http://localhost:3001/api/datasource/hive/metadata');
                if (res.data) {
                    // Combine Mock and Real/Configured Data
                    setDataSources([...MOCK_DATA_SOURCES, ...res.data]);
                }
            } catch (error) {
                console.error(t('datasource.error.fetch'), error);
            }
        };
        fetchDataSources();
    }, [t]);

    return (
        <div style={{ 
            width: '260px', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={14} /> {t('datasource.panel.title')}
                </h3>
            </div>
            
            {/* Source Selector */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <select 
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        outline: 'none'
                    }}
                >
                    {dataSources.map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name}</option>
                    ))}
                </select>
            </div>

            {/* Tree View */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {dataSources.find(ds => ds.id === selectedSourceId)?.databases.map((db, dbIdx) => (
                    <div key={dbIdx} style={{ marginBottom: '4px' }}>
                        <div 
                            onClick={() => setExpandedDBs(prev => ({ ...prev, [db.name]: !prev[db.name] }))}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {expandedDBs[db.name] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <Layers size={14} color="var(--text-secondary)" />
                            <span style={{ fontWeight: '500' }}>{db.name}</span>
                        </div>

                        {expandedDBs[db.name] && (
                            <div style={{ marginLeft: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
                                {db.tables.map((table, tblIdx) => (
                                    <div 
                                        key={tblIdx}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, 'editorTable', table)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 8px',
                                            cursor: 'grab',
                                            borderRadius: '4px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            marginTop: '2px'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                            e.currentTarget.style.color = 'var(--text-primary)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        <Database size={12} />
                                        <span>{table.name}</span>
                                        <Plus 
                                            size={12} 
                                            style={{ marginLeft: 'auto', opacity: 0.5, cursor: 'pointer' }} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const viewport = getViewport();
                                                const center = {
                                                    x: (-viewport.x + (reactFlowWrapper.current?.offsetWidth || 800) / 2) / viewport.zoom,
                                                    y: (-viewport.y + (reactFlowWrapper.current?.offsetHeight || 600) / 2) / viewport.zoom
                                                };
                                                addTableToGraph(table, center);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataSourcePanel;
