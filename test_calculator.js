// 测试安全的计算器功能
const Agent = require('./agent');

const agent = new Agent();

console.log('🧮 测试安全计算器功能...\n');

const testCases = [
    '2 + 2',
    '10 - 4',
    '5 * 3',
    '20 / 4',
    '(2 + 3) * 4',
    '10 / 2 + 3',
    '2.5 + 3.5',
    '100 - (20 + 30)'
];

testCases.forEach(expr => {
    try {
        const result = agent.executeSkill('calculator', expr);
        console.log(`✅ ${expr} = ${result.reply}`);
    } catch (e) {
        console.log(`❌ ${expr} - 错误: ${e.message}`);
    }
});

console.log('\n🔒 测试注入防护...');
const injectionTests = [
    'process.exit()',
    'require("fs")',
    'console.log("hacked")',
    'global.foo = "bar"'
];

injectionTests.forEach(expr => {
    try {
        const result = agent.executeSkill('calculator', expr);
        console.log(`⚠️  ${expr} -> 结果: ${result.reply}`);
    } catch (e) {
        console.log(`🛡️  ${expr} -> 已阻止: ${e.message}`);
    }
});
