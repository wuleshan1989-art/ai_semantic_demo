import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Logo from './Logo';
import AirsIcon from './AirsIcon';
import { User, Paperclip, Mic, Square, Send, Box, Plus, Chat, X, ChevronDown, ChevronRight, Activity, Terminal, MessageSquare, Database, FileText, CloudLightning, Zap, Edit3, Save, Folder, Settings, Maximize, Minimize, Bot, Cpu, Layout, Image, Code, Crosshair } from './Icons';
import { useApp } from './AppContext';
import CodeEditor from './CodeEditor';
import useModels from './hooks/useModels';
import ModelManagementModal from './components/ModelManagementModal';

const ChatPage = () => {
  const { t, theme, skills, toggleSkill, updateSkillFiles, currentRepoId, user, llmConfig, setLlmConfig } = useApp();
  // --- 状态 ---
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Replaced currentArtifact with tab state
  const [artifactTabs, setArtifactTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isArtifactTracking, setIsArtifactTracking] = useState(true);
  
  const activeArtifact = artifactTabs.find(t => t.id === activeTabId);
  const isTrackingRef = useRef(isArtifactTracking);
  useEffect(() => {
    isTrackingRef.current = isArtifactTracking;
  }, [isArtifactTracking]);

  const [showPreview, setShowPreview] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null); // The skill currently being edited
  const [isSkillModalExpanded, setIsSkillModalExpanded] = useState(false);
  const [activeFile, setActiveFile] = useState(null); // The file currently open in the editor
  const [showCapabilityMenu, setShowCapabilityMenu] = useState(false);
  const [showMcpMenu, setShowMcpMenu] = useState(false);
  const [mcpTools, setMcpTools] = useState([]);
  
  // MCP UI State
  const [mcpSearch, setMcpSearch] = useState('');
  const [selectedMcpTool, setSelectedMcpTool] = useState(null);
  const [showMcpDetailModal, setShowMcpDetailModal] = useState(false);
  const [disabledTools, setDisabledTools] = useState([]); // Store IDs of disabled tools
  
  // 新增状态
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [selectedModel, setSelectedModel] = useState(''); 
  const [isRecording, setIsRecording] = useState(false);
  const [files, setFiles] = useState([]);
  const { models, saveModel, removeModel } = useModels();

  useEffect(() => {
    if (llmConfig?.modelName) {
      setSelectedModel(llmConfig.modelName);
    }
  }, [llmConfig]);

  const [showModelModal, setShowModelModal] = useState(false);

  const [expandedSteps, setExpandedSteps] = useState({}); // Stores which message steps are expanded { [msgIndex]: true/false }
  const [comments, setComments] = useState({}); // { [artifactId]: [ { id, text, line, timestamp, selection? } ] }
  const [showCommentInput, setShowCommentInput] = useState(null); // { artifactId, line, selection? } or null
  const [commentText, setCommentText] = useState('');
  const [hoveredLine, setHoveredLine] = useState(null); // { artifactId, line }
  const [selection, setSelection] = useState(null); // { text, start, end, rect }

  const quickCapabilities = [
    {
      id: 'web_search',
      label: t('chat.web_search') || 'Web Search',
      icon: <CloudLightning size={14} />, // Reusing CloudLightning or use a specific Search icon
      prompt: 'Please search for: ',
      description: 'Search the internet for information'
    },
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

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    // Select first file if available
    if (skill.files && skill.files.length > 0) {
      setActiveFile(skill.files[0]);
    } else {
      setActiveFile(null);
    }
  };

  const handleFileContentChange = (newContent) => {
    if (editingSkill && activeFile) {
        const updatedFiles = editingSkill.files.map(f => 
            f.name === activeFile.name ? { ...f, content: newContent } : f
        );
        // Update local editing state
        setEditingSkill({ ...editingSkill, files: updatedFiles });
        setActiveFile({ ...activeFile, content: newContent });
    }
  };

  const handleSaveSkill = () => {
      if (editingSkill) {
          updateSkillFiles(editingSkill.id, editingSkill.files);
          alert(t('chat.skill.saved_success'));
      }
  };

  const handleFileUpload = (e) => {
      if (e.target.files && e.target.files.length > 0 && editingSkill) {
          const newFiles = Array.from(e.target.files).map(file => ({
              name: file.name,
              content: '// Uploaded content placeholder' // In real app, read file content
          }));
          
          const updatedFiles = [...(editingSkill.files || []), ...newFiles];
          setEditingSkill({ ...editingSkill, files: updatedFiles });
          if (!activeFile) setActiveFile(newFiles[0]);
      }
  };

  const handleCapabilityClick = (cap) => {
    // Reset input with template
    setInput(cap.prompt);
    // If cap requires doc upload, we could trigger file dialog, but for now just text
    if (cap.id === 'doc_mining' || cap.id === 'semantic_ingest') {
        // Optional: Auto trigger file upload if [文档] placeholder exists
        // document.getElementById('file-upload-input').click();
    }
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  // --- 初始化 ---
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // --- 初始化 ---
  useEffect(() => {
    fetchSessions();
    fetchMcpTools();
    fetchUserToolConfig();
  }, []);

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
      // Revert on error (optional but good UX)
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

  // 当会话切换时，加载该会话的消息
  useEffect(() => {
    if (currentSessionId) {
      fetchSessionDetails(currentSessionId);
      setFiles([]); 
      setInput('');
      setShowPreview(false); // 切换会话时关闭预览
    }
  }, [currentSessionId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // --- API 调用 ---

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
      console.error('获取会话列表失败', error);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/sessions/${sessionId}`);
      const msgs = res.data.messages || [];
      // Ensure all artifacts have IDs for robust tab handling
      msgs.forEach((m, idx) => {
          if (m.artifact && !m.artifact.id) {
              m.artifact.id = `art-${m.id || Date.now()}-${idx}`;
          }
      });
      setMessages(msgs);
      
      const lastArtifactMsg = [...msgs].reverse().find(m => m.artifact);
      if (lastArtifactMsg) {
        setArtifactTabs([lastArtifactMsg.artifact]);
        setActiveTabId(lastArtifactMsg.artifact.id);
      } else {
        setArtifactTabs([]);
        setActiveTabId(null);
      }
    } catch (error) {
      console.error('获取会话详情失败', error);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/sessions');
      setSessions(prev => [res.data, ...prev]);
      setCurrentSessionId(res.data.id);
      setMessages([]);
      setArtifactTabs([]);
      setActiveTabId(null);
      setShowPreview(false);
      setFiles([]);
      setInput('');
    } catch (error) {
      console.error('创建会话失败', error);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsLoading(false);
        setMessages(prev => [...prev, { id: Date.now(), text: '⛔️ 已停止生成', sender: 'system' }]);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || isRecording) return;
    if (isLoading) {
        handleStop();
        return;
    }
    
    let messageText = input;
    if (files.length > 0) {
      messageText += `\n[Uploaded ${files.length} files: ${files.map(f => f.name).join(', ')}]`;
    }

    const userMsg = { id: Date.now(), text: messageText, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // AbortController setup
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // 1. Create a placeholder message for Agent
      const agentMsgId = Date.now() + 1;
      setMessages(prev => [...prev, {
          id: agentMsgId,
          text: '',
          sender: 'agent',
          timestamp: Date.now(),
          steps: [],
          isStreaming: true
      }]);

      const res = await axios.post('http://localhost:3001/api/agent/chat', {
        message: messageText,
        sessionId: currentSessionId,
        agent: selectedAgent,
        model: selectedModel,
        modelConfig: llmConfig // Pass the full config including API key
      }, {
        signal: abortControllerRef.current.signal
      });

      // 2. Stream Steps
      if (res.data.steps && res.data.steps.length > 0) {
          for (const step of res.data.steps) {
              await wait(800); // Simulate thinking time
              setMessages(prev => prev.map(msg => {
                  if (msg.id === agentMsgId) {
                      return { ...msg, steps: [...(msg.steps || []), step] };
                  }
                  return msg;
              }));
          }
      }

      // 3. Stream Text
      const fullText = res.data.reply || '';
      const chunkSize = 5;
      for (let i = 0; i < fullText.length; i += chunkSize) {
          await wait(15);
          const currentText = fullText.slice(0, i + chunkSize);
          setMessages(prev => prev.map(msg => {
              if (msg.id === agentMsgId) {
                  return { ...msg, text: currentText };
              }
              return msg;
          }));
      }

      // 4. Finish
      setMessages(prev => prev.map(msg => {
          if (msg.id === agentMsgId) {
              return { 
                  ...msg, 
                  text: fullText,
                  artifact: res.data.artifact,
                  isStreaming: false
              };
          }
          return msg;
      }));
      
      if (res.data.artifact) {
        // Ensure ID exists
        if (!res.data.artifact.id) {
            res.data.artifact.id = `art-gen-${Date.now()}`;
        }
        const newArtifact = res.data.artifact;
        setArtifactTabs(prev => {
             const exists = prev.find(a => a.id === newArtifact.id);
             if (exists) return prev.map(a => a.id === newArtifact.id ? newArtifact : a);
             return [...prev, newArtifact];
        });
        
        if (isTrackingRef.current) {
             setActiveTabId(newArtifact.id);
             setShowPreview(true);
        }
      }
      
      fetchSessions();
    } catch (error) {
      if (axios.isCancel(error)) {
          console.log('Request canceled');
          // Update the streaming message to show it was stopped? 
          // Actually handleStop already added a system message.
          // We might want to mark the agent message as not streaming.
          setMessages(prev => prev.map(msg => {
              if (msg.isStreaming) {
                  return { ...msg, isStreaming: false, text: msg.text + ' [Stopped]' };
              }
              return msg;
          }));
      } else {
          console.error('发送消息失败', error);
          setMessages(prev => [...prev, { id: Date.now(), text: t('chat.error.send'), sender: 'error' }]);
      }
    } finally {
      // Only set loading to false if we haven't already (e.g. via handleStop)
      // Actually handleStop sets it, but if it finished normally, we set it here.
      // If aborted, handleStop sets it, but this finally block runs too. 
      // It's safe to set it again.
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFiles(prev => [...prev, newFile]);
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
        setInput(prev => prev + (prev ? " " : "") + t('chat.voice_test_content'));
      }, 2000);
    }
  };

  const handleAddComment = (artifactId, line, selectionData) => {
    if (!commentText.trim()) return;
    
    const newComment = {
      id: Date.now(),
      text: commentText,
      line: line,
      selection: selectionData,
      timestamp: Date.now()
    };

    setComments(prev => ({
      ...prev,
      [artifactId]: [...(prev[artifactId] || []), newComment]
    }));

    // Add to input as context for next turn
    /* 
    setInput(prev => {
      const selectionContext = selectionData ? ` (Selection: "${selectionData.text}")` : '';
      const contextMsg = `\n[Context: Comment on ${currentArtifact.title}${line ? ` line ${line}` : ''}${selectionContext}: "${commentText}"]`;
      return prev + contextMsg;
    });
    */

    setCommentText('');
    setShowCommentInput(null);
    setSelection(null);
  };

  const handleDeleteComment = (artifactId, commentId) => {
    // 1. Get current comments to find the line
    const fileComments = comments[artifactId] || [];
    const targetComment = fileComments.find(c => c.id === commentId);
    if (!targetComment) return;

    const line = targetComment.line;
    
    // 2. Update comments state
    const newFileComments = fileComments.filter(c => c.id !== commentId);
    
    // NOTE: We need to use functional update to ensure we have latest state if called rapidly
    // But here we already derived newFileComments from 'comments' which is a dependency if we were in useEffect
    // Since this is an event handler, 'comments' state might be stale if multiple deletes happen? 
    // Actually in React batching it should be fine, but let's be safe.
    
    setComments(prev => ({
        ...prev,
        [artifactId]: newFileComments
    }));

    // 3. Check if we need to close input
    const remainingOnLine = newFileComments.filter(c => c.line === line);
    if (remainingOnLine.length === 0) {
        // Only close if it's the specific line being viewed
        if (showCommentInput?.artifactId === artifactId && showCommentInput?.line === line) {
            setShowCommentInput(null);
        }
    }
  };

  const handleSelection = (e) => {
    const sel = window.getSelection();
    
    // Make sure we have a valid selection that is not collapsed
    if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
        // If we clicked inside the comment popup or button, don't clear
        // This is handled by stopPropagation on those elements
        
        // Only clear if we really clicked somewhere else and not on a button
        // But since this is called onMouseUp of the container, it fires after the click
        // Let's rely on the click handler of the document or container to clear selection if needed
        // For now, if no selection, we might want to clear the 'selection' state if it exists?
        // But clearing it here might hide the button before we can click it?
        // No, the button is rendered based on 'selection' state.
        
        // Actually, the browser native selection remains until clicked elsewhere.
        // We should sync our state with it.
        if (selection) {
             // Delay clearing to allow click events to process
             setTimeout(() => {
                 // Check if selection is still empty
                 const currentSel = window.getSelection();
                 if (!currentSel || currentSel.isCollapsed) {
                     setSelection(null);
                 }
             }, 200);
        }
        return;
    }

    const text = sel.toString();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Update state to show button
    setSelection({ 
      text,
      rect: {
        top: rect.top,
        left: rect.right,
        bottom: rect.bottom,
        height: rect.height
      }
    });
  };


  const renderCommentMarker = (artifactId, line) => {
    const fileComments = comments[artifactId] || [];
    const lineComments = fileComments.filter(c => c.line === line);
    const hasComments = lineComments.length > 0;
    const isHovered = hoveredLine?.artifactId === artifactId && hoveredLine?.line === line;
    const isInputOpen = showCommentInput?.artifactId === artifactId && showCommentInput?.line === line;
    
    // Check if we have a selection on this line (approximate check via hover)
    // IMPORTANT: Only show selection button if the selection is actually within this element's bounds?
    // Actually, selection.rect is global coordinates. We just need to know if we have a selection.
    // The button is rendered via portal or fixed position, so it doesn't matter WHICH line renders it,
    // as long as it's rendered exactly ONCE.
    // Currently, it's rendered by EVERY line that is hovered? No, only if 'isHovered' is true.
    // But 'isHovered' is only true for ONE line at a time.
    
    // BUG FIX: The selection button should show up even if we mouse out, as long as selection exists?
    // No, standard behavior is button shows near selection.
    
    // Fix logic: Render selection button globally or only on the specific line?
    // Let's render it only if we are the hovered line to avoid duplication, OR render it outside the loop.
    // Since we are inside map(), we need to be careful.
    
    const showSelectionButton = selection && isHovered && !isInputOpen;

    return (
      <>
        {/* 1. Selection Comment Button - Floating at end of selection */}
        {showSelectionButton && (
            <div 
                className="selection-comment-trigger"
                onClick={(e) => {
                    e.stopPropagation();
                    // Don't use the 'line' from the loop, use the selection's context if possible
                    // But here we are attaching it to the current line context
                    setShowCommentInput({ artifactId, line });
                }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent clearing selection
                style={{
                    position: 'fixed',
                    top: selection.rect.top - 32, // Position above the selection
                    left: selection.rect.right,   // At the END of selection (right side)
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <MessageSquare size={14} /> {t('chat.comment.btn')}
                <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--primary-color)'
                }} />
            </div>
        )}

        {/* 2. Line Marker (Only if no comments and not input open) */}
        {!hasComments && !isInputOpen && !showSelectionButton && (
            <div 
                className="comment-trigger"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentInput({ artifactId, line });
                }}
                style={{
                    position: 'absolute',
                    right: '4px',
                    opacity: 0, // Controlled by parent hover
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'opacity 0.2s',
                    zIndex: 20
                }}
                title="Add comment"
            >
                <MessageSquare size={14} />
            </div>
        )}

        {/* 3. Existing Comment Indicator */}
        <div style={{ position: 'absolute', right: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 20 }}>
            {hasComments && (
            <div 
                style={{ 
                cursor: 'pointer', 
                color: 'var(--primary-color)',
                marginBottom: isInputOpen ? '4px' : '0'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentInput(isInputOpen ? null : { artifactId, line });
                }}
                title={`${lineComments.length} ${t('chat.comment.btn')}`}
            >
                <MessageSquare size={14} fill="var(--primary-color)" />
            </div>
            )}

            {/* 4. Comment Popup */}
            {(isInputOpen || (hasComments && isHovered)) && (
            <div style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                border: '1px solid var(--primary-color)',
                borderRadius: '6px',
                padding: '8px',
                width: '260px',
                boxShadow: '0 4px 12px var(--shadow-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'absolute',
                right: '0',
                top: '20px',
                zIndex: 100,
                cursor: 'default' // Reset cursor
            }} 
            onClick={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()} // Prevent triggering selection logic
            >
                {/* Comments List */}
                {lineComments.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: isInputOpen ? '8px' : '0', borderBottom: isInputOpen ? '1px solid var(--border-color)' : 'none', paddingBottom: '4px' }}>
                        {lineComments.map(c => (
                            <div key={c.id} style={{ fontSize: '11px', color: 'var(--text-primary)', marginBottom: '6px', padding: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)', position: 'relative' }}>
                                {c.selection && (
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px', borderLeft: '2px solid var(--primary-color)', paddingLeft: '4px', fontStyle: 'italic', borderBottom: '1px solid #fde047' }}>
                                    "{c.selection.text.length > 30 ? c.selection.text.substring(0, 30) + '...' : c.selection.text}"
                                </div>
                                )}
                                <div>{c.text}</div>
                                {isInputOpen && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                                    <span>{new Date(c.timestamp).toLocaleTimeString()}</span>
                                    <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteComment(artifactId, c.id);
                                    }}
                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                    >
                                    {t('chat.comment.delete')}
                                    </button>
                                </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Input Area */}
                {isInputOpen && (
                <>
                    {selection && showCommentInput?.line === line && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', borderLeft: '2px solid var(--primary-color)', paddingLeft: '4px', fontStyle: 'italic', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderBottom: '1px solid #fde047' }}>
                        Selected: "{selection.text.length > 30 ? selection.text.substring(0, 30) + '...' : selection.text}"
                    </div>
                    )}
                    <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={t('chat.comment.placeholder')}
                    autoFocus
                    style={{
                        width: '100%',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '6px',
                        fontSize: '12px',
                        minHeight: '60px',
                        outline: 'none',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        resize: 'vertical'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(artifactId, line, selection);
                        }
                    }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button 
                        onClick={() => {
                            setShowCommentInput(null);
                            setCommentText('');
                            setSelection(null);
                        }}
                        style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        {t('chat.comment.cancel')}
                    </button>
                    <button 
                        onClick={() => handleAddComment(artifactId, line, selection)}
                        style={{ fontSize: '11px', padding: '4px 8px', border: 'none', background: 'var(--primary-color)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        {t('chat.comment.send')}
                    </button>
                    </div>
                </>
                )}
            </div>
            )}
        </div>
      </>
    );
  };

  const closeTab = (artifactId, e) => {
    e.stopPropagation();
    const index = artifactTabs.findIndex(t => t.id === artifactId);
    const newTabs = artifactTabs.filter(t => t.id !== artifactId);
    setArtifactTabs(newTabs);
    
    if (activeTabId === artifactId) {
        if (newTabs.length > 0) {
            const newIndex = index >= newTabs.length ? newTabs.length - 1 : index;
            setActiveTabId(newTabs[newIndex].id);
        } else {
            setActiveTabId(null);
            setShowPreview(false);
        }
    }
  };

  const handleArtifactClick = (artifact) => {
    if (!artifactTabs.some(t => t.id === artifact.id)) {
        setArtifactTabs(prev => [...prev, artifact]);
    }
    setActiveTabId(artifact.id);
    setShowPreview(true);
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      
      <style>{`
        ::selection {
          background-color: #fde047; /* Yellow highlight for selection */
          color: black;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      
      {/* 1. 左侧：历史会话 */}
      <div style={{ 
        width: '260px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRight: '1px solid var(--border-color)', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ 
          height: '64px',
          padding: '0 16px', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button 
            onClick={createNewSession}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            <Plus size={16} />
            {t('chat.new_session')}
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px', fontSize: '14px' }}>
              {t('chat.no_sessions')}
            </div>
          )}
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              style={{
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: currentSessionId === session.id ? 'var(--hover-bg)' : 'transparent',
                border: currentSessionId === session.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {currentSessionId === session.id ? (
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)'
                  }}>
                    <Logo size={14} />
                  </div>
                ) : (
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <Chat size={16} color="var(--text-secondary)" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.title || t('chat.new_session')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {session.lastMessage || '...'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 中间：对话区域 (Flex 1) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: '0' }}>
        {/* 消息列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
              <Logo size={80} />
              <p style={{ marginTop: '20px', fontSize: '18px', color: 'var(--text-secondary)' }}>{t('chat.start_new')}</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ 
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
                            wordBreak: 'break-word'
                        }}>
                            {msg.text}
                            {msg.isStreaming && <span className="cursor-blink">|</span>}
                        </div>

                        {/* Artifact Preview Button */}
                        {msg.artifact && (
                            <div 
                                onClick={() => handleArtifactClick(msg.artifact)}
                                style={{ 
                                    marginTop: '12px', 
                                    padding: '8px 12px', 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                {msg.artifact.type === 'terminal' ? <Terminal size={16} /> : <Box size={16} />}
                                <span style={{ fontWeight: '500' }}>{msg.artifact.title || 'Artifact'}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('preview.view')} &gt;</span>
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
            ))
          )}
          {isLoading && (
             <div style={{ display: 'flex', gap: '12px', paddingLeft: '44px' }}>
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    fontSize: '13px', color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                }}>
                    <div className="loading-dots">...</div>
                    <span>{t('chat.thinking')}</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 增强版输入区域 */}
          {/* Enhanced Input Area */}
          <div style={{ 
            padding: '16px 24px 32px', 
            backgroundColor: 'var(--bg-secondary)', 
            boxShadow: '0 -4px 20px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 20
          }}>
            {/* File Preview */}
            {files.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {files.map((file, idx) => (
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
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
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
                      width: '220px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px var(--shadow-color)',
                      zIndex: 40,
                      padding: '6px',
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
                            gap: '10px',
                            padding: '8px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
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
                            gap: '10px',
                            padding: '8px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
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
              </div>

              {/* Agent/Model Selectors */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    style={{
                      appearance: 'none',
                      border: 'none',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      outline: 'none',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  >
                    <option value="general">{t('chat.agent.general')}</option>
                    <option value="coder">{t('chat.agent.coder')}</option>
                    <option value="writer">{t('chat.agent.writer')}</option>
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
                        // Find the model object to update global config
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
                      fontSize: '12px',
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
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || isRecording}
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
                      <label style={{ cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title={t('chat.upload_file')}>
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
                      onClick={isLoading ? handleStop : handleSend}
                      disabled={(!input.trim() && files.length === 0) && !isLoading && !isRecording}
                      style={{
                          width: '32px',
                          height: '32px',
                          padding: 0,
                          backgroundColor: (!input.trim() && files.length === 0) && !isLoading && !isRecording ? 'var(--bg-tertiary)' : 'var(--primary-color)',
                          color: (!input.trim() && files.length === 0) && !isLoading && !isRecording ? 'var(--text-secondary)' : 'white',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: (!input.trim() && files.length === 0) && !isLoading && !isRecording ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                      }}
                  >
                      {isLoading ? <Square size={14} fill="currentColor" /> : <Send size={16} fill={(!input.trim() && files.length === 0) ? "none" : "currentColor"} />}
                  </button>
              </div>
            </div>
          </div>
      </div>

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
                                  <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
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
                                      onClick={() => setActiveFile(file)}
                                      style={{ 
                                          padding: '8px 12px', 
                                          cursor: 'pointer', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '8px',
                                          fontSize: '13px',
                                          backgroundColor: activeFile?.name === file.name ? 'var(--bg-secondary)' : 'transparent',
                                          color: activeFile?.name === file.name ? 'var(--primary-color)' : 'var(--text-primary)',
                                          borderLeft: activeFile?.name === file.name ? '2px solid var(--primary-color)' : '2px solid transparent'
                                      }}
                                  >
                                      <FileText size={14} />
                                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                  </div>
                              ))}
                          </div>

                          {/* Main: Editor */}
                          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                              {activeFile ? (
                                  <CodeEditor 
                                      content={activeFile.content || ''}
                                      language={activeFile.name.endsWith('.json') ? 'json' : (activeFile.name.endsWith('.py') ? 'python' : 'javascript')}
                                      onChange={handleFileContentChange}
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

      {/* 3. 产物预览区域 (Side-by-Side) */}
      {showPreview && (
        <div style={{
          flex: 1, // 1:1 split with chat area
          minWidth: '0', // Allow shrinking
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          {/* Header - Tab Bar */}
          <div style={{ 
            height: '48px', 
            padding: '0 8px', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: 'var(--bg-tertiary)',
            gap: '8px'
          }}>
            {/* 1. Real-time Tracking Toggle (Left) */}
            <button
                onClick={() => setIsArtifactTracking(!isArtifactTracking)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isArtifactTracking ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    color: isArtifactTracking ? '#22c55e' : 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => !isArtifactTracking && (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                onMouseLeave={e => !isArtifactTracking && (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Auto-switch to new artifacts"
            >
                <Crosshair size={14} />
                {t('chat.tracking')}
            </button>

            {/* 2. Divider */}
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

            {/* 3. Tabs Container (Middle - Scrollable) */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                overflowX: 'auto', 
                height: '100%', 
                alignItems: 'center',
                gap: '4px',
                paddingRight: '8px'
            }}>
                {artifactTabs.map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        style={{
                            padding: '6px 10px',
                            cursor: 'pointer',
                            backgroundColor: activeTabId === tab.id ? 'var(--bg-secondary)' : 'transparent',
                            borderRadius: '6px',
                            border: activeTabId === tab.id ? '1px solid var(--border-color)' : '1px solid transparent',
                            color: activeTabId === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '0', 
                            maxWidth: '160px',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                        onMouseEnter={e => activeTabId !== tab.id && (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                        onMouseLeave={e => activeTabId !== tab.id && (e.currentTarget.style.backgroundColor = 'transparent')}
                        title={tab.title}
                    >
                        <span style={{ flexShrink: 0, display: 'flex', color: activeTabId === tab.id ? 'var(--primary-color)' : 'currentColor' }}>
                            {/* Icon Logic */}
                            {(() => {
                                const type = tab.type || 'code';
                                switch (type) {
                                    case 'terminal': return <Terminal size={14} />;
                                    case 'html': return <Layout size={14} />;
                                    case 'image': return <Image size={14} />;
                                    case 'markdown': return <FileText size={14} />;
                                    default: return <Code size={14} />;
                                }
                            })()}
                        </span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {tab.title || t('preview.title')}
                        </span>
                        
                        {/* Close Button */}
                        <div 
                            onClick={(e) => closeTab(tab.id, e)}
                            style={{ 
                                padding: '2px', 
                                borderRadius: '4px', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: 0.6
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <X size={12} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Sidebar Close Button (Right) */}
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setShowPreview(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Close Sidebar"
                >
                  <X size={16} />
                </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0', backgroundColor: activeArtifact?.type === 'terminal' || activeArtifact?.type === 'code' ? 'var(--code-bg)' : 'var(--bg-secondary)' }}>
            {activeArtifact ? (
                <>
                {activeArtifact.type === 'code' && (
                    <div style={{ padding: '20px' }}>
                      <SyntaxHighlighter 
                        language={(() => {
                            const map = {
                                'js': 'javascript',
                                'jsx': 'javascript',
                                'ts': 'typescript',
                                'tsx': 'typescript',
                                'py': 'python',
                                'python': 'python',
                                'sql': 'sql',
                                'html': 'html',
                                'css': 'css',
                                'json': 'json',
                                'md': 'markdown',
                                'markdown': 'markdown',
                                'yml': 'yaml',
                                'yaml': 'yaml',
                                'sh': 'bash',
                                'bash': 'bash',
                                'shell': 'bash',
                                'java': 'java',
                                'go': 'go',
                                'rust': 'rust',
                                'c': 'c',
                                'cpp': 'cpp',
                                'c++': 'cpp'
                            };
                            
                            if (activeArtifact.language) {
                                const lang = activeArtifact.language.toLowerCase();
                                return map[lang] || lang;
                            }
    
                            if (activeArtifact.title) {
                                const ext = activeArtifact.title.split('.').pop().toLowerCase();
                                return map[ext] || 'text';
                            }
                            return 'text';
                        })()} 
                        style={theme === 'dark' ? vscDarkPlus : coy} 
                        showLineNumbers={false}
                        wrapLines={true}
                        wrapLongLines={true}
                        lineProps={(lineNumber) => ({
                          style: { 
                            display: 'block', 
                            cursor: 'pointer',
                            position: 'relative'
                          },
                          className: 'code-line'
                        })}
                        renderer={({ rows, stylesheet, useInlineStyles }) => {
                      return rows.map((row, i) => {
                        const lineNumber = i + 1;
                        const hasComment = comments[activeArtifact.id]?.some(c => c.line === lineNumber);
                        
                        return (
                          <div 
                            key={i} 
                            style={{ 
                                position: 'relative', 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                backgroundColor: 'transparent',
                                borderBottom: hasComment ? '1px dashed #fde047' : 'none'
                            }}
                            className="code-line-container"
                            onMouseEnter={(e) => {
                               setHoveredLine({ artifactId: activeArtifact.id, line: lineNumber });
                               const trigger = e.currentTarget.lastElementChild.querySelector('.comment-trigger');
                               if (trigger) trigger.style.opacity = 1;
                               if (hasComment) e.currentTarget.style.backgroundColor = 'rgba(253, 224, 71, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                               setHoveredLine(null);
                               const trigger = e.currentTarget.lastElementChild.querySelector('.comment-trigger');
                               if (trigger) trigger.style.opacity = 0;
                               e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                             <span style={{ 
                                 display: 'inline-block', 
                                 minWidth: '2.5em', 
                                 paddingRight: '1em', 
                                 textAlign: 'right', 
                                 userSelect: 'none', 
                                 color: 'var(--text-secondary)', 
                                 opacity: 0.5 
                             }}>
                                 {lineNumber}
                             </span>
                             <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                 {row.children && row.children.map((child, k) => {
                                     if (child.type === 'text') {
                                         return child.value;
                                     } else if (child.tagName) {
                                         const style = { ...child.properties?.style };
                                         if (stylesheet && child.properties?.className) {
                                             child.properties.className.forEach(className => {
                                                 if (stylesheet[className]) {
                                                     Object.assign(style, stylesheet[className]);
                                                 }
                                             });
                                         }
    
                                         return (
                                           <span 
                                             key={k} 
                                             className={child.properties?.className?.join(' ')} 
                                             style={style}
                                           >
                                             {child.children && child.children.map(c => c.value || (c.children && c.children[0] ? c.children[0].value : '')).join('')}
                                           </span>
                                         );
                                     }
                                     return null;
                                 })}
                             </span>
                             <div style={{ position: 'relative', width: '20px', height: '100%' }}>
                                {renderCommentMarker(activeArtifact.id, lineNumber)}
                             </div>
                          </div>
                        );
                      });
                    }}
                        customStyle={{ 
                          margin: 0, 
                          background: 'transparent',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}
                        codeTagProps={{
                          style: { fontFamily: '"JetBrains Mono", monospace' }
                        }}
                      >
                        {activeArtifact.content.replace(/^\s*\d+[\.\s]\s*/gm, '')}
                      </SyntaxHighlighter>
                    </div>
                  )}
                {activeArtifact.type === 'markdown' && (
                  <div className="markdown-body" style={{ padding: '20px', position: 'relative' }}>
                    <ReactMarkdown
                      components={{
                        code: ({node, inline, className, children, ...props}) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : '';
                          const map = {
                              'js': 'javascript',
                              'jsx': 'javascript',
                              'ts': 'typescript',
                              'tsx': 'typescript',
                              'py': 'python',
                              'python': 'python',
                              'sql': 'sql',
                              'html': 'html',
                              'css': 'css',
                              'json': 'json',
                              'md': 'markdown',
                              'markdown': 'markdown',
                              'yml': 'yaml',
                              'yaml': 'yaml',
                              'sh': 'bash',
                              'bash': 'bash',
                              'shell': 'bash',
                              'java': 'java',
                              'go': 'go',
                              'rust': 'rust',
                              'c': 'c',
                              'cpp': 'cpp',
                              'c++': 'cpp'
                          };
                          const normalizedLang = map[lang.toLowerCase()] || lang;
    
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={theme === 'dark' ? vscDarkPlus : coy}
                              language={normalizedLang}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/^\s*\d+[\.\s]\s*/gm, '').replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({node, children}) => {
                           const line = node.position?.start?.line;
                           const hasComment = comments[activeArtifact.id]?.some(c => c.line === line);
                           
                           return (
                               <div 
                                   style={{ 
                                       position: 'relative', 
                                       marginBottom: '16px',
                                       backgroundColor: 'transparent',
                                       borderBottom: hasComment ? '2px solid #fde047' : 'none',
                                       cursor: hasComment ? 'pointer' : 'text'
                                   }}
                                   onMouseUp={(e) => handleSelection(e)}
                                   onMouseEnter={(e) => {
                                       if (line) setHoveredLine({ artifactId: activeArtifact.id, line });
                                       const trigger = e.currentTarget.querySelector('.comment-trigger');
                                       if (trigger) trigger.style.opacity = 1;
                                       if (hasComment) e.currentTarget.style.backgroundColor = 'rgba(253, 224, 71, 0.1)';
                                   }}
                                   onMouseLeave={(e) => {
                                       setHoveredLine(null);
                                       const trigger = e.currentTarget.querySelector('.comment-trigger');
                                       if (trigger) trigger.style.opacity = 0;
                                       e.currentTarget.style.backgroundColor = 'transparent';
                                   }}
                               >
                                   <p style={{ margin: 0, paddingRight: '20px' }}>{children}</p>
                                   {line && renderCommentMarker(activeArtifact.id, line)}
                               </div>
                           )
                        },
                        h1: ({node, children}) => {
                            const line = node.position?.start?.line;
                            const hasComment = comments[activeArtifact.id]?.some(c => c.line === line);
    
                            return (
                            <div style={{ 
                                    position: 'relative',
                                    backgroundColor: 'transparent',
                                    borderBottom: hasComment ? '2px solid #fde047' : 'none',
                                    cursor: hasComment ? 'pointer' : 'text'
                                 }} 
                                 onMouseUp={(e) => handleSelection(e)}
                                 onMouseEnter={(e) => {
                                    if (line) setHoveredLine({ artifactId: activeArtifact.id, line });
                                    const trigger = e.currentTarget.querySelector('.comment-trigger');
                                    if (trigger) trigger.style.opacity = 1;
                                    if (hasComment) e.currentTarget.style.backgroundColor = 'rgba(253, 224, 71, 0.1)';
                                 }}
                                 onMouseLeave={(e) => {
                                    setHoveredLine(null);
                                    const trigger = e.currentTarget.querySelector('.comment-trigger');
                                    if (trigger) trigger.style.opacity = 0;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                 }}>
                                <h1 style={{ paddingRight: '20px' }}>{children}</h1>
                                {line && renderCommentMarker(activeArtifact.id, line)}
                            </div>
                        )},
                        h2: ({node, children}) => {
                            const line = node.position?.start?.line;
                            const hasComment = comments[activeArtifact.id]?.some(c => c.line === line);
    
                            return (
                            <div style={{ 
                                    position: 'relative',
                                    backgroundColor: 'transparent',
                                    borderBottom: hasComment ? '2px solid #fde047' : 'none',
                                    cursor: hasComment ? 'pointer' : 'text'
                                 }}
                                 onMouseUp={(e) => handleSelection(e)}
                                 onMouseEnter={(e) => {
                                    if (line) setHoveredLine({ artifactId: activeArtifact.id, line });
                                    const trigger = e.currentTarget.querySelector('.comment-trigger');
                                    if (trigger) trigger.style.opacity = 1;
                                    if (hasComment) e.currentTarget.style.backgroundColor = 'rgba(253, 224, 71, 0.1)';
                                 }}
                                 onMouseLeave={(e) => {
                                    setHoveredLine(null);
                                    const trigger = e.currentTarget.querySelector('.comment-trigger');
                                    if (trigger) trigger.style.opacity = 0;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                 }}>
                                <h2 style={{ paddingRight: '20px' }}>{children}</h2>
                                {line && renderCommentMarker(activeArtifact.id, line)}
                            </div>
                        )},
                        li: ({node, children}) => {
                            const line = node.position?.start?.line;
                            const hasComment = comments[activeArtifact.id]?.some(c => c.line === line);
    
                            return (
                            <li style={{ 
                                    position: 'relative',
                                    backgroundColor: 'transparent',
                                    borderBottom: hasComment ? '2px solid #fde047' : 'none',
                                    cursor: hasComment ? 'pointer' : 'text'
                                 }}
                                 onMouseUp={(e) => handleSelection(e)}
                                 onMouseEnter={(e) => {
                                    if (line) setHoveredLine({ artifactId: activeArtifact.id, line });
                                    const trigger = e.currentTarget.querySelector('.comment-trigger');
                                    if (trigger) trigger.style.opacity = 1;
                                    if (hasComment) e.currentTarget.style.backgroundColor = 'rgba(253, 224, 71, 0.1)';
                                 }}
                                 onMouseLeave={(e) => {
                                    setHoveredLine(null);
                                    const trigger = e.currentTarget.querySelector('.comment-trigger');
                                    if (trigger) trigger.style.opacity = 0;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                 }}>
                                <span style={{ paddingRight: '20px' }}>{children}</span>
                                {line && renderCommentMarker(activeArtifact.id, line)}
                            </li>
                        )}
                      }}
                    >
                        {activeArtifact.content}
                    </ReactMarkdown>
                  </div>
                )}
                {activeArtifact.type === 'html' && (
                  <iframe 
                    srcDoc={activeArtifact.content} 
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }} 
                    title="preview"
                  />
                )}
                {activeArtifact.type === 'terminal' && (
                  <div style={{ 
                    padding: '20px', 
                    fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
                    fontSize: '14px',
                    color: theme === 'dark' ? '#d4d4d4' : '#333',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}>
                    {activeArtifact.content}
                  </div>
                )}
                </>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                    {t('preview.no_artifact') || 'No artifact selected'}
                </div>
            )}
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
                        setInput(prev => prev + (prev ? " " : "") + `Thinking Process: calling ${selectedMcpTool.name}...`); 
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

    </div>
  );
};

export default ChatPage;