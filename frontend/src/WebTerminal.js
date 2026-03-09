import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Maximize, Minimize, Sidebar, Layout } from './Icons';
import { useApp } from './AppContext';

const WebTerminal = ({ files, currentBranch, onClose, onOpenFile, position, onPositionChange, height, width, isCopilotOpen }) => {
  const { t, currentRepoId } = useApp();
  const [history, setHistory] = useState([
    { type: 'output', content: t('terminal.welcome_msg') },
    { type: 'output', content: `${t('terminal.current_branch')} ${currentBranch}` },
    { type: 'output', content: t('terminal.help_hint') }
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    }
  };

  const getFileByPath = (path, fileList) => {
    // Simplify: Assume flat list for now or just search by name for this mock
    // Real implementation would parse path
    // Let's implement basic recursive find
    const parts = path.split('/').filter(p => p);
    // If path is empty (root), return null as file but maybe directory?
    if (parts.length === 0) return null;

    const findRecursive = (nodes, name) => {
      for (const node of nodes) {
        if (node.name === name) return node;
        if (node.children) {
          const found = findRecursive(node.children, name);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findRecursive(fileList, parts[parts.length - 1]);
  };

  const executeCommand = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Preserve the original command for history
    const historyEntry = { type: 'input', content: `${currentPath} $ ${trimmed}` };
    // Optimistically update history with input
    setHistory(prev => [...prev, historyEntry]);

    // Split considering flags
    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    // Local Interactive Commands
    if (command === 'clear') {
        setHistory([]);
        return;
    }

    if (['vi', 'vim', 'nano'].includes(command)) {
        if (args.length === 0) {
          setHistory(prev => [...prev, { type: 'error', content: t('terminal.usage_editor').replace('{cmd}', command) }]);
        } else {
          if (currentBranch === 'main' || currentBranch === 'master') {
             setHistory(prev => [...prev, { type: 'error', content: t('terminal.read_only_error') }]);
          } else {
             const fileName = args[0];
             // Still use local file list for editor opening to ensure we have the object reference
             const file = getFileByPath(fileName, files);
             if (file && file.type === 'file') {
               setHistory(prev => [...prev, { type: 'output', content: t('terminal.opening_editor') + fileName }]);
               onOpenFile(file);
             } else {
               setHistory(prev => [...prev, { type: 'error', content: t('terminal.file_not_found') + fileName }]);
             }
          }
        }
        return;
    }

    if (command === 'help') {
        setHistory(prev => [...prev, { type: 'output', content: t('terminal.available_commands') }]);
        return;
    }

    // Remote Commands (ls, cat, find, grep, etc.)
    try {
        const res = await axios.post('http://localhost:3001/api/semantic/terminal', {
            command: trimmed,
            repository: currentRepoId,
            branch: currentBranch,
            sessionId: `session-${currentRepoId}`
        });
        
        if (res.data.output) {
             // Handle grep empty result gracefully
             setHistory(prev => [...prev, { type: 'output', content: res.data.output }]);
        } else if (res.data.output === '') {
             // No output is fine for some commands
        }
        
        if (res.data.cwd) {
            setCurrentPath(res.data.cwd);
        }
    } catch (e) {
        setHistory(prev => [...prev, { type: 'error', content: e.response?.data?.output || e.message }]);
    }
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      backgroundColor: 'var(--terminal-bg)',
      color: 'var(--terminal-text)',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      display: 'flex',
      flexDirection: 'column',
      borderTop: position === 'bottom' ? '1px solid var(--border-color)' : 'none',
      borderLeft: position === 'right' ? '1px solid var(--border-color)' : 'none',
      boxShadow: '0 -4px 6px -1px var(--shadow-color)'
    }}>
      <div style={{
        padding: '8px 16px',
        backgroundColor: 'var(--terminal-header-bg)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '12px',
        textTransform: 'uppercase'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--terminal-text)' }}>{t('terminal.title')} - {currentBranch}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Docking Controls */}
            {!isCopilotOpen && (
              <button 
                onClick={() => onPositionChange(position === 'bottom' ? 'right' : 'bottom')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--terminal-text)',
                  cursor: 'pointer',
                  padding: '4px',
                  opacity: 0.7
                }}
                title={position === 'bottom' ? t('terminal.dock_right') : t('terminal.dock_bottom')}
              >
                {position === 'bottom' ? <Sidebar size={14} style={{ transform: 'rotate(180deg)' }} /> : <Layout size={14} style={{ transform: 'rotate(180deg)' }} />}
              </button>
            )}
            {!isCopilotOpen && <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-color)' }}></div>}
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--terminal-text)',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={14} />
            </button>
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }} onClick={() => inputRef.current?.focus()}>
        {history.map((entry, i) => (
          <div key={i} style={{ 
            marginBottom: '4px', 
            color: entry.type === 'error' ? '#ef4444' : entry.type === 'input' ? 'var(--terminal-text)' : 'var(--terminal-dim)',
            whiteSpace: 'pre-wrap'
          }}>
            {entry.content}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center' }} ref={bottomRef}>
          <span style={{ color: '#22c55e', marginRight: '8px' }}>{currentPath} $</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--terminal-text)',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              outline: 'none'
            }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default WebTerminal;