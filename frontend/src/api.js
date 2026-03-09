// API 配置 - 集中管理所有后端端点
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 60000,

  // API 端点
  endpoints: {
    // 认证
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      currentUser: '/api/auth/current-user',
      feishuLogin: '/api/auth/feishu/login',
      feishuCallback: '/api/auth/feishu/callback',
      wechatLogin: '/api/auth/wechat/login',
      wechatCallback: '/api/auth/wechat/callback',
    },

    // 仓库
    repos: {
      list: '/api/repos',
      files: (repoId) => `/api/repos/${repoId}/files`,
      branches: (repoId) => `/api/repos/${repoId}/branches`,
      members: (repoId) => `/api/repos/${repoId}/members`,
      mergeRequests: (repoId) => `/api/repos/${repoId}/merge-requests`,
      pull: (repoId) => `/api/repos/${repoId}/pull`,
    },

    // 文件
    files: {
      list: '/api/files',
      get: (id) => `/api/files/${id}`,
      update: (id) => `/api/files/${id}`,
      rename: (id) => `/api/files/${id}/rename`,
      create: '/api/files',
      delete: (id) => `/api/files/${id}`,
    },

    // 会话
    sessions: {
      list: '/api/sessions',
      create: '/api/sessions',
      get: (id) => `/api/sessions/${id}`,
    },

    // Agent
    agent: {
      chat: '/api/agent/chat',
    },

    // 追踪
    traces: {
      list: '/api/traces',
    },

    // 模型
    models: {
      list: '/api/models',
      create: '/api/models',
      update: (id) => `/api/models/${id}`,
      delete: (id) => `/api/models/${id}`,
    },

    // 语义服务
    semantic: {
      models: '/api/semantic-models',
      entity: '/api/semantic/entity',
      search: '/api/semantic/search',
      terminal: '/api/semantic/terminal',
    },

    // 数据源
    datasource: {
      config: '/api/datasource/config',
      hiveMetadata: '/api/datasource/hive/metadata',
    },

    // SQL
    sql: {
      execute: '/api/sql/execute',
    },

    // MCP
    mcp: {
      tools: '/api/mcp/tools',
      userConfig: '/api/mcp/user-config',
      call: '/api/mcp/call',
      register: '/api/mcp/register',
      callTool: (id) => `/api/mcp/tools/${id}`,
    },

    // 任务
    tasks: {
      list: '/api/tasks',
      create: '/api/tasks',
      update: (id) => `/api/tasks/${id}`,
      delete: (id) => `/api/tasks/${id}`,
      run: (id) => `/api/tasks/${id}/run`,
    },

    // 评估
    eval: {
      sets: '/api/eval-sets',
      set: (id) => `/api/eval-sets/${id}`,
      setFields: (id) => `/api/eval-sets/${id}/fields`,
      setPermissions: (id) => `/api/eval-sets/${id}/permissions`,
      setTraces: (setId, traceId) => `/api/eval-sets/${setId}/traces/${traceId}`,
      importTraces: '/api/eval-sets/import-traces',
      runs: (setId) => `/api/eval-sets/${setId}/runs`,
      createRun: (setId) => `/api/eval-sets/${setId}/runs`,
      runDetail: (runId) => `/api/eval-runs/${runId}`,
      diff: (setId, traceId) => `/api/eval-sets/${setId}/traces/${traceId}/diff`,
    },
  },
};

// 辅助函数：获取完整 URL
export function getApiUrl(endpoint) {
  return `${apiConfig.baseURL}${endpoint}`;
}

export default apiConfig;
