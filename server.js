const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Agent = require('./agent');
const mcpServer = require('./mcp-server'); // MCP Integration
const sqlite3 = require('sqlite3').verbose();

// --- SQLite Database Setup ---
const db = new sqlite3.Database(':memory:'); // Use in-memory DB for testing

db.serialize(() => {
  // 1. Users Table
  db.run(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    city TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 2. Products Table
  db.run(`CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL,
    sku TEXT
  )`);

  // 3. Orders Table
  db.run(`CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    product_id TEXT,
    amount REAL,
    status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

    // 4. Categories Table
    db.run(`CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT,
        parent_id TEXT
    )`);

    // 5. Customers Table
    db.run(`CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT,
        segment TEXT,
        country TEXT
    )`);

    // 6. Stores Table
    db.run(`CREATE TABLE stores (
        id TEXT PRIMARY KEY,
        name TEXT,
        city TEXT,
        region_id TEXT
    )`);

    // 7. Regions Table
    db.run(`CREATE TABLE regions (
        id TEXT PRIMARY KEY,
        name TEXT
    )`);

    // 8. Suppliers Table
    db.run(`CREATE TABLE suppliers (
        id TEXT PRIMARY KEY,
        name TEXT
    )`);

    // 9. Dates Table
    db.run(`CREATE TABLE dates (
        date_key TEXT PRIMARY KEY,
        year INTEGER,
        quarter TEXT,
        month TEXT
    )`);

  // 10. Sales Table
  db.run(`CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    customer_id TEXT,
    store_id TEXT,
    date_key TEXT,
    amount REAL,
    status TEXT
  )`);

  // 11. Transactions Table
  db.run(`CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    amount REAL,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 12. Tasks Table (Scheduled Tasks)
  db.run(`CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    name TEXT,
    schedule TEXT,
    command TEXT,
    description TEXT,
    status TEXT,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Mock Data
  const stmtUsers = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
  stmtUsers.run("u1", "Alice", "New York", "alice@example.com", "2023-01-01 10:00:00");
  stmtUsers.run("u2", "Bob", "San Francisco", "bob@example.com", "2023-01-02 11:00:00");
  stmtUsers.run("u3", "Charlie", "New York", "charlie@example.com", "2023-01-03 12:00:00");
  stmtUsers.finalize();

  const stmtProducts = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?)");
  stmtProducts.run("p1", "Laptop", "Electronics", 1200.00, "LAP-001");
  stmtProducts.run("p2", "Phone", "Electronics", 800.00, "PHN-002");
  stmtProducts.run("p3", "Desk", "Furniture", 300.00, "DSK-003");
  stmtProducts.finalize();

  const stmtOrders = db.prepare("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)");
  stmtOrders.run("o1", "u1", "p1", 1200.00, "completed", "2023-01-05 10:00:00");
  stmtOrders.run("o2", "u2", "p2", 800.00, "pending", "2023-01-06 14:00:00");
  stmtOrders.run("o3", "u1", "p3", 300.00, "completed", "2023-01-07 09:00:00");
  stmtOrders.run("o4", "u3", "p1", 1200.00, "failed", "2023-01-08 16:00:00");
  stmtOrders.finalize();
  
  // Insert Data for Retail Analytics
  const stmtCategories = db.prepare("INSERT INTO categories VALUES (?, ?, ?)");
  stmtCategories.run("c1", "Electronics", null);
  stmtCategories.run("c2", "Computers", "c1");
  stmtCategories.finalize();

  const stmtCustomers = db.prepare("INSERT INTO customers VALUES (?, ?, ?, ?)");
  stmtCustomers.run("cust1", "John Doe", "Consumer", "USA");
  stmtCustomers.run("cust2", "Jane Smith", "Corporate", "Canada");
  stmtCustomers.finalize();

  const stmtRegions = db.prepare("INSERT INTO regions VALUES (?, ?)");
  stmtRegions.run("r1", "North America");
  stmtRegions.finalize();

  const stmtStores = db.prepare("INSERT INTO stores VALUES (?, ?, ?, ?)");
  stmtStores.run("s1", "Tech Store NY", "New York", "r1");
  stmtStores.finalize();

  const stmtSuppliers = db.prepare("INSERT INTO suppliers VALUES (?, ?)");
  stmtSuppliers.run("sup1", "Global Tech Supply");
  stmtSuppliers.finalize();

  const stmtDates = db.prepare("INSERT INTO dates VALUES (?, ?, ?, ?)");
  stmtDates.run("20230101", 2023, "Q1", "January");
  stmtDates.finalize();

  const stmtSales = db.prepare("INSERT INTO sales VALUES (?, ?, ?, ?, ?, ?, ?)");
  stmtSales.run("sale1", "p1", "cust1", "s1", "20230101", 1200.00, "completed");
  stmtSales.finalize();

  const stmtTrans = db.prepare("INSERT INTO transactions VALUES (?, ?, ?, ?, ?)");
  stmtTrans.run("t1", "acc1", 5000.00, "credit", "2023-01-10 10:00:00");
  stmtTrans.finalize();

  const stmtTasks = db.prepare("INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  stmtTasks.run("1", "Daily Semantic Mining", "0 0 * * *", "airs mine --all", "Run daily mining job", "active", "2024-05-19 00:00:00", "2024-05-20 00:00:00", 1, "2024-01-01 00:00:00");
  stmtTasks.run("2", "Weekly Knowledge Sync", "0 0 * * 0", "airs sync --remote", "Sync knowledge base", "idle", "2024-05-12 00:00:00", "2024-05-26 00:00:00", 1, "2024-01-01 00:00:00");
  stmtTasks.finalize();

  console.log("Mock SQLite Database initialized with tables: users, products, orders, sales, transactions, etc.");
});

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

const agent = new Agent();

// --- Auth & User Management ---
let currentUser = null; // Mock session for single user environment

app.get('/api/auth/feishu/login', (req, res) => {
  // Mock redirect to Feishu, which then redirects back to our frontend callback
  // In reality, this would be https://open.feishu.cn/open-apis/authen/v1/index...
  const redirectUri = 'http://localhost:3000/auth/callback';
  const mockCode = 'mock_feishu_auth_code_' + Date.now();
  res.redirect(`${redirectUri}?code=${mockCode}`);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Super Admin Check
  if (username && password && username.trim() === 'admin' && password.trim() === 'admin') {
      const adminUser = {
          userId: 'admin_001',
          name: 'Super Admin',
          avatar: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp',
          role: 'super_admin',
          email: 'admin@system.local'
      };
      currentUser = adminUser;
      
      // Auto-join all repos as admin
      repositories.forEach(repo => {
          if (!repo.members) repo.members = [];
          const existing = repo.members.find(m => m.userId === adminUser.userId);
          if (!existing) {
              repo.members.push({
                  userId: adminUser.userId,
                  name: adminUser.name,
                  avatar: adminUser.avatar,
                  role: 'super_admin'
              });
          } else {
              existing.role = 'super_admin'; // Ensure super_admin rights
          }
          // Grant access if permission was no-access
          if (repo.permission === 'no-access') {
              repo.permission = 'read-write'; // Unlock for this session context (mock behavior)
          }
      });
      
      return res.json({ user: adminUser });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/auth/wechat/login', (req, res) => {
  // Mock redirect to WeChat
  const redirectUri = 'http://localhost:3000/auth/callback';
  const mockCode = 'mock_wechat_auth_code_' + Date.now();
  res.redirect(`${redirectUri}?code=${mockCode}&source=wechat`);
});

app.post('/api/auth/wechat/callback', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  const mockWechatUser = {
    userId: 'wechat_user_' + code.substring(20),
    name: 'WeChat User',
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=WeChat',
    email: 'wechat@example.com',
    source: 'wechat'
  };

  currentUser = mockWechatUser;
  
  // Sync user logic (reused)
  repositories.forEach(repo => {
    if (!repo.members) repo.members = [];
    const existing = repo.members.find(m => m.userId === mockWechatUser.userId);
    if (!existing) {
      repo.members.push({
        userId: mockWechatUser.userId,
        name: mockWechatUser.name,
        avatar: mockWechatUser.avatar,
        role: 'visitor'
      });
    }
  });

  res.json({ user: mockWechatUser });
});

app.post('/api/auth/feishu/callback', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  // Mock fetching user info from Feishu
  const mockFeishuUser = {
    userId: 'feishu_user_001',
    name: 'Feishu User',
    avatar: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp',
    email: 'user@example.com'
  };

  currentUser = mockFeishuUser;

  // Sync user to repositories (Auto-join as visitor)
  repositories.forEach(repo => {
    if (!repo.members) repo.members = [];
    const existing = repo.members.find(m => m.userId === mockFeishuUser.userId);
    if (!existing) {
      repo.members.push({
        userId: mockFeishuUser.userId,
        name: mockFeishuUser.name,
        avatar: mockFeishuUser.avatar,
        role: 'visitor' // Default role
      });
    }
  });

  res.json({ user: mockFeishuUser });
});

app.get('/api/auth/current-user', (req, res) => {
  if (currentUser) {
    res.json(currentUser);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  currentUser = null;
  res.json({ success: true });
});

// --- 内存数据存储 ---

// 用户工具配置存储
// 结构: { [userId]: [disabledToolId1, disabledToolId2, ...] }
const userToolConfigs = {};

// 会话存储 - 预置 Mock 数据
const sessions = {
  'session-1': {
    id: 'session-1',
    title: 'React 组件生成',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 10000,
    messages: [
      { text: '请写一个 React 计数器组件，包含增加和减少功能。', sender: 'user', timestamp: Date.now() - 20000 },
      { 
        text: '好的，这是一个包含增加、减少和重置功能的 React 计数器组件。你可以直接复制使用。', 
        sender: 'agent', 
        timestamp: Date.now() - 10000,
        steps: [
          { type: 'thought', content: '用户需要一个 React 计数器组件' },
          { type: 'thought', content: '组件功能：增加、减少、重置' },
          { type: 'action', content: '编写 Counter.js 代码' }
        ],
        artifact: {
          id: 'art-counter-1',
          type: 'code',
          title: 'Counter.js',
          language: 'javascript',
          content: `import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>计数器: {count}</h2>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button onClick={() => setCount(count + 1)}>+ 增加</button>
        <button onClick={() => setCount(count - 1)}>- 减少</button>
        <button onClick={() => setCount(0)} style={{ backgroundColor: '#ff4d4f', color: 'white' }}>重置</button>
      </div>
    </div>
  );
};

export default Counter;`
        }
      }
    ]
  },
  'session-5': {
    id: 'session-5',
    title: '多轮对话演示',
    createdAt: Date.now() - 60000,
    updatedAt: Date.now(),
    messages: [
      { text: '我想分析一下这个电商项目的销售数据，有什么建议吗？', sender: 'user', timestamp: Date.now() - 50000 },
      {
        text: '我可以帮你从以下几个维度进行分析：\n1. **总体销售趋势**：查看最近几个月的收入变化。\n2. **用户增长**：分析新老用户比例和活跃度。\n3. **热门商品**：识别最畅销的产品类别。\n\n你想先看哪个？',
        sender: 'agent',
        timestamp: Date.now() - 45000,
        steps: [
            { type: 'thought', content: '用户请求分析销售数据' },
            { type: 'thought', content: '检索可用数据源：orders, users, products' },
            { type: 'action', content: '生成分析建议方案' }
        ]
      },
      { text: '先看总体销售趋势吧，最好能生成一个图表。', sender: 'user', timestamp: Date.now() - 40000 },
      {
        text: '正在为你查询最近半年的销售数据...',
        sender: 'agent',
        timestamp: Date.now() - 35000,
        steps: [
            { type: 'thought', content: '用户选择：总体销售趋势' },
            { type: 'action', content: 'Execute SQL: SELECT date_trunc(\'month\', created_at) as month, sum(amount) as revenue FROM orders GROUP BY 1 ORDER BY 1 DESC LIMIT 6' },
            { type: 'observation', content: 'Data retrieved: 6 rows' }
        ],
        isStreaming: false
      },
      {
        text: '这是最近半年的月度销售收入趋势图。可以看出 Q4 季度有显著增长，可能是受促销活动影响。',
        sender: 'agent',
        timestamp: Date.now() - 30000,
        steps: [
            { type: 'thought', content: '处理查询结果' },
            { type: 'action', content: '生成 ECharts 可视化配置' }
        ],
        artifact: {
            id: 'art-chart-1',
            type: 'html',
            title: 'Revenue Trend Chart',
            content: `<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>body{margin:0;padding:20px;height:100vh;display:flex;flex-direction:column;}</style>
