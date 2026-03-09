// 配置管理模块 - 管理环境变量和默认值
require('dotenv').config();

// 默认配置（向后兼容）
const defaultConfig = {
  // 服务器配置
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // ARK/Doubao 配置 - 使用默认演示值（向后兼容）
  ARK_API_KEY: process.env.ARK_API_KEY || '5f01e800-04df-4195-9a48-a7909f5ea7f2',
  ARK_ENDPOINT: process.env.ARK_ENDPOINT || 'https://ark-cn-beijing.bytedance.net/api/v3/chat/completions',
  ARK_MODEL: process.env.ARK_MODEL || 'ep-20250609110517-6zp6k',
  ARK_PROVIDER: process.env.ARK_PROVIDER || 'doubao',

  // 前端 URL（用于 CORS）
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // 管理员凭证（仅用于开发环境）
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',

  // 检查是否使用了自定义配置
  isUsingDefaultApiKey: !process.env.ARK_API_KEY
};

// 验证配置
function validateConfig() {
  const warnings = [];

  if (defaultConfig.isUsingDefaultApiKey) {
    warnings.push('⚠️  使用默认 API Key，建议在 .env 文件中设置 ARK_API_KEY');
  }

  if (defaultConfig.NODE_ENV === 'production' && defaultConfig.isUsingDefaultApiKey) {
    warnings.push('❌  生产环境必须设置自定义 ARK_API_KEY');
  }

  return warnings;
}

// 打印配置警告
function printConfigWarnings() {
  const warnings = validateConfig();
  if (warnings.length > 0) {
    console.log('\n📋 配置提示:');
    warnings.forEach(w => console.log(w));
    console.log('   参考 .env.example 创建 .env 文件\n');
  }
}

module.exports = {
  config: defaultConfig,
  validateConfig,
  printConfigWarnings
};
