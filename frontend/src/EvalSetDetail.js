import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import EvalTraceDetailModal from './EvalTraceDetailModal';
import ManageCollaboratorsModal from './ManageCollaboratorsModal';
import axios from 'axios';
import { 
    FileText, 
    ArrowLeft, 
    Settings, 
    Plus, 
    Trash2, 
    CheckCircle, 
    AlertCircle, 
    X,
    Save,
    Play,
    List,
    Clock,
    User,
    Shield
} from './Icons';

const RunEvaluationModal = ({ isOpen, onClose, onRun }) => {
    const { t } = useApp();
    const [config, setConfig] = useState('{\n  "model": "gpt-4",\n  "temperature": 0.7\n}');

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
                        {t('eval.sets.run_eval')}
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
                
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                        {t('eval.run.config')} (JSON)
                    </div>
                    <textarea
                        value={config}
                        onChange={(e) => setConfig(e.target.value)}
                        style={{
                            width: '100%',
                            height: '200px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            resize: 'vertical',
                            outline: 'none'
                        }}
                        spellCheck="false"
                    />
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
                        onClick={() => onRun(config)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        <Play size={16} /> {t('eval.sets.run_eval')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ManageFieldsModal = ({ isOpen, onClose, fields, onSave }) => {
    const { t } = useApp();
    const [localFields, setLocalFields] = useState(fields || []);

    useEffect(() => {
        setLocalFields(fields || []);
    }, [fields]);

    const addField = () => {
        setLocalFields([...localFields, { name: '', type: 'text', options: [] }]);
    };

    const removeField = (index) => {
        const newFields = [...localFields];
        newFields.splice(index, 1);
        setLocalFields(newFields);
    };

    const updateField = (index, key, value) => {
        const newFields = [...localFields];
        newFields[index] = { ...newFields[index], [key]: value };
        setLocalFields(newFields);
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
                width: '600px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxHeight: '80vh',
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
                        {t('eval.sets.manage_fields')}
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
                
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {localFields.map((field, index) => (
                        <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    {t('eval.field.name')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('eval.field.name')}
                                    value={field.name}
                                    onChange={(e) => updateField(index, 'name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ width: '140px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    {t('eval.field.type')}
                                </label>
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(index, 'type', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="text">Text</option>
                                    <option value="select">Select</option>
                                    <option value="rating">Rating</option>
                                </select>
                            </div>
                            <div style={{ paddingTop: '20px' }}>
                                <button
                                    onClick={() => removeField(index)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        background: 'transparent',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button
                        onClick={addField}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--primary-color)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            marginTop: '12px',
                            padding: '6px 0'
                        }}
                    >
                        <Plus size={16} /> {t('eval.field.add')}
                    </button>
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
                        onClick={() => onSave(localFields)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        <Save size={16} /> {t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EvalSetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, user, userRole } = useApp();
    
    const [evalSet, setEvalSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [selectedTrace, setSelectedTrace] = useState(null);
    const [activeTab, setActiveTab] = useState('traces'); // 'traces' or 'runs'
    const [evalRuns, setEvalRuns] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');

    // Permissions Logic
    const isSuperAdmin = user?.role === 'super_admin';
    const isRepoAdmin = userRole === 'admin';
    const isAdmin = isSuperAdmin || isRepoAdmin;
    const isOwner = evalSet && (evalSet.owner === user?.userId);
    const isCollaborator = evalSet && (evalSet.collaborators || []).includes(user?.userId);

    const canManage = isAdmin || isOwner;
    const canEdit = canManage || isCollaborator;

    const filteredTraces = (evalSet?.traces || []).filter(trace => {
        if (filterStatus !== 'all' && trace.status !== filterStatus) return false;
        return true;
    }).sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    useEffect(() => {
        fetchEvalSet();
        if (activeTab === 'runs') {
            fetchEvalRuns();
        }
    }, [id, activeTab]);

    const fetchEvalSet = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:3001/api/eval-sets/${id}`);
            setEvalSet(res.data);
        } catch (error) {
            console.error('Failed to fetch eval set', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvalRuns = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/api/eval-sets/${id}/runs`);
            setEvalRuns(res.data);
        } catch (error) {
            console.error('Failed to fetch eval runs', error);
        }
    };

    const handleRunEvaluation = async (configStr) => {
        try {
            // Validate JSON
            JSON.parse(configStr);
            
            setIsRunModalOpen(false);
            setActiveTab('runs'); // Switch to runs tab
            
            await axios.post(`http://localhost:3001/api/eval-sets/${id}/runs`, {
                config: configStr
            });
            
            fetchEvalRuns();
        } catch (error) {
            console.error('Failed to start evaluation run', error);
            alert('Failed to start evaluation run. Please check your JSON configuration.');
        }
    };

    const handleUpdateTrace = (updatedTrace) => {
        // Update the trace in the local list
        setEvalSet(prev => ({
            ...prev,
            traces: prev.traces.map(t => t.id === updatedTrace.id ? updatedTrace : t)
        }));
    };

    const handleSaveFields = async (newFields) => {
        try {
            // Optimistic update
            const updatedSet = { ...evalSet, annotationFields: newFields };
            setEvalSet(updatedSet);
            setIsManageFieldsOpen(false);

            await axios.put(`http://localhost:3001/api/eval-sets/${id}/fields`, {
                fields: newFields
            });
            
            // Refetch to be sure
            fetchEvalSet();
        } catch (error) {
            console.error('Failed to update fields', error);
            alert('Failed to update fields');
        }
    };

    const handleSavePermissions = async (newOwner, newCollaborators) => {
        try {
            await axios.put(`http://localhost:3001/api/eval-sets/${id}/permissions`, {
                owner: newOwner,
                collaborators: newCollaborators
            });
            setEvalSet(prev => ({ ...prev, owner: newOwner, collaborators: newCollaborators }));
            setIsPermissionsOpen(false);
        } catch (error) {
            console.error('Failed to update permissions', error);
            alert('Failed to update permissions');
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('common.loading')}</div>;
    }

    if (!evalSet) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Evaluation set not found</div>;
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ 
                height: '64px',
                padding: '0 24px', 
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button 
                    onClick={() => navigate('/evaluation/sets')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={24} color="var(--primary-color)" />
                        {evalSet.name}
                    </h1>
                    {evalSet.description && (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                            {evalSet.description}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {canEdit && (
                        <button
                            onClick={() => setIsRunModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                backgroundColor: 'var(--primary-color)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'white'
                            }}
                        >
                            <Play size={16} />
                            {t('eval.sets.run_eval')}
                        </button>
                    )}
                    
                    {canManage && (
                        <>
                            <button
                                onClick={() => setIsPermissionsOpen(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <User size={16} />
                                {t('eval.modal.manage_permissions', 'Permissions')}
                            </button>
                            <button
                                onClick={() => setIsManageFieldsOpen(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <Settings size={16} />
                                {t('eval.sets.manage_fields')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                padding: '0 24px', 
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                <button
                    onClick={() => setActiveTab('traces')}
                    style={{
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'traces' ? '2px solid var(--primary-color)' : '2px solid transparent',
                        color: activeTab === 'traces' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: activeTab === 'traces' ? '600' : '500',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <List size={16} /> {t('eval.sets.tabs.traces')}
                </button>
                <button
                    onClick={() => setActiveTab('runs')}
                    style={{
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'runs' ? '2px solid var(--primary-color)' : '2px solid transparent',
                        color: activeTab === 'runs' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: activeTab === 'runs' ? '600' : '500',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Clock size={16} /> {t('eval.sets.tabs.runs')}
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'traces' ? (
                    <>
                        {/* Toolbar */}
                        <div style={{ 
                            padding: '12px 24px', 
                            display: 'flex', 
                            gap: '12px', 
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                        }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('eval.run.status')}:</span>
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">{t('eval.trace.filter.all_status')}</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>

                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('eval.filter.sort_by')}</span>
                            <select 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="desc">{t('eval.filter.sort.newest')}</option>
                                <option value="asc">{t('eval.filter.sort.oldest')}</option>
                            </select>
                        </div>

                        {/* Table Header */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '100px 100px 1fr 150px', 
                            padding: '12px 24px', 
                            backgroundColor: 'var(--bg-tertiary)',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            <div>{t('eval.trace.col.id')}</div>
                            <div>{t('eval.run.status')}</div>
                            <div>{t('eval.trace.col.question')}</div>
                            <div>{t('eval.modal.annotation')}</div>
                        </div>

                        {/* Table Body */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {(!filteredTraces || filteredTraces.length === 0) ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    {evalSet.traces && evalSet.traces.length > 0 ? t('eval.trace.no_traces_filter') : t('eval.set.no_traces')}
                                </div>
                            ) : (
                                filteredTraces.map(trace => (
                                    <div 
                                        key={trace.id}
                                        onClick={() => setSelectedTrace(trace)}
                                        style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '100px 100px 1fr 150px', 
                                            padding: '12px 24px', 
                                            borderBottom: '1px solid var(--border-color)',
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.1s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {trace.id}
                                        </div>
                                        <div>
                                            {trace.status === 'success' ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontSize: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                                    <CheckCircle size={10} /> Success
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                                    <AlertCircle size={10} /> Failed
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: '500', paddingRight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {trace.artifact && <FileText size={14} color="var(--text-secondary)" title={t('eval.trace.artifact')} />}
                                            {trace.question}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                            {trace.annotations && trace.annotations.global && Object.keys(trace.annotations.global).length > 0 ? (
                                                <span style={{ color: 'var(--primary-color)' }}>{t('eval.set.fields_count', { count: Object.keys(trace.annotations.global).length })}</span>
                                            ) : (
                                                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>{t('eval.set.unlabeled')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Runs Table Header */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '150px 200px 150px 100px 1fr', 
                            padding: '12px 24px', 
                            backgroundColor: 'var(--bg-tertiary)',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            <div>{t('eval.trace.col.id')}</div>
                            <div>{t('eval.run.start_time')}</div>
                            <div>{t('eval.run.status')}</div>
                            <div>{t('eval.run.results')}</div>
                            <div>{t('eval.run.config')}</div>
                        </div>

                        {/* Runs Table Body */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {(!evalRuns || evalRuns.length === 0) ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    {t('eval.set.no_runs')}
                                </div>
                            ) : (
                                evalRuns.map(run => (
                                    <div 
                                        key={run.id}
                                        onClick={() => navigate(`/evaluation/runs/${run.id}`)}
                                        style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '150px 200px 150px 100px 1fr', 
                                            padding: '16px 24px', 
                                            borderBottom: '1px solid var(--border-color)',
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.1s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                            {run.id}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(run.startTime).toLocaleString()}
                                        </div>
                                        <div>
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '4px', 
                                                fontSize: '12px', 
                                                padding: '2px 8px', 
                                                borderRadius: '10px',
                                                backgroundColor: run.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 
                                                               run.status === 'running' ? 'rgba(59, 130, 246, 0.1)' : 
                                                               'rgba(239, 68, 68, 0.1)',
                                                color: run.status === 'completed' ? '#22c55e' : 
                                                       run.status === 'running' ? '#3b82f6' : 
                                                       '#ef4444'
                                            }}>
                                                {run.status === 'completed' ? <CheckCircle size={10} /> : 
                                                 run.status === 'running' ? <Play size={10} /> : 
                                                 <AlertCircle size={10} />}
                                                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: '500' }}>
                                            {run.summary ? (run.summary.avgScore ? run.summary.avgScore.toFixed(1) : '-') : '-'}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {(typeof run.config === 'string' ? run.config : JSON.stringify(run.config || {})).substring(0, 100)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <ManageFieldsModal 
                isOpen={isManageFieldsOpen} 
                onClose={() => setIsManageFieldsOpen(false)}
                fields={evalSet.annotationFields}
                onSave={handleSaveFields}
            />

            <RunEvaluationModal
                isOpen={isRunModalOpen}
                onClose={() => setIsRunModalOpen(false)}
                onRun={handleRunEvaluation}
            />
            
            <ManageCollaboratorsModal
                isOpen={isPermissionsOpen}
                onClose={() => setIsPermissionsOpen(false)}
                evalSet={evalSet}
                onUpdate={(updatedSet) => setEvalSet(updatedSet)}
            />

            {selectedTrace && (
                <EvalTraceDetailModal 
                    isOpen={!!selectedTrace}
                    trace={selectedTrace} 
                    evalSetId={id}
                    annotationFields={evalSet.annotationFields}
                    onClose={() => setSelectedTrace(null)} 
                    onUpdateTrace={handleUpdateTrace}
                    readOnly={!canEdit}
                    onNavigate={{
                        hasPrev: (() => {
                            if (!filteredTraces || !selectedTrace) return false;
                            const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                            return currentIndex > 0;
                        })(),
                        hasNext: (() => {
                            if (!filteredTraces || !selectedTrace) return false;
                            const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                            return currentIndex < filteredTraces.length - 1;
                        })(),
                        onPrev: () => {
                            if (!filteredTraces || !selectedTrace) return;
                            const currentIndex = filteredTraces.findIndex(t => t.id === selectedTrace.id);
                            if (currentIndex > 0) {
                                setSelectedTrace(filteredTraces[currentIndex - 1]);
                            }
                        },
                        onNext: () => {
                            if (!filteredTraces || !selectedTrace) return;
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

export default EvalSetDetail;
