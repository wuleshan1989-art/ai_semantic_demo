import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, 
    FileText, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    List, 
    ChevronDown, 
    ChevronRight,
    MessageSquare,
    Star
} from './Icons';
import { useApp } from './AppContext';
import EvalTraceDetailModal from './EvalTraceDetailModal';

const EvaluationRunDetail = () => {
    const { id: runId } = useParams();
    const navigate = useNavigate();
    const { t } = useApp();

    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configExpanded, setConfigExpanded] = useState(false);
    const [selectedTrace, setSelectedTrace] = useState(null);
    
    // Fetch run details
    useEffect(() => {
        const fetchRunDetails = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:3001/api/eval-runs/${runId}`);
                let runData = res.data;

                // Fallback: If traces are missing in runData, fetch them from EvalSet
                if (!runData.traces && runData.evalSetId) {
                    try {
                        const setRes = await axios.get(`http://localhost:3001/api/eval-sets/${runData.evalSetId}`);
                        const set = setRes.data;
                        const results = runData.results || [];
                        
                        // Merge traces with results
                        const tracesWithResults = set.traces.map(trace => {
                            const result = results.find(r => r.traceId === trace.id);
                            return {
                                ...trace,
                                score: result ? result.score : null,
                                comment: result ? result.comment : null,
                                runDetails: result ? result.details : null
                            };
                        });
                        
                        runData = {
                            ...runData,
                            traces: tracesWithResults,
                            annotationFields: set.annotationFields
                        };
                    } catch (err) {
                        console.error('Failed to fetch eval set for fallback', err);
                    }
                }

                setRun(runData);
            } catch (error) {
                console.error('Failed to fetch run details', error);
            } finally {
                setLoading(false);
            }
        };

        if (runId) {
            fetchRunDetails();
        }
    }, [runId]);

    const handleUpdateTrace = (updatedTrace) => {
        setRun(prev => ({
            ...prev,
            traces: prev.traces.map(t => t.id === updatedTrace.id ? updatedTrace : t)
        }));
    };

    if (loading) {
        return (
            <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-secondary)' 
            }}>
                {t('loading', 'Loading run details...')}
            </div>
        );
    }

    if (!run) {
        return (
            <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-secondary)' 
            }}>
                {t('run_not_found', 'Evaluation run not found')}
            </div>
        );
    }

    // Helper to extract score/comment
    const getScore = (trace) => {
        // Try to find score in annotations or root level
        if (trace.score !== undefined) return trace.score;
        if (trace.annotations?.global?.score) return trace.annotations.global.score;
        if (trace.annotations?.global?.rating) return trace.annotations.global.rating;
        return '-';
    };

    const getComment = (trace) => {
        if (trace.comment) return trace.comment;
        if (trace.annotations?.global?.comment) return trace.annotations.global.comment;
        return '-';
    };

    return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: 'var(--bg-primary)', 
            overflow: 'hidden' 
        }}>
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
                    onClick={() => navigate(run.evalSetId ? `/evaluation/sets/${run.evalSetId}` : '/evaluation/sets')}
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
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t('run_detail_title', 'Run Details')}
                    </h1>
                    <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '13px', 
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                    }}>
                        #{run.id}
                    </span>
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
                               '#ef4444',
                        fontWeight: '500'
                    }}>
                        {run.status === 'completed' ? <CheckCircle size={12} /> : 
                         run.status === 'running' ? <Clock size={12} /> : 
                         <AlertCircle size={12} />}
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                    
                    <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            {new Date(run.startTime).toLocaleString()}
                        </span>
                        {run.stats && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <List size={14} />
                                {run.stats.total || 0} Traces
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Config Section */}
            <div style={{ 
                padding: '12px 24px', 
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)'
            }}>
                <div 
                    onClick={() => setConfigExpanded(!configExpanded)}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--text-secondary)',
                        userSelect: 'none'
                    }}
                >
                    {configExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {t('configuration', 'Configuration')}
                </div>
                {configExpanded && (
                    <div style={{ 
                        marginTop: '8px', 
                        padding: '12px', 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        overflowX: 'auto',
                        color: 'var(--text-primary)'
                    }}>
                        {typeof run.config === 'object' ? JSON.stringify(run.config, null, 2) : run.config}
                    </div>
                )}
            </div>

            {/* Traces List */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Table Header */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '100px 1fr 100px 80px 1fr', 
                    padding: '12px 24px', 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                }}>
                    <div>{t('trace_id', 'Trace ID')}</div>
                    <div>{t('question', 'Question')}</div>
                    <div>{t('status', 'Status')}</div>
                    <div>{t('score', 'Score')}</div>
                    <div>{t('comment', 'Comment')}</div>
                </div>

                {/* Table Body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {(!run.traces || run.traces.length === 0) ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {t('no_traces', 'No traces in this run.')}
                        </div>
                    ) : (
                        run.traces.map(trace => (
                            <div 
                                key={trace.id}
                                onClick={() => setSelectedTrace(trace)}
                                style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '100px 1fr 100px 80px 1fr', 
                                    padding: '16px 24px', 
                                    borderBottom: '1px solid var(--border-color)',
                                    fontSize: '13px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.1s',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {trace.id.substring(0, 8)}...
                                </div>
                                <div style={{ fontWeight: '500', paddingRight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {trace.question}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Star size={12} color="var(--text-secondary)" />
                                    {getScore(trace)}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MessageSquare size={12} />
                                    {getComment(trace)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Trace Detail Modal */}
            {selectedTrace && (
                <EvalTraceDetailModal 
                    isOpen={!!selectedTrace}
                    trace={selectedTrace} 
                    evalSetId={run.evalSetId}
                    annotationFields={run.annotationFields || []}
                    onClose={() => setSelectedTrace(null)} 
                    onUpdateTrace={handleUpdateTrace}
                    onNavigate={{
                        hasPrev: (() => {
                            if (!run.traces || !selectedTrace) return false;
                            const currentIndex = run.traces.findIndex(t => t.id === selectedTrace.id);
                            return currentIndex > 0;
                        })(),
                        hasNext: (() => {
                            if (!run.traces || !selectedTrace) return false;
                            const currentIndex = run.traces.findIndex(t => t.id === selectedTrace.id);
                            return currentIndex < run.traces.length - 1;
                        })(),
                        onPrev: () => {
                            if (!run.traces || !selectedTrace) return;
                            const currentIndex = run.traces.findIndex(t => t.id === selectedTrace.id);
                            if (currentIndex > 0) {
                                setSelectedTrace(run.traces[currentIndex - 1]);
                            }
                        },
                        onNext: () => {
                            if (!run.traces || !selectedTrace) return;
                            const currentIndex = run.traces.findIndex(t => t.id === selectedTrace.id);
                            if (currentIndex < run.traces.length - 1) {
                                setSelectedTrace(run.traces[currentIndex + 1]);
                            }
                        }
                    }}
                />
            )}
        </div>
    );
};

export default EvaluationRunDetail;
