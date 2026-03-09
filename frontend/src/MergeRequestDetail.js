import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from './AppContext';
import { GitBranch, GitPullRequest, GitMerge, Check, X, AlertCircle } from './Icons';

const MergeRequestDetail = ({ repoId, mrId, onBack }) => {
  const { t } = useApp();
  const [mr, setMr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMRDetail();
  }, [repoId, mrId]);

  const fetchMRDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/repos/${repoId}/merge-requests/${mrId}`);
      setMr(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    try {
      const res = await axios.post(`http://localhost:3001/api/repos/${repoId}/merge-requests/${mrId}/merge`, {
        user: { name: 'Admin' }
      });
      if (res.status === 200) {
        fetchMRDetail();
      } else {
        alert(t('settings.failed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('settings.failed'));
    }
  };

  const handleReject = async () => {
    if (!window.confirm(t('git.mr.reject_confirm'))) return;
    try {
      const res = await axios.post(`http://localhost:3001/api/repos/${repoId}/merge-requests/${mrId}/reject`);
      if (res.status === 200) {
        fetchMRDetail();
      } else {
        alert(t('settings.failed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('settings.failed'));
    }
  };

  const handleResolve = async () => {
    try {
      const res = await axios.post(`http://localhost:3001/api/repos/${repoId}/merge-requests/${mrId}/resolve`);
      if (res.status === 200) {
        fetchMRDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;
  if (!mr) return <div>{t('git.mr.not_found')}</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
        ← {t('git.mr.back')}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>
            {mr.title} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>#{mr.id}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: mr.status === 'open' ? '#238636' : (mr.status === 'merged' ? '#8957e5' : '#cf222e'),
              color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              {mr.status === 'open' ? <GitPullRequest size={16} /> : (mr.status === 'merged' ? <GitMerge size={16} /> : <X size={16} />)}
              {mr.status.toUpperCase()}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {mr.author.name} {t('git.mr.wants_merge')} <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px' }}>{mr.targetBranch}</code> {t('git.mr.from')} <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px' }}>{mr.sourceBranch}</code>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          {/* Description */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '16px', marginBottom: '24px', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>{t('git.mr.desc')}</h3>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>{mr.description || t('git.mr.no_desc')}</p>
          </div>

          {/* Diffs */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t('git.mr.files_changed')} <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{mr.diffs?.length || 0}</span>
            </h3>
            
            {mr.diffs && mr.diffs.map((diff, index) => (
              <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: '600', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{diff.file}</span>
                  {diff.type === 'conflict' && <span style={{ color: '#cf222e', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {t('git.mr.conflict').toUpperCase()}</span>}
                </div>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0', overflowX: 'auto' }}>
                  {diff.hunks.map((hunk, hIndex) => (
                    <div key={hIndex} style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' }}>
                      <div style={{ backgroundColor: '#f0f4f8', color: 'var(--text-secondary)', padding: '4px 12px' }}>{hunk.header}</div>
                      {hunk.lines.map((line, lIndex) => {
                        let bg = 'transparent';
                        if (line.type === 'add') bg = '#e6ffec';
                        if (line.type === 'remove') bg = '#ffebe9';
                        if (line.type === 'conflict-start') bg = '#fffbdd'; // Yellowish
                        if (line.type === 'conflict-mid') bg = '#fffbdd';
                        if (line.type === 'conflict-end') bg = '#fffbdd';
                        
                        return (
                          <div key={lIndex} style={{ backgroundColor: bg, padding: '0 12px', whiteSpace: 'pre' }}>
                            {line.type === 'add' && '+ '}
                            {line.type === 'remove' && '- '}
                            {line.content}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div style={{ width: '280px' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '16px', backgroundColor: 'var(--bg-primary)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{t('git.mr.reviewers')}</h4>
            {mr.reviewers && mr.reviewers.length > 0 ? (
               mr.reviewers.map((r, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                   <img src={r.avatar} width="20" height="20" style={{ borderRadius: '50%' }} />
                   <span>{r.name}</span>
                   {r.status === 'approved' && <Check size={14} color="#238636" />}
                 </div>
               ))
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('git.mr.no_reviewers')}</div>
            )}
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              {mr.status === 'conflict' ? (
                <div>
                   <div style={{ color: '#cf222e', marginBottom: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <AlertCircle size={16} />
                     {t('git.mr.resolve_hint')}
                   </div>
                   <button 
                     onClick={handleResolve}
                     style={{ width: '100%', padding: '8px', backgroundColor: '#f6f8fa', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                   >
                     {t('git.mr.resolve')}
                   </button>
                </div>
              ) : mr.status === 'open' ? (
                <div>
                  <div style={{ color: '#238636', marginBottom: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    {t('git.mr.ready_merge')}
                  </div>
                  <button 
                    onClick={handleMerge}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {t('git.mr.merge')}
                  </button>
                  <button 
                    onClick={handleReject}
                    style={{ width: '100%', marginTop: '8px', padding: '8px', backgroundColor: '#cf222e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {t('git.mr.reject')}
                  </button>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
                    {t('git.mr.approve_hint')}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {t('git.mr.status_is')} {mr.status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergeRequestDetail;
