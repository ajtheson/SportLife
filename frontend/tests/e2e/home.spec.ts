import { expect, test } from "@playwright/test";

test("shows SportLife public home", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /find venues/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});
