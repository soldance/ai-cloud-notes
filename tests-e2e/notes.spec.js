/**
 * notes.spec.js - Playwright E2E 测试
 * 模拟真实用户操作：注册 → 新建笔记 → 搜索 → 编辑 → 收藏 → 删除
 *
 * 定位约定：全部使用 data-testid（见 frontend/src/App.jsx）
 * 原因：App.jsx 用内联样式对象，DOM 里没有真实 class 名，
 *       文本定位又容易被「搜索结果」和「编辑区」的同名文本同时命中。
 *
 * 运行方式（前后端都启动后）：
 *   npx playwright test
 *   npx playwright test --headed     # 想看浏览器界面
 *   npx playwright test --ui         # 想调试每一步
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_URL || 'http://localhost:5173';

test.describe('AI 云笔记 E2E 流程', () => {
  test('完整用户流程：注册 → 新建 → 搜索 → 编辑 → 收藏 → 删除', async ({ page }) => {
    // 1. 注册后自动登录会进入主界面，先把 confirm 自动确认掉
    page.on('dialog', dialog => dialog.accept());

    // 2. 打开应用 → 看到登录页
    await page.goto(BASE_URL);
    await expect(page.getByText('📝 AI 云笔记')).toBeVisible();

    // 3. 注册新用户（每次跑用时间戳，避免「用户名已存在 409」）
    const username = `testuser_${Date.now()}`;
    await page.getByTestId('username-input').fill(username);
    await page.getByTestId('password-input').fill('123456');
    await page.getByTestId('register-btn').click();

    // 4. 注册后自动登录 → 进入主界面
    await expect(page.getByTestId('new-note-btn')).toBeVisible({ timeout: 10000 });
    // 新用户应该看到空列表提示
    await expect(page.getByTestId('empty-tip')).toBeVisible();

    // 5. 新建笔记
    await page.getByTestId('new-note-btn').click();
    await page.getByTestId('title-input').fill('Playwright 测试笔记');
    await page.getByTestId('tags-input').fill('测试, E2E, Playwright');
    await page.getByTestId('content-input').fill('这是一条由 Playwright 自动创建的笔记');
    await page.getByTestId('save-btn').click();

    // 6. 验证笔记出现在左侧列表（列表项内的标题文本）
    const noteItem = page.getByTestId('note-item');
    await expect(noteItem).toHaveCount(1);
    await expect(noteItem).toContainText('Playwright 测试笔记');
    await expect(noteItem.getByText('E2E')).toBeVisible(); // 标签也渲染出来了

    // 7. 搜索：命中关键词时笔记仍在
    await page.getByTestId('search-input').fill('Playwright');
    await expect(page.getByTestId('note-item')).toHaveCount(1);

    // 8. 搜索：换成不存在的关键词时列表清空（验证搜索真的在过滤）
    await page.getByTestId('search-input').fill('不存在的关键词_zzz');
    await expect(page.getByTestId('note-item')).toHaveCount(0);

    // 9. 清空搜索 → 笔记回来
    await page.getByTestId('search-input').fill('');
    await expect(page.getByTestId('note-item')).toHaveCount(1);

    // 10. 编辑笔记：点标题进入编辑 → 表单被填入该笔记 → 改名后保存
    // 注意：不要点 note-item 整张卡片 —— Playwright 点的是几何中心，
    // 卡片里含标签/收藏/删除等子元素，中心可能落到子元素上被 stopPropagation 吃掉。
    // 点 note-title 才是明确的「编辑」目标。
    await page.getByTestId('note-title').click();
    await expect(page.getByTestId('title-input')).toHaveValue('Playwright 测试笔记');
    await page.getByTestId('title-input').fill('Playwright 测试笔记（已修改）');
    await page.getByTestId('save-btn').click();

    // 验证列表里标题已更新，且表单回到「新建」状态（标题被清空）
    await expect(page.getByTestId('note-item')).toContainText('（已修改）');
    await expect(page.getByTestId('title-input')).toHaveValue('');

    // 11. 切换收藏 → 列表项出现 ⭐
    await page.getByTestId('favorite-btn').first().click();
    await expect(page.getByTestId('note-item').first()).toContainText('⭐');

    // 12. 删除笔记（confirm 已在第 1 步自动确认）→ 回到空列表
    await page.getByTestId('delete-btn').first().click();
    await expect(page.getByTestId('note-item')).toHaveCount(0);
    await expect(page.getByTestId('empty-tip')).toBeVisible();

    // 13. 登出 → 回到登录页
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-btn')).toBeVisible();

    console.log(`✅ E2E 测试完成（用户：${username}）`);
  });
});
