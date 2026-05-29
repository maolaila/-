import { expect, test, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("heading", { name: "数据概览" })).toBeVisible();
}

test("guest can browse products and is prompted to login for cart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Light Commerce" })).toBeVisible();
  await page.getByRole("link", { name: "全部商品" }).click();
  await expect(page.getByRole("heading", { name: "商品列表" })).toBeVisible();
  await page.getByRole("link", { name: "便携保温杯" }).click();
  await expect(page).toHaveTitle(/便携保温杯/);
  await page.getByRole("button", { name: "加入购物车" }).click();
  await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
});

test("customer can register, add cart item and submit order", async ({ page }) => {
  const username = `buyer-${Date.now()}`;
  await page.goto("/register");
  await page.getByLabel("账号").fill(username);
  await page.getByLabel("密码", { exact: true }).fill("password123");
  await page.getByLabel("确认密码").fill("password123");
  await page.getByRole("button", { name: "注册并登录" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/products/portable-thermal-cup");
  await page.getByRole("button", { name: "加入购物车" }).click();
  await expect(page.getByText("已加入购物车")).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("便携保温杯")).toBeVisible();
  await page.getByRole("link", { name: "去结算" }).click();
  await page.getByLabel("收货人").fill("张三");
  await page.getByLabel("联系方式").fill("13800000000");
  await page.getByLabel("收货地址").fill("上海市测试路 1 号");
  await page.getByRole("button", { name: "提交订单" }).click();
  await expect(page.getByRole("heading", { name: /订单 LC/ })).toBeVisible();
  await expect(page.getByText("待确认").first()).toBeVisible();
});

test("admin can manage orders and customers", async ({ page }) => {
  await loginAdmin(page);

  await page.getByRole("link", { name: "订单管理" }).click();
  await expect(page.getByRole("heading", { name: "订单管理" })).toBeVisible();
  await page.getByRole("link", { name: "查看" }).first().click();
  await page.getByLabel("修改付款状态").selectOption("paid");
  await page.getByRole("button", { name: "保存付款" }).click();
  await expect(page.getByText("已付全款").first()).toBeVisible();

  await page.getByRole("link", { name: "顾客管理" }).click();
  await expect(page.getByRole("heading", { name: "顾客管理" })).toBeVisible();
  await expect(page.getByText("customer").first()).toBeVisible();
});

test("admin can create a category and product that storefront search can find", async ({ page }) => {
  const suffix = Date.now();
  const categoryName = `自动测试分类 ${suffix}`;
  const categorySlug = `auto-category-${suffix}`;
  const productName = `自动测试商品 ${suffix}`;
  const productSlug = `auto-product-${suffix}`;

  await loginAdmin(page);

  await page.goto("/admin/categories");
  await page.getByLabel("分类名称").fill(categoryName);
  await page.getByLabel("Slug").first().fill(categorySlug);
  await page.getByRole("button", { name: "新增分类" }).click();
  await expect(page.locator(`input[value="${categoryName}"]`)).toBeVisible();

  await page.goto("/admin/products/new");
  await page.getByLabel("商品名称").fill(productName);
  await page.getByLabel("Slug").fill(productSlug);
  await page.getByLabel("分类").selectOption({ label: categoryName });
  await page.getByLabel("状态").selectOption("active");
  await page.getByLabel("商品 SKU").fill(`AUTO-${suffix}`);
  await page.getByLabel("标签").fill("现货, 自动测试");
  await page.getByLabel("商品简介").fill("自动化创建商品，验证后台保存和前台搜索。");
  await page.getByLabel("主图 URL").fill("https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&w=1200&q=80");
  await page.getByLabel("SEO 标题").fill(`${productName} - Light Commerce`);
  await page.getByLabel("SEO 描述").fill("自动化测试商品 SEO 描述");
  await page.getByLabel("商品详情").fill("<p>自动测试详情</p><script>alert('blocked')</script>");
  await page.getByLabel("购买说明").fill("自动化测试购买说明");
  await page.getByLabel(/规格 JSON/).fill(
    JSON.stringify(
      [
        {
          optionValues: { 颜色: "蓝色" },
          price: 12.5,
          stock: 3,
          status: "active"
        }
      ],
      null,
      2
    )
  );
  await page.getByRole("button", { name: "保存商品" }).click();
  await expect(page.getByRole("heading", { name: "编辑商品" })).toBeVisible();
  await expect(page.getByText(productName).first()).toBeVisible();

  await page.goto(`/products?q=${encodeURIComponent(productName)}`);
  await expect(page.getByText(productName).first()).toBeVisible();
  await page.getByText(productName).first().click();
  await expect(page).toHaveURL(new RegExp(`/products/${productSlug}$`));
  await expect(page.getByText("自动测试详情")).toBeVisible();
  await expect(page.locator("script", { hasText: "blocked" })).toHaveCount(0);
});

test("admin can update storefront settings and restore them", async ({ page }) => {
  const storeName = `Light Commerce ${Date.now()}`;

  await loginAdmin(page);
  await page.goto("/admin/settings");
  await page.getByLabel("店铺名称").fill(storeName);
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("站点配置已保存")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: storeName })).toBeVisible();

  await page.goto("/admin/settings");
  await page.getByLabel("店铺名称").fill("Light Commerce");
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("站点配置已保存")).toBeVisible();
});

test("mobile storefront and admin layouts expose h5 navigation without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "搜索商品" }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "全部商品" }).last()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Light Commerce" })).toBeVisible();
  await expect(page.getByRole("link", { name: "浏览商品" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await loginAdmin(page);
  await expect(page.getByRole("link", { name: "商品管理" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "数据概览" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