</head>
<body>
    <div id="chart" style="width:100%;height:300px;"></div>
    <script>
        var chart = echarts.init(document.getElementById('chart'));
        var option = {
            title: { text: 'Monthly Revenue Trend' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
            yAxis: { type: 'value' },
            series: [{
                data: [12000, 15000, 28000, 18000, 22000, 25000],
                type: 'line',
                smooth: true,
                areaStyle: {}
            }]
        };
        chart.setOption(option);
    </script>
</body>
</html>`
        }
      },
      { text: '能不能再帮我写一个查询 SQL，我想看下各城市的销售额排名？', sender: 'user', timestamp: Date.now() - 20000 },
      {
        text: '好的，这是查询各城市销售额排名的 SQL 语句，已经按销售额降序排列。',
        sender: 'agent',
        timestamp: Date.now() - 10000,
        steps: [
            { type: 'thought', content: '用户请求：城市销售额排名 SQL' },
            { type: 'thought', content: '关联表：orders (amount), users (city)' },
            { type: 'action', content: '构建 SQL 查询' }
        ],
        artifact: {
            id: 'art-sql-1',
            type: 'code',
            title: 'top_cities_revenue.sql',
            language: 'sql',
            content: `SELECT 
    u.city,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_revenue
FROM orders o
JOIN users u ON o.user_id = u.id
GROUP BY u.city
ORDER BY total_revenue DESC
LIMIT 10;`
        }
      }
    ]
  },
  'session-4': {
    id: 'session-4',
    title: '终端命令执行',
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 1000,
    messages: [
      { text: '帮我安装 react-router-dom 并检查 git 状态', sender: 'user', timestamp: Date.now() - 5000 },
      { 
        text: '好的，正在执行...', 
        sender: 'agent', 
        timestamp: Date.now() - 1000,
        steps: [
          { type: 'thought', content: '用户请求执行 npm 和 git 命令' },
          { type: 'action', content: 'Execute: npm install react-router-dom' },
          { type: 'action', content: 'Execute: git status' }
        ],
        artifact: {
          id: 'art-cmd-1',
          type: 'terminal',
          title: 'Command Output',
          content: `> npm install react-router-dom

added 12 packages, and audited 15 packages in 2s

3 packages are looking for funding
  run \`npm fund\` for details

found 0 vulnerabilities

> git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`
        }
      }
    ]
  },
  'session-2': {
    id: 'session-2',
    title: '项目 README 模板',
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 50000,
    messages: [
      { text: '帮我生成一份开源项目的 README.md 模板，包含安装和使用说明。', sender: 'user', timestamp: Date.now() - 60000 },
      { 
        text: '没问题，这是一份标准的 README 模板，包含项目简介、安装步骤、使用指南和贡献说明。', 
        sender: 'agent', 
        timestamp: Date.now() - 50000,
        steps: [
            { type: 'thought', content: '用户请求生成 README 模板' },
            { type: 'thought', content: '确定模板结构：简介、安装、使用、贡献' },
            { type: 'action', content: '生成 Markdown 内容' }
        ],
        artifact: {
          id: 'art-readme-1',
          type: 'markdown',
          title: 'README.md',
          content: `# Project Name

这是一个很棒的开源项目。

## ✨ 特性

- 🚀 快速启动
- 📦 开箱即用
- 🎨 易于定制

## 🛠️ 安装

\`\`\`bash
npm install my-project
\`\`\`

## 📖 使用

\`\`\`javascript
import myProject from 'my-project';

myProject.start();
\`\`\`

## 🤝 贡献

欢迎提交 Pull Request！

## 📄 许可证

MIT License`
        }
      }
    ]
  },
  'session-3': {
    id: 'session-3',
    title: '个人主页预览',
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 80000,
    messages: [
      { text: '我想做一个简单的个人主页，风格要简约现代，帮我生成一个预览。', sender: 'user', timestamp: Date.now() - 90000 },
      { 
        text: '好的，这是为你设计的个人主页预览，采用了极简风格，包含头像、简介和社交链接。', 
        sender: 'agent', 
        timestamp: Date.now() - 80000,
        steps: [
            { type: 'thought', content: '用户请求设计个人主页 HTML' },
            { type: 'thought', content: '风格：简约现代' },
            { type: 'action', content: '编写 HTML 和 CSS 代码' },
            { type: 'action', content: '生成预览' }
        ],
        artifact: {
          id: 'art-html-1',
          type: 'html',
          title: 'index.html',
          content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
    .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 300px; }
    .avatar { width: 100px; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; }
    h1 { margin: 0 0 10px; color: #333; }
    p { color: #666; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #333; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="avatar"></div>
    <h1>Alex Doe</h1>
    <p>全栈开发者 / UI 设计师<br>热爱创造美好的事物</p>
    <a href="#" class="btn">联系我</a>
  </div>
</body>
</html>`
        }
      }
    ]
  }
};

// 文件存储 (模拟)
// 结构：{ repoId: { files: [...] } }
const repositories = [
  { 
    id: 'repo-ecommerce', 
    name: 'E-Commerce Analytics', 
    permission: 'read-write', 
    logo: '🛒',
    dataSource: {
      type: 'sqlite',
      host: 'localhost',
      database: 'e-commerce-analytics.db',
      status: 'connected'
    },
    branches: [
      { name: 'main', owner: 'system', collaborators: [] },
      { name: 'dev', owner: 'user-2', collaborators: [] },
      { name: 'feature/new-metrics', owner: 'user-2', collaborators: [] }
    ],
    members: [
      { userId: 'user-1', name: 'User', role: 'admin', avatar: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp' },
      { userId: 'user-2', name: 'Alice', role: 'developer', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alice' },
      { userId: 'user-3', name: 'Bob', role: 'visitor', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bob' }
    ]
  },
  { 
    id: 'repo-finance', 
    name: 'Finance Reporting', 
    permission: 'read-only', 
    logo: '💰',
    branches: [
      { name: 'main', owner: 'system', collaborators: [] }
    ],
    members: [
      { userId: 'user-1', name: 'User', role: 'visitor', avatar: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp' },
      { userId: 'user-4', name: 'Charlie', role: 'admin', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie' }
    ]
  },
  { 
    id: 'repo-hr', 
    name: 'HR Data Warehouse', 
    permission: 'no-access', 
    logo: '👥',
    branches: [
      { name: 'main', owner: 'system', collaborators: [] }
    ],
    members: []
  }
];

const repoFiles = {
  'repo-ecommerce': [
    {
      id: 901,
      name: 'raw_data',
      type: 'directory',
      children: [
        { id: 301, name: 'docs', type: 'directory', children: [
          { 
            id: 302, 
            name: 'schema_guide.md', 
            type: 'file', 
            lastSynced: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            content: `# Schema Guide\n\nThis repository contains the data models for the E-commerce platform.\n\n## Conventions\n- Use snake_case for field names\n- Always include descriptions`,
            ragConfig: {
              embeddingModel: 'text-embedding-3-small',
              chunkSize: 512,
              chunkOverlap: 50,
              strategy: 'recursive'
            },
            chunks: [
              { id: 'c1', content: '# Schema Guide\n\nThis repository contains the data models for the E-commerce platform.', tokenCount: 15 },
              { id: 'c2', content: '## Conventions\n- Use snake_case for field names\n- Always include descriptions', tokenCount: 12 }
            ]
          },
          {
            id: 303,
            name: 'SpaceX_Starship.md',
            type: 'file',
            content: `# SpaceX Starship\n\nSpaceX Starship is a fully reusable launch vehicle and spacecraft that is being developed by SpaceX.\n\n## Overview\nStarship is designed to carry both crew and cargo to Earth orbit, the Moon, Mars, and beyond. The system consists of the Super Heavy booster and the Starship spacecraft.\n\n## Development\nDevelopment began in 2012, with the first prototype Starhopper flying in 2019. The first orbital flight test occurred in April 2023.`,
            graphRagConfig: {
              entityTypes: ['Organization', 'Spacecraft', 'Location', 'Event', 'Person'],
              maxGleanIterations: 1,
              communityLevel: 2,
              extractionPrompt: 'default'
            },
            knowledgeGraph: {
              nodes: [
                { id: 'SpaceX', label: 'SpaceX', type: 'Organization' },
                { id: 'Starship', label: 'Starship', type: 'Spacecraft' },
                { id: 'Super Heavy', label: 'Super Heavy', type: 'Spacecraft' },
                { id: 'Earth', label: 'Earth', type: 'Location' },
                { id: 'Moon', label: 'Moon', type: 'Location' },
                { id: 'Mars', label: 'Mars', type: 'Location' },
                { id: 'Starhopper', label: 'Starhopper', type: 'Spacecraft' },
                { id: 'Orbital Flight Test', label: 'Orbital Flight Test', type: 'Event' }
              ],
              edges: [
                { source: 'SpaceX', target: 'Starship', label: 'developed' },
                { source: 'Starship', target: 'Earth', label: 'destined for' },
                { source: 'Starship', target: 'Moon', label: 'destined for' },
                { source: 'Starship', target: 'Mars', label: 'destined for' },
                { source: 'SpaceX', target: 'Super Heavy', label: 'developed' },
                { source: 'Super Heavy', target: 'Starship', label: 'part of system' },
                { source: 'SpaceX', target: 'Starhopper', label: 'developed' },
                { source: 'Starhopper', target: 'Orbital Flight Test', label: 'preceded' }
              ]
            }
          }
        ]},
        { id: 401, name: 'queries', type: 'directory', children: [
          { id: 402, name: 'top_users.sql', type: 'file', content: `SELECT city, COUNT(*) as user_count 
    FROM users 
    GROUP BY city 
    ORDER BY user_count DESC 
    LIMIT 10;` }
        ]}
      ]
    },
    {
      id: 902,
      name: 'mined_data',
      type: 'directory',
      children: [
        { id: 101, name: 'models', type: 'directory', children: [
          { id: 102, name: 'orders.yml', type: 'file', lastSynced: new Date(Date.now() - 1000 * 60 * 5).toISOString(), content: `cubes:
  - name: orders
    sql: SELECT * FROM orders
    primaryKey: id

    joins:
      - name: users
        sql: "{CUBE}.user_id = {users}.id"
        relationship: many_to_one
      
      - name: dim_products
        sql: "{CUBE}.product_id = {dim_products}.id"
        relationship: many_to_one

    measures:
      - name: count
        type: count
      
      - name: total_amount
        sql: amount
        type: sum

    dimensions:
      - name: id
        sql: id
        type: string

      - name: status
        sql: status
        type: string
      
      - name: created_at
        sql: created_at
        type: time` },
          { id: 103, name: 'users.yml', type: 'file', lastSynced: new Date(Date.now() - 1000 * 60 * 30).toISOString(), content: `cubes:
  - name: users
    sql: SELECT * FROM users
    primaryKey: id

    measures:
      - name: count
        type: count

    dimensions:
      - name: id
        sql: id
        type: string

      - name: city
        sql: city
        type: string` },
          { id: 105, name: 'retail_analytics.yml', type: 'file', content: `cubes:
  - name: fact_sales
    sql: SELECT * FROM sales
    primaryKey: transaction_id
    
    joins:
      - name: dim_products
        sql: "{CUBE}.product_id = {dim_products}.id"
        relationship: many_to_one
      
      - name: dim_customers
        sql: "{CUBE}.customer_id = {dim_customers}.id"
        relationship: many_to_one
      
      - name: dim_stores
        sql: "{CUBE}.store_id = {dim_stores}.id"
        relationship: many_to_one
      
      - name: dim_date
        sql: "{CUBE}.date_key = {dim_date}.date_key"
        relationship: many_to_one

    measures:
      - name: total_revenue
        sql: amount
        type: sum
      - name: total_orders
        type: count
      - name: avg_order_value
        sql: "SUM(amount) / COUNT(*)"
        type: number

    dimensions:
      - name: transaction_id
        sql: id
        type: string
      - name: status
        sql: status
        type: string

  - name: dim_products
    sql: SELECT * FROM products
    primaryKey: product_id
    
    joins:
      - name: dim_categories
        sql: "{CUBE}.category = {dim_categories}.name"
        relationship: many_to_one

    dimensions:
      - name: product_id
        sql: id
        type: string
      - name: product_name
        sql: name
        type: string
      - name: sku
        sql: sku
        type: string

  - name: dim_categories
    sql: SELECT * FROM categories
    primaryKey: category_id
    dimensions:
      - name: category_id
        sql: id
        type: string
      - name: category_name
        sql: name
        type: string
      - name: parent_category
        sql: parent_id
        type: string

  - name: dim_customers
    sql: SELECT * FROM customers
    primaryKey: customer_id
    dimensions:
      - name: customer_id
        sql: id
        type: string
      - name: full_name
        sql: name
        type: string
      - name: segment
        sql: segment
        type: string
      - name: country
        sql: country
        type: string

  - name: dim_stores
    sql: SELECT * FROM stores
    primaryKey: store_id
    joins:
      - name: dim_regions
        sql: "{CUBE}.region_id = {dim_regions}.id"
        relationship: many_to_one
        
    dimensions:
      - name: store_id
        sql: id
        type: string
      - name: store_name
        sql: name
        type: string
      - name: city
        sql: city
        type: string

  - name: dim_regions
    sql: SELECT * FROM regions
    primaryKey: region_id
    dimensions:
      - name: region_id
        sql: id
        type: string
      - name: region_name
        sql: name
        type: string

  - name: dim_suppliers
    sql: SELECT * FROM suppliers
    primaryKey: supplier_id
    dimensions:
      - name: supplier_id
        sql: id
        type: string
      - name: supplier_name
        sql: name
        type: string
        
  - name: dim_date
    sql: SELECT * FROM dates
    primaryKey: date_key
    dimensions:
      - name: date_key
        sql: date_key
        type: string
      - name: year
        sql: year
        type: number
      - name: quarter
        sql: quarter
        type: string
      - name: month
        sql: month
        type: string` }
        ]},
        { id: 201, name: 'metrics', type: 'directory', children: [
          { id: 202, name: 'revenue_metrics.yml', type: 'file', content: `metrics:
  - name: monthly_revenue
    description: Total revenue per month
    type: number
    sql: sum(amount)
    owner: data-team` },
          { id: 2001, name: 'sales_metrics.yml', type: 'file', content: `metrics:
  - name: total_revenue
    sql: amount
    type: sum
  - name: total_orders
    type: count
  - name: avg_order_value
    sql: "SUM(amount) / COUNT(*)"
    type: number` },
          { id: 2002, name: 'orders_metrics.yml', type: 'file', content: `metrics:
  - name: count
    type: count
  - name: total_amount
    sql: amount
    type: sum` },
          { id: 2003, name: 'users_metrics.yml', type: 'file', content: `metrics:
  - name: count
    type: count` }
        ]},
        { id: 601, name: 'ontology', type: 'directory', children: [
          { id: 602, name: 'domain_ontology.owl', type: 'file', content: `<?xml version="1.0"?>
    <rdf:RDF xmlns="http://example.org/ontology#"
         xml:base="http://example.org/ontology"
         xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
    
        <owl:Ontology rdf:about="http://example.org/ontology"/>
    
        <!-- Classes -->
        <owl:Class rdf:about="#Person">
            <rdfs:label>Person</rdfs:label>
        </owl:Class>
    
        <owl:Class rdf:about="#Employee">
            <rdfs:subClassOf rdf:resource="#Person"/>
            <rdfs:label>Employee</rdfs:label>
        </owl:Class>
    
        <owl:Class rdf:about="#Manager">
            <rdfs:subClassOf rdf:resource="#Employee"/>
            <rdfs:label>Manager</rdfs:label>
        </owl:Class>
    
        <owl:Class rdf:about="#Department">
            <rdfs:label>Department</rdfs:label>
        </owl:Class>
    
        <owl:Class rdf:about="#Project">
            <rdfs:label>Project</rdfs:label>
        </owl:Class>
    
        <!-- Properties -->
        <owl:ObjectProperty rdf:about="#worksIn">
            <rdfs:domain rdf:resource="#Employee"/>
            <rdfs:range rdf:resource="#Department"/>
            <rdfs:label>works in</rdfs:label>
        </owl:ObjectProperty>
    
        <owl:ObjectProperty rdf:about="#manages">
            <rdfs:domain rdf:resource="#Manager"/>
            <rdfs:range rdf:resource="#Department"/>
            <rdfs:label>manages</rdfs:label>
        </owl:ObjectProperty>
    
        <owl:ObjectProperty rdf:about="#assignedTo">
            <rdfs:domain rdf:resource="#Employee"/>
            <rdfs:range rdf:resource="#Project"/>
            <rdfs:label>assigned to</rdfs:label>
        </owl:ObjectProperty>
    
    </rdf:RDF>` }
        ]},
        {
          id: 701,
          name: 'dimensions',
          type: 'directory',
          children: [
            {
              id: 702,
              name: 'dim_order_status.yml',
              type: 'file',
              content: `dimension:
  name: order_status
  description: The current status of the order transaction.
  type: string
  enums:
    - value: pending
      description: Order placed but not yet processed.
    - value: completed
      description: Order successfully processed and delivered.
    - value: failed
      description: Order processing failed due to payment or inventory issues.
    - value: cancelled
      description: Order cancelled by user or admin.`
            },
            {
              id: 703,
              name: 'dim_customer_segment.yml',
              type: 'file',
              content: `dimension:
  name: customer_segment
  description: Market segment classification for customers.
  type: string
  enums:
    - value: Consumer
      description: Individual retail customers.
    - value: Corporate
      description: Business and enterprise customers.
    - value: Home Office
      description: Small business or home office customers.`
            },
            { id: 2011, name: 'fact_sales_dims.yml', type: 'file', content: `dimensions:
  - name: transaction_id
    sql: id
    type: string
  - name: status
    sql: status
    type: string` },
            { id: 2012, name: 'products_dims.yml', type: 'file', content: `dimensions:
  - name: product_name
    sql: name
    type: string
  - name: sku
    sql: sku
    type: string` },
            { id: 2013, name: 'categories_dims.yml', type: 'file', content: `dimensions:
  - name: category_name
    sql: name
    type: string
  - name: parent_category
    sql: parent_id
    type: string` },
            { id: 2014, name: 'customers_dims.yml', type: 'file', content: `dimensions:
  - name: full_name
    sql: name
    type: string
  - name: segment
    sql: segment
    type: string
  - name: country
    sql: country
    type: string` },
            { id: 2015, name: 'stores_dims.yml', type: 'file', content: `dimensions:
  - name: store_name
    sql: name
    type: string
  - name: city
    sql: city
    type: string` },
            { id: 2016, name: 'regions_dims.yml', type: 'file', content: `dimensions:
  - name: region_name
    sql: name
    type: string` },
            { id: 2017, name: 'suppliers_dims.yml', type: 'file', content: `dimensions:
  - name: supplier_name
    sql: name
    type: string` },
            { id: 2018, name: 'date_dims.yml', type: 'file', content: `dimensions:
  - name: year
    sql: year
    type: number
  - name: quarter
    sql: quarter
    type: string
  - name: month
    sql: month
    type: string` },
            { id: 2019, name: 'users_dims.yml', type: 'file', content: `dimensions:
  - name: city
    sql: city
    type: string` },
            { id: 2020, name: 'orders_dims.yml', type: 'file', content: `dimensions:
  - name: status
    sql: status
    type: string
  - name: created_at
    sql: created_at
    type: time` }
          ]
        }
      ]
    }
  ],
  'repo-finance': [
    { id: 501, name: 'models', type: 'directory', children: [
      { id: 502, name: 'transactions.yml', type: 'file', content: `cubes:
  - name: transactions
    sql: SELECT * FROM transactions
    primaryKey: id
    dimensions:
      - name: id
        sql: id
        type: string` }
    ]}
  ]
};


