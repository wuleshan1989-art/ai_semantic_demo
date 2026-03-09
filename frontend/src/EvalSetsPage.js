import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Database, Clock, Layers, Edit2, X, User, Lock } from './Icons';
import { useApp } from './AppContext';
import ManageCollaboratorsModal from './ManageCollaboratorsModal';

const EditSetModal = ({ isOpen, onClose, initialData, onSave }) => {
    const { t } = useApp();
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [initialData, isOpen]);

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
                        {initialData ? t('eval.modal.title.edit') : t('eval.modal.title.create')}
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
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                            {t('eval.sets.col.name')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            {t('eval.sets.col.desc')}
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
                        onClick={() => onSave({ name, description })}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EvalSetsPage = () => {
  const { t, user, userRole } = useApp();
  const navigate = useNavigate();
  const [evalSets, setEvalSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSet, setEditingSet] = useState(null); // Set being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedSetForPermissions, setSelectedSetForPermissions] = useState(null);

  useEffect(() => {
    fetchEvalSets();
  }, []);

  const fetchEvalSets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3001/api/eval-sets');
      setEvalSets(res.data);
    } catch (error) {
      console.error('Failed to fetch eval sets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
      setEditingSet(null);
      setIsEditModalOpen(true);
  };

  const handleEdit = (set, e) => {
      e.stopPropagation();
      setEditingSet(set);
      setIsEditModalOpen(true);
  };

  const handlePermissions = (set, e) => {
      e.stopPropagation();
      setSelectedSetForPermissions(set);
      setIsPermissionsOpen(true);
  };

  const handleUpdateSetInList = (updatedSet) => {
      setEvalSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));
      // Also update selectedSetForPermissions if it's open
      if (selectedSetForPermissions && selectedSetForPermissions.id === updatedSet.id) {
          setSelectedSetForPermissions(updatedSet);
      }
  };

  const handleSaveSet = async (data) => {
      try {
          if (editingSet) {
              await axios.put(`http://localhost:3001/api/eval-sets/${editingSet.id}`, data);
          } else {
              // Create new set
              await axios.post('http://localhost:3001/api/eval-sets/import-traces', { 
                  traces: [], 
                  newSetName: data.name,
                  description: data.description 
              });
          }
          setIsEditModalOpen(false);
          fetchEvalSets();
      } catch (error) {
          console.error('Failed to save eval set', error);
          alert('Failed to save evaluation set');
      }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t('config.table.delete_confirm', { name: 'this set' }))) return;
    
    try {
        await axios.delete(`http://localhost:3001/api/eval-sets/${id}`);
        fetchEvalSets(); // Refresh list
    } catch (error) {
        console.error('Failed to delete eval set', error);
        alert('Failed to delete evaluation set');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ 
        height: '64px',
        padding: '0 24px', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="var(--primary-color)" />
            {t('eval.sets.title')}
          </h1>
        </div>
        
        <button 
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            onClick={handleCreate}
        >
            <Plus size={18} />
            {t('eval.sets.create')}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>{t('common.loading')}</div>
        ) : evalSets.length === 0 ? (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '400px',
                color: 'var(--text-secondary)',
                border: '2px dashed var(--border-color)',
                borderRadius: '16px',
                margin: '0 auto',
                maxWidth: '800px',
                backgroundColor: 'var(--bg-tertiary)'
            }}>
                <Database size={64} style={{ opacity: 0.3, marginBottom: '24px' }} />
                <p style={{ fontSize: '16px', fontWeight: '500' }}>{t('eval.sets.empty')}</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>{t('eval.set.empty_hint')}</p>
            </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {evalSets.map(set => {
                    const isSuperAdmin = user?.role === 'super_admin';
                    const isRepoAdmin = userRole === 'admin';
                    const isAdmin = isSuperAdmin || isRepoAdmin;
                    const isOwner = set.owner === user?.userId;
                    const isCollaborator = (set.collaborators || []).includes(user?.userId);
                    const canManage = isAdmin || isOwner;
                    const canView = canManage || isCollaborator;

                    return (
                        <div 
                            key={set.id}
                            onClick={() => {
                                if (canView) {
                                    navigate(`/evaluation/sets/${set.id}`);
                                }
                            }}
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                cursor: canView ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                boxShadow: '0 1px 3px var(--shadow-color)',
                                opacity: canView ? 1 : 0.7
                            }}
                            onMouseEnter={(e) => {
                                if (canView) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--shadow-color)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (canView) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px var(--shadow-color)';
                                }
                            }}
                        >
                            {!canView && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <Lock size={12} /> {t('layout.repo.no_access')}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: '600', fontSize: '18px', color: 'var(--text-primary)' }}>
                                    {set.name}
                                </div>
                                {canManage && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button 
                                            onClick={(e) => handlePermissions(set, e)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                transition: 'background 0.2s, color 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                                e.currentTarget.style.color = 'var(--primary-color)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }}
                                            title={t('eval.modal.manage_permissions')}
                                        >
                                            <User size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleEdit(set, e)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                transition: 'background 0.2s, color 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                                e.currentTarget.style.color = 'var(--primary-color)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }}
                                            title={t('common.edit')}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(set.id, e)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                transition: 'background 0.2s, color 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                e.currentTarget.style.color = '#ef4444';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }}
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {set.description || t('eval.set.no_desc')}
                            </div>
                            
                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>{t('eval.sets.col.count')}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                        <Layers size={14} />
                                        {set.traceCount}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>{t('eval.sets.col.created')}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                        <Clock size={14} />
                                        {new Date(set.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        {/* Modals */}
        <EditSetModal 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialData={editingSet}
            onSave={handleSaveSet}
        />
        <ManageCollaboratorsModal
            isOpen={isPermissionsOpen}
            onClose={() => setIsPermissionsOpen(false)}
            evalSet={selectedSetForPermissions}
            onUpdate={handleUpdateSetInList}
        />
      </div>
    </div>
  );
};

export default EvalSetsPage;
