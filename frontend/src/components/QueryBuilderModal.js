
import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Database, Filter, ChevronRight, ChevronDown, Plus, Trash, Copy, Check } from '../Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SemanticLayer } from '../utils/SemanticLayer';
import { useApp } from '../AppContext';

const QueryBuilderModal = ({ isOpen, onClose, modelContent, theme }) => {
  const { t } = useApp();
  const [semanticLayer, setSemanticLayer] = useState(null);
  const [selectedDimensions, setSelectedDimensions] = useState([]);
  const [selectedMeasures, setSelectedMeasures] = useState([]);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedCubes, setExpandedCubes] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (modelContent) {
      setSemanticLayer(new SemanticLayer(modelContent));
    }
  }, [modelContent]);

  const toggleCube = (cubeName) => {
    setExpandedCubes(prev => ({ ...prev, [cubeName]: !prev[cubeName] }));
  };

  const toggleSelection = (type, cubeName, fieldName) => {
    const id = `${cubeName}.${fieldName}`;
    if (type === 'dimension') {
      setSelectedDimensions(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } else {
      setSelectedMeasures(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const handleGenerateSQL = () => {
    if (!semanticLayer) return;
    const sql = semanticLayer.generateSQL({
      dimensions: selectedDimensions,
      measures: selectedMeasures
    });
    setGeneratedSQL(sql);
    setQueryResult(null);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    
    // Ensure SQL is generated before executing
    let sqlToExecute = generatedSQL;
    if (!sqlToExecute && semanticLayer) {
        sqlToExecute = semanticLayer.generateSQL({
            dimensions: selectedDimensions,
            measures: selectedMeasures
        });
        setGeneratedSQL(sqlToExecute);
    }

    if (!sqlToExecute) {
        setIsExecuting(false);
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/sql/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: sqlToExecute }),
        });

        const data = await response.json();

        if (response.ok) {
            setQueryResult(data.results);
        } else {
            console.error('SQL Execution Failed:', data.error);
            // Show error in results or alert
            alert(`Execution Failed: ${data.error}`);
            setQueryResult([]);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('Network Error');
    } finally {
        setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSQL) return;
    navigator.clipboard.writeText(generatedSQL);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '90%', height: '90%', backgroundColor: 'var(--bg-primary)', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              backgroundColor: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <Database size={18} color="var(--primary-color)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{t('sql.test_title')}</h2>
          </div>
          <button onClick={onClose} style={{ 
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
            padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Sidebar: Data Model */}
          <div style={{ width: '280px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('sql.data_model')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {semanticLayer && semanticLayer.getAllCubes().map(cube => (
                <div key={cube.name} style={{ marginBottom: '8px' }}>
                  <div 
                    onClick={() => toggleCube(cube.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                      cursor: 'pointer', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
                      fontWeight: '500', transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {expandedCubes[cube.name] ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronRight size={14} color="var(--text-secondary)" />}
                    <span>{cube.name}</span>
                  </div>
                  
                  {expandedCubes[cube.name] && (
                    <div style={{ marginLeft: '11px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px', marginTop: '4px' }}>
                      {/* Measures */}
                      {cube.measures && cube.measures.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase', fontWeight: '600' }}>{t('sql.measures')}</div>
                          {cube.measures.map(m => (
                            <div 
                              key={m.name}
                              onClick={() => toggleSelection('measure', cube.name, m.name)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                                cursor: 'pointer', borderRadius: '4px', fontSize: '12px',
                                backgroundColor: selectedMeasures.includes(`${cube.name}.${m.name}`) ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                color: selectedMeasures.includes(`${cube.name}.${m.name}`) ? 'var(--primary-color)' : 'var(--text-primary)',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ 
                                width: '14px', height: '14px', borderRadius: '3px', 
                                border: `1px solid ${selectedMeasures.includes(`${cube.name}.${m.name}`) ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px',
                                backgroundColor: selectedMeasures.includes(`${cube.name}.${m.name}`) ? 'var(--primary-color)' : 'transparent',
                                color: 'white'
                              }}>
                                {selectedMeasures.includes(`${cube.name}.${m.name}`) && <Check size={10} />}
                              </div>
                              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.7 }}>123</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dimensions */}
                      {cube.dimensions && cube.dimensions.length > 0 && (
                        <div>
                           <div style={{ fontSize: '10px', color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase', fontWeight: '600' }}>{t('sql.dimensions')}</div>
                           {cube.dimensions.map(d => (
                            <div 
                              key={d.name}
                              onClick={() => toggleSelection('dimension', cube.name, d.name)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                                cursor: 'pointer', borderRadius: '4px', fontSize: '12px',
                                backgroundColor: selectedDimensions.includes(`${cube.name}.${d.name}`) ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                color: selectedDimensions.includes(`${cube.name}.${d.name}`) ? 'var(--primary-color)' : 'var(--text-primary)',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ 
                                width: '14px', height: '14px', borderRadius: '3px', 
                                border: `1px solid ${selectedDimensions.includes(`${cube.name}.${d.name}`) ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px',
                                backgroundColor: selectedDimensions.includes(`${cube.name}.${d.name}`) ? 'var(--primary-color)' : 'transparent',
                                color: 'white'
                              }}>
                                {selectedDimensions.includes(`${cube.name}.${d.name}`) && <Check size={10} />}
                              </div>
                              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.7 }}>ABC</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            
            {/* Query Canvas */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{t('sql.selected_fields')}</h3>
                    <div style={{ 
                      minHeight: '60px', padding: '12px', backgroundColor: 'var(--bg-primary)', 
                      borderRadius: '8px', border: '1px solid var(--border-color)', 
                      display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        {selectedDimensions.length === 0 && selectedMeasures.length === 0 && (
                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                {t('sql.no_selection')}
                            </div>
                        )}
                        {selectedDimensions.map(d => (
                            <div key={d} style={{ 
                              display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', 
                              backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', 
                              borderRadius: '12px', fontSize: '11px', color: 'var(--text-primary)',
                              height: '24px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{t('sql.dim_short')}</span>
                                <span>{d}</span>
                                <div 
                                  onClick={() => toggleSelection('dimension', d.split('.')[0], d.split('.')[1])}
                                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.6, ':hover': { opacity: 1 } }}
                                >
                                  <X size={10} />
                                </div>
                            </div>
                        ))}
                        {selectedMeasures.map(m => (
                            <div key={m} style={{ 
                              display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', 
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)', border: '1px solid var(--primary-color)', 
                              borderRadius: '12px', fontSize: '11px', color: 'var(--primary-color)',
                              height: '24px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ fontWeight: '600' }}>{t('sql.msr_short')}</span>
                                <span>{m}</span>
                                <div 
                                  onClick={() => toggleSelection('measure', m.split('.')[0], m.split('.')[1])}
                                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.6, ':hover': { opacity: 1 } }}
                                >
                                  <X size={10} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                         <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>{t('sql.generated_sql')}</h3>
                         <div style={{ display: 'flex', gap: '8px' }}>
                             <button 
                                onClick={handleCopy}
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                                  backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                                  borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px',
                                  transition: 'all 0.2s'
                                }}
                                title={t('sql.copy_tooltip')}
                             >
                                 {copySuccess ? <Check size={12} color="var(--success-color, #10b981)" /> : <Copy size={12} />}
                                 {copySuccess ? t('sql.copied') : t('sql.copy')}
                             </button>
                             <button 
                                onClick={handleGenerateSQL}
                                style={{ 
                                  padding: '6px 12px', backgroundColor: 'var(--bg-secondary)', 
                                  border: '1px solid var(--border-color)', borderRadius: '6px', 
                                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px',
                                  transition: 'all 0.2s'
                                }}
                             >
                                 {t('sql.refresh')}
                             </button>
                             <button 
                                onClick={handleExecute}
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', 
                                  backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: '6px', 
                                  color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                                  boxShadow: '0 2px 4px rgba(var(--primary-rgb), 0.3)',
                                  transition: 'all 0.2s'
                                }}
                             >
                                 <Play size={12} /> {t('sql.execute')}
                             </button>
                         </div>
                    </div>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <SyntaxHighlighter
                            language="sql"
                            style={theme === 'dark' ? vscDarkPlus : coy}
                            customStyle={{ 
                              margin: 0, padding: '16px', fontSize: '13px', 
                              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
                              minHeight: '120px'
                            }}
                            showLineNumbers
                        >
                            {generatedSQL || t('sql.waiting_selection')}
                        </SyntaxHighlighter>
                    </div>
                </div>

                {/* Results Table */}
                {queryResult && (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{t('sql.results')} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>({queryResult.length} {t('sql.rows')})</span></h3>
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--text-primary)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        {Object.keys(queryResult[0]).map(key => (
                                            <th key={key} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {queryResult.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-tertiary)' }}>
                                            {Object.values(row).map((val, j) => (
                                                <td key={j} style={{ padding: '10px 16px' }}>{val}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default QueryBuilderModal;