// --- Merge Requests Store (Mock) ---
const mergeRequests = {
  'repo-ecommerce': [
    {
      id: 'mr-101',
      repoId: 'repo-ecommerce',
      title: 'Update user schema',
      description: 'Added new fields to user dimension',
      sourceBranch: 'feature/new-metrics',
      targetBranch: 'main',
      author: { name: 'Alice', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alice' },
      status: 'open', // open, merged, closed, conflict
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      reviewers: [
        { name: 'User', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix', status: 'approved' }
      ]
    }
  ]
};

// --- Git & Merge Request APIs ---

// 1. Pull from Master
app.post('/api/repos/:repoId/pull', (req, res) => {
  const { repoId } = req.params;
  const { branch } = req.body;
  
  // Simulate network delay
  setTimeout(() => {
    // 20% chance of updates
    if (Math.random() > 0.8) {
      res.json({ status: 'updated', message: 'Successfully pulled 2 commits from master.', files: ['models/users.yml', 'metrics/revenue.yml'] });
    } else {
      res.json({ status: 'up-to-date', message: 'Already up to date.' });
    }
  }, 1000);
});

// 2. List Merge Requests
app.get('/api/repos/:repoId/merge-requests', (req, res) => {
  const { repoId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  res.json(mrs);
});

// 3. Create Merge Request
app.post('/api/repos/:repoId/merge-requests', (req, res) => {
  const { repoId } = req.params;
  const { sourceBranch, targetBranch, title, description, author } = req.body;
  
  if (!mergeRequests[repoId]) mergeRequests[repoId] = [];
  
  // Simulate Conflict Check (10% chance)
  const hasConflict = Math.random() > 0.9;
  
  const newMR = {
    id: `mr-${Date.now()}`,
    repoId,
    title,
    description,
    sourceBranch,
    targetBranch,
    author: author || { name: 'Current User', avatar: '' },
    status: hasConflict ? 'conflict' : 'open',
    createdAt: new Date().toISOString(),
    reviewers: []
  };
  
  // Use unshift to add to the beginning of the array
  mergeRequests[repoId].unshift(newMR);
  console.log(`[MR] Created new MR: ${newMR.id} in repo ${repoId}`);
  
  res.json(newMR);
});

// 4. Get Merge Request Details (with Mock Diff)
app.get('/api/repos/:repoId/merge-requests/:mrId', (req, res) => {
  const { repoId, mrId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  // Dynamic Diff Generation based on branch content
  let diffs = [];
  if (repoFiles[repoId]) {
      const findChanges = (nodes, pathPrefix = '') => {
          nodes.forEach(node => {
              const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
              if (node.type === 'file' && node.branchContent && node.branchContent[mr.sourceBranch]) {
                  if (node.branchContent[mr.sourceBranch] !== node.content) {
                      diffs.push({
                          file: currentPath,
                          type: 'modified',
                          hunks: [
                              {
                                  header: '@@ -1 +1 @@',
                                  lines: [
                                      { type: 'remove', content: (node.content || '').substring(0, 100) + (node.content?.length > 100 ? '...' : '') },
                                      { type: 'add', content: node.branchContent[mr.sourceBranch].substring(0, 100) + (node.branchContent[mr.sourceBranch].length > 100 ? '...' : '') }
                                  ]
                              }
                          ]
                      });
                  }
              }
              if (node.children) {
                  findChanges(node.children, currentPath);
              }
          });
      };
      findChanges(repoFiles[repoId]);
  }

  // Fallback to mock if no real changes found (for demo MRs)
  if (diffs.length === 0) {
      diffs = [
        {
          file: 'models/orders.yml',
          type: 'modified',
          hunks: [
            {
              header: '@@ -10,4 +10,5 @@',
              lines: [
                { type: 'normal', content: '    sql: SELECT * FROM public.orders' },
                { type: 'normal', content: '' },
                { type: 'add', content: '    description: Core order fact table' },
                { type: 'normal', content: '    joins:' }
              ]
            }
          ]
        }
      ];
      
      if (mr.status === 'conflict') {
        diffs.push({
          file: 'models/users.yml',
          type: 'conflict',
          hunks: [
            {
              header: '@@ -5,3 +5,7 @@',
              lines: [
                { type: 'normal', content: '    measures:' },
                { type: 'conflict-start', content: '<<<<<<< HEAD' },
                { type: 'normal', content: '      - name: count_all' },
                { type: 'conflict-mid', content: '=======' },
                { type: 'normal', content: '      - name: total_users' },
                { type: 'conflict-end', content: '>>>>>>> feature/new-metrics' }
              ]
            }
          ]
        });
      }
  }

  res.json({ ...mr, diffs });
});

// 5. Merge MR
app.post('/api/repos/:repoId/merge-requests/:mrId/merge', (req, res) => {
  const { repoId, mrId } = req.params;
  const { user } = req.body; // Expecting user info to check admin
  
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  // Check Admin (Mock)
  // In real app, check req.user from session
  // For now, client sends user role
  
  if (mr.status === 'conflict') {
    return res.status(400).json({ error: 'Cannot merge with conflicts' });
  }
  
  // Apply Merge: Copy branchContent to content
  if (repoFiles[repoId]) {
      const applyMerge = (nodes) => {
        nodes.forEach(node => {
            if (node.type === 'file' && node.branchContent && node.branchContent[mr.sourceBranch]) {
                node.content = node.branchContent[mr.sourceBranch];
                // delete node.branchContent[mr.sourceBranch]; // Optional: keep for history
            }
            if (node.children) {
                applyMerge(node.children);
            }
        });
      };
      applyMerge(repoFiles[repoId]);
  }

  mr.status = 'merged';
  mr.mergedBy = user || { name: 'Admin' };
  mr.mergedAt = new Date().toISOString();
  
  res.json(mr);
});

// 6. Reject MR
app.post('/api/repos/:repoId/merge-requests/:mrId/reject', (req, res) => {
  const { repoId, mrId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  mr.status = 'closed';
  res.json(mr);
});

// 7. Resolve Conflict
app.post('/api/repos/:repoId/merge-requests/:mrId/resolve', (req, res) => {
  const { repoId, mrId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  mr.status = 'open'; // Reset to open
  res.json(mr);
});

// --- 文件管理接口 ---

app.get('/api/repos', (req, res) => {
  res.json(repositories);
});

app.get('/api/repos/:repoId/files', (req, res) => {
  const { repoId } = req.params;
  const { branch } = req.query; // Support branch-specific view
  const repo = repositories.find(r => r.id === repoId);
  
  if (!repo) {
    return res.status(404).json({ error: 'Repository not found' });
  }
  
  if (repo.permission === 'no-access') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Inject lastSynced for demo purposes if not present
  // Deep clone to avoid mutating the original structure when we inject branch content
  const files = JSON.parse(JSON.stringify(repoFiles[repoId] || []));
  
  const processFiles = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'file') {
        if (!node.lastSynced) {
          node.lastSynced = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
        }
        
        // Handle Branch Content
        // We need to look up the ORIGINAL node to find branchContent, because JSON.stringify lost it if it's not in the initial mock data
        // Actually, since we are cloning from the memory store which MIGHT have branchContent now (after some PUTs), it should be preserved if it was part of the object.
        // However, we need to OVERWRITE 'content' with 'branchContent[branch]' if it exists.
        
        // Find the original node in memory to get the latest state including branchContent
        const originalNode = findFileById(repoFiles[repoId], node.id);
        if (originalNode && originalNode.branchContent && branch && branch !== 'main' && branch !== 'master') {
            if (originalNode.branchContent[branch]) {
                node.content = originalNode.branchContent[branch];
            }
        }
      }
      if (node.children) {
        processFiles(node.children);
      }
    });
  };
  processFiles(files);

  res.json(files);
});

app.get('/api/repos/:repoId/branches', (req, res) => {
  const { repoId } = req.params;
  const repo = repositories.find(r => r.id === repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  // Ensure we return the object structure. If old string format exists (shouldn't happen with my manual update, but safe to handle), map it.
  const branches = repo.branches.map(b => typeof b === 'string' ? { name: b, owner: 'system', collaborators: [] } : b);
  res.json(branches);
});

app.post('/api/repos/:repoId/branches', (req, res) => {
  const { repoId } = req.params;
  const { name, user } = req.body;
  const repo = repositories.find(r => r.id === repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  
  if (!repo.branches.find(b => b.name === name)) {
    repo.branches.push({
        name,
        owner: user ? user.userId : 'user-1',
        collaborators: []
    });
  }
  res.json(repo.branches);
});

// Update Branch Permissions
app.put('/api/repos/:repoId/branches/:branchName/permissions', (req, res) => {
  const { repoId, branchName } = req.params;
  const { owner, collaborators, user } = req.body; // user is the requester
  
  const repo = repositories.find(r => r.id === repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  
  const branch = repo.branches.find(b => b.name === branchName);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  // Permission Check
  // 0. Main Branch Protection
  if (branchName === 'main') {
      return res.status(403).json({ error: 'Main branch is system protected. Cannot change permissions or ownership.' });
  }

  // 1. Repo Admin can do anything
  // 2. Branch Owner can transfer ownership and manage collaborators
  // 3. Visitor cannot do anything (except maybe transfer if they are owner? Req 6 says yes)
  
  const requester = repo.members.find(m => m.userId === user.userId);
  if (!requester) return res.status(403).json({ error: 'User not in repo' });

  const isRepoAdmin = requester.role === 'admin' || requester.role === 'super_admin';
  const isBranchOwner = branch.owner === user.userId;

  if (!isRepoAdmin && !isBranchOwner) {
      // Allow adding/removing collaborators if user is owner of the branch (already covered)
      // If user is Admin, they can do anything.
      // Wait, isBranchOwner check above already covers owner.
      // So this block just rejects non-admin non-owners.
      return res.status(403).json({ error: 'Permission denied. Only Owner or Admin can manage branch permissions.' });
  }

  // Update Logic
  if (owner) {
      // Transfer ownership
      // Any restrictions on who can receive? "该仓库其他成员" (Requirement 3)
      const newOwner = repo.members.find(m => m.userId === owner);
      if (!newOwner) return res.status(400).json({ error: 'New owner must be a repository member' });
      
      branch.owner = owner;
  }

  if (collaborators) {
      // Update collaborators
      // Ensure all are members
      const validCollaborators = collaborators.filter(id => repo.members.some(m => m.userId === id));
      branch.collaborators = validCollaborators;
  }

  res.json(branch);
});

// --- Git & Merge Request APIs ---

// 1. Pull from Master
app.post('/api/repos/:repoId/pull', (req, res) => {
  const { repoId } = req.params;
  const { branch } = req.body;
  
  // Simulate network delay
  setTimeout(() => {
    // 20% chance of updates
    if (Math.random() > 0.8) {
      res.json({ status: 'updated', message: 'Successfully pulled 2 commits from master.', files: ['models/users.yml', 'metrics/revenue.yml'] });
    } else {
      res.json({ status: 'up-to-date', message: 'Already up to date.' });
    }
  }, 1000);
});

// 2. List Merge Requests
app.get('/api/repos/:repoId/merge-requests', (req, res) => {
  const { repoId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  res.json(mrs);
});

// 3. Create Merge Request
app.post('/api/repos/:repoId/merge-requests', (req, res) => {
  const { repoId } = req.params;
  const { sourceBranch, targetBranch, title, description, author } = req.body;
  
  if (!mergeRequests[repoId]) mergeRequests[repoId] = [];
  
  // Simulate Conflict Check (10% chance)
  const hasConflict = Math.random() > 0.9;
  
  const newMR = {
    id: `mr-${Date.now()}`,
    repoId,
    title,
    description,
    sourceBranch,
    targetBranch,
    author: author || { name: 'Current User', avatar: '' },
    status: hasConflict ? 'conflict' : 'open',
    createdAt: new Date().toISOString(),
    reviewers: []
  };
  
  mergeRequests[repoId].unshift(newMR);
  res.json(newMR);
});

// 4. Get Merge Request Details (with Mock Diff)
app.get('/api/repos/:repoId/merge-requests/:mrId', (req, res) => {
  const { repoId, mrId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  // Mock Diffs
  const diffs = [
    {
      file: 'models/orders.yml',
      type: 'modified',
      hunks: [
        {
          header: '@@ -10,4 +10,5 @@',
          lines: [
            { type: 'normal', content: '    sql: SELECT * FROM public.orders' },
            { type: 'normal', content: '' },
            { type: 'add', content: '    description: Core order fact table' },
            { type: 'normal', content: '    joins:' }
          ]
        }
      ]
    }
  ];
  
  if (mr.status === 'conflict') {
    diffs.push({
      file: 'models/users.yml',
      type: 'conflict',
      hunks: [
        {
          header: '@@ -5,3 +5,7 @@',
          lines: [
            { type: 'normal', content: '    measures:' },
            { type: 'conflict-start', content: '<<<<<<< HEAD' },
            { type: 'normal', content: '      - name: count_all' },
            { type: 'conflict-mid', content: '=======' },
            { type: 'normal', content: '      - name: total_users' },
            { type: 'conflict-end', content: '>>>>>>> feature/new-metrics' }
          ]
        }
      ]
    });
  }

  res.json({ ...mr, diffs });
});

// 5. Merge MR
app.post('/api/repos/:repoId/merge-requests/:mrId/merge', (req, res) => {
  const { repoId, mrId } = req.params;
  const { user } = req.body; // Expecting user info to check admin
  
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  // Check Admin (Mock)
  // In real app, check req.user from session
  // For now, client sends user role
  
  if (mr.status === 'conflict') {
    return res.status(400).json({ error: 'Cannot merge with conflicts' });
  }
  
  mr.status = 'merged';
  mr.mergedBy = user || { name: 'Admin' };
  mr.mergedAt = new Date().toISOString();
  
  res.json(mr);
});

// 6. Reject MR
app.post('/api/repos/:repoId/merge-requests/:mrId/reject', (req, res) => {
  const { repoId, mrId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  mr.status = 'closed';
  res.json(mr);
});

// 7. Resolve Conflict
app.post('/api/repos/:repoId/merge-requests/:mrId/resolve', (req, res) => {
  const { repoId, mrId } = req.params;
  const mrs = mergeRequests[repoId] || [];
  const mr = mrs.find(m => m.id === mrId);
  
  if (!mr) return res.status(404).json({ error: 'Merge request not found' });
  
  mr.status = 'open'; // Reset to open
  res.json(mr);
});

app.get('/api/repos/:repoId/members', (req, res) => {
  const { repoId } = req.params;
  const repo = repositories.find(r => r.id === repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  res.json(repo.members || []);
});

app.put('/api/repos/:repoId/members/:userId', (req, res) => {
  const { repoId, userId } = req.params;
  const { role } = req.body;
  const repo = repositories.find(r => r.id === repoId);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });
  
  const member = repo.members.find(m => m.userId === userId);
  if (member) {
    member.role = role;
    res.json(member);
  } else {
    res.status(404).json({ error: 'Member not found' });
  }
});

app.get('/api/files', (req, res) => {
  // Deprecated: use /api/repos/:repoId/files instead, keeping for backward compatibility if needed
  res.json(repoFiles['repo-ecommerce']); 
});

app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const { repoId } = req.query; // Optional repoId to narrow search
  
  let file = null;
  if (repoId && repoFiles[repoId]) {
     file = findFileById(repoFiles[repoId], parseInt(id));
  } else {
    // Search across all
    for (const key in repoFiles) {
      file = findFileById(repoFiles[key], parseInt(id));
      if (file) break;
    }
  }

  if (file) {
    res.json(file);
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

app.get('/', (req, res) => {
  res.send('智能体后端已启动');
});

// --- 会话管理接口 ---
app.get('/api/sessions', (req, res) => {
  const list = Object.values(sessions).map(s => ({
    id: s.id,
    title: s.title,
    lastMessage: s.messages[s.messages.length - 1]?.text || '',
    updatedAt: s.updatedAt,
    messageCount: s.messages.length
  }));
  // 按更新时间倒序排列
  res.json(list.sort((a, b) => b.updatedAt - a.updatedAt));
});

// 创建新会话
app.post('/api/sessions', (req, res) => {
  const id = Date.now().toString();
  sessions[id] = {
    id,
    title: '新会话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  res.json(sessions[id]);
});

// 获取特定会话详情
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions[req.params.id];
  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// --- 智能体聊天接口 (支持会话) ---

app.get('/api/traces', (req, res) => {
    const traces = [];
    Object.values(sessions).forEach(session => {
        const msgs = session.messages;
        for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].sender === 'user') {
                const userMsg = msgs[i];
                const agentMsg = msgs[i+1] && msgs[i+1].sender === 'agent' ? msgs[i+1] : null;
                
                traces.push({
                    id: `${session.id}-${i}`,
                    sessionId: session.id,
                    username: 'User', // Mock
                    question: userMsg.text,
                    timestamp: userMsg.timestamp,
                    status: agentMsg ? 'success' : 'pending',
                    response: agentMsg ? agentMsg.text : null,
                    steps: agentMsg ? (agentMsg.steps || []) : [],
                    artifact: agentMsg ? (agentMsg.artifact || null) : null,
                    model: 'Doubao Pro' // Mock
                });
            }
        }
    });
    // Sort by timestamp desc
    traces.sort((a, b) => b.timestamp - a.timestamp);
    res.json(traces);
});

app.post('/api/agent/chat', async (req, res) => {
  const { message, sessionId, modelConfig } = req.body;
  
  // Update agent config if provided
  if (modelConfig) {
      agent.modelConfig = {
          ...agent.modelConfig,
          ...modelConfig
      };
  }
  
  // 如果没有提供 sessionId，或者 sessionId 不存在，则创建一个新会话（或者报错，这里选择自动创建以兼容旧前端）
  let session = sessionId ? sessions[sessionId] : null;
  
  if (!session) {
    // 如果没有 sessionId，创建一个临时的（或者返回错误）
    // 为了兼容性，如果没有传 sessionId，我们就不存入 session 列表，直接返回结果
    // 但为了三栏布局，前端应该总是传 sessionId
    if (sessionId) {
       // 如果传了 sessionId 但找不到，可能是非法的，或者我们可以新建一个
       session = {
         id: sessionId,
         title: message.slice(0, 15) || '新会话',
         messages: [],
         createdAt: Date.now(),
         updatedAt: Date.now()
       };
       sessions[sessionId] = session;
    } else {
      // 兼容旧模式：不存储 session，直接返回
      try {
        const result = await agent.processMessage(message);
        return res.json({ reply: result.reply, artifact: result.artifact });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
  }

  // 更新会话标题（如果是第一条消息）
  if (session.messages.length === 0) {
    session.title = message.slice(0, 15);
  }

  // 记录用户消息
  session.messages.push({ 
    text: message, 
    sender: 'user', 
    timestamp: Date.now(),
    steps: [] // Initialize empty steps for user
  });
  
  try {
    // 获取当前用户的工具配置
    let disabledTools = [];
    if (currentUser && userToolConfigs[currentUser.userId]) {
        disabledTools = userToolConfigs[currentUser.userId];
    }

    const controller = new AbortController();
    req.on('close', () => {
        console.log(`[Server] Connection closed by client for session ${sessionId}. Keeping agent running for debug...`);
        // controller.abort(); // Temporarily disable abort to see if agent finishes
    });

    const result = await agent.processMessage(message, { 
        disabledTools,
        modelConfig: agent.modelConfig, // Explicitly pass current config
        signal: controller.signal
    });
    
    // 记录智能体消息
    session.messages.push({ 
      text: result.reply, 
      sender: 'agent', 
      timestamp: Date.now(),
      artifact: result.artifact,
      steps: result.steps
    });
    
    session.updatedAt = Date.now();
    
    res.json({ 
      reply: result.reply, 
      artifact: result.artifact,
      steps: result.steps,
      sessionId: session.id 
    });
  } catch (error) {
    if (error.message === 'Aborted' || error.code === 'ERR_CANCELED') {
        console.log('Client disconnected, agent execution aborted');
        return; // Don't send response if closed
    }
    console.error('智能体处理消息失败:', error);
    res.status(500).json({ reply: '抱歉，我暂时无法处理你的请求。' });
  }
});


// --- 文件管理接口 ---

app.get('/api/files', (req, res) => {
  res.json(files);
});

app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const file = findFileById(files, parseInt(id));
  if (file) {
    res.json(file);
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

// --- 权限检查辅助函数 ---
const checkFilePermission = (repoId, branchName, userId) => {
    const repo = repositories.find(r => r.id === repoId);
    if (!repo) return { allowed: false, error: 'Repository not found' };

    const member = repo.members.find(m => m.userId === userId);
    if (!member) return { allowed: false, error: 'User not a member of this repository' };

    // 0. Main Branch Protection (Strict Read-Only for Direct Edits)
    if (branchName === 'main') {
        return { allowed: false, error: 'Main branch is protected. Use Merge Requests to make changes.' };
    }

    // 1. Admin has full access
    if (member.role === 'admin' || member.role === 'super_admin') {
        return { allowed: true };
    }

    // 2. Visitor has no write access
    if (member.role === 'visitor') {
        return { allowed: false, error: 'Visitors are read-only' };
    }

    // 3. Developer needs Branch Ownership or Collaborator status
    if (member.role === 'developer') {
        const targetBranchName = branchName || 'main';
        
        // If the branch is a simple string (legacy), we can't check ownership, so default to allow if strictly developer? 
        // No, we migrated everything to objects.
        const branch = repo.branches.find(b => (typeof b === 'string' ? b === targetBranchName : b.name === targetBranchName));
        
        if (!branch) return { allowed: false, error: 'Branch not found' };

        // Handle legacy string branch (shouldn't happen but safe fallback: allow developers on legacy)
        if (typeof branch === 'string') return { allowed: true };

        if (branch.owner === userId) return { allowed: true };
        if (branch.collaborators && branch.collaborators.includes(userId)) return { allowed: true };

        return { allowed: false, error: 'Developer needs to be Branch Owner or Collaborator to edit' };
    }

    return { allowed: false, error: 'Permission denied' };
};

app.put('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const { content, repoId, branch, user } = req.body;
  
  // Permission Check
  if (repoId && user) {
      const perm = checkFilePermission(repoId, branch, user.userId);
      if (!perm.allowed) {
          return res.status(403).json({ error: perm.error });
      }
  }

  console.log(`[PUT] Update file ${id} on branch ${branch || 'main'}`);

  const updateContent = (fileList) => {
      const file = findFileById(fileList, parseInt(id));
      if (file) {
          // If branch is provided and is NOT main/master, update branchContent
          if (branch && branch !== 'main' && branch !== 'master') {
              console.log(`[PUT] Updating branchContent for ${branch}`);
              if (!file.branchContent) file.branchContent = {};
              file.branchContent[branch] = content;
          } else {
              // Otherwise update main content
              console.log(`[PUT] Updating main content`);
              file.content = content;
          }
          return true;
      }
      return false;
  };

  if (repoId && repoFiles[repoId]) {
    if (updateContent(repoFiles[repoId])) {
      return res.json({ success: true, branch: branch || 'main' });
    }
  } else {
     // Try to find across all if repoId not provided
     for (const key in repoFiles) {
        if (updateContent(repoFiles[key])) {
          return res.json({ success: true, branch: branch || 'main' });
        }
     }
  }

  res.status(404).json({ error: 'File not found' });
});

app.put('/api/files/:id/rename', (req, res) => {
  const { id } = req.params;
  const { name, repoId, branch, user } = req.body;
  
  if (!name) {
      return res.status(400).json({ error: 'Name is required' });
  }

  // Permission Check
  if (repoId && user) {
      const perm = checkFilePermission(repoId, branch, user.userId);
      if (!perm.allowed) {
          return res.status(403).json({ error: perm.error });
      }
  }

  if (repoId && repoFiles[repoId]) {
    const file = findFileById(repoFiles[repoId], parseInt(id));
    if (file) {
        file.name = name;
        return res.json({ success: true, name });
    }
  } else {
     // Try to find across all if repoId not provided
     for (const key in repoFiles) {
        const file = findFileById(repoFiles[key], parseInt(id));
        if (file) {
            file.name = name;
            return res.json({ success: true, name });
        }
     }
  }

  res.status(404).json({ error: '文件不存在' });
});

app.post('/api/files', (req, res) => {
  const { name, content, parentId, repoId, branch, user } = req.body;
  
  // Permission Check
  if (repoId && user) {
      const perm = checkFilePermission(repoId, branch, user.userId);
      if (!perm.allowed) {
          return res.status(403).json({ error: perm.error });
      }
  }

  const newFile = {
    id: Date.now(),
    name,
    type: 'file',
    content: content || ''
  };
  
  const targetRepoFiles = repoFiles[repoId];
  if (!targetRepoFiles) {
    return res.status(404).json({ error: 'Repository not found' });
  }

  if (parentId) {
    const parent = findFileById(targetRepoFiles, parseInt(parentId));
    if (parent && parent.type === 'directory') {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(newFile);
    }
  } else {
    targetRepoFiles.push(newFile);
  }
  res.json(newFile);
});

app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const { repoId, branch, user } = req.body; // Usually DELETE has no body, but we need context here. Or use query params.

  // Using query params for delete is safer if body is not supported by some clients, but express supports body in delete.
  // Let's check both body and query for flexibility
  const rId = repoId || req.query.repoId;
  const br = branch || req.query.branch;
  const uId = user?.userId || (req.query.userId ? req.query.userId : null);

  // Permission Check
  if (rId && uId) {
      const perm = checkFilePermission(rId, br, uId);
      if (!perm.allowed) {
          return res.status(403).json({ error: perm.error });
      }
  }

  const deleteFile = (fileList) => {
      for (let i = 0; i < fileList.length; i++) {
          if (fileList[i].id === parseInt(id)) {
              fileList.splice(i, 1);
              return true;
          }
          if (fileList[i].type === 'directory' && fileList[i].children) {
              if (deleteFile(fileList[i].children)) return true;
          }
      }
      return false;
  };

  if (rId && repoFiles[rId]) {
      if (deleteFile(repoFiles[rId])) return res.json({ success: true });
  } else {
      for (const key in repoFiles) {
          if (deleteFile(repoFiles[key])) return res.json({ success: true });
      }
  }

  res.status(404).json({ error: 'File not found' });
});

// 辅助函数
function findFileById(fileList, id) {
  for (const file of fileList) {
    if (file.id === id) return file;
    if (file.type === 'directory' && file.children) {
      const found = findFileById(file.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateFileContent(fileList, id, newContent) {
  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].id === id) {
      fileList[i].content = newContent;
      return fileList;
    }
    if (fileList[i].type === 'directory' && fileList[i].children) {
      const updated = updateFileContent(fileList[i].children, id, newContent);
      if (updated) return fileList;
    }
  }
  return null;
}

// --- Semantic Service API ---

// --- Model Management API ---
let connectedModels = [
  { id: 'm1', name: 'Doubao Pro', provider: 'doubao', modelName: 'ep-20250609110517-6zp6k', baseUrl: 'https://ark-cn-beijing.bytedance.net/api/v3/chat/completions', apiKey: 'sk-xxxxxxxx', type: 'chat' },
  { id: 'm2', name: 'GPT-4o', provider: 'openai', modelName: 'gpt-4o', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-xxxxxxxx', type: 'chat' }
];

app.get('/api/models', (req, res) => {
  res.json(connectedModels);
});

app.post('/api/models', (req, res) => {
  const { name, provider, modelName, baseUrl, apiKey, type } = req.body;
  const newModel = { 
    id: Date.now().toString(), 
    name, 
    provider, 
    modelName, 
    baseUrl, 
    apiKey, 
    type: type || 'chat' 
  };
  connectedModels.push(newModel);
  res.json(newModel);
});

app.put('/api/models/:id', (req, res) => {
  const { id } = req.params;
  const { name, provider, modelName, baseUrl, apiKey, type } = req.body;
  
  const modelIndex = connectedModels.findIndex(m => m.id === id);
  if (modelIndex === -1) {
      return res.status(404).json({ error: 'Model not found' });
  }

  connectedModels[modelIndex] = {
      ...connectedModels[modelIndex],
      name, 
      provider, 
      modelName, 
      baseUrl, 
      apiKey, 
      type: type || connectedModels[modelIndex].type
  };

  res.json(connectedModels[modelIndex]);
});

app.delete('/api/models/:id', (req, res) => {
  const { id } = req.params;
  connectedModels = connectedModels.filter(m => m.id !== id);
  res.json({ success: true });
});

// 0. 获取所有语义模型及其字段 (用于 Ontology 编辑器)
app.get('/api/semantic-models', (req, res) => {
  const models = [];
  
  // 简单的 YAML 解析逻辑 (仅适用于当前 Mock 数据的格式)
  const parseYamlModels = (content) => {
    const foundModels = [];
    const lines = content.split('\n');
    let currentModel = null;
    let currentSection = null; // 'measures' or 'dimensions'

    lines.forEach(line => {
      const trimLine = line.trim();
      
      // 匹配模型定义: "- name: model_name" (在 cubes 下)
      // 注意：这里假设缩进结构比较标准
      if (line.includes('- name:') && !line.startsWith('      ')) {
        // 这是一个顶级数组项，可能是 cube
        const match = line.match(/- name: (\w+)/);
        if (match) {
          currentModel = { name: match[1], fields: [] };
          foundModels.push(currentModel);
          currentSection = null;
        }
      } 
      // Match Primary Key
      else if (line.includes('primaryKey:')) {
         const match = line.match(/primaryKey: (\w+)/);
         if (match && currentModel) {
             currentModel.primaryKey = match[1];
         }
      }
      // 匹配字段定义: "- name: field_name" (在 measures 或 dimensions 下)
      else if (line.includes('measures:')) {
        currentSection = 'measures';
      }
      else if (line.includes('dimensions:')) {
        currentSection = 'dimensions';
      }
      else if ((currentSection === 'measures' || currentSection === 'dimensions') && line.includes('- name:')) {
         const match = line.match(/- name: (\w+)/);
         if (match && currentModel) {
           currentModel.fields.push({
             name: match[1],
             type: currentSection === 'dimensions' ? 'dimension' : 'measure'
           });
         }
      }
    });
    return foundModels;
  };

  // 遍历所有仓库的文件
  Object.values(repoFiles).forEach(files => {
    const findModels = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'file' && (node.name.endsWith('.yml') || node.name.endsWith('.yaml'))) {
          // 尝试解析
          try {
             const parsed = parseYamlModels(node.content);
             models.push(...parsed);
          } catch (e) {
            console.error('Failed to parse model file:', node.name);
          }
        } else if (node.children) {
          findModels(node.children);
        }
      });
    };
    findModels(files);
  });

  res.json(models);
});

// --- Data Source Configuration (Sync with SQLite) ---
// Initialize with SQLite config
let dataSourceConfig = {
  type: 'sqlite',
  host: 'localhost',
  database: 'e-commerce-analytics.db' // Logical name for the in-memory DB
};

app.get('/api/datasource/config', (req, res) => {
  res.json(dataSourceConfig);
});

app.post('/api/datasource/config', (req, res) => {
  dataSourceConfig = { ...dataSourceConfig, ...req.body };
  res.json({ success: true, config: dataSourceConfig });
});

app.get('/api/datasource/hive/metadata', (req, res) => {
  // Mock Metadata based on configuration
  // For SQLite, we can return the structure we created above
  if (dataSourceConfig.type === 'sqlite') {
      const mockSqliteData = [
        {
          id: 'sqlite_prod',
          name: `SQLite (${dataSourceConfig.database})`,
          type: 'sqlite',
          databases: [
            {
              name: 'main',
              tables: [
                { name: 'users', columns: [{name:'id',type:'TEXT'},{name:'name',type:'TEXT'},{name:'city',type:'TEXT'}] },
                { name: 'orders', columns: [{name:'id',type:'TEXT'},{name:'user_id',type:'TEXT'},{name:'amount',type:'REAL'},{name:'status',type:'TEXT'}] },
                { name: 'products', columns: [{name:'id',type:'TEXT'},{name:'name',type:'TEXT'},{name:'category',type:'TEXT'},{name:'price',type:'REAL'}] },
                { name: 'sales', columns: [{name:'id',type:'TEXT'},{name:'amount',type:'REAL'},{name:'status',type:'TEXT'}] }
              ]
            }
          ]
        }
      ];
      return res.json(mockSqliteData);
  }

  // Fallback (Hive Mock)
  const mockHiveData = [
    {
      id: 'hive_prod',
      name: `Hive (${dataSourceConfig.host})`,
      type: 'hive',
      databases: [
        {
          name: dataSourceConfig.database || 'default',
          tables: [
            { 
              name: 'fact_orders', 
              description: 'Order transactions',
              columns: [
                { name: 'order_id', type: 'string' },
                { name: 'user_id', type: 'string' },
                { name: 'amount', type: 'double' },
                { name: 'dt', type: 'string' }
              ] 
            },
            { 
              name: 'dim_users', 
              description: 'User dimensions',
              columns: [
                { name: 'user_id', type: 'string' },
                { name: 'username', type: 'string' },
                { name: 'email', type: 'string' },
                { name: 'age', type: 'int' }
              ] 
            }
          ]
        },
        {
            name: 'analytics',
            tables: [
                {
                    name: 'daily_active_users',
                    columns: [
                        { name: 'dt', type: 'string' },
                        { name: 'count', type: 'bigint' }
                    ]
                }
            ]
        }
      ]
    }
  ];

  res.json(mockHiveData);
});

// 1. 获取实体详情 API
app.get('/api/semantic/entity', (req, res) => {
  const { type, name, repository, branch, repoId } = req.query; // Support repository (new) and repoId (legacy)
  
  if (!type || !name) {
    return res.status(400).json({ error: 'Missing required parameters: type, name' });
  }

  // Helper to find file by name pattern
  const findFileByName = (fileList, pattern) => {
    for (const file of fileList) {
      if (file.type === 'file' && (file.name === pattern || file.name.includes(pattern))) {
        return file;
      }
      if (file.type === 'directory' && file.children) {
        const found = findFileByName(file.children, pattern);
        if (found) return found;
      }
    }
    return null;
  };

  let targetFile = null;
  const targetRepoId = repository || repoId;
  const searchRepo = targetRepoId ? [targetRepoId] : Object.keys(repoFiles);

  for (const rid of searchRepo) {
    if (repoFiles[rid]) {
      // Simple heuristic mapping
      let searchPattern = name;
      if (type === 'model') searchPattern = '.yml';
      if (type === 'metric') searchPattern = '.yml';
      
      // Try exact match first
      targetFile = findFileByName(repoFiles[rid], name);
      
      // If not found, try to search content (very basic mock implementation)
      if (!targetFile) {
         // In a real system, this would query a semantic index
         // Here we just return a mock response if we can't find the file
      } else {
        break;
      }
    }
  }

  if (targetFile) {
    // Branch Logic
    let content = targetFile.content;
    if (branch && branch !== 'main' && branch !== 'master' && targetFile.branchContent && targetFile.branchContent[branch]) {
        content = targetFile.branchContent[branch];
    }

    res.json({
      entity: {
        type,
        name,
        content: content,
        metadata: {
          repository: targetRepoId || 'unknown',
          branch: branch || 'main',
          path: targetFile.name
        }
      }
    });
  } else {
    // Return mock data for demo purposes if specific file not found
    res.json({
      entity: {
        type,
        name,
        content: `mock_content_for: ${name}\ntype: ${type}\nstatus: generated`,
        metadata: {
          source: 'mock-generator'
        }
      }
    });
  }
});

// 2. 语义检索 API (向量/图检索)
app.post('/api/semantic/search', (req, res) => {
  const { query, topK = 5, repository, branch, repoId } = req.body; // Support repository (new) and repoId (legacy)
  
  if (!query) {
    return res.status(400).json({ error: 'Missing required parameter: query' });
  }

  // Mock Search Logic
  const results = [];
  const targetRepoId = repository || repoId;
  const searchRepo = targetRepoId ? [targetRepoId] : Object.keys(repoFiles);

  // Helper to search recursively
  const searchFiles = (files) => {
    files.forEach(file => {
      if (file.type === 'file') {
        let score = 0;
        const lowerQuery = query.toLowerCase();
        const lowerName = file.name.toLowerCase();
        
        // Branch Content Logic
        let content = file.content || '';
        if (branch && branch !== 'main' && branch !== 'master' && file.branchContent && file.branchContent[branch]) {
            content = file.branchContent[branch];
        }
        
        const lowerContent = content.toLowerCase();

        // Simple keyword matching
        if (lowerName.includes(lowerQuery)) score += 0.5;
        if (lowerContent.includes(lowerQuery)) score += 0.3;

        // Random jitter to simulate vector similarity
        if (score > 0) {
          score += Math.random() * 0.2;
          
          const result = {
            id: file.id,
            name: file.name,
            type: file.name.endsWith('.md') ? 'document' : 'entity',
            score: parseFloat(score.toFixed(4)),
            lastSynced: file.lastSynced || new Date().toISOString(),
            preview: content.substring(0, 200) + '...'
          };

          // If document, try to find relevant chunks
          if (file.chunks) {
            const relevantChunks = file.chunks.filter(c => c.content.toLowerCase().includes(lowerQuery));
            if (relevantChunks.length > 0) {
              result.chunks = relevantChunks;
              result.matchedChunkCount = relevantChunks.length;
            }
          }
          
          results.push(result);
        }
      } else if (file.type === 'directory' && file.children) {
        searchFiles(file.children);
      }
    });
  };

  searchRepo.forEach(rid => {
    if (repoFiles[rid]) {
      searchFiles(repoFiles[rid]);
    }
  });

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  res.json({
    query,
    total: results.length,
    results: results.slice(0, topK)
  });
});

// 3. SQL 执行 API (Mock -> Real SQLite)
app.post('/api/sql/execute', (req, res) => {
  const { sql } = req.body;
  
  if (!sql) {
    return res.status(400).json({ error: 'Missing required parameter: sql' });
  }

  console.log(`[SQL] Executing: ${sql}`);

  // Safety check: only allow SELECT statements for now (read-only)
  if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(403).json({ error: 'Only SELECT statements are allowed in this test environment.' });
  }
  
  // Replace "public." schema which is common in postgres but not sqlite
  const cleanSql = sql.replace(/public\./g, '');

  db.all(cleanSql, [], (err, rows) => {
    if (err) {
      console.error('[SQL] Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ results: rows });
  });
});

// --- MCP API (Model Context Protocol) ---
app.get('/api/mcp/tools', (req, res) => {
    res.json(mcpServer.tools);
});

// 获取用户 MCP 工具配置
app.get('/api/mcp/user-config', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const config = userToolConfigs[currentUser.userId] || [];
    res.json({ disabledTools: config });
});

// 更新用户 MCP 工具配置
app.post('/api/mcp/user-config', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { disabledTools } = req.body;
    if (!Array.isArray(disabledTools)) {
        return res.status(400).json({ error: 'disabledTools must be an array' });
    }
    
    userToolConfigs[currentUser.userId] = disabledTools;
    res.json({ success: true, disabledTools });
});

app.post('/api/mcp/tools/:id', (req, res) => {
    // Edit tool metadata
    const { id } = req.params;
    const { name, description, inputSchema } = req.body;
    
    const tool = mcpServer.tools.find(t => t.id === id);
    if (tool) {
        const updates = {};
        if (name) updates.name = name;
        if (description) updates.description = description;
        if (inputSchema) updates.inputSchema = inputSchema;
        
        mcpServer.updateTool(id, updates);
        res.json(tool);
    } else {
        res.status(404).json({ error: 'Tool not found' });
    }
});

app.post('/api/mcp/call', async (req, res) => {
    const { name, args } = req.body;
    try {
        const tool = mcpServer.tools.find(t => t.name === name);
        if (!tool) {
            return res.status(404).json({ error: `Tool ${name} not found` });
        }
        
        // Execute Handler
        const result = await tool.handler(args);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// External MCP Server Registration (Mock)
app.post('/api/mcp/register', (req, res) => {
    const { url, name } = req.body;
    // In a real implementation, we would validate the URL and fetch its tools
    // For now, just store it
    mcpServer.externalServers.push({ url, name, status: 'connected' });
    res.json({ success: true, message: 'Server registered' });
});

// --- Semantic Terminal API ---

// Mock File System State (In-memory per session would be better, but global for simplicity)
const userSessions = {}; // sessionId -> { cwd: '/' }

app.post('/api/semantic/terminal', (req, res) => {
    const { repository, branch, command, sessionId = 'default' } = req.body;
    
    if (!command) {
        return res.status(400).json({ output: 'Error: Command is required.' });
    }

    // Initialize Session
    if (!userSessions[sessionId]) {
        userSessions[sessionId] = { cwd: '/' };
    }
    const session = userSessions[sessionId];

    // 1. Determine Root Context
    let rootNodes = [];
    let isVirtualRoot = false;

    if (repository) {
        if (!repoFiles[repository]) {
             return res.json({ output: `Error: Repository '${repository}' not found.` });
        }
        rootNodes = repoFiles[repository];
    } else {
        // Virtual Root: Treat all repositories as directories in $HOME
        isVirtualRoot = true;
        rootNodes = Object.keys(repoFiles).map(key => ({
            id: key,
            name: key,
            type: 'directory',
            children: repoFiles[key]
        }));
    }

    // 2. Helper to traverse the mock file system
    // Resolve absolute or relative path to a node
    const resolvePath = (path, currentDir) => {
        // Handle absolute path
        let parts;
        if (path.startsWith('/')) {
            parts = path.split('/').filter(p => p && p !== '.');
        } else {
            // Handle relative path: combine currentDir and path
            const combined = (currentDir === '/' ? '' : currentDir) + '/' + path;
            parts = combined.split('/').filter(p => p && p !== '.');
        }
        
        // Resolve '..'
        const stack = [];
        for (const part of parts) {
            if (part === '..') {
                stack.pop();
            } else {
                stack.push(part);
            }
        }
        
        // Traverse from root
        let current = { type: 'directory', children: rootNodes };
        // If virtual root, we need to handle the first level (repo name) manually if it's not in rootNodes structure directly
        // But our rootNodes construction above handles it for virtual root.
        
        for (const part of stack) {
            if (!current.children) return null; // Not a directory
            const found = current.children.find(c => c.name === part);
            if (!found) return null;
            current = found;
        }
        
        return { node: current, path: '/' + stack.join('/') };
    };

    // 3. Command Parser
    const parseCommand = (cmdStr) => {
        const parts = cmdStr.trim().split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);
        const flags = new Set();
        const targets = [];

        args.forEach(arg => {
            if (arg.startsWith('-')) {
                // Handle -al as 'a', 'l'
                for (let i = 1; i < arg.length; i++) {
                    flags.add(arg[i]);
                }
            } else {
                targets.push(arg);
            }
        });

        return { cmd, flags, targets };
    };

    const { cmd, flags, targets } = parseCommand(command);
    let output = '';
    let newCwd = session.cwd;

    try {
        switch (cmd) {
            case 'ls':
            case 'll': {
                if (cmd === 'll') flags.add('l');
                
                const targetPath = targets[0] || '.';
                const resolved = resolvePath(targetPath, session.cwd);
                
                if (!resolved || !resolved.node) {
                    output = `ls: ${targetPath}: No such file or directory`;
                } else if (resolved.node.type === 'file') {
                    output = resolved.node.name;
                } else {
                    const children = resolved.node.children || [];
                    const showHidden = flags.has('a');
                    const showDetails = flags.has('l');

                    const filtered = children.filter(c => showHidden || !c.name.startsWith('.'));

                    if (showDetails) {
                        output = filtered.map(c => {
                            const isDir = c.type === 'directory';
                            const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                            const user = 'user'; 
                            const group = 'staff';
                            const size = c.content ? c.content.length : (isDir ? 4096 : 0);
                            const date = c.lastSynced ? new Date(c.lastSynced).toISOString().slice(0, 10) : 'Jan 01 00:00';
                            const name = c.name + (isDir ? '/' : '');
                            return `${perms} 1 ${user} ${group} ${String(size).padStart(5)} ${date} ${name}`;
                        }).join('\n');
                        output = `total ${filtered.length}\n` + output;
                    } else {
                        output = filtered.map(c => {
                            const isDir = c.type === 'directory';
                            return isDir ? c.name + '/' : c.name;
                        }).join('\n');
                    }
                }
                break;
            }
            case 'cd': {
                const targetPath = targets[0] || '/';
                const resolved = resolvePath(targetPath, session.cwd);
                
                if (!resolved || !resolved.node) {
                    output = `cd: ${targetPath}: No such file or directory`;
                } else if (resolved.node.type !== 'directory') {
                    output = `cd: ${targetPath}: Not a directory`;
                } else {
                    newCwd = resolved.path || '/';
                    session.cwd = newCwd;
                }
                break;
            }
            case 'pwd': {
                output = session.cwd;
                break;
            }
            case 'cat': {
                const targetArg = targets[0];
                if (!targetArg) {
                    output = 'cat: missing file operand';
                    break;
                }
                const resolved = resolvePath(targetArg, session.cwd);
                if (!resolved || !resolved.node) {
                    output = `cat: ${targetArg}: No such file or directory`;
                } else if (resolved.node.type === 'directory') {
                    output = `cat: ${targetArg}: Is a directory`;
                } else {
                    let content = resolved.node.content;
                    if (branch && branch !== 'main' && branch !== 'master' && resolved.node.branchContent && resolved.node.branchContent[branch]) {
                        content = resolved.node.branchContent[branch];
                    }
                    output = content || '';
                }
                break;
            }
            case 'grep': {
                const pattern = targets[0];
                const fileArg = targets[1];
                const recursive = flags.has('r');

                if (!pattern) {
                    output = 'grep: usage: grep [-r] pattern [file]';
                    break;
                }

                if (recursive) {
                    // Recursive search
                    const searchDir = fileArg || '.';
                    const resolvedStart = resolvePath(searchDir, session.cwd);
                    
                    if (!resolvedStart || !resolvedStart.node) {
                        output = `grep: ${searchDir}: No such file or directory`;
                    } else {
                        const results = [];
                        const traverse = (node, pathPrefix) => {
                            if (node.type === 'file') {
                                let content = node.content || '';
                                if (branch && branch !== 'main' && branch !== 'master' && node.branchContent && node.branchContent[branch]) {
                                    content = node.branchContent[branch];
                                }
                                const lines = content.split('\n');
                                lines.forEach((line, idx) => {
                                    if (line.includes(pattern)) {
                                        results.push(`${pathPrefix}: ${line}`);
                                    }
                                });
                            } else if (node.children) {
                                node.children.forEach(c => traverse(c, `${pathPrefix}/${c.name}`));
                            }
                        };
                        
                        // Fix path prefix handling
                        const startPrefix = resolvedStart.path === '/' ? '' : resolvedStart.path;
                        traverse(resolvedStart.node, startPrefix || (resolvedStart.node.name === searchDir ? searchDir : '')); 
                        // Simplified prefix logic for mock
                        
                        output = results.join('\n');
                        if (results.length === 0) output = ''; // No matches
                    }

                } else {
                    if (!fileArg) {
                         output = 'grep: missing file operand (stdin not supported)';
                         break;
                    }
                    const resolved = resolvePath(fileArg, session.cwd);
                    if (!resolved || !resolved.node || resolved.node.type !== 'file') {
                        output = `grep: ${fileArg}: No such file`;
                    } else {
                        let content = resolved.node.content || '';
                        if (branch && branch !== 'main' && branch !== 'master' && resolved.node.branchContent && resolved.node.branchContent[branch]) {
                            content = resolved.node.branchContent[branch];
                        }
                        
                        const lines = content.split('\n');
                        const matches = lines.filter(line => line.includes(pattern));
                        output = matches.join('\n');
                    }
                }
                break;
            }
            case 'find': {
                const startPath = targets[0] || '.';
                const resolvedStart = resolvePath(startPath, session.cwd);
                
                if (!resolvedStart || !resolvedStart.node) {
                    output = `find: ${startPath}: No such file or directory`;
                } else {
                    const results = [];
                    const traverse = (node, prefix) => {
                        const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
                        results.push(currentPath);
                        if (node.children) {
                            node.children.forEach(c => traverse(c, currentPath));
                        }
                    };
                    
                    // Simple traversal relative to find root
                    // Note: This output format simplifies 'find' which usually outputs relative to startPath
                    if (resolvedStart.node.children) {
                        // If it's a directory, list itself and children
                        // results.push(startPath); // Usually find prints root too
                        traverse(resolvedStart.node, startPath === '.' ? '' : startPath); 
                        // Fixup: traverse adds prefix. 
                    } else {
                         results.push(startPath);
                    }
                    
                    // Re-implement simpler traverse for clean output matching `find` behavior
                    const collect = (n, p) => {
                        results.push(p);
                        if (n.children) {
                            n.children.forEach(c => collect(c, p === '/' ? `/${c.name}` : `${p}/${c.name}`));
                        }
                    };
                    collect(resolvedStart.node, startPath === '.' ? session.cwd : resolvedStart.path); // Use absolute path for simplicity in mock
                    
                    output = results.join('\n');
                }
                break;
            }
            case 'mkdir': {
                const targetPath = targets[0];
                if (!targetPath) { output = 'mkdir: missing operand'; break; }
                // Mock: Does not actually persist changes in this simple server version structure
                // But we can return success to simulate
                output = ''; 
                break;
            }
            case 'touch': {
                 const targetPath = targets[0];
                 if (!targetPath) { output = 'touch: missing file operand'; break; }
                 output = '';
                 break;
            }
            case 'rm': {
                const targetPath = targets[0];
                 if (!targetPath) { output = 'rm: missing operand'; break; }
                 output = '';
                 break;
            }
            case 'echo': {
                output = targets.join(' ');
                break;
            }
            default:
                output = `term: command not found: ${cmd}`;
        }
    } catch (e) {
        output = `Error executing command: ${e.message}`;
    }

    res.json({ output, cwd: newCwd });
});

// --- Scheduled Task APIs ---

// 1. List Tasks
app.get('/api/tasks', (req, res) => {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Map snake_case to camelCase for frontend if needed, but let's stick to DB names or map them
        const tasks = rows.map(r => ({
            id: r.id,
            name: r.name,
            schedule: r.schedule,
            command: r.command,
            description: r.description,
            status: r.status,
            lastRun: r.last_run,
            nextRun: r.next_run,
            enabled: !!r.enabled
        }));
        res.json(tasks);
    });
});

// 2. Create Task
app.post('/api/tasks', (req, res) => {
    const { name, schedule, command, description, enabled } = req.body;
    const id = Date.now().toString();
    const status = 'idle';
    const lastRun = null;
    const nextRun = null; // In real app, calculate next run from cron
    
    const stmt = db.prepare("INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)");
    stmt.run(id, name, schedule, command, description, status, lastRun, nextRun, enabled ? 1 : 0, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, name, schedule, command, description, status, lastRun, nextRun, enabled: !!enabled });
    });
    stmt.finalize();
});

