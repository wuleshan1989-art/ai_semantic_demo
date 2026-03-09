import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { translations } from './translations';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const getBrowserLanguage = () => {
    const lang = navigator.language || navigator.userLanguage;
    return lang && lang.startsWith('zh') ? 'zh' : 'en';
  };

  const [language, setLanguage] = useState(getBrowserLanguage());
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
      // Check auth status on mount
      const checkAuth = async () => {
          try {
              const res = await axios.get('http://localhost:3001/api/auth/current-user');
              if (res.data) {
                  setUser(res.data);
                  setIsAuthenticated(true);
              }
          } catch (e) {
              console.log('Not authenticated');
          } finally {
              setLoadingAuth(false);
          }
      };
      checkAuth();
  }, []);

  const login = async (code, source) => {
      try {
          let endpoint = 'http://localhost:3001/api/auth/feishu/callback';
          if (source === 'wechat') {
              endpoint = 'http://localhost:3001/api/auth/wechat/callback';
          }
          
          const res = await axios.post(endpoint, { code });
          if (res.data.user) {
              setUser(res.data.user);
              setIsAuthenticated(true);
              return res.data.user;
          }
      } catch (e) {
          console.error('Login failed', e);
          throw e;
      }
  };

  const loginWithPassword = async (username, password) => {
      try {
          const res = await axios.post('http://localhost:3001/api/auth/login', { username, password });
          if (res.data.user) {
              setUser(res.data.user);
              setIsAuthenticated(true);
              return res.data.user;
          }
      } catch (e) {
          console.error('Password login failed', e);
          throw e;
      }
  };

  const logout = async () => {
      try {
          await axios.post('http://localhost:3001/api/auth/logout');
          setUser(null);
          setIsAuthenticated(false);
      } catch (e) {
          console.error('Logout failed', e);
      }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Update document title based on language
  useEffect(() => {
    document.title = translations[language]?.['app.name'] || 'Knowledge Center';
  }, [language]);

  const [currentRepoId, setCurrentRepoId] = useState(''); 
  const [repositories, setRepositories] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [branches, setBranches] = useState([]);
  const [userRole, setUserRole] = useState('viewer'); // 'admin', 'developer', 'visitor'

  // --- LLM Config ---
  const [llmConfig, setLlmConfig] = useState(null);

  useEffect(() => {
      const loadConfig = () => {
        const savedConfig = localStorage.getItem('llm_config');
        if (savedConfig) {
            setLlmConfig(JSON.parse(savedConfig));
        } else {
            // Default Doubao Config
            const defaultConfig = {
                provider: 'doubao',
                apiKey: '5f01e800-04df-4195-9a48-a7909f5ea7f2',
                baseUrl: 'https://ark-cn-beijing.bytedance.net/api/v3/chat/completions',
                modelName: 'ep-20250609110517-6zp6k',
                embeddingModel: 'text-embedding-3-small',
                maxTokens: 4096,
                temperature: 0.7
            };
            setLlmConfig(defaultConfig);
            localStorage.setItem('llm_config', JSON.stringify(defaultConfig));
        }
      };
      loadConfig();
      // Listen for storage changes from other tabs
      window.addEventListener('storage', loadConfig);
      return () => window.removeEventListener('storage', loadConfig);
  }, []);

  const updateLlmConfig = (newConfig) => {
      setLlmConfig(newConfig);
      localStorage.setItem('llm_config', JSON.stringify(newConfig));
      // Dispatch event for other tabs
      // window.dispatchEvent(new Event('storage')); // Not needed for same window if we use context
  };

  // --- Scheduler Tasks ---
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
      try {
          const res = await axios.get('http://localhost:3001/api/tasks');
          setTasks(res.data);
      } catch (e) {
          console.error('Failed to fetch tasks', e);
      }
  };

  useEffect(() => {
      fetchTasks();
  }, []);

  // --- Skills Management ---
  const [skills, setSkills] = useState([
    { id: 'web_search', name: 'Web Search', description: 'Search the internet for real-time information', type: 'official', enabled: true },
    { id: 'code_analysis', name: 'Code Analysis', description: 'Deep static analysis of code quality and security', type: 'official', enabled: true },
    { id: 'img_gen', name: 'Image Generation', description: 'Generate images from text descriptions', type: 'official', enabled: false },
    // Mock custom skills (will be filtered by currentRepoId in UI)
    // We'll assign them to the first repo ID found or just use a placeholder
    { 
        id: 'deploy_script', 
        name: 'Auto Deploy', 
        description: 'Deploy current project to staging', 
        type: 'custom', 
        repoId: 'repo-1', 
        enabled: true,
        files: [
            { name: 'index.js', content: '// Auto Deploy Script\n\nasync function deploy() {\n  console.log("Deploying to staging...");\n  // Add deployment logic here\n  await new Promise(r => setTimeout(r, 2000));\n  console.log("Deployment successful!");\n}\n\ndeploy();' },
            { name: 'manifest.json', content: '{\n  "name": "Auto Deploy",\n  "version": "1.0.0",\n  "permissions": ["network"]\n}' }
        ]
    },
    { 
        id: 'api_checker', 
        name: 'API Checker', 
        description: 'Validate API endpoints against spec', 
        type: 'custom', 
        repoId: 'repo-1', 
        enabled: false,
        files: [
            { name: 'check.py', content: 'import requests\n\ndef check_health(url):\n    resp = requests.get(url)\n    return resp.status_code == 200\n\nprint(check_health("http://localhost:3000/health"))' },
            { name: 'requirements.txt', content: 'requests==2.28.1' }
        ]
    },
  ]);

  const toggleSkill = (skillId) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSkillFiles = (skillId, newFiles) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, files: newFiles } : s));
  };

  useEffect(() => {
    // Dynamically assign repoId to mock custom skills once repos are loaded
    if (repositories.length > 0) {
        const firstRepoId = repositories[0].id;
        setSkills(prev => prev.map(s => {
            if (s.type === 'custom' && s.repoId === 'repo-1') {
                return { ...s, repoId: firstRepoId };
            }
            return s;
        }));
    }
  }, [repositories]);

  const fetchRepositories = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/repos');
      if (Array.isArray(response.data)) {
          setRepositories(response.data);
          
          // Select first available repo if none selected or current is invalid
          const currentExists = response.data.find(r => r.id === currentRepoId);
          if ((!currentRepoId || !currentExists) && response.data.length > 0) {
             const firstAvailable = response.data.find(r => r.permission !== 'no-access');
             if (firstAvailable) {
               setCurrentRepoId(firstAvailable.id);
             }
          }
      } else {
          console.error('Invalid repositories data format', response.data);
          setRepositories([]);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      // Retry with 127.0.0.1 if localhost fails
      try {
          const resRetry = await axios.get('http://127.0.0.1:3001/api/repos');
          if (Array.isArray(resRetry.data)) {
              setRepositories(resRetry.data);
              // Select logic again
               const currentExists = resRetry.data.find(r => r.id === currentRepoId);
                if ((!currentRepoId || !currentExists) && resRetry.data.length > 0) {
                    const firstAvailable = resRetry.data.find(r => r.permission !== 'no-access');
                    if (firstAvailable) {
                        setCurrentRepoId(firstAvailable.id);
                    }
                }
          }
      } catch (e) {
          console.error('Retry failed:', e);
      }
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []); // Run once on mount

  useEffect(() => {
     // Re-fetch if currentRepoId changes to ensure sync? 
     // No, usually we just need to load once. 
     // But if we want to refresh permissions when switching, we might need it.
     // For now, let's rely on the initial fetch.
  }, [currentRepoId]);

  useEffect(() => {
    if (currentRepoId && user) {
      const fetchRepoData = async () => {
        try {
          // Fetch branches
          const branchesRes = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/branches`);
          const branchList = branchesRes.data;
          setBranches(branchList);
          
          // Check if current branch exists in the new list
          // Handle both string array (legacy) and object array
          const branchExists = branchList.some(b => (typeof b === 'string' ? b === currentBranch : b.name === currentBranch));
          
          if (!branchExists && branchList.length > 0) {
            const firstBranch = branchList[0];
            setCurrentBranch(typeof firstBranch === 'string' ? firstBranch : firstBranch.name);
          }

          // Fetch members to determine role
          const membersRes = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/members`);
          // Mock logic: assume current user is "user-1" (User) or find by name
          // If super admin, force admin role for UI logic
          if (user.role === 'super_admin') {
              setUserRole('admin');
          } else {
              const me = membersRes.data.find(m => m.userId === user.userId);
              setUserRole(me ? me.role : 'visitor'); // Default to visitor if not found
          }
        } catch (error) {
          console.error('Failed to fetch repo data:', error);
          setUserRole('visitor');
        }
      };
      fetchRepoData();
    }
  }, [currentRepoId, user]);

  const refreshRepoData = async () => {
      if (currentRepoId && user) {
          try {
            const branchesRes = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/branches`);
            setBranches(branchesRes.data);
            
            const membersRes = await axios.get(`http://localhost:3001/api/repos/${currentRepoId}/members`);
            // Update role just in case
            if (user.role === 'super_admin') {
                setUserRole('admin');
            } else {
                const me = membersRes.data.find(m => m.userId === user.userId);
                setUserRole(me ? me.role : 'visitor');
            }
          } catch (error) {
            console.error('Failed to refresh repo data:', error);
          }
      }
  };

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || key;
    if (!text) return key;
    Object.keys(params).forEach(param => {
      // Escape the parameter key for regex safety
      const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        text = text.replace(new RegExp(`{${escapedParam}}`, 'g'), params[param]);
      } catch (e) {
        console.error('Regex error in translation', e);
      }
    });
    return text;
  };

  return (
    <AppContext.Provider value={{ 
      language, setLanguage, theme, setTheme, user, isAuthenticated, loadingAuth, login, loginWithPassword, logout, t, 
      currentRepoId, setCurrentRepoId, repositories,
      currentBranch, setCurrentBranch, branches, setBranches,
      userRole, skills, toggleSkill, updateSkillFiles,
      tasks, setTasks, fetchTasks,
      llmConfig, setLlmConfig: updateLlmConfig,
      refreshRepoData,
      refreshRepositories: fetchRepositories
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);