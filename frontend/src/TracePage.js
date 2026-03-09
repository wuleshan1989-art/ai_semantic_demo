import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Search, User, Clock, CheckCircle, AlertCircle, Eye, X, Save, FileText } from './Icons';
import { useApp } from './AppContext';
import EvalTraceDetailModal from './EvalTraceDetailModal';

const SaveToEvalModal = ({ isOpen, onClose, selectedCount, onSave }) => {
    const { t } = useApp();
    const [evalSets, setEvalSets] = useState([]);
    const [mode, setMode] = useState('existing'); // 'existing' or 'new'
    const [targetSetId, setTargetSetId] = useState('');
    const [newSetName, setNewSetName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchEvalSets();
        }
    }, [isOpen]);

    const fetchEvalSets = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/eval-sets');
            setEvalSets(res.data);
            if (res.data.length > 0) {
                setTargetSetId(res.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch eval sets', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                width: '500px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                <div style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-secondary)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t('eval.modal.title.save_traces', { count: selectedCount })}
                    </h3>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: 'var(--text-secondary)',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => setMode('existing')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: mode === 'existing' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                                backgroundColor: mode === 'existing' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: mode === 'existing' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t('eval.modal.mode.existing')}
                        </button>
                        <button 
                            onClick={() => setMode('new')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: mode === 'new' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                                backgroundColor: mode === 'new' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: mode === 'new' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t('eval.modal.mode.new')}
                        </button>
                    </div>

                    {mode === 'existing' ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                {t('eval.modal.label.select_set')}
                            </label>
                            {evalSets.length === 0 ? (
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
                                    {t('eval.modal.no_sets')}
                                </div>
                            ) : (
                                <select
                                    value={targetSetId}
                                    onChange={(e) => setTargetSetId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                >
                                    {evalSets.map(set => (
                                        <option key={set.id} value={set.id}>{set.name} ({set.traceCount} traces)</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ) : (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                    {t('eval.modal.label.new_set_name')}
                                </label>
                                <input
                                    type="text"
                                    value={newSetName}
                                    onChange={(e) => setNewSetName(e.target.value)}
                                    placeholder={t('eval.modal.placeholder.set_name')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                    {t('eval.modal.label.desc')}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '80px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div style={{ 
                    padding: '16px 24px', 
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px',
                    backgroundColor: 'var(--bg-primary)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={() => onSave({ 
                            mode, 
                            targetSetId: mode === 'existing' ? targetSetId : null,
                            newSetName: mode === 'new' ? newSetName : null,
                            description: mode === 'new' ? description : null
                        })}
                        disabled={mode === 'existing' && !targetSetId || mode === 'new' && !newSetName}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            opacity: (mode === 'existing' && !targetSetId || mode === 'new' && !newSetName) ? 0.5 : 1
                        }}
                    >
                        {t('eval.modal.btn.save_traces')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TracePage = () => {
  const { t, userRole, user } = useApp();
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [sortOrder, setSortOrder] = useState('desc'); // desc or asc
  const [selectedTrace, setSelectedTrace] = useState(null); // For details view
  const [selectedTraces, setSelectedTraces] = useState(new Set()); // For batch selection
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Permission Check
  const hasPermission = userRole === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (hasPermission) {
        fetchTraces();
    }
  }, [hasPermission]);

  if (!hasPermission) {
      return (
          <div style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-primary)'
          }}>
              <div style={{ 
                  padding: '40px', 
                  borderRadius: '16px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <AlertCircle size={48} color="var(--text-secondary)" />
                <h2 style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t('common.access_denied')}</h2>
                <p style={{ textAlign: 'center', maxWidth: '400px' }}>
                    {t('eval.trace.no_permission', 'Only Repository Admins and Platform Super Admins can view the Trace List.')}
                </p>
              </div>
          </div>
      );
  }

  const fetchTraces = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3001/api/traces');
      setTraces(res.data);
    } catch (error) {
      console.error('Failed to fetch traces', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTraces = traces.filter(trace => {
    if (filterUser && !trace.username.toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (filterStatus !== 'all' && trace.status !== filterStatus) return false;
    
    // Time Range Filter
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (timeRange === '24h' && now - trace.timestamp > oneDay) return false;
    if (timeRange === '7d' && now - trace.timestamp > 7 * oneDay) return false;
    if (timeRange === '30d' && now - trace.timestamp > 30 * oneDay) return false;
    
    return true;
  }).sort((a, b) => {
    return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  });

  const handleSaveToEval = async (data) => {
    if (selectedTraces.size === 0) return;
    
    const tracesToSave = traces.filter(t => selectedTraces.has(t.id));
    try {
        await axios.post('http://localhost:3001/api/eval-sets/import-traces', { 
            traces: tracesToSave,
            targetSetId: data.mode === 'existing' ? data.targetSetId : null,
            newSetName: data.mode === 'new' ? data.newSetName : null,
            description: data.description
        });
        alert(`${t('eval.trace.save_success')} (${selectedTraces.size})`);
        setSelectedTraces(new Set()); // Clear selection
        setIsSaveModalOpen(false);
    } catch (error) {
        console.error('Failed to save traces', error);
        alert('Failed to save traces');
    }
  };

  const toggleSelectTrace = (id) => {
    const newSelected = new Set(selectedTraces);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedTraces(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTraces.size === filteredTraces.length) {
        setSelectedTraces(new Set());
    } else {
        const newSelected = new Set();
        filteredTraces.forEach(t => newSelected.add(t.id));
        setSelectedTraces(newSelected);
    }
  };

  // Styles
  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    },
    header: {
      height: '64px',
      padding: '0 24px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'var(--bg-secondary)'
    },
    headerTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    headerDesc: {
      display: 'none'
    },
    toolbar: {
      padding: '16px 24px',
      display: 'flex',
      gap: '12px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-primary)',
      alignItems: 'center'
    },
    inputWrapper: {
      position: 'relative',
      width: '240px'
    },
    input: {
      width: '100%',
      padding: '8px 10px 8px 32px',
      borderRadius: '6px',
      border: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      fontSize: '13px',
      outline: 'none'
    },
    select: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      fontSize: '13px',
      outline: 'none',
      cursor: 'pointer'
    },
    buttonPrimary: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '40px 100px 100px 1fr 120px 150px 80px',
      padding: '12px 24px',
      backgroundColor: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '12px',
      fontWeight: '600',
      color: 'var(--text-secondary)'
    },
    tableRow: {
      display: 'grid',
      gridTemplateColumns: '40px 100px 100px 1fr 120px 150px 80px',
      padding: '12px 24px',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '13px',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      alignItems: 'center',
      transition: 'background-color 0.1s'
    },
    statusSuccess: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      color: '#22c55e',
      fontSize: '12px',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      padding: '2px 8px',
      borderRadius: '10px'
    },
    statusFailed: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      color: '#ef4444',
      fontSize: '12px',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      padding: '2px 8px',
      borderRadius: '10px'
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalContent: {
      width: '90%',
      height: '90%',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    modalHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'var(--bg-secondary)'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            <Activity size={24} color="var(--primary-color)" />
            {t('nav.evaluation')} / {t('eval.trace.title')}
          </h1>
          <p style={styles.headerDesc}>
            {t('eval.trace.desc')}
          </p>
        </div>
      </div>

        {/* Trace List */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden'
        }}>
          {/* Toolbar */}
          <div style={styles.toolbar}>
            <div style={styles.inputWrapper}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder={t('eval.trace.filter.user')} 
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                style={styles.input}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                {selectedTraces.size > 0 && (
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        style={styles.buttonPrimary}
                    >
                        <Save size={14} />
                        {t('eval.trace.save_to_set')} ({selectedTraces.size})
                    </button>
                )}

                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('eval.run.status')}:</span>
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={styles.select}
                >
                    <option value="all">{t('eval.trace.filter.all_status')}</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                </select>

                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('eval.trace.filter.time')}:</span>
                <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    style={styles.select}
                >
                    <option value="24h">{t('eval.trace.filter.last24h')}</option>
                    <option value="7d">{t('eval.trace.filter.last7d')}</option>
                    <option value="30d">{t('eval.trace.filter.last30d')}</option>
                    <option value="all">{t('eval.trace.filter.all_time')}</option>
                </select>

                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('eval.filter.sort_by')}</span>
                <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={styles.select}
                >
                    <option value="desc">{t('eval.filter.sort.newest')}</option>
                    <option value="asc">{t('eval.filter.sort.oldest')}</option>
                </select>
            </div>
          </div>

          {/* Table Header */}
          <div style={styles.tableHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input 
                    type="checkbox" 
                    checked={filteredTraces.length > 0 && selectedTraces.size === filteredTraces.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                />
            </div>
            <div>{t('eval.trace.col.id')}</div>
            <div>{t('eval.run.status')}</div>
            <div>{t('eval.trace.col.question')}</div>
            <div>{t('eval.trace.col.user')}</div>
            <div>{t('eval.trace.col.time')}</div>
            <div>{t('eval.trace.col.actions')}</div>
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
            ) : filteredTraces.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('eval.trace.no_traces')}</div>
            ) : (
                filteredTraces.map(trace => (
                    <div 
                        key={trace.id}
                        onClick={() => {
                            setSelectedTrace(trace);
                        }}
                        style={{
                            ...styles.tableRow,
                            backgroundColor: selectedTraces.has(trace.id) ? 'var(--hover-bg)' : 'transparent',
                        }}
                        onMouseEnter={(e) => !selectedTraces.has(trace.id) && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                        onMouseLeave={(e) => !selectedTraces.has(trace.id) && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox" 
                                checked={selectedTraces.has(trace.id)}
                                onChange={() => toggleSelectTrace(trace.id)}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }} title={trace.id}>
                            {trace.id}
                        </div>
                        <div>
                            {trace.status === 'success' ? (
                                <span style={styles.statusSuccess}>
                                    <CheckCircle size={10} /> Success
                                </span>
                            ) : (
                                <span style={styles.statusFailed}>
                                    <AlertCircle size={10} /> Failed
                                </span>
                            )}
                        </div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px', fontWeight: '500' }} title={trace.question}>
                            {trace.artifact && <span title="Has Artifact" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}><FileText size={14} color="var(--text-secondary)" /></span>}
                            {trace.question}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={12} color="var(--text-secondary)" />
                            {trace.username}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                            <Clock size={12} />
                            {new Date(trace.timestamp).toLocaleString()}
                        </div>
                        <div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrace(trace);
                                }}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Eye size={14} /> {t('common.details')}
                            </button>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      <SaveToEvalModal 
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        selectedCount={selectedTraces.size}
        onSave={handleSaveToEval}
      />
      {selectedTrace && (
        <EvalTraceDetailModal 
            isOpen={!!selectedTrace}
            trace={selectedTrace}
            onClose={() => setSelectedTrace(null)}
            readOnly={true}
            onNavigate={{
                hasPrev: (() => {
                    const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                    return currentIndex > 0;
                })(),
                hasNext: (() => {
                    const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                    return currentIndex < filteredTraces.length - 1;
                })(),
                onPrev: () => {
                    const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                    if (currentIndex > 0) {
                        setSelectedTrace(filteredTraces[currentIndex - 1]);
                    }
                },
                onNext: () => {
                    const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                    if (currentIndex < filteredTraces.length - 1) {
                        setSelectedTrace(filteredTraces[currentIndex + 1]);
                    }
                }
            }}
        />
      )}
    </div>
  );
};

export default TracePage;