// 3. Update Task
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { name, schedule, command, description, enabled } = req.body;
    
    // Construct dynamic update query
    let updates = [];
    let params = [];
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (schedule !== undefined) { updates.push("schedule = ?"); params.push(schedule); }
    if (command !== undefined) { updates.push("command = ?"); params.push(command); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (enabled !== undefined) { updates.push("enabled = ?"); params.push(enabled ? 1 : 0); }
    
    if (updates.length === 0) return res.json({ message: "No changes" });
    
    params.push(id);
    const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ success: true, id });
    });
});

// 4. Delete Task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM tasks WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ success: true, id });
    });
});

// 5. Run Task (Mock)
app.post('/api/tasks/:id/run', (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    db.run("UPDATE tasks SET last_run = ?, status = 'success' WHERE id = ?", [now, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ success: true, lastRun: now, status: 'success', output: "Task executed successfully (mock)" });
    });
});

// --- Eval Sets Storage (Mock) ---
const evalSets = [
    {
        id: 'eval-set-math',
        name: 'Math Reasoning',
        description: 'Evaluation set for complex mathematical reasoning tasks.',
        owner: 'user-1',
        collaborators: ['user-2'],
        createdAt: Date.now() - 10000000,
        annotationFields: [
             { name: 'correctness', type: 'select', options: ['Correct', 'Incorrect'], system: true },
             { name: 'reasoning_quality', type: 'rating', min: 1, max: 5 }
        ],
        traces: [
            {
                id: 'trace-math-1',
                sessionId: 'session-math-1',
                username: 'Alice',
                question: 'If 2x + 5 = 15, what is x?',
                timestamp: Date.now() - 50000,
                status: 'success',
                response: 'x = 5',
                steps: [
                    { type: 'thought', content: 'Subtract 5 from both sides: 2x = 10' },
                    { type: 'thought', content: 'Divide by 2: x = 5' }
                ],
                artifact: {
                    id: 'art-math-1',
                    type: 'markdown',
                    title: 'Solution Steps',
                    content: '## Solution\n\n1. Start with the equation: $2x + 5 = 15$\n2. Subtract 5 from both sides: $2x = 10$\n3. Divide by 2: $x = 5$'
                },
                model: 'Doubao Pro',
                annotations: {
                    global: { correctness: 'Correct', reasoning_quality: 5 },
                    steps: {
                        0: { comment: 'Good start' }
                    }
                }
            },
            {
                id: 'trace-math-2',
                sessionId: 'session-math-2',
                username: 'Bob',
                question: 'Calculate the area of a circle with radius 3.',
                timestamp: Date.now() - 40000,
                status: 'success',
                response: 'Area = 28.27',
                steps: [
                    { type: 'thought', content: 'Formula is pi * r^2' },
                    { type: 'action', content: 'Calculate 3.14159 * 3 * 3' }
                ],
                model: 'GPT-4o',
                annotations: {
                    global: { correctness: 'Correct', reasoning_quality: 4 }
                }
            },
            {
                id: 'trace-weather-1',
                sessionId: 'session-weather-1',
                username: 'Charlie',
                question: 'search weather in Beijing',
                timestamp: Date.now() - 20000,
                status: 'success',
                response: '根据搜索结果，我为你生成了一份简报。',
                steps: [
                    { type: 'thought', content: '用户需要搜索信息，调用 web_search 工具。' },
                    { type: 'action', content: 'Render Artifact: Search Report' }
                ],
                artifact: {
                    id: 'art-weather-mock-old',
                    type: 'html',
                    title: 'Search Report',
                    content: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Search Results Summary</h2>
                            <p style="color: #666;">Here are the latest findings based on your query:</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <h3 style="margin-top: 0; color: #1f2937;">🌦️ Weather</h3>
                                <p>Current conditions: Overcast, 18°C. Might rain later.</p>
                            </div>
                            <p style="margin-top: 20px; font-size: 12px; color: #999;"><em>Snapshot taken yesterday</em></p>
                        </div>
                       `
                },
                model: 'Doubao Pro',
                annotations: {
                    global: { correctness: 'Correct' }
                }
            }
        ]
    },
    {
        id: 'eval-set-code',
        name: 'Code Generation',
        description: 'Set for testing code generation capabilities.',
        createdAt: Date.now() - 5000000,
        annotationFields: [
             { name: 'correctness', type: 'select', options: ['Correct', 'Incorrect'], system: true },
             { name: 'style', type: 'select', options: ['Good', 'Bad'] }
        ],
        traces: [
            {
                id: 'trace-code-1',
                sessionId: 'session-code-1',
                username: 'Charlie',
                question: 'Write a Python function to reverse a string.',
                timestamp: Date.now() - 30000,
                status: 'success',
                response: 'Here is the Python function:\n```python\ndef reverse_string(s):\n    return s[::-1]\n```',
                steps: [
                    { type: 'thought', content: 'The user wants a Python function to reverse a string.' },
                    { type: 'thought', content: 'Using slicing [::-1] is the most pythonic way.' },
                    { type: 'action', content: 'Generate Python code' }
                ],
                artifact: {
                    id: 'art-code-1',
                    type: 'code',
                    title: 'reverse_string.py',
                    language: 'python',
                    content: 'def reverse_string(s):\n    """Reverses a given string."""\n    return s[::-1]\n\n# Example usage:\nprint(reverse_string("hello"))  # Output: olleh'
                },
                model: 'GPT-4o',
                annotations: {
                    global: { correctness: 'Correct', style: 'Good' }
                }
            }
        ]
    }
];

// --- Eval Runs Storage (Mock) ---
const evalRuns = [
    {
        id: 'run-mock-1',
        evalSetId: 'eval-set-math',
        status: 'completed',
        startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        endTime: new Date(Date.now() - 86390000).toISOString(),
        config: { model: 'GPT-4o', temperature: 0.7 },
        summary: {
            avgScore: 92,
            totalTraces: 2,
            successRate: '100.0%'
        }
    },
    {
        id: 'run-mock-2',
        evalSetId: 'eval-set-math',
        status: 'failed',
        startTime: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        endTime: new Date(Date.now() - 43195000).toISOString(),
        config: { model: 'Doubao Pro', temperature: 0.1 },
        summary: {
            avgScore: 0,
            totalTraces: 2,
            successRate: '0.0%'
        },
        error: 'API Rate Limit Exceeded'
    },
    {
        id: 'run-mock-3',
        evalSetId: 'eval-set-code',
        status: 'completed',
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date(Date.now() - 3590000).toISOString(),
        config: { model: 'Claude 3.5 Sonnet', temperature: 0 },
        summary: {
            avgScore: 88,
            totalTraces: 1,
            successRate: '100.0%'
        }
    }
];
const evalRunResults = {
    'run-mock-1': [
        { traceId: 'trace-math-1', score: 95, comment: 'Perfect reasoning.', details: { latency: 1200, tokens: 150 } },
        { traceId: 'trace-math-2', score: 89, comment: 'Correct calculation.', details: { latency: 800, tokens: 80 } }
    ],
    'run-mock-3': [
        { traceId: 'trace-code-1', score: 88, comment: 'Efficient code.', details: { latency: 2500, tokens: 400 } }
    ]
};

app.get('/api/eval-sets', (req, res) => {
    res.json(evalSets.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        owner: s.owner,
        collaborators: s.collaborators,
        createdAt: s.createdAt,
        traceCount: s.traces.length,
        annotationFields: s.annotationFields
    })).sort((a, b) => b.createdAt - a.createdAt));
});

app.get('/api/eval-sets/:id', (req, res) => {
    const set = evalSets.find(s => s.id === req.params.id);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });
    res.json(set);
});

app.put('/api/eval-sets/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const set = evalSets.find(s => s.id === id);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });
    
    if (name) set.name = name;
    if (description !== undefined) set.description = description;
    
    res.json(set);
});

app.put('/api/eval-sets/:id/fields', (req, res) => {
    const { id } = req.params;
    const { fields } = req.body;
    const set = evalSets.find(s => s.id === id);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });
    
    if (!Array.isArray(fields)) {
        return res.status(400).json({ error: 'Fields must be an array' });
    }

    set.annotationFields = fields;
    res.json(set);
});

app.put('/api/eval-sets/:id/permissions', (req, res) => {
    const { id } = req.params;
    const { owner, collaborators } = req.body;
    const set = evalSets.find(s => s.id === id);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });
    
    if (owner) set.owner = owner;
    if (collaborators && Array.isArray(collaborators)) {
        set.collaborators = collaborators;
    }
    
    res.json(set);
});

app.put('/api/eval-sets/:setId/traces/:traceId', (req, res) => {
    const { setId, traceId } = req.params;
    const { annotations } = req.body;
    
    const set = evalSets.find(s => s.id === setId);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });
    
    const trace = set.traces.find(t => t.id === traceId);
    if (!trace) return res.status(404).json({ error: 'Trace not found' });
    
    if (!trace.annotations) trace.annotations = { global: {}, steps: {} };
    
    if (annotations.global) {
        trace.annotations.global = { ...trace.annotations.global, ...annotations.global };
    }
    if (annotations.steps) {
        trace.annotations.steps = { ...trace.annotations.steps, ...annotations.steps };
    }
    
    res.json(trace);
});

app.post('/api/eval-sets/import-traces', (req, res) => {
    const { traces, targetSetId, newSetName, ownerId } = req.body;
    if (!traces || !Array.isArray(traces)) {
        return res.status(400).json({ error: 'Invalid traces data' });
    }

    if (targetSetId) {
        // Append to existing set
        const targetSet = evalSets.find(s => s.id === targetSetId);
        if (!targetSet) {
            return res.status(404).json({ error: 'Target Eval Set not found' });
        }
        
        const newTraces = traces.map(t => ({
            ...t,
            id: t.id || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure ID exists
            // Snapshot key data
            steps: t.steps ? JSON.parse(JSON.stringify(t.steps)) : [],
            artifact: t.artifact ? JSON.parse(JSON.stringify(t.artifact)) : null,
            annotations: { global: {}, steps: {} }
        }));
        
        targetSet.traces.push(...newTraces);
        targetSet.traceCount = targetSet.traces.length;
        
        return res.json(targetSet);
    } else {
        // Create new set
        const name = newSetName || `Imported Traces ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        
        const newSet = {
            id: `eval-set-${Date.now()}`,
            name: name,
            description: `Automatically created from ${traces.length} selected traces.`,
            owner: ownerId || 'user-1', // Default to user-1 if not provided
            collaborators: [],
            createdAt: Date.now(),
            annotationFields: [
                 { key: 'correctness', label: 'Correctness', type: 'select', options: ['Correct', 'Incorrect'], system: true }
            ],
            traces: traces.map(t => ({
                ...t,
                id: t.id || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                // Snapshot key data
                steps: t.steps ? JSON.parse(JSON.stringify(t.steps)) : [],
                artifact: t.artifact ? JSON.parse(JSON.stringify(t.artifact)) : null,
                annotations: { global: {}, steps: {} }
            })),
            traceCount: traces.length
        };

        evalSets.unshift(newSet);
        res.json(newSet);
    }
});

app.delete('/api/eval-sets/:id', (req, res) => {
    const { id } = req.params;
    const index = evalSets.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Eval set not found' });
    
    evalSets.splice(index, 1);
    res.json({ success: true });
});

// --- Eval Runs API ---

// 1. Start Evaluation Run
app.post('/api/eval-sets/:id/runs', (req, res) => {
    const { id } = req.params;
    const { config } = req.body;
    
    const set = evalSets.find(s => s.id === id);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });

    const runId = `run-${Date.now()}`;
    const newRun = {
        id: runId,
        evalSetId: id,
        status: 'running',
        startTime: new Date().toISOString(),
        config: config || {},
        summary: null
    };

    evalRuns.unshift(newRun);
    evalRunResults[runId] = [];

    // Simulate async evaluation process
    setTimeout(() => {
        const results = set.traces.map(trace => {
            const score = Math.floor(Math.random() * 41) + 60; // 60-100 (Bias towards success for demo)
            return {
                traceId: trace.id,
                score: score,
                comment: score > 90 ? 'Excellent response!' : (score > 80 ? 'Good result.' : 'Acceptable.'),
                details: {
                    latency: Math.floor(Math.random() * 1500) + 500, // ms
                    tokens: Math.floor(Math.random() * 300) + 100
                }
            };
        });

        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

        // Update run status
        const run = evalRuns.find(r => r.id === runId);
        if (run) {
            run.status = 'completed';
            run.endTime = new Date().toISOString();
            run.summary = {
                avgScore,
                totalTraces: results.length,
                successRate: (results.filter(r => r.score >= 80).length / results.length * 100).toFixed(1) + '%'
            };
        }

        evalRunResults[runId] = results;
        console.log(`[Eval] Run ${runId} completed for set ${id}`);

    }, 3000); // 3 seconds delay

    res.json(newRun);
});


