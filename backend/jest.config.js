/**
 * jest.config.js - Jest 配置
 *
 * setupFiles（而不是 setupFilesAfterEach）很关键：
 * 它在「测试框架就绪前」执行，也就是早于测试文件里的 require('../src/db')。
 * 这样 setup.js 里设置的 DB_PATH 才能在 db.js 建立连接前生效。
 */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // 集成测试要连数据库，串行跑避免互相干扰
  maxWorkers: 1,
};
