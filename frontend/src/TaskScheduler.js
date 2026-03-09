import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from './AppContext';
import { Clock, Play, Plus, Trash, Edit3, Check, AlertCircle, Activity, Terminal } from './Icons';

const TaskScheduler = () => {
  const { t, tasks, fetchTasks } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    schedule: '0 0 * * *',
    command: '',
    enabled: true
  });

  // Mock Logs
  const [logs, setLogs] = useState({});

  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const handleSave = async () => {
    try {
        if (isEditing) {
            await axios.put(`http://localhost:3001/api/tasks/${selectedTaskId}`, formData);
            await fetchTasks();
        } else {
            const res = await axios.post('http://localhost:3001/api/tasks', formData);
            await fetchTasks();
            setSelectedTaskId(res.data.id);
        }
        setShowModal(false);
    } catch (e) {
        console.error("Failed to save task", e);
        alert("Failed to save task: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('scheduler.confirm_delete'))) return;
    try {
        await axios.delete(`http://localhost:3001/api/tasks/${id}`);
        await fetchTasks();
        if (selectedTaskId === id) {
            setSelectedTaskId(null);
        }
    } catch (e) {
        console.error("Failed to delete task", e);
    }
  };

  const handleRunNow = async (task) => {
    try {
        const res = await axios.post(`http://localhost:3001/api/tasks/${task.id}/run`);
        const { output, lastRun, status } = res.data;

        const newLog = {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          status: status,
          output: output
        };
        
        setLogs(prev => ({
          ...prev,
          [task.id]: [newLog, ...(prev[task.id] || [])]
        }));
        
        fetchTasks();
    } catch (e) {
        console.error("Failed to run task", e);
        const newLog = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            status: 'failed',
            output: e.message
        };
        setLogs(prev => ({
            ...prev,
            [task.id]: [newLog, ...(prev[task.id] || [])]
        }));
    }
  };

  const openModal = (task = null) => {
    if (task) {
      setIsEditing(true);
      setFormData({
        name: task.name,
        schedule: task.schedule,
        command: task.command,
        enabled: task.enabled
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        schedule: '0 0 * * *',
        command: '',
        enabled: true
      });
    }
    setShowModal(true);
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar: Task List */}
      <div style={{
        width: '300px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px', boxSizing: 'border-box' }}>
          <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <Clock size={20} color="var(--primary-color)" />
            {t('scheduler.title')}
          </h2>
          <button
            onClick={() => openModal()}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
            title={t('scheduler.add_task')}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: selectedTaskId === task.id ? 'var(--bg-tertiary)' : 'transparent',
                border: selectedTaskId === task.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>{task.name}</span>
                <span style={{ 
                  fontSize: '10px', 
                  padding: '2px 6px', 
                  borderRadius: '10px', 
                  backgroundColor: task.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: task.enabled ? '#22c55e' : '#ef4444'
                }}>
                  {task.enabled ? t('scheduler.status_active') : t('scheduler.status_paused')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Clock size={12} /> {task.schedule}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedTask ? (
          <>
            {/* Task Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ margin: '0 0 8px', fontSize: '20px', color: 'var(--text-primary)' }}>{selectedTask.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> {t('scheduler.schedule_label')} <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{selectedTask.schedule}</code>
                    </span>
                    <span>{t('scheduler.last_run')} {selectedTask.lastRun || t('scheduler.never')}</span>
                    <span>{t('scheduler.next_run')} {selectedTask.nextRun}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleRunNow(selectedTask)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Play size={16} fill="white" /> {t('scheduler.run_now')}
                  </button>
                  <button
                    onClick={() => openModal(selectedTask)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedTask.id)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid transparent',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={16} color="var(--text-secondary)" />
                {selectedTask.command}
              </div>
            </div>

            {/* Execution Logs */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>{t('scheduler.history')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(logs[selectedTask.id] || []).length > 0 ? (
                    logs[selectedTask.id].map(log => (
                        <div key={log.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                            <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {log.status === 'success' ? <Check size={16} color="#22c55e" /> : <AlertCircle size={16} color="#ef4444" />}
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{log.status === 'success' ? t('scheduler.success') : t('scheduler.failed')}</span>
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.timestamp}</span>
                            </div>
                            <div style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {log.output}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {t('scheduler.no_history')}
                    </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {t('scheduler.select_hint')}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(2px)'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            width: '500px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                {isEditing ? t('scheduler.edit_task') : t('scheduler.add_task')}
              </h3>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('scheduler.task_name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('scheduler.cron_schedule')}</label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="0 0 * * *"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
                />
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t('scheduler.cron_format')}</div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('scheduler.command')}</label>
                <textarea
                  value={formData.command}
                  onChange={e => setFormData({ ...formData, command: e.target.value })}
                  rows={3}
                  placeholder={t('scheduler.placeholder.command')}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="task-enabled"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                />
                <label htmlFor="task-enabled" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>{t('scheduler.enable_task')}</label>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--bg-tertiary)' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {t('scheduler.cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.name || !formData.command}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', opacity: (!formData.name || !formData.command) ? 0.5 : 1 }}
              >
                {t('scheduler.save_task')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskScheduler;
