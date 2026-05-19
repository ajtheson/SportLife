import { expect, test } from "@playwright/test";

test("shows SportLife public home", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Tìm sân/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng ký" })).toBeVisible();
});
