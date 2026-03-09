import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useApp } from './AppContext';
import { Save, GitBranch, GitCommit, Database, Cpu, Lock, Sliders, CheckCircle, Shield, User, Eye, Edit3, GitPullRequest, Trash2, Plus } from './Icons';
import MergeRequestList from './MergeRequestList';
import MergeRequestDetail from './MergeRequestDetail';

const ManagementCenter = () => {
  const { currentRepoId, repositories, userRole, t, refreshRepositories } = useApp();
  const location = useLocation();
  const [gitConfig, setGitConfig] = useState({
    repoUrl: 'https://github.com/example/repo.git',
    branch: 'main',
    syncInterval: 30,
    authType: 'token',
    authToken: '****************'
  });

  const [dsConfig, setDsConfig] = useState({
      type: 'sqlite',
      host: 'localhost',
      port: '',
      username: '',
      password: '',
      database: 'e-commerce-analytics.db'
  });

  // Model Config State
  const [modelConfig, setModelConfig] = useState({
    name: '',
    provider: 'doubao',
    modelName: '',
    baseUrl: '',
    apiKey: ''
  });
  const [models, setModels] = useState([]);
  const [isAddingModel, setIsAddingModel] = useState(false);

  // New state for list of connected data sources
  const [dataSources, setDataSources] = useState([]);
  const [isAddingDs, setIsAddingDs] = useState(false);

  // MCP Service State
  const [mcpServers, setMcpServers] = useState([]);
  const [isAddingMcp, setIsAddingMcp] = useState(false);
  const [mcpConfig, setMcpConfig] = useState({ name: '', url: '' });

  const [activeTab, setActiveTab] = useState('git'); // 'git' or 'llm' or 'members' or 'data_sources' or 'mcp'
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMR, setSelectedMR] = useState(null);

  const currentRepo = repositories.find(r => r.id === currentRepoId);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location]);

  useEffect(() => {
    if (activeTab === 'members' && currentRepoId) {
      fetchMembers();
    }
    if (activeTab === 'data_sources') {
        // In real app, we would fetch list of DS for this repo
        // For now, if currentRepo has DS, we put it in the list
        if (currentRepo?.dataSource) {
            setDataSources([currentRepo.dataSource]);
        } else {
            setDataSources([]);
        }
        
        // Also fetch config for the form (optional if we want to prefill)
        fetchDsConfig();
        
        // Refresh repositories to get latest dataSource info
        if (refreshRepositories) refreshRepositories();
    }
    if (activeTab === 'models') {
      fetchModels();
    }
    if (activeTab === 'mcp') {
        // Fetch registered MCP servers (mock)
        // In a real app, this would come from an API
        setMcpServers([
            { id: 'local', name: 'Built-in MCP', url: 'Localhost', status: 'connected' },
            // ...fetched external servers
        ]);
    }
  }, [activeTab, currentRepoId, currentRepo?.dataSource]);

  const fetchModels = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/models');
      setModels(res.data);
    } catch (error) {
      console.error("Failed to fetch models", error);
    }
  };

  const fetchDsConfig = async () => {
      try {
          const res = await axios.get('http://localhost:3001/api/datasource/config');
          setDsConfig(res.data);
      } catch (error) {
          console.error("Failed to fetch DS config", error);
      }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/members`);
      // Filter out super_admin role from display
      setMembers(res.data.filter(m => m.role !== 'super_admin'));
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:3001/api/repos/${currentRepoId}/members/${userId}`, {
        role: newRole
      });
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleGitChange = (e) => {
    const { name, value } = e.target;
    setGitConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleDsChange = (e) => {
      const { name, value } = e.target;
      setDsConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleModelChange = (e) => {
    const { name, value } = e.target;
    setModelConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleMcpChange = (e) => {
      const { name, value } = e.target;
      setMcpConfig(prev => ({ ...prev, [name]: value }));
  };

  const handlePull = async () => {
    try {
      const res = await axios.post(`http://localhost:3001/api/repos/${currentRepoId}/pull`, {
        branch: gitConfig.branch
      });
      alert(res.data.message);
    } catch (e) {
      console.error(e);
      alert('Failed to pull from master');
    }
  };

  const handleRemoveDataSource = async (dsType) => {
      if (window.confirm(t('management.datasource.confirm_remove'))) {
          // Mock removal
          // In real app, call API to remove association
          alert(t('management.datasource.remove_success') || 'Data source removed');
          // Update local state
          setDataSources([]);
          // Trigger refresh
          if (refreshRepositories) refreshRepositories();
      }
  };

  const handleRemoveModel = async (id) => {
    if (window.confirm(t('management.models.confirm_remove') || 'Are you sure you want to remove this model?')) {
      try {
        await axios.delete(`http://localhost:3001/api/models/${id}`);
        fetchModels();
        alert(t('management.models.remove_success') || 'Model removed');
      } catch (e) {
        console.error(e);
        alert('Failed to remove model');
      }
    }
  };

  const handleRemoveMcp = (id) => {
      if (id === 'local') {
          alert('Cannot remove built-in MCP server');
          return;
      }
      if (window.confirm('Are you sure you want to remove this MCP server?')) {
          setMcpServers(prev => prev.filter(s => s.id !== id));
          alert('MCP server removed');
      }
  };

  const handleEditModel = (model) => {
      setModelConfig(model);
      setIsAddingModel(true);
  };

  const handleSave = async () => {
    if (activeTab === 'data_sources') {
        try {
            await axios.post('http://localhost:3001/api/datasource/config', dsConfig);
            alert(t('management.save_success'));
            setIsAddingDs(false);
            if (refreshRepositories) refreshRepositories();
        } catch (e) {
            console.error(e);
            alert(t('management.save_failed'));
        }
    } else if (activeTab === 'models') {
      try {
        if (modelConfig.id) {
            await axios.put(`http://localhost:3001/api/models/${modelConfig.id}`, modelConfig);
        } else {
            await axios.post('http://localhost:3001/api/models', modelConfig);
        }
        alert(t('management.save_success'));
        setIsAddingModel(false);
        fetchModels();
        setModelConfig({ name: '', provider: 'doubao', modelName: '', baseUrl: '', apiKey: '' });
      } catch (e) {
        console.error(e);
        alert(t('management.save_failed'));
      }
    } else if (activeTab === 'mcp') {
        if (!mcpConfig.name || !mcpConfig.url) return;
        try {
            await axios.post('http://localhost:3001/api/mcp/register', mcpConfig);
            setMcpServers(prev => [...prev, { ...mcpConfig, id: Date.now().toString(), status: 'connected' }]);
            setIsAddingMcp(false);
            setMcpConfig({ name: '', url: '' });
            alert(t('mcp.register_success'));
        } catch (e) {
            console.error(e);
            alert('Failed to register MCP server');
        }
    } else {
        // Mock save for others
        alert(t('management.save_success'));
    }
  };

  const canManageDataSource = userRole === 'admin' || userRole === 'super_admin';
  const canManageModels = userRole === 'admin' || userRole === 'super_admin';
  const canManageMcp = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
        {t('management.title')}
      </h1>

      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Sidebar Navigation */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('git')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'git' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'git' ? 'var(--primary-color)' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <GitBranch size={18} />
            {t('management.tab.git')}
          </button>
          <button
            onClick={() => { setActiveTab('merge_requests'); setSelectedMR(null); }}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'merge_requests' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'merge_requests' ? 'var(--primary-color)' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <GitPullRequest size={18} />
            {t('git.merge_requests')}
          </button>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'members' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'members' ? 'var(--primary-color)' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <Shield size={18} />
            {t('management.tab.members')}
          </button>
          <button
            onClick={() => setActiveTab('data_sources')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'data_sources' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'data_sources' ? 'var(--primary-color)' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <Database size={18} />
            {t('management.tab.datasource')}
          </button>
          <button
            onClick={() => setActiveTab('models')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'models' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'models' ? 'var(--primary-color)' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <Cpu size={18} />
            {t('management.tab.models') || 'Model Access'}
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: activeTab === 'mcp' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'mcp' ? 'var(--primary-color)' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <Cpu size={18} />
            {t('management.tab.mcp') || 'MCP Services'}
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {activeTab === 'git' && (
            <div style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '12px', 
              padding: '24px',
              boxShadow: '0 4px 6px -1px var(--shadow-color)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitBranch size={20} color="var(--primary-color)" /> {t('management.git.title')}
              </h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {t('management.git.url')}
                  </label>
                  <input
                    type="text"
                    name="repoUrl"
                    value={gitConfig.repoUrl}
                    onChange={handleGitChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.git.branch')}
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={gitConfig.branch}
                      onChange={handleGitChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.git.sync_interval')}
                    </label>
                    <input
                      type="number"
                      name="syncInterval"
                      value={gitConfig.syncInterval}
                      onChange={handleGitChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {t('management.git.auth_method')}
                  </label>
                  <select
                    name="authType"
                    value={gitConfig.authType}
                    onChange={handleGitChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="token">{t('management.git.auth.token')}</option>
                    <option value="ssh">{t('management.git.auth.ssh')}</option>
                    <option value="none">{t('management.git.auth.none')}</option>
                  </select>
                </div>

                {gitConfig.authType !== 'none' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {gitConfig.authType === 'token' ? t('management.git.access_token') : t('management.git.private_key')}
                    </label>
                    <div style={{ position: 'relative' }}>
                       <input
                        type="password"
                        name="authToken"
                        value={gitConfig.authToken}
                        onChange={handleGitChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          paddingRight: '36px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>{t('git.mr.actions')}</h3>
                <button
                  onClick={handlePull}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}
                >
                  <GitPullRequest size={16} style={{ transform: 'rotate(180deg)' }} />
                  {t('git.pull')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'merge_requests' && (
             <div style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              minHeight: '400px'
            }}>
              {selectedMR ? (
                <MergeRequestDetail 
                  repoId={currentRepoId} 
                  mrId={selectedMR.id} 
                  onBack={() => setSelectedMR(null)}
                />
              ) : (
                <MergeRequestList 
                  repoId={currentRepoId} 
                  onSelectMR={setSelectedMR} 
                  createMode={new URLSearchParams(location.search).get('create') === 'true'}
                />
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '12px', 
              padding: '24px',
              boxShadow: '0 4px 6px -1px var(--shadow-color)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} color="var(--primary-color)" /> {t('management.members.title')}
              </h2>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                {t('management.members.desc').replace('{repoName}', currentRepo?.name)}
              </p>
              
              <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('management.members.user')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('management.members.role')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('management.members.permissions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.userId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img 
                              src={member.avatar} 
                              alt={member.name} 
                              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                            />
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                            disabled={userRole !== 'admin'}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              outline: 'none',
                              cursor: userRole === 'admin' ? 'pointer' : 'not-allowed'
                            }}
                          >
                            <option value="admin">{t('management.members.role.admin')}</option>
                            <option value="developer">{t('management.members.role.developer')}</option>
                            <option value="visitor">{t('management.members.role.visitor')}</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {member.role === 'admin' && (
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={10} /> {t('management.members.perm.full')}
                              </span>
                            )}
                            {(member.role === 'admin' || member.role === 'developer') && (
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Edit3 size={10} /> {t('management.members.perm.edit')}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Eye size={10} /> {t('management.members.perm.view')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && !loadingMembers && (
                       <tr>
                         <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                           {t('management.members.no_members')}
                         </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'data_sources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Connected Data Sources List */}
              {!isAddingDs && (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Database size={20} color="var(--primary-color)" /> {t('management.datasource.title') || 'Data Sources'}
                    </h2>
                    {canManageDataSource && (
                        <button
                            onClick={() => setIsAddingDs(true)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> {t('management.datasource.add') || 'Add New'}
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dataSources.length > 0 ? (
                        dataSources.map((ds, index) => (
                            <div key={index} style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '8px', 
                                padding: '16px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--text-primary)',
                                    fontSize: '18px'
                                    }}>
                                        {ds.type === 'sqlite' ? '🔋' : ds.type === 'hive' ? '🐘' : ds.type === 'mysql' ? '🐬' : '🐘'}
                                    </div>
                                    <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {ds.type.toUpperCase()} - {ds.database}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{ds.host}:{ds.port || 'default'}</span>
                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }}></span>
                                        <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle size={10} /> Connected
                                        </span>
                                    </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        style={{ 
                                            padding: '6px 12px', 
                                            fontSize: '12px', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            setDsConfig(ds);
                                            setIsAddingDs(true);
                                        }}
                                    >
                                        {t('common.edit') || 'Edit'}
                                    </button>
                                    {canManageDataSource && (
                                        <button 
                                            style={{ 
                                                padding: '6px', 
                                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => handleRemoveDataSource(ds.type)}
                                            title="Remove connection"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            padding: '32px', 
                            textAlign: 'center', 
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px dashed var(--border-color)'
                        }}>
                            {t('management.datasource.empty') || 'No data sources connected yet.'}
                        </div>
                    )}
                </div>
              </div>
              )}

              {/* Add/Edit Config Form */}
              {isAddingDs && (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={20} color="var(--primary-color)" /> {t('management.datasource.config_title') || 'Data Source Configuration'}
                    </h2>
                    <button 
                        onClick={() => setIsAddingDs(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                </div>
                
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.datasource.type')}
                    </label>
                    <select
                      name="type"
                      value={dsConfig.type}
                      onChange={handleDsChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="sqlite">SQLite (In-Memory)</option>
                      <option value="hive">Apache Hive</option>
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {t('management.datasource.host')}
                      </label>
                      <input
                        type="text"
                        name="host"
                        value={dsConfig.host}
                        onChange={handleDsChange}
                        placeholder={t('management.datasource.placeholder.host')}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {t('management.datasource.port')}
                      </label>
                      <input
                        type="text"
                        name="port"
                        value={dsConfig.port}
                        onChange={handleDsChange}
                        placeholder={t('management.datasource.placeholder.port')}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.datasource.database')}
                    </label>
                    <input
                      type="text"
                      name="database"
                      value={dsConfig.database}
                      onChange={handleDsChange}
                      placeholder={t('management.datasource.placeholder.db')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {t('management.datasource.username')}
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={dsConfig.username}
                        onChange={handleDsChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {t('management.datasource.password')}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={dsConfig.password}
                        onChange={handleDsChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: 0 }}>
                          {t('management.datasource.note')}
                      </p>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {activeTab === 'models' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Connected Models List */}
              {!isAddingModel && (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Cpu size={20} color="var(--primary-color)" /> {t('management.models.title')}
                    </h2>
                    {canManageModels && (
                        <button
                            onClick={() => {
                                setModelConfig({ name: '', provider: 'doubao', modelName: '', baseUrl: '', apiKey: '' });
                                setIsAddingModel(true);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> {t('management.models.add')}
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {models.length > 0 ? (
                        models.map((model, index) => (
                            <div key={index} style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '8px', 
                                padding: '16px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--text-primary)',
                                    fontSize: '18px'
                                    }}>
                                        🤖
                                    </div>
                                    <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {model.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ textTransform: 'uppercase' }}>{model.provider}</span>
                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }}></span>
                                        <span>{model.modelName}</span>
                                    </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        style={{ 
                                            padding: '6px 12px', 
                                            fontSize: '12px', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={() => handleEditModel(model)}
                                    >
                                        <Edit3 size={14} />
                                        {t('common.edit')}
                                    </button>
                                    {canManageModels && (
                                        <button 
                                            style={{ 
                                                padding: '6px', 
                                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => handleRemoveModel(model.id)}
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            padding: '32px', 
                            textAlign: 'center', 
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px dashed var(--border-color)'
                        }}>
                            {t('management.models.empty')}
                        </div>
                    )}
                </div>
              </div>
              )}

              {/* Add/Edit Model Form */}
              {isAddingModel && (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={20} color="var(--primary-color)" /> {t('management.models.config_title')}
                    </h2>
                    <button 
                        onClick={() => setIsAddingModel(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                </div>
                
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.models.name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={modelConfig.name}
                      onChange={handleModelChange}
                      placeholder="e.g. My GPT-4"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.llm.provider')}
                    </label>
                    <select
                      name="provider"
                      value={modelConfig.provider}
                      onChange={handleModelChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="doubao">Doubao (Ark)</option>
                      <option value="openai">OpenAI</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="ollama">Ollama (Local)</option>
                      <option value="vllm">vLLM (Self-hosted)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.llm.model_name')}
                    </label>
                    <input
                      type="text"
                      name="modelName"
                      value={modelConfig.modelName}
                      onChange={handleModelChange}
                      placeholder="e.g. gpt-4o, ep-2025..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.llm.base_url')}
                    </label>
                    <input
                      type="text"
                      name="baseUrl"
                      value={modelConfig.baseUrl}
                      onChange={handleModelChange}
                      placeholder="https://api.openai.com/v1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('management.llm.api_key')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="password"
                        name="apiKey"
                        value={modelConfig.apiKey}
                        onChange={handleModelChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                      <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button
                        onClick={() => setIsAddingModel(false)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={18} />
                        {t('common.save')}
                    </button>
                </div>
              </div>
              )}
            </div>
          )}

          {activeTab === 'mcp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {!isAddingMcp && (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Cpu size={20} color="var(--primary-color)" /> {t('management.mcp.title')}
                    </h2>
                    {canManageMcp && (
                        <button
                            onClick={() => {
                                setMcpConfig({ name: '', url: '' });
                                setIsAddingMcp(true);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> {t('management.mcp.add')}
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {mcpServers.length > 0 ? (
                        mcpServers.map((server, index) => (
                            <div key={index} style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '8px', 
                                padding: '16px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'var(--text-primary)',
                                    fontSize: '18px'
                                    }}>
                                        🔌
                                    </div>
                                    <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {server.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ textTransform: 'uppercase' }}>{server.status || 'unknown'}</span>
                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }}></span>
                                        <span>{server.url}</span>
                                    </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {canManageMcp && server.id !== 'local' && (
                                        <button 
                                            style={{ 
                                                padding: '6px', 
                                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => handleRemoveMcp(server.id)}
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            padding: '32px', 
                            textAlign: 'center', 
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px dashed var(--border-color)'
                        }}>
                            {t('mcp.no_servers')}
                        </div>
                    )}
                </div>
              </div>
              )}

              {isAddingMcp && (
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={20} color="var(--primary-color)" /> {t('management.mcp.config_title')}
                    </h2>
                    <button 
                        onClick={() => setIsAddingMcp(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                </div>
                
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('mcp.server_name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={mcpConfig.name}
                      onChange={handleMcpChange}
                      placeholder="e.g. Weather Service"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {t('mcp.server_url')}
                    </label>
                    <input
                      type="text"
                      name="url"
                      value={mcpConfig.url}
                      onChange={handleMcpChange}
                      placeholder="https://mcp.example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button
                        onClick={() => setIsAddingMcp(false)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={18} />
                        {t('common.save')}
                    </button>
                </div>
              </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            {activeTab !== 'merge_requests' && activeTab !== 'data_sources' && activeTab !== 'models' && activeTab !== 'mcp' && (
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px var(--shadow-color)'
              }}
            >
              <Save size={18} /> {t('management.save')}
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementCenter;
