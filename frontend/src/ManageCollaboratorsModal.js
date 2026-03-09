import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import axios from 'axios';
import { X, Plus, Trash2 } from './Icons';

const ManageCollaboratorsModal = ({ isOpen, onClose, evalSet, onUpdate }) => {
    const { t, currentRepoId, user, userRole } = useApp();
    const [members, setMembers] = useState([]);
    const [newCollaboratorId, setNewCollaboratorId] = useState('');
    const [newOwnerId, setNewOwnerId] = useState('');

    useEffect(() => {
        if (isOpen && currentRepoId) {
            const fetchMembers = async () => {
                try {
                    const res = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/members`);
                    setMembers(res.data);
                } catch (error) {
                    console.error('Failed to fetch members', error);
                }
            };
            fetchMembers();
        }
    }, [isOpen, currentRepoId]);

    const handleTransferOwnership = async () => {
        if (!newOwnerId || !evalSet) return;
        if (!window.confirm(t('branch.transfer_confirm'))) return;

        try {
            await axios.put(`http://localhost:3001/api/eval-sets/${evalSet.id}/permissions`, {
                owner: newOwnerId,
                collaborators: evalSet.collaborators || []
            });
            
            onUpdate({ ...evalSet, owner: newOwnerId });
            setNewOwnerId('');
            onClose(); // Close on ownership transfer as the user might lose access or it's a major change
        } catch (error) {
            console.error('Failed to transfer ownership', error);
            alert(t('settings.failed'));
        }
    };

    const handleAddCollaborator = async () => {
        if (!newCollaboratorId || !evalSet) return;
        try {
            const currentCollabs = evalSet.collaborators || [];
            if (currentCollabs.includes(newCollaboratorId)) return;

            const newCollabs = [...currentCollabs, newCollaboratorId];
            await axios.put(`http://localhost:3001/api/eval-sets/${evalSet.id}/permissions`, {
                owner: evalSet.owner,
                collaborators: newCollabs
            });
            
            onUpdate({ ...evalSet, collaborators: newCollabs });
            setNewCollaboratorId('');
        } catch (error) {
            console.error('Failed to add collaborator', error);
            alert(t('settings.failed'));
        }
    };

    const handleRemoveCollaborator = async (idToRemove) => {
        if (!evalSet) return;
        try {
            const currentCollabs = evalSet.collaborators || [];
            const newCollabs = currentCollabs.filter(id => id !== idToRemove);

            await axios.put(`http://localhost:3001/api/eval-sets/${evalSet.id}/permissions`, {
                owner: evalSet.owner,
                collaborators: newCollabs
            });
            
            onUpdate({ ...evalSet, collaborators: newCollabs });
        } catch (error) {
            console.error('Failed to remove collaborator', error);
            alert(t('settings.failed'));
        }
    };

    if (!isOpen || !evalSet) return null;

    const ownerMember = members.find(m => m.userId === evalSet.owner);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(2px)'
        }} onClick={onClose}>
            <div style={{
                width: '500px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px var(--shadow-color)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                        {t('eval.modal.manage_permissions')}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>
                
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Owner */}
                    <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-primary)' }}>{t('eval.role.owner')}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                    {ownerMember?.name?.charAt(0) || '?'}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {ownerMember?.name || evalSet.owner}
                                </span>
                            </div>
                        </div>

                        {/* Transfer Ownership */}
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                            <select 
                                value={newOwnerId}
                                onChange={(e) => setNewOwnerId(e.target.value)}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">{t('branch.select_new_owner')}</option>
                                {members
                                    .filter(m => m.userId !== evalSet.owner && m.role !== 'super_admin')
                                    .map(m => (
                                    <option key={m.userId} value={m.userId}>{m.name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleTransferOwnership}
                                disabled={!newOwnerId}
                                style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: !newOwnerId ? 0.5 : 1 }}
                            >
                                {t('branch.transfer')}
                            </button>
                        </div>
                    </div>

                    {/* Collaborators */}
                    <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-primary)' }}>{t('eval.role.editors')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                             {(evalSet.collaborators || []).map(collabId => {
                                const member = members.find(m => m.userId === collabId);
                                const canRemove = userRole === 'admin' || userRole === 'super_admin' || user.userId === evalSet.owner;
                                
                                return (
                                    <div key={collabId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                {member?.name?.charAt(0) || '?'}
                                            </div>
                                            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{member?.name || collabId}</span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '1px 4px', borderRadius: '4px' }}>{t('branch.role.collaborator')}</span>
                                        </div>
                                        {canRemove && (
                                            <button 
                                                onClick={() => handleRemoveCollaborator(collabId)}
                                                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                title={t('branch.remove')}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {(evalSet.collaborators || []).length === 0 && (
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{t('eval.modal.no_editors')}</div>
                            )}
                        </div>

                        {/* Add Collaborator */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <select 
                                value={newCollaboratorId}
                                onChange={(e) => setNewCollaboratorId(e.target.value)}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">{t('eval.modal.add_editor')}</option>
                                {members
                                    .filter(m => m.userId !== evalSet.owner && !(evalSet.collaborators || []).includes(m.userId))
                                    .map(m => (
                                    <option key={m.userId} value={m.userId}>{m.name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleAddCollaborator}
                                disabled={!newCollaboratorId}
                                style={{ padding: '8px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: !newCollaboratorId ? 0.5 : 1 }}
                            >
                                {t('branch.add')}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={onClose}
                        style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                        {t('layout.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCollaboratorsModal;