import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Folder, FileText, Plus, Save, ChevronDown, ChevronRight, GitCommit, GitBranch, GitPullRequest, Sliders, Clock, Search, Activity, Settings, Layers, Terminal, Database, MessageCircle, X, Send, Paperclip, Mic, Square, Zap, CloudLightning, Edit2, Edit3, Maximize, Minimize, Cpu } from './Icons';
import Logo from './Logo';
import AirsIcon from './AirsIcon';
import { useApp } from './AppContext';
import ModelVisualEditor from './ModelVisualEditor';
import OntologyVisualEditor from './OntologyVisualEditor';
import QueryBuilderModal from './components/QueryBuilderModal';
import RAGConfigModal from './RAGConfigModal';
import ChunkViewer from './ChunkViewer';
import DocumentGraphView from './DocumentGraphView';
import WebTerminal from './WebTerminal';
import CodeEditor from './CodeEditor';
import useModels from './hooks/useModels';
import ModelManagementModal from './components/ModelManagementModal';

const FileManager = () => {
  const navigate = useNavigate();
  const { t, theme, currentRepoId, setCurrentRepoId, repositories, userRole, currentBranch, setCurrentBranch, user, skills, toggleSkill, updateSkillFiles, branches, refreshRepoData } = useApp();
  // const [repositories, setRepositories] = useState([]); // Moved to AppContext
  // const [currentRepoId, setCurrentRepoId] = useState(''); // Moved to AppContext
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState({}); // { [path]: boolean }
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'source' for MD files
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showRAGConfig, setShowRAGConfig] = useState(false);
  const [showChunkViewer, setShowChunkViewer] = useState(false);
  const [showDocumentGraph, setShowDocumentGraph] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  
  // Branch Management State (Moved from Layout)
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showBranchSettingsModal, setShowBranchSettingsModal] = useState(false);
  const [selectedBranchSettings, setSelectedBranchSettings] = useState(null);
  const [repoMembers, setRepoMembers] = useState([]);
  const [newCollaboratorId, setNewCollaboratorId] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');

  // Skill Modal State
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isSkillModalExpanded, setIsSkillModalExpanded] = useState(false);
  const [activeSkillFile, setActiveSkillFile] = useState(null);

  // Copilot State - Synced with ChatPage
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [showSessionList, setShowSessionList] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  
  // MCP Tools State
  const [mcpTools, setMcpTools] = useState([]);
  const [showMcpMenu, setShowMcpMenu] = useState(false);
  const [mcpSearch, setMcpSearch] = useState('');
  const [selectedMcpTool, setSelectedMcpTool] = useState(null);
  const [showMcpDetailModal, setShowMcpDetailModal] = useState(false);
  const [disabledTools, setDisabledTools] = useState([]); // Store IDs of disabled tools
  
  // Model Management State
  const [showModelModal, setShowModelModal] = useState(false);
  const { models, saveModel, removeModel } = useModels();
  
  const messagesEndRef = React.useRef(null);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await axios.post(`http://localhost:3001/api/repos/${currentRepoId}/branches`, {
        name: newBranchName,
        user
      });
      refreshRepoData(); // Refresh to get the new branch object properly
      setCurrentBranch(newBranchName);
      setShowNewBranchModal(false);
      setNewBranchName('');
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const handleOpenBranchSettings = async (branch) => {
      // Ensure we have the branch object
      const branchObj = typeof branch === 'string' ? branches.find(b => b.name === branch) : branch;
      if (!branchObj) return;
      
      try {
          const res = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/members`);
          setRepoMembers(res.data);
      } catch (e) {
          console.error("Failed to fetch members");
      }

      setSelectedBranchSettings(branchObj);
      setShowBranchSettingsModal(true);
      setShowBranchMenu(false);
  };

  const handleCreateMergeRequest = (branchName) => {
    // Navigate to Management Center -> Merge Requests with pre-filled parameters
    // We can use query parameters to pass the source branch
    navigate(`/management?tab=merge_requests&create=true&source=${encodeURIComponent(branchName)}&target=main`);
    setShowBranchMenu(false);
  };
  
  const handleAddCollaborator = async () => {
      if (!newCollaboratorId || !selectedBranchSettings) return;
      try {
          const currentCollabs = selectedBranchSettings.collaborators || [];
          if (currentCollabs.includes(newCollaboratorId)) return;

          await axios.put(`http://localhost:3001/api/repos/${currentRepoId}/branches/${selectedBranchSettings.name}/permissions`, {
              collaborators: [...currentCollabs, newCollaboratorId],
              user
          });
          
          await refreshRepoData();
          
          setSelectedBranchSettings(prev => ({
              ...prev,
              collaborators: [...(prev.collaborators || []), newCollaboratorId]
          }));
          setNewCollaboratorId('');
      } catch (error) {
          alert(t('settings.failed'));
      }
  };

  const handleRemoveCollaborator = async (userIdToRemove) => {
      if (!selectedBranchSettings) return;
      try {
          const currentCollabs = selectedBranchSettings.collaborators || [];
          const newCollabs = currentCollabs.filter(id => id !== userIdToRemove);

          await axios.put(`http://localhost:3001/api/repos/${currentRepoId}/branches/${selectedBranchSettings.name}/permissions`, {
              collaborators: newCollabs,
              user
          });
          
          await refreshRepoData();
          setSelectedBranchSettings(prev => ({ ...prev, collaborators: newCollabs }));
      } catch (error) {
          alert(t('settings.failed'));
      }
  };

  const handleTransferOwnership = async () => {
      if (!newOwnerId || !selectedBranchSettings) return;
      if (!window.confirm(t('branch.transfer_confirm'))) return;

      try {
          await axios.put(`http://localhost:3001/api/repos/${currentRepoId}/branches/${selectedBranchSettings.name}/permissions`, {
              owner: newOwnerId,
              user
          });
          
          await refreshRepoData();
          setShowBranchSettingsModal(false);
          setNewOwnerId('');
      } catch (error) {
          alert(t('settings.failed'));
      }
  };

  // --- Copilot API & Effects ---
  const [showCreateMRModal, setShowCreateMRModal] = useState(false);
  const [mrTitle, setMrTitle] = useState('');
  const [mrDescription, setMrDescription] = useState('');

  useEffect(() => {
    if (showCopilot) {
      fetchSessions();
      fetchMcpTools();
      fetchUserToolConfig();
    }
  }, [showCopilot]);

  const fetchUserToolConfig = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/mcp/user-config');
      setDisabledTools(res.data.disabledTools || []);
    } catch (e) {
      console.error('Failed to fetch user tool config', e);
    }
  };

  const toggleToolStatus = async (toolId) => {
    try {
      let newDisabledTools;
      if (disabledTools.includes(toolId)) {
        newDisabledTools = disabledTools.filter(id => id !== toolId);
      } else {
        newDisabledTools = [...disabledTools, toolId];
      }
      
      setDisabledTools(newDisabledTools);
      
      // Save to backend
      await axios.post('http://localhost:3001/api/mcp/user-config', {
        disabledTools: newDisabledTools
      });
    } catch (e) {
      console.error('Failed to update tool status', e);
      fetchUserToolConfig();
    }
  };

  const fetchMcpTools = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/mcp/tools');
      setMcpTools(res.data);
    } catch (e) {
      console.error('Failed to fetch MCP tools', e);
    }
  };

  useEffect(() => {
    if (currentSessionId) {
      fetchSessionDetails(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [copilotMessages]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/sessions');
      setSessions(res.data);
      if (!currentSessionId && res.data.length > 0) {
        setCurrentSessionId(res.data[0].id);
      } else if (res.data.length === 0) {
        createNewSession();
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
      // Fallback/Mock data for demo
      const mockSessions = [
        { id: 'mock-1', title: 'Code Analysis', lastMessage: 'Analyze this file...' },
        { id: 'mock-2', title: 'Refactoring', lastMessage: 'Refactor the sidebar...' }
      ];
      setSessions(mockSessions);
      if (!currentSessionId) setCurrentSessionId(mockSessions[0].id);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/sessions/${sessionId}`);
      // Ensure messages are compatible
      setCopilotMessages(res.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch session details', error);
      // Mock messages if API fails
      if (sessionId === 'mock-1') {
         setCopilotMessages([
             { text: 'Hello! How can I help you with your code today?', sender: 'agent', timestamp: Date.now(), steps: [{ type: 'thought', content: 'Agent Initialized' }] }
         ]);
      }
    }
  };

  const createNewSession = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/sessions');
      setSessions(prev => [res.data, ...prev]);
      setCurrentSessionId(res.data.id);
      setCopilotMessages([]);
      setShowSessionList(false);
    } catch (error) {
      console.error('Failed to create session', error);
      const newId = `mock-${Date.now()}`;
      const newSession = { id: newId, title: 'New Chat', lastMessage: '' };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);
      setCopilotMessages([]);
      setShowSessionList(false);
    }
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleCopilotSend = async () => {
    if ((!copilotInput.trim() && attachedFiles.length === 0) || copilotIsLoading || isRecording) return;

    let messageText = copilotInput;
    if (attachedFiles.length > 0) {
      messageText += `\n[Uploaded ${attachedFiles.length} files: ${attachedFiles.map(f => f.name).join(', ')}]`;
    }

    const userMsg = { text: messageText, sender: 'user', timestamp: Date.now(), attachedFiles: [...attachedFiles] };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput('');
    setAttachedFiles([]);
    setCopilotIsLoading(true);
    setExecutionStatus('thinking');
    stopGenerationRef.current = false;

    // Create a placeholder message for the agent
    const agentMsgId = Date.now();
    const initialAgentMsg = {
        id: agentMsgId,
        text: '',
        sender: 'agent',
        timestamp: Date.now(),
        steps: [],
        artifact: null,
        isStreaming: true
    };
    setCopilotMessages(prev => [...prev, initialAgentMsg]);

    try {
        const res = await axios.post('http://localhost:3001/api/agent/chat', {
            message: messageText,
            sessionId: currentSessionId,
            agent: selectedAgent,
            model: selectedModel,
            modelConfig: llmConfig
        });

        const fullResponse = res.data;
        
        // Simulate Steps Streaming
        if (fullResponse.steps && fullResponse.steps.length > 0) {
            for (const step of fullResponse.steps) {
                if (stopGenerationRef.current) break;
                
                setExecutionStatus(step.type === 'thought' ? 'Thinking...' : `Executing: ${step.content.slice(0, 20)}...`);
                await wait(800); // Simulate thinking time

                setCopilotMessages(prev => prev.map(msg => 
                    msg.id === agentMsgId 
                        ? { ...msg, steps: [...msg.steps, step] } 
                        : msg
                ));
            }
        }

        // Simulate Text Streaming
        if (!stopGenerationRef.current) {
            setExecutionStatus('Responding...');
            const text = fullResponse.reply || '';
            let currentText = '';
            // Chunk size for typing effect
            const chunkSize = 2; 
            
            for (let i = 0; i < text.length; i += chunkSize) {
                if (stopGenerationRef.current) break;
                currentText += text.slice(i, i + chunkSize);
                
                setCopilotMessages(prev => prev.map(msg => 
                    msg.id === agentMsgId ? { ...msg, text: currentText } : msg
                ));
                // Auto scroll is handled by useEffect on copilotMessages change
                await wait(10); // Typing speed
            }
        }

        // Show Artifact
        if (!stopGenerationRef.current && fullResponse.artifact) {
             setCopilotMessages(prev => prev.map(msg => 
                msg.id === agentMsgId ? { ...msg, artifact: fullResponse.artifact } : msg
             ));
        }

        fetchSessions(); // Refresh list for titles
    } catch (error) {
        console.error('Failed to send message', error);
        setCopilotMessages(prev => prev.map(msg => 
            msg.id === agentMsgId ? { ...msg, text: "Sorry, something went wrong.", isStreaming: false } : msg
        ));
    } finally {
        setCopilotIsLoading(false);
        setExecutionStatus('done');
        setCopilotMessages(prev => prev.map(msg => 
            msg.id === agentMsgId ? { ...msg, isStreaming: false } : msg
        ));
    }
  };

  const handleStopGeneration = () => {
      stopGenerationRef.current = true;
      setCopilotIsLoading(false);
      setExecutionStatus('interrupted');
  };
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [terminalPosition, setTerminalPosition] = useState('bottom'); // 'bottom' or 'right'
  const [terminalWidth, setTerminalWidth] = useState(600);
  
  // Copilot State
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [selectedModel, setSelectedModel] = useState('doubao-pro-1.5');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]); // Files attached to the chat
  
  // Load LLM Config
  const [llmConfig, setLlmConfig] = useState(null);
  useEffect(() => {
      const loadConfig = () => {
        const savedConfig = localStorage.getItem('llm_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            setLlmConfig(config);
            if (config.modelName && config.provider === 'doubao') {
                setSelectedModel(config.modelName);
            }
        }
      };
      loadConfig();
      window.addEventListener('storage', loadConfig);
      return () => window.removeEventListener('storage', loadConfig);
  }, []);
  const [showCapabilityMenu, setShowCapabilityMenu] = useState(false);
  const [copilotIsLoading, setCopilotIsLoading] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(''); // 'thinking', 'executing', 'responding', 'done'
  const stopGenerationRef = React.useRef(false);

  const quickCapabilities = [
    {
      id: 'sql_mining',
      label: t('chat.sql_mining'),
      icon: <Database size={14} />,
      prompt: t('chat.prompt.sql_mining'),
      description: t('chat.desc.sql_mining')
    },
    {
      id: 'doc_mining',
      label: t('chat.doc_mining'),
      icon: <FileText size={14} />,
      prompt: t('chat.prompt.doc_mining'),
      description: t('chat.desc.doc_mining')
    },
    {
      id: 'semantic_ingest',
      label: t('chat.semantic_ingest'),
      icon: <CloudLightning size={14} />,
      prompt: t('chat.prompt.semantic_ingest'),
      description: t('chat.desc.semantic_ingest')
    }
  ];

  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [lastCommit, setLastCommit] = useState({
    message: 'Initial commit',
    author: 'System',
    time: '2 hours ago'
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const currentBranchObj = branches.find(b => (typeof b === 'string' ? b === currentBranch : b.name === currentBranch));
  
  let canEdit = false;
  const currentRepo = repositories.find(r => r.id === currentRepoId);
  
  if (currentRepo?.permission !== 'read-only' && currentRepo?.permission !== 'no-access') {
      if (currentBranch === 'main') {
          canEdit = false; // Main branch is always strict read-only
      } else if (userRole === 'admin') {
          canEdit = true;
      } else if (userRole === 'developer') {
          // Must be owner or collaborator of the current branch
          if (currentBranchObj && typeof currentBranchObj === 'object') {
              if (currentBranchObj.owner === user?.userId) canEdit = true;
              else if (currentBranchObj.collaborators && currentBranchObj.collaborators.includes(user?.userId)) canEdit = true;
          } else {
              // Legacy support or if strictly developer on main (usually restricted but allowing for now if not explicit)
              // Actually requirement says: "如果你只是开发者没有分支所有或编辑权限，那么只能新建分支"
              // So defaults to false unless explicit match
              canEdit = false; 
          }
      }
  }

  useEffect(() => {
    // fetchRepositories();
  }, []);

  useEffect(() => {
    if (currentRepoId) {
      fetchFiles(currentRepoId);
      setSelectedFile(null);
      setViewMode('preview');
      setShowVisualEditor(false);
      setShowKnowledgeGraph(false);
      setShowRAGConfig(false);
      setShowChunkViewer(false);
      setShowDocumentGraph(false);
    }
  }, [currentRepoId, currentBranch]);

  /* 
  const fetchRepositories = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/repos');
      setRepositories(response.data);
      // Select first available repo
      const firstAvailable = response.data.find(r => r.permission !== 'no-access');
      if (firstAvailable) {
        setCurrentRepoId(firstAvailable.id);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }
  };
  */

  const fetchFiles = async (repoId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/repos/${repoId}/files`, { params: { branch: currentBranch } });
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setFiles([]);
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      setEditContent(file.content);
      setViewMode('preview');
    } else if (file.type === 'directory') {
      toggleDir(file.id);
    }
  };

  const toggleDir = (dirId) => {
    setExpandedDirs(prev => ({
      ...prev,
      [dirId]: !prev[dirId]
    }));
  };

  const handleCommitChanges = async () => {
    if (selectedFile) {
      try {
        await axios.put(`http://localhost:3001/api/files/${selectedFile.id}`, {
          content: editContent,
          repoId: currentRepoId,
          branch: currentBranch,
          user
        });
        
        // Optimistic update
        const updatedFiles = updateFileContent(files, selectedFile.id, editContent);
        setFiles(updatedFiles);
        setSelectedFile({ ...selectedFile, content: editContent });
        
        // Update mock commit history
        setLastCommit({
          message: commitMessage || `Update ${selectedFile.name}`,
          author: 'You',
          time: 'Just now'
        });
        
        setShowCommitModal(false);
        setCommitMessage('');
        
        alert(t('files.commit_success'));
      } catch (error) {
        console.error('Failed to save file:', error);
        alert(t('files.commit_failed'));
      }
    }
  };

  const updateFileContent = (fileList, fileId, newContent) => {
    return fileList.map(file => {
      if (file.id === fileId) {
        return { ...file, content: newContent };
      } else if (file.type === 'directory' && file.children) {
        return { ...file, children: updateFileContent(file.children, fileId, newContent) };
      }
      return file;
    });
  };

  const handleSaveRAGConfig = async ({ ragConfig, graphRagConfig }) => {
    if (selectedFile) {
      // In a real app, this would be an API call to update the file metadata
      // For mock purposes, we'll update the local state
      const updatedFile = { 
        ...selectedFile, 
        ragConfig, 
        graphRagConfig 
      };
      setSelectedFile(updatedFile);
      
      // Also update the file in the files list
      const updatedFiles = updateFileInList(files, selectedFile.id, { 
        ragConfig, 
        graphRagConfig 
      });
      setFiles(updatedFiles);

      setShowRAGConfig(false);
      alert(t('filemanager.rag.saved'));
    }
  };

  const updateFileInList = (fileList, fileId, updates) => {
    return fileList.map(file => {
      if (file.id === fileId) {
        return { ...file, ...updates };
      } else if (file.type === 'directory' && file.children) {
        return { ...file, children: updateFileInList(file.children, fileId, updates) };
      }
      return file;
    });
  };

  const handleCreateNewFile = async () => {
    if (newFileName) {
      try {
        await axios.post('http://localhost:3001/api/files', {
          name: newFileName,
          content: '',
          repoId: currentRepoId,
          branch: currentBranch,
          user
        });
        fetchFiles(currentRepoId);
        setShowNewFileModal(false);
        setNewFileName('');
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  const handleRename = async (newName) => {
    if (selectedFile && newName) {
      try {
        const res = await axios.put(`http://localhost:3001/api/files/${selectedFile.id}/rename`, {
          name: newName,
          repoId: currentRepoId,
          branch: currentBranch,
          user
        });
        
        if (res.data.success) {
           // Update local state
           const updatedFiles = updateFileName(files, selectedFile.id, newName);
           setFiles(updatedFiles);
           setSelectedFile(prev => ({ ...prev, name: newName }));
        }
      } catch (error) {
        console.error('Failed to rename file:', error);
        alert(t('filemanager.rename.failed'));
      }
    }
  };

  const updateFileName = (fileList, fileId, newName) => {
    return fileList.map(file => {
      if (file.id === fileId) {
        return { ...file, name: newName };
      } else if (file.type === 'directory' && file.children) {
        return { ...file, children: updateFileName(file.children, fileId, newName) };
      }
      return file;
    });
  };

  const getFilteredFiles = (nodes, query) => {
    if (!query) return nodes;
    
    return nodes.reduce((acc, node) => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          acc.push(node);
        }
      } else if (node.type === 'directory') {
        const filteredChildren = getFilteredFiles(node.children || [], query);
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: 'rgba(255, 255, 0, 0.4)', color: 'var(--text-primary)' }}>{part}</span>
      ) : (
        part
      )
    );
  };

  // Automatically expand directories when searching
  useEffect(() => {
    if (searchQuery) {
      const expandMatchingDirs = (nodes) => {
        nodes.forEach(node => {
          if (node.type === 'directory') {
             const hasMatchingChild = getFilteredFiles(node.children || [], searchQuery).length > 0;
             if (hasMatchingChild) {
               setExpandedDirs(prev => ({ ...prev, [node.id]: true }));
             }
             expandMatchingDirs(node.children || []);
          }
        });
      };
      expandMatchingDirs(files);
    }
  }, [searchQuery, files]);

  // Recursive file tree renderer
  const renderTree = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div 
          onClick={() => handleFileClick(node)}
          style={{
            padding: `6px 12px 6px ${12 + level * 20}px`,
            cursor: 'pointer',
            backgroundColor: selectedFile?.id === node.id ? 'var(--hover-bg)' : 'transparent',
            color: selectedFile?.id === node.id ? 'var(--primary-color)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            borderLeft: selectedFile?.id === node.id ? '2px solid var(--primary-color)' : '2px solid transparent'
          }}
        >
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            {node.type === 'directory' && (
              expandedDirs[node.id] || searchQuery ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
            {node.type === 'directory' ? <Folder size={16} color="var(--primary-color)" /> : <FileText size={16} />}
          </span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {highlightText(node.name, searchQuery)}
          </span>
          {currentBranch === 'main' && node.type === 'file' && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '10px', 
                color: 'var(--text-secondary)', 
                marginLeft: '8px', 
                opacity: 0.7,
                backgroundColor: 'var(--bg-tertiary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}
              title={`Last synced to Vector/Graph DB: ${new Date(node.lastSynced || Date.now()).toLocaleString()}`}
            >
              <Database size={10} />
              <span>{new Date(node.lastSynced || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
        {node.type === 'directory' && (expandedDirs[node.id] || searchQuery) && node.children && (
          <div>{renderTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const getFileLanguage = (filename) => {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
    if (filename.endsWith('.sql')) return 'sql';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.owl')) return 'xml';
    return 'text';
  };



  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setAttachedFiles(prev => [...prev, newFile]);
      e.target.value = '';
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setCopilotInput(prev => prev + (prev ? " " : "") + "Voice input test content");
      }, 2000);
    }
  };

  const handleCapabilityClick = (cap) => {
    setCopilotInput(cap.prompt);
    // Focus textarea if we had a ref, but for now just state update
  };

  const toggleCopilot = () => {
    const newState = !showCopilot;
    setShowCopilot(newState);
    if (newState && showTerminal && terminalPosition === 'right') {
      setTerminalPosition('bottom');
    }
  };

  const handleCreateMR = async () => {
    try {
      await axios.post(`http://localhost:3001/api/repos/${currentRepoId}/merge-requests`, {
        title: mrTitle,
        description: mrDescription,
        sourceBranch: currentBranch,
        targetBranch: 'main'
      });
      setShowCreateMRModal(false);
      alert(t('git.mr.create_success'));
    } catch (error) {
      console.error('Failed to create MR:', error);
      alert(t('git.mr.create_failed'));
    }
  };

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    // Select first file if available
    if (skill.files && skill.files.length > 0) {
      setActiveSkillFile(skill.files[0]);
    } else {
      setActiveSkillFile(null);
    }
  };

  const handleSkillFileContentChange = (newContent) => {
    if (editingSkill && activeSkillFile) {
        const updatedFiles = editingSkill.files.map(f => 
            f.name === activeSkillFile.name ? { ...f, content: newContent } : f
        );
        // Update local editing state
        setEditingSkill({ ...editingSkill, files: updatedFiles });
        setActiveSkillFile({ ...activeSkillFile, content: newContent });
    }
  };

  const handleSaveSkill = () => {
      if (editingSkill) {
          updateSkillFiles(editingSkill.id, editingSkill.files);
          alert(t('chat.skill.saved_success'));
      }
  };

  const handleSkillFileUpload = (e) => {
      if (e.target.files && e.target.files.length > 0 && editingSkill) {
          const newFiles = Array.from(e.target.files).map(file => ({
              name: file.name,
              content: '// Uploaded content placeholder' // In real app, read file content
          }));
          
          const updatedFiles = [...(editingSkill.files || []), ...newFiles];
          setEditingSkill({ ...editingSkill, files: updatedFiles });
          if (!activeSkillFile) setActiveSkillFile(newFiles[0]);
      }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Left Main Panel: Sidebar + Editor + Terminal */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        
        {/* Top Section: Sidebar + Editor + Right Terminal */}
        <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
      
          {/* Sidebar: File Tree */}
          <div style={{ 
            width: '280px', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRight: '1px solid var(--border-color)', 
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            {/* Repo Switcher (Removed as it is now in Layout) */}
            
            {/* Branch Selector Header (Aligned with Layout Logo Area - 64px) */}
            <div style={{ 
              height: '64px',
              padding: '0 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0
            }}>
                <div 
                    onClick={() => setShowBranchMenu(!showBranchMenu)}
                    style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.2s',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                    }}
                    title={`Branch: ${currentBranch}`}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <GitBranch size={14} color="var(--text-secondary)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                        {currentBranch}
                    </span>
                    </div>
                    <ChevronDown size={12} color="var(--text-secondary)" />

                    {/* Branch Dropdown */}
                    {showBranchMenu && (
                    <>
                        <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 30 }} 
                        onClick={(e) => { e.stopPropagation(); setShowBranchMenu(false); }} 
                        />
                        <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            marginTop: '4px',
                            width: '100%',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 40,
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                        }}
                        >
                        <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {t('layout.branch.switch')}
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {branches.map(branch => {
                            const branchName = typeof branch === 'string' ? branch : branch.name;
                            const isOwner = typeof branch === 'object' && user && branch.owner === user.userId;
                            const isAdmin = userRole === 'admin' || userRole === 'super_admin';
                            const isMain = branchName === 'main';
                            const canManage = !isMain && (isOwner || isAdmin); 

                            return (
                            <div key={branchName} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <button
                                onClick={() => {
                                setCurrentBranch(branchName);
                                setShowBranchMenu(false);
                                }}
                                style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                border: 'none',
                                background: currentBranch === branchName ? 'var(--bg-tertiary)' : 'transparent',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GitBranch size={14} />
                                {branchName}
                                {isOwner && <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Owner</span>}
                                </div>
                                {currentBranch === branchName && (
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                                )}
                            </button>
                            {!isMain && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault(); 
                                        e.stopPropagation();
                                        handleCreateMergeRequest(branchName);
                                    }}
                                    style={{
                                        padding: '6px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRadius: '4px',
                                        zIndex: 50,
                                        marginLeft: '2px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    title={t('git.mr.create')}
                                >
                                    <GitPullRequest size={12} />
                                </div>
                            )}
                            {canManage && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault(); 
                                        e.stopPropagation();
                                        handleOpenBranchSettings(branch);
                                    }}
                                    style={{
                                        padding: '6px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRadius: '4px',
                                        zIndex: 50
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    title="Manage Branch Permissions"
                                >
                                    <Sliders size={12} />
                                </div>
                            )}
                            </div>
                            );
                            })}
                        </div>
                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                        <button
                            onClick={() => {
                            setShowBranchMenu(false);
                            setShowNewBranchModal(true);
                            }}
                            style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--primary-color)',
                            fontSize: '13px',
                            fontWeight: '500'
                            }}
                        >
                            <Plus size={14} /> {t('layout.branch.new')}
                        </button>
                        </div>
                    </>
                    )}
                </div>
            </div>

            {/* File Tree Header & Search */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Files</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowTerminal(!showTerminal)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: showTerminal ? 'var(--primary-color)' : 'var(--text-secondary)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    title="Toggle Terminal"
                  >
                    <Terminal size={14} />
                  </button>
                  <button
                    onClick={toggleCopilot}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: showCopilot ? 'var(--primary-color)' : 'var(--text-secondary)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    title="Toggle AI Copilot"
                  >
                    <MessageCircle size={14} />
                  </button>
                  <button 
                    onClick={() => setShowNewFileModal(true)}
                    disabled={!canEdit}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: !canEdit ? 'not-allowed' : 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '4px',
                      opacity: !canEdit ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => canEdit && (e.currentTarget.style.color = 'var(--primary-color)')}
                    onMouseLeave={(e) => canEdit && (e.currentTarget.style.color = 'var(--text-secondary)')}
                    title={t('files.new')}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div style={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                transition: 'border-color 0.2s'
              }}>
                <Search size={14} color="var(--text-secondary)" style={{ marginRight: '6px' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>

            {/* File Tree Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              {files.length > 0 ? (
                searchQuery ? renderTree(getFilteredFiles(files, searchQuery)) : renderTree(files)
              ) : (
                 <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                   {t('files.empty')}
                 </div>
              )}
            </div>
          </div>

          {/* Main Content Area (Editor) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              {selectedFile ? (
              <>
                {/* File Header (GitHub Style) */}
                {/* 1. Main Header (64px) */}
                <div style={{ 
                  height: '64px',
                  padding: '0 24px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                    {/* Left: File Info / Breadcrumbs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{repositories.find(r => r.id === currentRepoId)?.name}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>/</span>
                            <FileText size={16} color="var(--text-secondary)" />
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedFile.name}</span>
                        </div>
                        {(!canEdit) && (
                            <span style={{ 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                backgroundColor: 'var(--bg-tertiary)', 
                                borderRadius: '4px', 
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}>
                                {t('files.read_only')}
                            </span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Markdown Actions */}
                      {selectedFile.name.endsWith('.md') && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px' }}>
                            <button 
                              onClick={() => setViewMode('preview')}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: viewMode === 'preview' ? 'var(--bg-secondary)' : 'transparent',
                                color: viewMode === 'preview' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                boxShadow: viewMode === 'preview' ? '0 1px 2px var(--shadow-color)' : 'none'
                              }}
                            >
                              {t('files.preview')}
                            </button>
                            <button 
                              onClick={() => setViewMode('source')}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: viewMode === 'source' ? 'var(--bg-secondary)' : 'transparent',
                                color: viewMode === 'source' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                boxShadow: viewMode === 'source' ? '0 1px 2px var(--shadow-color)' : 'none'
                              }}
                            >
                              {t('files.source')}
                            </button>
                          </div>

                          <button 
                            onClick={() => setShowRAGConfig(true)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '500'
                            }}
                            title="RAG Configuration"
                          >
                            <Activity size={14} /> {t('files.rag_config')}
                          </button>

                          {(currentBranch === 'master' || currentBranch === 'main') && (
                            <button 
                              onClick={() => setShowChunkViewer(true)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '500'
                              }}
                              title="View Chunks"
                            >
                              <FileText size={14} /> {t('files.chunks')}
                            </button>
                          )}

                          {(currentBranch === 'master' || currentBranch === 'main') && selectedFile.knowledgeGraph && (
                            <button 
                              onClick={() => setShowDocumentGraph(true)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--primary-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '500'
                              }}
                              title="View Extracted Knowledge Graph"
                            >
                              <Activity size={14} /> {t('files.kg_view')}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Visual Editor Button */}
                      {selectedFile.name.endsWith('.yml') && selectedFile.content.includes('cubes:') && (
                        <>
                          <button 
                            onClick={() => setShowVisualEditor(true)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--primary-color)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '500'
                            }}
                            title={t('files.visual_edit')}
                          >
                            {currentBranch === 'main' || currentBranch === 'master' ? <Activity size={14} /> : <Edit2 size={14} />} 
                            {currentBranch === 'main' || currentBranch === 'master' ? t('files.visual_view') : t('files.visual_edit')}
                          </button>
                        <button
                           onClick={() => setShowQueryBuilder(true)}
                           style={{
                             padding: '6px 12px',
                             backgroundColor: 'var(--bg-tertiary)',
                             color: 'var(--primary-color)',
                             border: '1px solid var(--border-color)',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '13px',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '6px',
                             fontWeight: '500'
                           }}
                           title={t('files.test_sql')}
                        >
                            <Database size={14} /> {t('files.test_sql')}
                        </button>
                        </>
                      )}

                      {/* Ontology Visual Editor */}
                      {selectedFile.name.endsWith('.owl') && (
                        <button 
                          onClick={() => setShowVisualEditor(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--primary-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '500'
                          }}
                          title={currentBranch === 'main' || currentBranch === 'master' ? t('files.visual_view') : t('files.visual_edit')}
                        >
                          {currentBranch === 'main' || currentBranch === 'master' ? <Activity size={14} /> : <Edit2 size={14} />} 
                          {currentBranch === 'main' || currentBranch === 'master' ? t('files.visual_view') : t('files.visual_edit')}
                        </button>
                      )}

                      {/* Commit Button */}
                      {canEdit && (
                        <button 
                          onClick={() => setShowCommitModal(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2da44e', // GitHub Green
                            color: 'white',
                            border: '1px solid rgba(27,31,36,0.15)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 0 rgba(27,31,36,0.1)'
                          }}
                        >
                          <GitCommit size={14} /> {t('files.commit')}
                        </button>
                      )}
                    </div>
                </div>

                {/* 2. Sub-Header: Commit Info */}
                <div style={{ 
                    padding: '8px 24px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}>
                        {lastCommit?.author?.charAt(0) || 'S'}
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{lastCommit?.author || 'System'}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{lastCommit?.message || 'Initial commit'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Clock size={12} /> {lastCommit?.time || '2 hours ago'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GitCommit size={12} /> 
                        <span style={{ fontFamily: 'monospace' }}>a1b2c3d</span>
                      </span>
                    </div>
                </div>
                {/* File Content / Editor */}
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {selectedFile.name.endsWith('.md') ? (
                     // Markdown View
                     <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', height: '100%' }}>
                       {viewMode === 'preview' ? (
                         <div className="markdown-body">
                           <ReactMarkdown>{editContent}</ReactMarkdown>
                         </div>
                       ) : (
                         <textarea
                           value={editContent}
                           onChange={(e) => setEditContent(e.target.value)}
                           readOnly={!canEdit}
                           style={{
                             width: '100%',
                             height: '100%',
                             padding: '20px',
                             border: '1px solid var(--border-color)',
                             borderRadius: '8px',
                             fontFamily: 'monospace',
                             fontSize: '14px',
                             lineHeight: '1.6',
                             resize: 'none',
                             outline: 'none',
                             backgroundColor: 'var(--bg-secondary)',
                             color: 'var(--text-primary)'
                           }}
                         />
                       )}
                     </div>
                  ) : (
                    // Code View (.yml, .sql, .js, etc.)
                    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                       <CodeEditor 
                         content={editContent} 
                         language={getFileLanguage(selectedFile.name)} 
                         onChange={setEditContent}
                         readOnly={!canEdit}
                         theme={theme}
                       />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--bg-secondary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '16px'
                }}>
                  <FileText size={32} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{t('files.select_file')}</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>{t('files.select_hint')}</div>
              </div>
            )}
          </div>

          {/* Web Terminal - Resizable Split View (Right Side only - disabled if Copilot is open) */}
          {showTerminal && terminalPosition === 'right' && !showCopilot && (
            <>
               {/* Resizer Handle */}
               <div 
                   style={{
                       cursor: 'col-resize',
                       width: '4px',
                       height: '100%',
                       backgroundColor: 'var(--border-color)',
                       transition: 'background-color 0.2s',
                       zIndex: 20
                   }}
                   onMouseDown={(e) => {
                       e.preventDefault();
                       const startX = e.clientX;
                       const startWidth = terminalWidth;

                       const handleMouseMove = (moveEvent) => {
                           const newWidth = startWidth - (moveEvent.clientX - startX);
                           setTerminalWidth(Math.max(200, Math.min(newWidth, 800)));
                       };

                       const handleMouseUp = () => {
                           document.removeEventListener('mousemove', handleMouseMove);
                           document.removeEventListener('mouseup', handleMouseUp);
                       };

                       document.addEventListener('mousemove', handleMouseMove);
                       document.addEventListener('mouseup', handleMouseUp);
                   }}
                   onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                   onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
               />
               
               {/* Terminal Container */}
               <div style={{
                   width: `${terminalWidth}px`,
                   height: '100%',
                   zIndex: 10,
                   backgroundColor: 'var(--bg-secondary)',
                   display: 'flex',
                   flexDirection: 'column'
               }}>
              <WebTerminal 
                files={files}
                currentBranch={currentBranch}
                repoId={currentRepoId}
                theme={theme}
                onClose={() => setShowTerminal(false)}
                onOpenFile={(file) => {
                  setSelectedFile(file);
                  setEditContent(file.content);
                  setViewMode('preview');
                }}
                position={terminalPosition}
                onPositionChange={setTerminalPosition}
                height={terminalHeight}
                width={terminalWidth}
                isCopilotOpen={showCopilot}
              />
            </div>
            </>
          )}

        </div>

        {/* Web Terminal - Resizable Split View (Bottom) */}
        {showTerminal && terminalPosition === 'bottom' && (
           <>
              {/* Resizer Handle */}
              <div 
                  style={{
                      cursor: 'row-resize',
                      height: '4px',
                      width: '100%',
                      backgroundColor: 'var(--border-color)',
                      transition: 'background-color 0.2s',
                      zIndex: 20
                  }}
                  onMouseDown={(e) => {
                      e.preventDefault();
                      const startY = e.clientY;
                      const startHeight = terminalHeight;

                      const handleMouseMove = (moveEvent) => {
                          const newHeight = startHeight - (moveEvent.clientY - startY);
                          setTerminalHeight(Math.max(100, Math.min(newHeight, 600)));
                      };

                      const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
              />
              
              {/* Terminal Container */}
              <div style={{
                  height: `${terminalHeight}px`,
                  width: '100%',
                  zIndex: 10,
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column'
              }}>
             <WebTerminal 
               files={files}
               currentBranch={currentBranch}
               repoId={currentRepoId}
               theme={theme}
               onClose={() => setShowTerminal(false)}
               onOpenFile={(file) => {
                 setSelectedFile(file);
                 setEditContent(file.content);
                 setViewMode('preview');
               }}
               position={terminalPosition}
               onPositionChange={setTerminalPosition}
               height={terminalHeight}
               width={terminalWidth}
               isCopilotOpen={showCopilot}
             />
           </div>
           </>
         )}

      </div>

      {/* Copilot Sidebar (Right) */}
      {showCopilot && (
        <div style={{
          width: '400px',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 25,
          height: '100%'
        }}>
          {/* Header */}
          <div style={{
            height: '56px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)',
            gap: '8px',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <Logo size={24} />
              
              {/* Session Switcher */}
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <button 
                    onClick={() => setShowSessionList(!showSessionList)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        width: '100%',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    className="session-trigger"
                >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}
                    </span>
                    <ChevronDown size={14} color="var(--text-secondary)" />
                </button>

                {showSessionList && (
                    <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setShowSessionList(false)} />
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            width: '240px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px var(--shadow-color)',
                            zIndex: 40,
                            maxHeight: '300px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                <button
                                    onClick={createNewSession}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: 'var(--primary-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Plus size={14} /> New Session
                                </button>
                            </div>
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {sessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setCurrentSessionId(s.id);
                                            setShowSessionList(false);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: currentSessionId === s.id ? 'var(--hover-bg)' : 'transparent',
                                            fontSize: '13px',
                                            color: 'var(--text-primary)',
                                            borderLeft: currentSessionId === s.id ? '2px solid var(--primary-color)' : '2px solid transparent'
                                        }}
                                    >
                                        <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title || 'New Chat'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.lastMessage}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowCopilot(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {copilotMessages.map((msg, idx) => (
              <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'flex-start',
                  gap: '12px',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%' 
              }}>
                {/* Agent Avatar */}
                {msg.sender === 'agent' && (
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                    }}>
                        <AirsIcon size={20} />
                    </div>
                )}

                <div style={{
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: msg.sender === 'agent' ? '100%' : 'auto'
                }}>
                   <div style={{
                        padding: msg.sender === 'user' ? '10px 14px' : '0',
                        borderRadius: msg.sender === 'user' ? '12px' : '0',
                        backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'transparent',
                        color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        width: '100%'
                   }}>
                        {/* Agent Steps (Thoughts/Actions) - Clean Look */}
                        {msg.sender === 'agent' && msg.steps && msg.steps.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                                {msg.steps.map((step, i) => (
                                    <div key={i} style={{ 
                                        display: 'flex', 
                                        gap: '8px', 
                                        marginBottom: '4px', 
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)',
                                        alignItems: 'flex-start'
                                    }}>
                                        <span style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '16px', height: '16px', flexShrink: 0, marginTop: '2px'
                                        }}>
                                            {step.type === 'thought' ? '💭' : step.type === 'action' ? '⚡' : '👁️'}
                                        </span>
                                        <span style={{ fontFamily: 'monospace', opacity: 0.9 }}>
                                            {step.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                  {/* Text Content */}
                  <div style={{ 
                      whiteSpace: 'pre-wrap', 
                      padding: msg.sender === 'agent' ? '0 4px' : '0' 
                  }}>
                      {msg.text}
                      {msg.isStreaming && <span className="cursor-blink">|</span>}
                  </div>

                  {/* Artifacts Inline Rendering */}
                  {msg.artifact && (
                      <div style={{ 
                          marginTop: '16px', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          overflow: 'hidden',
                          backgroundColor: 'var(--bg-secondary)',
                          width: '100%',
                          maxWidth: '600px'
                      }}>
                          {/* Artifact Header */}
                          <div style={{ 
                              padding: '8px 12px', 
                              backgroundColor: 'var(--bg-tertiary)', 
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              color: 'var(--text-primary)'
                          }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                  {(msg.artifact.type === 'code' || msg.artifact.type === 'terminal') ? <Terminal size={12} /> : 
                                   msg.artifact.type === 'html' ? <Activity size={12} /> : <FileText size={12} />}
                                  {msg.artifact.title || 'Artifact'}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                  {msg.artifact.type}
                              </div>
                          </div>

                          {/* Artifact Content */}
                          <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                              {(msg.artifact.type === 'code' || msg.artifact.type === 'terminal') && (
                                  <SyntaxHighlighter 
                                    language={(() => {
                                        if (msg.artifact.language) return msg.artifact.language;
                                        if (msg.artifact.type === 'terminal') return 'bash';
                                        if (msg.artifact.title) {
                                            const ext = msg.artifact.title.split('.').pop().toLowerCase();
                                            const map = {
                                                'js': 'javascript',
                                                'jsx': 'javascript',
                                                'ts': 'typescript',
                                                'tsx': 'typescript',
                                                'py': 'python',
                                                'sql': 'sql',
                                                'html': 'html',
                                                'css': 'css',
                                                'json': 'json',
                                                'md': 'markdown',
                                                'yml': 'yaml',
                                                'yaml': 'yaml',
                                                'sh': 'bash',
                                                'bash': 'bash',
                                                'java': 'java',
                                                'go': 'go',
                                                'rust': 'rust',
                                                'c': 'c',
                                                'cpp': 'cpp'
                                            };
                                            return map[ext] || 'text';
                                        }
                                        return 'text';
                                    })()} 
                                    style={theme === 'dark' ? vscDarkPlus : coy} 
                                    showLineNumbers={true}
                                    customStyle={{ margin: 0, fontSize: '12px', padding: '12px' }}
                                    wrapLongLines={true}
                                  >
                                    {msg.artifact.content}
                                  </SyntaxHighlighter>
                              )}

                              {msg.artifact.type === 'markdown' && (
                                  <div className="markdown-body" style={{ padding: '12px', fontSize: '12px' }}>
                                      <ReactMarkdown>{msg.artifact.content}</ReactMarkdown>
                                  </div>
                              )}

                              {msg.artifact.type === 'html' && (
                                  <div style={{ height: '300px', backgroundColor: 'white' }}>
                                      <iframe 
                                          srcDoc={msg.artifact.content} 
                                          style={{ width: '100%', height: '100%', border: 'none' }} 
                                          title="preview"
                                      />
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                     <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Attachments:</div>
                        {msg.attachedFiles.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                <Paperclip size={10} /> {f.name}
                            </div>
                        ))}
                     </div>
                  )}
                   </div>
                </div>
                {/* User Avatar */}
                {msg.sender === 'user' && (
                    <img 
                      src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                      alt="User" 
                      style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          border: '1px solid var(--border-color)',
                          flexShrink: 0,
                          marginTop: '2px'
                      }} 
                    />
                )}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div style={{ 
            padding: '16px 20px 24px', 
            backgroundColor: 'var(--bg-secondary)', 
            boxShadow: '0 -4px 20px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 20
          }}>
            {/* Execution Status Bar */}
            {copilotIsLoading && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    border: '1px solid var(--primary-color)',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <div className="loading-dots" style={{ color: 'var(--primary-color)' }}>...</div>
                         <span style={{ fontWeight: '500' }}>{executionStatus}</span>
                    </div>
                    <button 
                        onClick={handleStopGeneration} 
                        style={{ 
                            border: 'none', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            color: '#ef4444', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}
                    >
                        <Square size={10} fill="currentColor" /> STOP
                    </button>
                </div>
            )}

            {/* File Preview */}
            {attachedFiles.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} style={{ 
                    position: 'relative', 
                    padding: '4px 8px', 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: 'var(--text-primary)'
                  }}>
                    <Paperclip size={12} />
                    <span>{file.name}</span>
                    <button 
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Capabilities & Selectors */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              
              <div style={{ display: 'flex', gap: '8px' }}>
              {/* MCP Tools Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMcpMenu(!showMcpMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  title="MCP Tools"
                >
                  <Cpu size={14} color="var(--primary-color)" />
                  <span style={{ marginLeft: '2px' }}>MCP</span>
                  <ChevronDown size={12} color="var(--text-secondary)" />
                </button>

                {showMcpMenu && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 30 }} 
                      onClick={() => setShowMcpMenu(false)} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '8px',
                      width: '320px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px var(--shadow-color)',
                      zIndex: 40,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                        <input 
                            type="text" 
                            placeholder={t('search') || "Search tools..."} 
                            value={mcpSearch}
                            onChange={(e) => setMcpSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        
                        {(() => {
                            const filtered = mcpTools.filter(t => 
                                t.name.toLowerCase().includes(mcpSearch.toLowerCase()) || 
                                (t.description && t.description.toLowerCase().includes(mcpSearch.toLowerCase()))
                            );

                            const grouped = filtered.reduce((acc, tool) => {
                                const source = tool.source || 'Other';
                                if (!acc[source]) acc[source] = [];
                                acc[source].push(tool);
                                return acc;
                            }, {});

                            if (filtered.length === 0) {
                                return <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>No tools found</div>;
                            }

                            return Object.entries(grouped).map(([source, tools]) => (
                                <div key={source}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', marginTop: '4px' }}>
                                        {source}
                                    </div>
                                    {tools.map(tool => {
                                        const isEnabled = !disabledTools.includes(tool.id);
                                        return (
                                        <div 
                                            key={tool.id} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMcpTool(tool);
                                                setShowMcpDetailModal(true);
                                                setShowMcpMenu(false);
                                            }}
                                            style={{ 
                                                padding: '8px', 
                                                borderRadius: '6px', 
                                                backgroundColor: 'var(--bg-tertiary)', 
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                marginBottom: '4px',
                                                transition: 'background-color 0.2s',
                                                opacity: isEnabled ? 1 : 0.6
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            title={tool.description}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{tool.name}</div>
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleToolStatus(tool.id);
                                                    }}
                                                    style={{
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                        backgroundColor: isEnabled ? 'var(--primary-color)' : 'var(--border-color)',
                                                        color: isEnabled ? 'white' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        minWidth: '40px',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {isEnabled ? 'ON' : 'OFF'}
                                                </div>
                                            </div>
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: 'var(--text-secondary)',
                                                whiteSpace: 'nowrap', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis' 
                                            }}>
                                                {tool.description}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ));
                        })()}
                    </div>
                  </>
                )}
              </div>

              {/* Capability Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCapabilityMenu(!showCapabilityMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  title={t('chat.actions')}
                >
                  <Zap size={14} color="var(--primary-color)" fill="currentColor" />
                  <span style={{ marginLeft: '2px' }}>{t('chat.actions')}</span>
                  <ChevronDown size={12} color="var(--text-secondary)" />
                </button>

                {showCapabilityMenu && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 30 }} 
                      onClick={() => setShowCapabilityMenu(false)} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '8px',
                      width: '200px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px var(--shadow-color)',
                      zIndex: 40,
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      {quickCapabilities.map(cap => (
                        <button
                          key={cap.id}
                          onClick={() => {
                            handleCapabilityClick(cap);
                            setShowCapabilityMenu(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--text-primary)',
                            fontSize: '12px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ color: 'var(--text-secondary)' }}>{cap.icon}</div>
                          <span>{cap.label}</span>
                        </button>
                      ))}

                      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                      
                      <button
                        onClick={() => {
                            setShowSkillModal(true);
                            setShowCapabilityMenu(false);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--text-primary)',
                            fontSize: '12px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                          <div style={{ color: 'var(--text-secondary)' }}><Zap size={14} /></div>
                          <span>{t('skills.manage')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              </div>

              {/* Agent/Model Selectors */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    style={{
                      appearance: 'none',
                      border: 'none',
                      fontSize: '11px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      outline: 'none',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  >
                    <option value="general">General</option>
                    <option value="coder">Coder</option>
                    <option value="writer">Writer</option>
                  </select>

                  <select 
                    value={selectedModel}
                    onChange={(e) => {
                        const newVal = e.target.value;
                        if (newVal === 'MANAGE_MODELS') {
                            setShowModelModal(true);
                            return;
                        }
                        setSelectedModel(newVal);
                        const model = models.find(m => m.modelName === newVal);
                        if (model) {
                             const newConfig = {
                                provider: model.provider,
                                modelName: model.modelName,
                                baseUrl: model.baseUrl,
                                apiKey: model.apiKey
                            };
                            setLlmConfig(newConfig);
                        }
                    }}
                    style={{
                      appearance: 'none',
                      border: 'none',
                      fontSize: '11px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      outline: 'none',
                      textAlign: 'right',
                      fontWeight: '500',
                      maxWidth: '120px'
                    }}
                  >
                    {models.length > 0 ? (
                        <>
                        {models.map(m => (
                            <option key={m.id} value={m.modelName}>{m.name}</option>
                        ))}
                        <option disabled>──────────</option>
                        <option value="MANAGE_MODELS">⚙️ {t('management.models.manage') || 'Manage Models'}</option>
                        </>
                    ) : (
                        <option value="">Loading...</option>
                    )}
                  </select>
              </div>
            </div>

            {/* Input Box */}
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '14px',
              backgroundColor: theme === 'dark' ? 'var(--bg-tertiary)' : '#ffffff',
              borderColor: isRecording ? '#ef4444' : 'var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}>
              <textarea
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCopilotSend();
                  }
                }}
                disabled={copilotIsLoading || isRecording}
                placeholder={isRecording ? t('chat.recording') : t('chat.input_placeholder')}
                rows={1}
                style={{
                  width: '100%',
                  padding: '0',
                  border: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  resize: 'none',
                  minHeight: '24px',
                  maxHeight: '160px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title={t('chat.upload_file')}
                             onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                             onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                          <input type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                          <Paperclip size={18} />
                      </label>

                      <button
                          onClick={toggleRecording}
                          style={{
                              padding: '4px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              color: isRecording ? '#ef4444' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'color 0.2s'
                          }}
                          onMouseEnter={e => !isRecording && (e.currentTarget.style.color = 'var(--text-primary)')}
                          onMouseLeave={e => !isRecording && (e.currentTarget.style.color = 'var(--text-secondary)')}
                          title={isRecording ? t('chat.stop_recording') : t('chat.voice_input')}
                      >
                          {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                      </button>
                  </div>

                  <button
                      onClick={handleCopilotSend}
                      disabled={(!copilotInput.trim() && attachedFiles.length === 0) || copilotIsLoading || isRecording}
                      style={{
                          width: '32px',
                          height: '32px',
                          padding: 0,
                          backgroundColor: (!copilotInput.trim() && attachedFiles.length === 0) || copilotIsLoading || isRecording ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                          color: (!copilotInput.trim() && attachedFiles.length === 0) || copilotIsLoading || isRecording ? 'var(--text-secondary)' : 'white',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: (!copilotInput.trim() && attachedFiles.length === 0) || copilotIsLoading || isRecording ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                      }}
                  >
                      <Send size={16} fill={(!copilotInput.trim() && attachedFiles.length === 0) ? "none" : "currentColor"} />
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Commit Modal */}
      {showCommitModal && (
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
          zIndex: 50,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            width: '500px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('files.commit')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('files.commit_message')}</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={`Update ${selectedFile?.name}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <GitBranch size={14} />
                <span>{t('terminal.current_branch')} <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{currentBranch}</span></span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowCommitModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleCommitChanges}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2da44e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 1px 0 rgba(27,31,36,0.1)'
                }}
              >
                {t('files.commit')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create MR Modal */}
      {showCreateMRModal && (
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
          zIndex: 60,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            width: '500px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('git.mr.new')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('git.mr.title')}</label>
              <input
                type="text"
                value={mrTitle}
                onChange={(e) => setMrTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('git.mr.desc')}</label>
              <textarea
                value={mrDescription}
                onChange={(e) => setMrDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('git.mr.source')}</label>
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <GitBranch size={14} /> {currentBranch}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('git.mr.target')}</label>
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <GitBranch size={14} /> main
                  </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowCreateMRModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}
              >
                {t('files.cancel')}
              </button>
              <button 
                onClick={handleCreateMR}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#238636',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {t('git.mr.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
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
          zIndex: 50,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('files.new')}</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={t('files.name_placeholder')}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowNewFileModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}
              >
                {t('files.cancel')}
              </button>
              <button 
                onClick={handleCreateNewFile}
                disabled={!newFileName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  opacity: !newFileName.trim() ? 0.5 : 1
                }}
              >
                {t('files.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Editor Modal (Model or Ontology) */}
      {showVisualEditor && selectedFile && (
        selectedFile.name.endsWith('.yml') ? (
          <ModelVisualEditor 
            content={selectedFile.content}
            fileName={selectedFile.name}
            onRename={handleRename}
            readOnly={currentBranch === 'main' || currentBranch === 'master'}
            onSave={(newContent) => {
              setEditContent(newContent);
              setSelectedFile(prev => ({ ...prev, content: newContent }));
              setShowVisualEditor(false);
            }}
            onClose={() => setShowVisualEditor(false)} 
          />
        ) : selectedFile.name.endsWith('.owl') ? (
          <OntologyVisualEditor 
            content={selectedFile.content}
            fileName={selectedFile.name}
            onRename={handleRename}
            readOnly={currentBranch === 'main' || currentBranch === 'master'}
            onSave={(newContent) => {
              setEditContent(newContent);
              setSelectedFile(prev => ({ ...prev, content: newContent }));
              setShowVisualEditor(false);
            }}
            onClose={() => setShowVisualEditor(false)} 
          />
        ) : null
      )}

      {/* SQL Query Builder Modal */}
      {showQueryBuilder && selectedFile && (
        <QueryBuilderModal
          isOpen={showQueryBuilder}
          onClose={() => setShowQueryBuilder(false)}
          modelContent={selectedFile.content}
          theme={theme}
        />
      )}

      {/* Knowledge Graph View Modal (Legacy - Removed) */}
      {/* 
      {showKnowledgeGraph && selectedFile && (
        <KnowledgeGraphView 
          content={selectedFile.content} 
          onClose={() => setShowKnowledgeGraph(false)} 
        />
      )} 
      */}
      
      {/* RAG Config Modal */}
       {showRAGConfig && selectedFile && (
         <RAGConfigModal
           config={selectedFile.ragConfig || {}}
           graphRagConfig={selectedFile.graphRagConfig || {}}
           onSave={handleSaveRAGConfig}
           onClose={() => setShowRAGConfig(false)}
           readOnly={!canEdit}
         />
       )}

       {/* Chunk Viewer Modal */}
       {showChunkViewer && selectedFile && (
         <ChunkViewer
           chunks={selectedFile.chunks || []}
           fileName={selectedFile.name}
           onClose={() => setShowChunkViewer(false)}
         />
       )}

       {/* Document Graph View Modal */}
       {showDocumentGraph && selectedFile && (
         <DocumentGraphView
           data={selectedFile.knowledgeGraph}
           onClose={() => setShowDocumentGraph(false)}
         />
       )}

      {/* Model Management Modal */}
      {showModelModal && (
        <ModelManagementModal
          models={models}
          onSave={saveModel}
          onRemove={removeModel}
          onClose={() => setShowModelModal(false)}
        />
      )}

      {/* Skill Modal */}
      {showSkillModal && (
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
        }} onClick={() => setShowSkillModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            width: isSkillModalExpanded ? '95vw' : '900px',
            height: isSkillModalExpanded ? '95vh' : '85vh',
            maxHeight: isSkillModalExpanded ? 'none' : '85vh',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-tertiary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary-color)'
                }}>
                    <Zap size={20} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{t('skills.title')}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('skills.manage')}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingSkill && (
                  <button 
                    onClick={() => setIsSkillModalExpanded(!isSkillModalExpanded)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '4px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={isSkillModalExpanded ? "Restore" : "Maximize"}
                  >
                    {isSkillModalExpanded ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                )}
                <button 
                  onClick={() => setShowSkillModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              {editingSkill ? (
                  // --- Skill Editor View ---
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                          <button 
                            onClick={() => setEditingSkill(null)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                          >
                              <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} /> {t('chat.skill.back')}
                          </button>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{editingSkill.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px' }}>{t('skills.custom')}</span>
                          
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                              <label style={{ 
                                  padding: '6px 12px', 
                                  borderRadius: '6px', 
                                  border: '1px solid var(--border-color)', 
                                  cursor: 'pointer', 
                                  fontSize: '12px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px',
                                  color: 'var(--text-primary)'
                              }}>
                                  <input type="file" multiple style={{ display: 'none' }} onChange={handleSkillFileUpload} />
                                  <Plus size={14} /> {t('chat.skill.upload_files')}
                              </label>
                              <button 
                                  onClick={handleSaveSkill}
                                  style={{ 
                                      padding: '6px 12px', 
                                      borderRadius: '6px', 
                                      backgroundColor: 'var(--primary-color)', 
                                      color: 'white', 
                                      border: 'none', 
                                      cursor: 'pointer', 
                                      fontSize: '12px', 
                                      fontWeight: '500',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '6px'
                                  }}
                              >
                                  <Save size={14} /> {t('chat.skill.save')}
                              </button>
                          </div>
                      </div>

                      <div style={{ display: 'flex', flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Sidebar: File List */}
                          <div style={{ width: '180px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', overflowY: 'auto' }}>
                              <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('chat.files')}</div>
                              {editingSkill.files && editingSkill.files.map((file, idx) => (
                                  <div 
                                      key={idx}
                                      onClick={() => setActiveSkillFile(file)}
                                      style={{ 
                                          padding: '8px 12px', 
                                          cursor: 'pointer', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '8px',
                                          fontSize: '13px',
                                          backgroundColor: activeSkillFile?.name === file.name ? 'var(--bg-secondary)' : 'transparent',
                                          color: activeSkillFile?.name === file.name ? 'var(--primary-color)' : 'var(--text-primary)',
                                          borderLeft: activeSkillFile?.name === file.name ? '2px solid var(--primary-color)' : '2px solid transparent'
                                      }}
                                  >
                                      <FileText size={14} />
                                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                  </div>
                              ))}
                          </div>

                          {/* Main: Editor */}
                          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                              {activeSkillFile ? (
                                  <CodeEditor 
                                      content={activeSkillFile.content || ''}
                                      language={activeSkillFile.name.endsWith('.json') ? 'json' : (activeSkillFile.name.endsWith('.py') ? 'python' : 'javascript')}
                                      onChange={handleSkillFileContentChange}
                                      readOnly={false}
                                      theme={theme}
                                  />
                              ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                      {t('chat.skill.select_file')}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                  // --- Default View: Skill List ---
                  <>
              {/* Official Skills Section */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ 
                    margin: '0 0 8px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {t('skills.official')}
                    <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-secondary)', padding: '2px 8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px' }}>{t('chat.tag.system')}</span>
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('skills.official_desc')}</p>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                    {skills.filter(s => s.type === 'official').map(skill => (
                        <div key={skill.id} style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `1px solid ${skill.enabled ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            backgroundColor: skill.enabled ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{skill.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{skill.description}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ 
                                    fontSize: '12px', 
                                    color: skill.enabled ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: '500'
                                }}>
                                    {skill.enabled ? t('skills.enabled') : t('skills.disabled')}
                                </span>
                                <div 
                                    onClick={() => toggleSkill(skill.id)}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        backgroundColor: skill.enabled ? 'var(--primary-color)' : 'var(--border-color)',
                                        borderRadius: '12px',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: '2px',
                                        left: skill.enabled ? '22px' : '2px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* Custom Skills Section */}
              <div>
                <h4 style={{ 
                    margin: '0 0 8px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {t('skills.custom')}
                    <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-secondary)', padding: '2px 8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px' }}>{t('chat.tag.repository')}</span>
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('skills.custom_desc')}</p>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                    {skills.filter(s => s.type === 'custom' && s.repoId === currentRepoId).length > 0 ? (
                        skills.filter(s => s.type === 'custom' && s.repoId === currentRepoId).map(skill => (
                            <div key={skill.id} style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: `1px solid ${skill.enabled ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                backgroundColor: skill.enabled ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{skill.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{skill.description}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Edit Button */}
                                    <button 
                                        onClick={() => handleEditSkill(skill)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'transparent',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '12px',
                                            marginRight: '8px'
                                        }}
                                        title="Edit Skill Files"
                                    >
                                        <Edit3 size={12} /> {t('chat.skill.edit_file')}
                                    </button>

                                    <span style={{ 
                                        fontSize: '12px', 
                                        color: skill.enabled ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: '500'
                                    }}>
                                        {skill.enabled ? t('skills.enabled') : t('skills.disabled')}
                                    </span>
                                    <div 
                                        onClick={() => toggleSkill(skill.id)}
                                        style={{
                                            width: '44px',
                                            height: '24px',
                                            backgroundColor: skill.enabled ? 'var(--primary-color)' : 'var(--border-color)',
                                            borderRadius: '12px',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '2px',
                                            left: skill.enabled ? '22px' : '2px',
                                            transition: 'left 0.2s',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            padding: '32px', 
                            textAlign: 'center', 
                            backgroundColor: 'var(--bg-tertiary)', 
                            borderRadius: '12px', 
                            border: '1px dashed var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontSize: '13px'
                        }}>
                            {t('skills.no_custom')}
                        </div>
                    )}
                </div>
              </div>
              </>
              )}

            </div>
          </div>
        </div>
      )}


      {showMcpDetailModal && selectedMcpTool && (
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
        }} onClick={() => setShowMcpDetailModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            width: '600px',
            maxHeight: '80vh',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Cpu size={20} color="var(--primary-color)" />
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{selectedMcpTool.name}</h3>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        {selectedMcpTool.source || 'Tool'}
                    </span>
                </div>
                <button 
                  onClick={() => setShowMcpDetailModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-primary)' }}>Description</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {selectedMcpTool.description}
                    </p>
                </div>

                <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-primary)' }}>Parameters</h4>
                    <div style={{ 
                        backgroundColor: 'var(--bg-tertiary)', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        overflowX: 'auto'
                    }}>
                        <pre style={{ margin: 0, color: 'var(--text-primary)' }}>
                            {JSON.stringify(selectedMcpTool.inputSchema, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    onClick={() => {
                        setCopilotInput(prev => prev + (prev ? " " : "") + `Thinking Process: calling ${selectedMcpTool.name}...`); 
                        setShowMcpDetailModal(false);
                    }}
                    style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                    {t('chat.use_tool') || "Use Tool"}
                </button>
            </div>
          </div>
        </div>
      )}

     {/* New Branch Modal */}
      {showNewBranchModal && (
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
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('layout.branch.create_modal_title')}</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('layout.branch.name')}</label>
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder={t('layout.branch.placeholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowNewBranchModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}
              >
                {t('layout.cancel')}
              </button>
              <button 
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  opacity: !newBranchName.trim() ? 0.5 : 1
                }}
              >
                {t('layout.branch.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Settings Modal */}
      {showBranchSettingsModal && selectedBranchSettings && (
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
        }} onClick={() => setShowBranchSettingsModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            width: '500px',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px var(--shadow-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{t('branch.settings')} - {selectedBranchSettings.name}</h3>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Ownership */}
                <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-primary)' }}>{t('branch.owner')}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                {repoMembers.find(m => m.userId === selectedBranchSettings.owner)?.name?.charAt(0) || '?'}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                {repoMembers.find(m => m.userId === selectedBranchSettings.owner)?.name || selectedBranchSettings.owner}
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
                            {repoMembers
                                .filter(m => m.userId !== selectedBranchSettings.owner && m.role !== 'super_admin')
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

                {/* Editors (Collaborators & Admins) */}
                <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-primary)' }}>{t('branch.editors')}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                        {/* 1. Explicit Collaborators */}
                        {(selectedBranchSettings.collaborators || []).map(collabId => {
                            const member = repoMembers.find(m => m.userId === collabId);
                            if (!member) return null;
                            const canRemove = userRole === 'admin' || userRole === 'super_admin' || user.userId === selectedBranchSettings.owner;
                            
                            return (
                                <div key={collabId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                            {member.name?.charAt(0) || '?'}
                                        </div>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{member.name}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '1px 4px', borderRadius: '4px' }}>{t('branch.role.collaborator')}</span>
                                    </div>
                                    {canRemove && (
                                        <button 
                                            onClick={() => handleRemoveCollaborator(collabId)}
                                            style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            title={t('branch.remove')}
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Empty State */}
                        {(selectedBranchSettings.collaborators || []).length === 0 && (
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{t('branch.no_editors')}</div>
                        )}
                    </div>
                    
                    {/* Add Collaborator Section */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <select 
                            value={newCollaboratorId}
                            onChange={(e) => setNewCollaboratorId(e.target.value)}
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="">{t('branch.add_collaborator')}</option>
                            {repoMembers
                                .filter(m => m.userId !== selectedBranchSettings.owner && !(selectedBranchSettings.collaborators || []).includes(m.userId) && m.role !== 'super_admin')
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
                    onClick={() => setShowBranchSettingsModal(false)}
                    style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    {t('layout.close')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
