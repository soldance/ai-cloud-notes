/**
 * tag-filter.spec.js - E2E：标签筛选 UI
 *
 * 需求来源：HANDOFF.md 的 P2 —— 「标签筛选 UI：后端已支持 ?tag=xxx，前端缺入口」
 * 后端能力：GET /api/notes?tag=xxx（见 backend/src/routes/notes.js）
 *
 * 定位约定：全部使用 data-testid（见 frontend/src/App.jsx）
 *   - note-tag         笔记卡片上的标签（点它触发筛选）
 *   - tag-filter-bar   筛选状态提示条（仅筛选时出现）
 *   - clear-tag-filter 清除筛选按钮
 *
 * 关键设计：用**两个不同标签**的笔记，否则"筛选后还是显示 1 条"无法证明筛选生效。
 * 标签名带时间戳，避免与上一次运行的数据串味。
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_URL || 'http://localhost:5173';

test.describe('标签筛选', () => {
  test('点击标签 → 只显示含该标签的笔记；清除 → 恢复全部', async ({ page }) => {
    const stamp = Date.now();
    const tagWork = `工作${stamp}`;
    const tagLife = `生活${stamp}`;

    // 1. 注册新用户并进入主界面
    await page.goto(BASE_URL);
    await page.getByTestId('username-input').fill(`taguser_${stamp}`);
    await page.getByTestId('password-input').fill('123456');
    await page.getByTestId('register-btn').click();
    await expect(page.getByTestId('new-note-btn')).toBeVisible({ timeout: 10000 });

    // 2. 新建第一篇笔记（标签 = tagWork）
    await page.getByTestId('new-note-btn').click();
    await page.getByTestId('title-input').fill('工作报告');
    await page.getByTestId('tags-input').fill(tagWork);
    await page.getByTestId('content-input').fill('这周的进度');
    await page.getByTestId('save-btn').click();
    await expect(page.getByTestId('note-item')).toHaveCount(1);

    // 3. 新建第二篇笔记（标签 = tagLife）
    await page.getByTestId('new-note-btn').click();
    await page.getByTestId('title-input').fill('买菜清单');
    await page.getByTestId('tags-input').fill(tagLife);
    await page.getByTestId('content-input').fill('西红柿、鸡蛋');
    await page.getByTestId('save-btn').click();
    await expect(page.getByTestId('note-item')).toHaveCount(2);

    // 4. 初始状态：不该有筛选提示条
    await expect(page.getByTestId('tag-filter-bar')).toHaveCount(0);

    // 5. 点击「工作」标签 → 只剩「工作报告」
    await page.getByTestId('note-tag').filter({ hasText: tagWork }).click();
    await expect(page.getByTestId('tag-filter-bar')).toBeVisible();
    await expect(page.getByTestId('tag-filter-bar')).toContainText(tagWork);
    await expect(page.getByTestId('note-item')).toHaveCount(1);
    await expect(page.getByTestId('note-item')).toContainText('工作报告');
    await expect(page.getByTestId('note-item')).not.toContainText('买菜清单');

    // 6. 点击「清除」→ 两篇都回来，筛选条消失
    await page.getByTestId('clear-tag-filter').click();
    await expect(page.getByTestId('tag-filter-bar')).toHaveCount(0);
    await expect(page.getByTestId('note-item')).toHaveCount(2);

    // 7. 反向验证：切到「生活」标签 → 只剩「买菜清单」（排除"筛选根本没生效"的假阳性）
    await page.getByTestId('note-tag').filter({ hasText: tagLife }).click();
    await expect(page.getByTestId('note-item')).toHaveCount(1);
    await expect(page.getByTestId('note-item')).toContainText('买菜清单');

    // 8. 再次点击同一个标签 → 当作开关，取消筛选
    await page.getByTestId('note-tag').filter({ hasText: tagLife }).click();
    await expect(page.getByTestId('tag-filter-bar')).toHaveCount(0);
    await expect(page.getByTestId('note-item')).toHaveCount(2);

    console.log(`✅ 标签筛选测试完成（标签：${tagWork} / ${tagLife}）`);
  });
});