app.get('/api/eval-sets/:id/runs', (req, res) => {
    const { id } = req.params;
    const runs = evalRuns.filter(r => r.evalSetId === id);
    res.json(runs);
});

// 3. Get Run Details
app.get('/api/eval-runs/:runId', (req, res) => {
    const { runId } = req.params;
    const run = evalRuns.find(r => r.id === runId);
    
    if (!run) return res.status(404).json({ error: 'Run not found' });
    
    const set = evalSets.find(s => s.id === run.evalSetId);
    const results = evalRunResults[runId] || [];
    
    // Merge traces with results
    const tracesWithResults = set ? set.traces.map(trace => {
        const result = results.find(r => r.traceId === trace.id);
        return {
            ...trace,
            score: result ? result.score : null,
            comment: result ? result.comment : null,
            runDetails: result ? result.details : null
        };
    }) : [];

    res.json({
        ...run,
        traces: tracesWithResults,
        annotationFields: set ? set.annotationFields : []
    });
});

app.get('/api/eval-sets/:setId/traces/:traceId/diff', async (req, res) => {
    const { setId, traceId } = req.params;
    const set = evalSets.find(s => s.id === setId);
    if (!set) return res.status(404).json({ error: 'Eval set not found' });
    
    const trace = set.traces.find(t => t.id === traceId);
    if (!trace) return res.status(404).json({ error: 'Trace not found' });
    
    // Real Replay using Agent
    try {
        // Create a temporary session context or just call agent directly
        // We use the same model config if available, or default
        const result = await agent.processMessage(trace.question, {
            // In a real system, we might want to inject the same system prompt or context
            // For now, we just replay the question against the current agent state
            modelConfig: agent.modelConfig
        });

        const replayedTrace = {
            ...trace,
            id: `replay-${Date.now()}`,
            timestamp: Date.now(),
            response: result.reply,
            steps: result.steps || [],
            artifact: result.artifact || null,
            status: 'success'
        };

        // Calculate Diffs (Simple field comparison)
        const diffs = [];
        
        // 1. Response Diff
        if (trace.response !== replayedTrace.response) {
            diffs.push({
                field: 'response',
                original: trace.response,
                replayed: replayedTrace.response,
                hasChange: true
            });
        }

        // 2. Steps Count Diff
        if (trace.steps.length !== replayedTrace.steps.length) {
             diffs.push({
                field: 'steps_count',
                original: `${trace.steps.length} steps`,
                replayed: `${replayedTrace.steps.length} steps`,
                hasChange: true
            });
        }

        // 3. Artifact Diff (Simple Content Check)
        if (trace.artifact || replayedTrace.artifact) {
            const orgContent = trace.artifact ? trace.artifact.content : '';
            const repContent = replayedTrace.artifact ? replayedTrace.artifact.content : '';
            if (orgContent !== repContent) {
                diffs.push({
                    field: 'artifact',
                    original: orgContent || '(No Artifact)',
                    replayed: repContent || '(No Artifact)',
                    hasChange: true
                });
            }
        }

        res.json({
            original: trace,
            replayed: replayedTrace,
            diffs
        });
    } catch (error) {
        console.error('Replay failed:', error);
        res.status(500).json({ error: 'Replay failed: ' + error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});