import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from './AppContext';
import { GitBranch, GitPullRequest, GitMerge, Check, X, AlertCircle } from './Icons';

const MergeRequestList = ({ repoId, onSelectMR, createMode }) => {
  const { t } = useApp();
  const [mrs, setMrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (createMode) setShowCreateModal(true);
  }, [createMode]);
  
  // New MR Form
  const [newMR, setNewMR] = useState({
    title: '',
    description: '',
    sourceBranch: '',
    targetBranch: 'main'
  });
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (repoId) {
      fetchMRs();
      fetchBranches();
    }
  }, [repoId]);

  // Refresh MRs periodically
  useEffect(() => {
    if (repoId) {
      const interval = setInterval(fetchMRs, 5000);
      return () => clearInterval(interval);
    }
  }, [repoId]);

  const fetchMRs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/repos/${repoId}/merge-requests`);
      setMrs(res.data);
    } catch (err) {
      console.error('Failed to fetch MRs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/repos/${repoId}/branches`);
      const data = res.data;
      setBranches(data);
      if (data.length > 0) {
        // Prefer 'dev' or 'feature' branch if available as default
        const branchNames = data.map(b => (typeof b === 'string' ? b : b.name));
        const preferredBranch = branchNames.find(b => b !== 'main' && b !== 'master') || branchNames[0];
        setNewMR(prev => ({ ...prev, sourceBranch: preferredBranch }));
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleCreateMR = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:3001/api/repos/${repoId}/merge-requests`, newMR);
      setShowCreateModal(false);
      fetchMRs();
      // Optionally open the new MR immediately
      // onSelectMR(res.data);
    } catch (err) {
      alert(t('git.mr.create_failed'));
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'merged': return '#8957e5'; // Purple
      case 'closed': return '#cf222e'; // Red
      case 'conflict': return '#d29922'; // Orange/Yellow
      case 'open': return '#238636'; // Green
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'merged': return <GitMerge size={16} />;
      case 'closed': return <X size={16} />;
      case 'conflict': return <AlertCircle size={16} />;
      case 'open': return <GitPullRequest size={16} />;
      default: return <GitPullRequest size={16} />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitPullRequest size={20} />
          {t('git.merge_requests')}
        </h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: '#238636',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {t('git.mr.new')}
        </button>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '14px' }}>
          <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <GitPullRequest size={16} /> {mrs.filter(m => m.status === 'open' || m.status === 'conflict').length} {t('git.mr.open')}
          </span>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={16} /> {mrs.filter(m => m.status === 'merged').length} {t('git.mr.closed')}
          </span>
        </div>
        
        {mrs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('git.mr.no_mrs')}
          </div>
        ) : (
          <div>
            {mrs.map(mr => (
              <div 
                key={mr.id}
                onClick={() => onSelectMR(mr)}
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
              >
                <div style={{ color: getStatusColor(mr.status), paddingTop: '2px' }}>
                  {getStatusIcon(mr.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {mr.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    #{mr.id} {t('git.mr.opened_by')} {mr.author.name} • {mr.sourceBranch} {t('git.mr.into')} {mr.targetBranch} • {new Date(mr.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                   {mr.status === 'conflict' && (
                     <span style={{ 
                       backgroundColor: '#d29922', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600'
                     }}>
                       {t('git.mr.conflict')}
                     </span>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create MR Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', width: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0 }}>{t('git.mr.new')}</h3>
            <form onSubmit={handleCreateMR}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('git.mr.title')}</label>
                <input 
                  type="text" 
                  value={newMR.title} 
                  onChange={e => setNewMR({...newMR, title: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('git.mr.desc')}</label>
                <textarea 
                  value={newMR.description} 
                  onChange={e => setNewMR({...newMR, description: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('git.mr.source')}</label>
                  <select 
                    value={newMR.sourceBranch} 
                    onChange={e => setNewMR({...newMR, sourceBranch: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  >
                    {branches.map(b => {
                        const name = typeof b === 'string' ? b : b.name;
                        return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('git.mr.target')}</label>
                  <select 
                    value={newMR.targetBranch} 
                    onChange={e => setNewMR({...newMR, targetBranch: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    disabled
                  >
                    <option value="main">main</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {t('files.cancel')}
                </button>
                <button 
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {t('files.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeRequestList;
