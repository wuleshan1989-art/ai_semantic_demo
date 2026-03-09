import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    X, 
    Save, 
    User, 
    Bot, 
    Tool, 
    MessageSquare, 
    CheckCircle, 
    AlertCircle, 
    Terminal, 
    FileText,
    RefreshCw,
    GitCommit,
    ChevronDown,
    ChevronRight,
    ArrowLeft
} from './Icons';
import { useApp } from './AppContext';

// Simple Star Rating Component
const StarRating = ({ value, onChange, max = 5 }) => {
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(max)].map((_, i) => (
                <span
                    key={i}
                    onClick={() => onChange(i + 1)}
                    style={{
                        cursor: 'pointer',
                        color: i < value ? '#fbbf24' : 'var(--text-secondary)',
                        fontSize: '20px',
                        opacity: i < value ? 1 : 0.3
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

const EvalTraceDetailModal = ({ 
    trace, 
    isOpen = true, 
    onClose, 
    evalSetId, 
    annotationFields = [], 
    onUpdateTrace,
    readOnly = false,
    onNavigate, // { hasPrev: boolean, hasNext: boolean, onPrev: () => void, onNext: () => void }
}) => {
    const { t } = useApp();
    const [annotations, setAnnotations] = useState({ global: {}, steps: {} });
    const [selectedStepIndex, setSelectedStepIndex] = useState(-1); // -1: User Input, 'final': Final Response, 0+: Steps, 'artifact': Artifact, 'diff': Diff View
    const [isSaving, setIsSaving] = useState(false);
    const [diffData, setDiffData] = useState(null);
    const [isLoadingDiff, setIsLoadingDiff] = useState(false);
    const itemRefs = useRef({});

    useEffect(() => {
        if (trace) {
            setAnnotations(trace.annotations || { global: {}, steps: {} });
            setSelectedStepIndex(-1);
            setDiffData(null);
        }
    }, [trace]);

    useEffect(() => {
        if (selectedStepIndex !== null && itemRefs.current[selectedStepIndex]) {
            itemRefs.current[selectedStepIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedStepIndex]);

    const handleReplayAndDiff = async () => {
        if (!evalSetId) {
            alert(t('eval.trace.diff_error_no_set'));
            return;
        }
        try {
            setIsLoadingDiff(true);
            setSelectedStepIndex('diff');
            const res = await axios.get(`http://localhost:3001/api/eval-sets/${evalSetId}/traces/${trace.id}/diff`);
            setDiffData(res.data);
        } catch (error) {
            console.error('Failed to fetch diff', error);
            alert(t('eval.trace.diff_error'));
            setSelectedStepIndex(-1);
        } finally {
            setIsLoadingDiff(false);
        }
    };

    if (!isOpen || !trace) return null;

    const steps = trace.steps || [];

    const handleGlobalAnnotationChange = (key, value) => {
        setAnnotations(prev => ({
            ...prev,
            global: {
                ...prev.global,
                [key]: value
            }
        }));
    };

    const handleStepAnnotationChange = (stepIndex, key, value) => {
        setAnnotations(prev => ({
            ...prev,
            steps: {
                ...prev.steps,
                [stepIndex]: {
                    ...(prev.steps[stepIndex] || {}),
                    [key]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const updatedTrace = { ...trace, annotations };
            // Note: Adjust URL based on actual API route
            await axios.put(`http://localhost:3001/api/eval-sets/${evalSetId}/traces/${trace.id}`, updatedTrace);
            if (onUpdateTrace) onUpdateTrace(updatedTrace);
            onClose();
        } catch (error) {
            console.error('Failed to save annotations', error);
            alert('Failed to save annotations');
        } finally {
            setIsSaving(false);
        }
    };

    // Render helper for Timeline Node
    const renderTimelineNode = (index, label, icon, isSelected) => {
        const hasAnnotation = index === -1 
            ? false // User input usually doesn't have specific annotation in this design
            : index === 'final' || index === 'artifact' || index === 'diff'
                ? false // Final response usually handled by global or specific logic? User req says "Step Section" bind to annotations.steps[selectedStepIndex].
                : !!(annotations.steps && annotations.steps[index] && Object.keys(annotations.steps[index]).length > 0);

        return (
            <div 
                onClick={() => setSelectedStepIndex(index)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                    marginBottom: '4px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ 
                    color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    borderRadius: '50%' // Optional: make it round to look better on the line
                }}>
                    {icon}
                </div>
                <div style={{ 
                    flex: 1, 
                    fontSize: '13px', 
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {label}
                </div>
                {hasAnnotation && (
                    <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-color)' 
                    }} />
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                width: '95%',
                maxWidth: '1400px',
                height: '90%',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {t('eval.trace.detail')}
                        </h2>
                        <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            backgroundColor: 'var(--bg-tertiary)', 
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)', 
                            fontSize: '12px',
                            fontFamily: 'monospace'
                        }}>
                            #{trace.id}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Navigation Buttons */}
                        {onNavigate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
                                <button
                                    onClick={onNavigate.onPrev}
                                    disabled={!onNavigate.hasPrev}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--border-color)',
                                        cursor: onNavigate.hasPrev ? 'pointer' : 'not-allowed',
                                        color: onNavigate.hasPrev ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        padding: '6px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: onNavigate.hasPrev ? 1 : 0.5
                                    }}
                                    title={t('common.prev')}
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <button
                                    onClick={onNavigate.onNext}
                                    disabled={!onNavigate.hasNext}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--border-color)',
                                        cursor: onNavigate.hasNext ? 'pointer' : 'not-allowed',
                                        color: onNavigate.hasNext ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        padding: '6px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: onNavigate.hasNext ? 1 : 0.5
                                    }}
                                    title={t('common.next')}
                                >
                                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                            </div>
                        )}

                        {/* Replay & Diff Button - Only show if in Eval Set context */}
                        {evalSetId && (
                            <button
                                onClick={handleReplayAndDiff}
                                disabled={isLoadingDiff}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    cursor: isLoadingDiff ? 'wait' : 'pointer'
                                }}
                            >
                                <RefreshCw size={14} />
                                {isLoadingDiff ? t('eval.trace.replaying') : t('eval.trace.replay_diff')}
                            </button>
                        )}
                        
                        <button 
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Column: Timeline */}
                    <div style={{
                        width: '300px',
                        borderRight: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <div style={{ 
                            padding: '16px 20px', 
                            fontWeight: '600', 
                            color: 'var(--text-secondary)', 
                            fontSize: '12px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid var(--border-color)',
                            height: '53px', // Fixed height to align with Content header
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {t('eval.modal.timeline')}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', position: 'relative' }}>
                            {/* Vertical Line for Timeline */}
                            <div style={{
                                position: 'absolute',
                                left: '36px', // 12px (parent padding) + 12px (node padding) + 12px (half icon)
                                top: '20px',
                                bottom: '20px',
                                width: '1px',
                                backgroundColor: 'var(--border-color)',
                                zIndex: 0
                            }} />

                            {renderTimelineNode(-1, t('eval.trace.user_input'), <User size={18} />, selectedStepIndex === -1)}
                            
                            {steps.map((step, idx) => (
                                <div key={idx} style={{ display: 'contents' }}>
                                    {renderTimelineNode(
                                        idx, 
                                        step.type === 'tool' ? `${t('eval.trace.action')}: ${step.name || 'Tool'}` : t('eval.trace.thought'), 
                                        step.type === 'tool' ? <Tool size={18} /> : <MessageSquare size={18} />, 
                                        selectedStepIndex === idx
                                    )}
                                </div>
                            ))}

                            {trace.artifact && renderTimelineNode('artifact', t('eval.trace.artifact'), <FileText size={18} />, selectedStepIndex === 'artifact')}

                            {renderTimelineNode('final', t('eval.trace.final_response'), <Bot size={18} />, selectedStepIndex === 'final')}
                            
                            {diffData && renderTimelineNode('diff', t('eval.trace.diff_view'), <GitCommit size={18} />, selectedStepIndex === 'diff')}
                        </div>
                    </div>

                    {/* Middle Column: Content */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'var(--bg-primary)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            padding: '16px 24px', 
                            borderBottom: '1px solid var(--border-color)', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            height: '53px' // Fixed height to align with Timeline header
                        }}>
                            <span>{t('eval.modal.content')}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '400' }}>
                                {selectedStepIndex === -1 ? t('eval.trace.user_input') : 
                                 selectedStepIndex === 'final' ? t('eval.trace.final_response') : 
                                 selectedStepIndex === 'artifact' ? t('eval.trace.artifact') :
                                 selectedStepIndex === 'diff' ? t('eval.trace.diff_view') :
                                 steps[selectedStepIndex]?.type === 'tool' ? t('eval.trace.action_detail') : t('eval.trace.thought_process')}
                            </span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollBehavior: 'smooth' }}>
                            {/* User Input Section */}
                            <div 
                                ref={el => itemRefs.current[-1] = el}
                                style={{
                                    marginBottom: '20px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: selectedStepIndex === -1 ? '1px solid var(--primary-color)' : '1px solid transparent',
                                    backgroundColor: selectedStepIndex === -1 ? 'var(--bg-secondary)' : 'transparent',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <h3 style={{ marginTop: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('eval.trace.col.question')}</h3>
                                <div style={{ 
                                    padding: '12px 16px', 
                                    backgroundColor: 'var(--bg-tertiary)', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border-color)', 
                                    lineHeight: '1.5',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)'
                                }}>
                                    {trace.question}
                                </div>
                                {trace.metadata && (
                                    <div style={{ marginTop: '16px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('eval.trace.metadata')}</h3>
                                        <pre style={{ 
                                            padding: '12px', 
                                            backgroundColor: 'var(--bg-tertiary)', 
                                            borderRadius: '8px', 
                                            overflowX: 'auto', 
                                            fontSize: '12px',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                            margin: 0
                                        }}>
                                            {JSON.stringify(trace.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Steps Section */}
                            {steps.map((step, idx) => (
                                <div 
                                    key={idx}
                                    ref={el => itemRefs.current[idx] = el}
                                    style={{
                                        marginBottom: '20px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: selectedStepIndex === idx ? '1px solid var(--primary-color)' : '1px solid transparent',
                                        backgroundColor: selectedStepIndex === idx ? 'var(--bg-secondary)' : 'transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {(step.thought || step.content) && step.type !== 'tool' && (
                                            <div>
                                                <h3 style={{ marginTop: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <MessageSquare size={14} />
                                                    {t('eval.trace.thought')}
                                                </h3>
                                                <div style={{ 
                                                    padding: '12px 16px', 
                                                    backgroundColor: 'var(--bg-tertiary)', 
                                                    borderRadius: '8px', 
                                                    whiteSpace: 'pre-wrap', 
                                                    lineHeight: '1.5',
                                                    fontSize: '14px',
                                                    color: 'var(--text-primary)',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    {step.thought || step.content}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {step.type === 'tool' && (
                                            <>
                                                <div>
                                                    <h3 style={{ marginTop: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Tool size={14} />
                                                        {t('eval.trace.input')}
                                                    </h3>
                                                    <pre style={{ 
                                                        padding: '12px', 
                                                        backgroundColor: 'var(--bg-tertiary)', 
                                                        color: 'var(--text-primary)', 
                                                        borderRadius: '8px', 
                                                        overflowX: 'auto', 
                                                        fontSize: '13px',
                                                        border: '1px solid var(--border-color)',
                                                        margin: 0
                                                    }}>
                                                        {typeof step.input === 'object' 
                                                            ? JSON.stringify(step.input, null, 2) 
                                                            : step.input}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', marginTop: '16px' }}>{t('eval.trace.output')}</h3>
                                                    <pre style={{ 
                                                        padding: '12px', 
                                                        backgroundColor: 'var(--bg-tertiary)', 
                                                        color: 'var(--text-primary)', 
                                                        borderRadius: '8px', 
                                                        overflowX: 'auto', 
                                                        fontSize: '13px',
                                                        border: '1px solid var(--border-color)',
                                                        margin: 0
                                                    }}>
                                                        {typeof step.output === 'object' 
                                                            ? JSON.stringify(step.output, null, 2) 
                                                            : step.output}
                                                    </pre>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Artifact Section */}
                            {trace.artifact && (
                                <div 
                                    ref={el => itemRefs.current['artifact'] = el}
                                    style={{
                                        marginBottom: '20px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: selectedStepIndex === 'artifact' ? '1px solid var(--primary-color)' : '1px solid transparent',
                                        backgroundColor: selectedStepIndex === 'artifact' ? 'var(--bg-secondary)' : 'transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <h3 style={{ marginTop: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileText size={16} />
                                        {t('eval.trace.artifact')}
                                    </h3>
                                    <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div style={{ marginBottom: '8px', fontSize: '13px' }}><strong>{t('eval.trace.artifact_type')}:</strong> {trace.artifact.type}</div>
                                        <div style={{ marginBottom: '8px', fontSize: '13px' }}><strong>{t('eval.trace.artifact_title')}:</strong> {trace.artifact.title}</div>
                                        <div style={{ marginBottom: '8px', fontSize: '13px' }}><strong>ID:</strong> {trace.artifact.id}</div>
                                        <pre style={{ 
                                            overflow: 'auto', 
                                            maxHeight: '400px', 
                                            backgroundColor: 'var(--bg-tertiary)', 
                                            padding: '12px', 
                                            borderRadius: '6px', 
                                            fontSize: '13px',
                                            margin: '8px 0 0 0'
                                        }}>{trace.artifact.content}</pre>
                                    </div>
                                </div>
                            )}

                            {/* Final Response Section */}
                            <div 
                                ref={el => itemRefs.current['final'] = el}
                                style={{
                                    marginBottom: '20px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: selectedStepIndex === 'final' ? '1px solid var(--primary-color)' : '1px solid transparent',
                                    backgroundColor: selectedStepIndex === 'final' ? 'var(--bg-secondary)' : 'transparent',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <h3 style={{ marginTop: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Bot size={16} />
                                    {t('eval.trace.answer')}
                                </h3>
                                <div style={{ 
                                    padding: '12px 16px', 
                                    backgroundColor: 'var(--bg-tertiary)', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border-color)', 
                                    lineHeight: '1.5', 
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)'
                                }}>
                                    {trace.answer || trace.output || 'No output'}
                                </div>
                            </div>

                            {/* Diff View Section */}
                            {diffData && (
                                <div 
                                    ref={el => itemRefs.current['diff'] = el}
                                    style={{
                                        marginBottom: '20px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: selectedStepIndex === 'diff' ? '1px solid var(--primary-color)' : '1px solid transparent',
                                        backgroundColor: selectedStepIndex === 'diff' ? 'var(--bg-secondary)' : 'transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <h3 style={{ marginTop: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('eval.trace.diff_view')}</h3>
                                    {isLoadingDiff ? (
                                        <div style={{ color: 'var(--text-secondary)' }}>Loading diff...</div>
                                    ) : (
                                        <div>
                                            {diffData.diffs.map((diff, idx) => (
                                                <div key={idx} style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Field: {diff.field}</h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                        <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                                                            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ef4444' }}>{t('eval.trace.original')}</h5>
                                                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', margin: 0, color: 'var(--text-primary)' }}>{diff.original}</pre>
                                                        </div>
                                                        <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                                                            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#22c55e' }}>{t('eval.trace.replayed')}</h5>
                                                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', margin: 0, color: 'var(--text-primary)' }}>{diff.replayed}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {diffData.diffs.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>{t('eval.trace.no_diff')}</div>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Annotations (Only if not readOnly) */}
                    {!readOnly && (
                        <div style={{
                            width: '320px',
                            borderLeft: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'var(--bg-secondary)'
                        }}>
                            <div style={{ 
                                padding: '16px 20px', 
                                borderBottom: '1px solid var(--border-color)', 
                                fontWeight: '600', 
                                color: 'var(--text-primary)',
                                height: '53px', // Fixed height to align
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {t('eval.modal.annotation')}
                            </div>
                            
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                {/* Global Annotations */}
                                <div style={{ marginBottom: '32px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('eval.annotation.global')}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {annotationFields.map((field, idx) => (
                                            <div key={idx}>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    {field.name}
                                                </label>
                                                {field.type === 'select' && (
                                                    <select
                                                        value={annotations.global?.[field.name] || ''}
                                                        onChange={(e) => handleGlobalAnnotationChange(field.name, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            backgroundColor: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '13px',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option value="">Select...</option>
                                                        {field.options && field.options.map((opt, i) => (
                                                            <option key={i} value={opt}>{t(`eval.annotation.option.${opt}`) || opt}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {field.type === 'text' && (
                                                    <textarea
                                                        value={annotations.global?.[field.name] || ''}
                                                        onChange={(e) => handleGlobalAnnotationChange(field.name, e.target.value)}
                                                        rows={3}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            backgroundColor: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '13px',
                                                            resize: 'vertical',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                )}
                                                {field.type === 'rating' && (
                                                    <StarRating 
                                                        value={parseInt(annotations.global?.[field.name] || 0)}
                                                        onChange={(val) => handleGlobalAnnotationChange(field.name, val)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {annotationFields.length === 0 && (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                                No global fields configured.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step Annotations */}
                                {typeof selectedStepIndex === 'number' && selectedStepIndex >= 0 && (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {t('eval.annotation.step')} {selectedStepIndex + 1}
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    {t('eval.annotation.step_correctness')}
                                                </label>
                                                <select
                                                    value={annotations.steps?.[selectedStepIndex]?.correctness || ''}
                                                    onChange={(e) => handleStepAnnotationChange(selectedStepIndex, 'correctness', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        backgroundColor: 'var(--bg-primary)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '13px',
                                                        outline: 'none'
                                                    }}
                                                >
                                                    <option value="">{t('eval.annotation.select_option')}</option>
                                                    <option value="correct">{t('eval.annotation.option.correct')}</option>
                                                    <option value="incorrect">{t('eval.annotation.option.incorrect')}</option>
                                                    <option value="partial">{t('eval.annotation.option.partial')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    {t('eval.annotation.comment')}
                                                </label>
                                                <textarea
                                                    value={annotations.steps?.[selectedStepIndex]?.comment || ''}
                                                    onChange={(e) => handleStepAnnotationChange(selectedStepIndex, 'comment', e.target.value)}
                                                    rows={3}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        backgroundColor: 'var(--bg-primary)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '13px',
                                                        resize: 'vertical',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px'
                            }}>
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 24px',
                                        backgroundColor: 'var(--primary-color)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        opacity: isSaving ? 0.7 : 1
                                    }}
                                >
                                    <Save size={18} />
                                    {isSaving ? t('eval.saving') : t('common.save')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvalTraceDetailModal;
