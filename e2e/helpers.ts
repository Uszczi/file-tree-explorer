import { expect, type Page } from "@playwright/test";

export async function loadExample(page: Page, label: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("button", { name: "Load tree" }).click();
  await expect(page).toHaveURL(/\/tree$/);
}

export function fileTree(page: Page) {
  return page.getByRole("tree", { name: "File tree" });
}

export function searchBox(page: Page) {
  return page.getByRole("searchbox", { name: "Search by name" });
}
