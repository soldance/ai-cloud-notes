// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_URL || 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  // 可配置 webServer 自动启动（需先 npm run dev + 后端）
  // webServer: {
  //   command: 'cd frontend && npm run dev',
  //   port: 5173,
  //   timeout: 120 * 1000,
  // },
});
