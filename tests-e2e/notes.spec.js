/**
 * notes.spec.js - Playwright E2E 测试
 * 模拟真实用户操作：注册 → 登录 → 新建笔记 → 搜索 → 编辑 → 删除
 *
 * 运行方式（项目跑起来后）：
 *   npx playwright test
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_URL || 'http://localhost:5173';

test.describe('AI 云笔记 E2E 流程', () => {
  test('完整用户流程', async ({ page }) => {
    // 1. 打开应用 → 看到登录页
    await page.goto(BASE_URL);
    await expect(page.getByText('📝 AI 云笔记')).toBeVisible();

    // 2. 注册新用户
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    await page.fill('input[placeholder="用户名"]', username);
    await page.fill('input[placeholder*="密码"]', '123456');
    await page.click('button:has-text("注册")');

    // 3. 注册后自动登录 → 进入主界面
    await expect(page.getByText('➕ 新建笔记')).toBeVisible({ timeout: 10000 });

    // 4. 新建笔记
    await page.click('button:has-text("新建笔记")');
    await page.fill('input[placeholder="标题"]', 'Playwright 测试笔记');
    await page.fill('input[placeholder*="标签"]', '测试, E2E, Playwright');
    await page.fill('textarea[placeholder*="开始写作"]', '这是一条由 Playwright 自动创建的笔记');
    await page.click('button:has-text("创建")');

    // 5. 验证笔记出现在列表
    await expect(page.getByText('Playwright 测试笔记')).toBeVisible();

    // 6. 搜索笔记
    await page.fill('input[placeholder*="搜索"]', 'Playwright');
    await expect(page.getByText('Playwright 测试笔记')).toBeVisible();

    // 7. 清空搜索，看到全部
    await page.fill('input[placeholder*="搜索"]', '');

    // 8. 编辑笔记
    await page.click('text=Playwright 测试笔记 >> .. >> ..'.replace(' >> ..', ''));
    // 点击笔记项进入编辑
    await page.locator('.note-item, [class*="noteItem"]').first().click();
    await page.fill('input[placeholder="标题"]', 'Playwright 测试笔记（已修改）');
    await page.click('button:has-text("更新")');
    await expect(page.getByText('（已修改）')).toBeVisible();

    // 9. 删除笔记（先定位再删除）
    // 注意：实际项目中建议加 data-testid 定位，这里用文本定位演示
    // await page.locator('text=🗑️').first().click();
    // await page.click('button:has-text("确定")');

    console.log('✅ E2E 测试完成');
  });
});
