/**
 * error-toast.spec.js - E2E：错误提示 toast
 *
 * 需求来源：HANDOFF.md 的 P2 —— 「前端错误提示优化：当前是顶部红色横条，建议改为 toast」
 *
 * 本文件是 🔴 TDD 的「红」：先写测试，此时实现尚不存在，所以必然失败。
 * 预期失败信息：getByTestId('toast') 找不到元素（toast 还没做）。
 *
 * 定位约定（见 frontend/src/App.jsx）：
 *   toast        错误提示浮层
 *   toast-close  手动关闭按钮
 *
 * 为什么断言 role="alert"？
 *   无障碍要求：错误提示应被屏幕阅读器即时播报。
 *   role="alert" 有隐式 aria-live="assertive"，是这类提示的标准做法。
 *   把它写进测试，等于把"无障碍"变成可验证的契约，而不是口头约定。
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_URL || 'http://localhost:5173';

test.describe('错误提示 toast', () => {
  test('登录失败时弹出 toast，可手动关闭', async ({ page }) => {
    await page.goto(BASE_URL);

    // 1. 初始不该有任何 toast
    await expect(page.getByTestId('toast')).toHaveCount(0);

    // 2. 造一个必然失败的操作：不存在的账号
    await page.getByTestId('username-input').fill(`nobody_${Date.now()}`);
    await page.getByTestId('password-input').fill('wrongpass');
    await page.getByTestId('login-btn').click();

    // 3. 后端返回 401，前端应弹出 toast
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible({ timeout: 10000 });

    // 4. 无障碍契约：必须是 alert 角色
    await expect(toast).toHaveAttribute('role', 'alert');

    // 5. 文案要能让用户看懂发生了什么
    await expect(toast).toContainText('用户名或密码错误');

    // 6. 必须是"浮层"而不是文档流里的横条 —— 这是本次需求的核心
    //    （否则改回占位横条，测试照样绿，就失去意义了）
    const pos = await toast.evaluate(el => getComputedStyle(el).position);
    expect(pos).toBe('fixed');

    // 7. 定位在视口右上角，不挤占内容区
    const box = await toast.boundingBox();
    const vw = page.viewportSize().width;
    expect(box.x + box.width).toBeGreaterThan(vw * 0.6); // 靠右
    expect(box.y).toBeLessThan(120);                     // 靠上

    // 8. 可手动关闭
    await page.getByTestId('toast-close').click();
    await expect(page.getByTestId('toast')).toHaveCount(0);
  });

  test('toast 会自动消失（不用手动关）', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByTestId('username-input').fill(`nobody_${Date.now()}`);
    await page.getByTestId('password-input').fill('wrongpass');
    await page.getByTestId('login-btn').click();

    await expect(page.getByTestId('toast')).toBeVisible({ timeout: 10000 });

    // 自动消失（实现约定 2.5 秒，给 6 秒容差）
    await expect(page.getByTestId('toast')).toHaveCount(0, { timeout: 6000 });
  });

  test('新建笔记时标题为空 → toast 提示且不创建', async ({ page }) => {
    const stamp = Date.now();

    // 先注册进入主界面
    await page.goto(BASE_URL);
    await page.getByTestId('username-input').fill(`toastuser_${stamp}`);
    await page.getByTestId('password-input').fill('123456');
    await page.getByTestId('register-btn').click();
    await expect(page.getByTestId('new-note-btn')).toBeVisible({ timeout: 10000 });

    // 不填标题直接保存 → 前端校验应拦下并弹 toast
    await page.getByTestId('save-btn').click();
    await expect(page.getByTestId('toast')).toBeVisible();
    await expect(page.getByTestId('toast')).toContainText('标题不能为空');

    // 关键：笔记没有被创建
    await expect(page.getByTestId('note-item')).toHaveCount(0);
  });
});
