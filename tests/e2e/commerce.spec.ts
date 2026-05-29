import { expect, test } from "@playwright/test";

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
  await page.goto("/admin/login");
  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("heading", { name: "数据概览" })).toBeVisible();

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
