import { expect, test } from "@playwright/test";
import { fileTree } from "./helpers";

test("keeps a tree larger than the localStorage limit after a reload", async ({
  page,
}) => {
  const folders = Array.from({ length: 200 }, (_, folder) => ({
    name: `folder-${folder}`,
    type: "folder",
    children: Array.from({ length: 500 }, (_, file) => ({
      name: `a-fairly-long-file-name-${folder}-${file}.txt`,
      type: "file",
      size: file,
    })),
  }));
  const json = JSON.stringify({
    name: "big",
    type: "folder",
    children: folders,
  });
  expect(json.length).toBeGreaterThan(6 * 1024 * 1024);

  await page.goto("/");
  await page.getByLabel("Tree JSON").fill(json);
  await page.getByRole("button", { name: "Load tree" }).click();
  await expect(page).toHaveURL(/\/tree$/);
  await expect(page.getByRole("main")).toContainText(
    "200 (200 folders, 0 files)",
  );

  await page.reload();
  await expect(fileTree(page).getByRole("link", { name: "big" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText(
    "200 (200 folders, 0 files)",
  );
  await expect(page.getByText("could not be saved")).toBeHidden();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("closing the tree removes the saved copy", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Assignment example", exact: true })
    .click();
  await page.getByRole("button", { name: "Load tree" }).click();
  await expect(page).toHaveURL(/\/tree$/);

  await page.getByRole("button", { name: "Close tree" }).click();
  await expect(page).toHaveURL("/");
  await page.reload();
  await expect(page.getByText("A tree is already loaded")).toBeHidden();
});
