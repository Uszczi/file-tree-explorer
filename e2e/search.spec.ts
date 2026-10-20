import { expect, test } from "@playwright/test";
import { fileTree, loadExample, searchBox } from "./helpers";

test.describe("search", () => {
  test.beforeEach(async ({ page }) => {
    await loadExample(page, "Assignment example");
  });

  test("finds nodes fuzzily and shows their full path", async ({ page }) => {
    await searchBox(page).fill("btn");

    const result = page.getByRole("search").getByRole("link", { name: /Button\.tsx/ });
    await expect(result).toBeVisible();
    await expect(result).toContainText("root/src/components/Button.tsx");
    await expect(fileTree(page)).toBeHidden();
  });

  test("keeps results after a page reload", async ({ page }) => {
    await searchBox(page).fill("btn");
    await expect(page).toHaveURL("/tree?q=btn");

    await page.reload();
    await expect(searchBox(page)).toHaveValue("btn");
    await expect(page.getByRole("search").getByRole("link", { name: /Button\.tsx/ })).toBeVisible();
  });

  test("keeps the query when opening a result", async ({ page }) => {
    await searchBox(page).fill("btn");
    await page.getByRole("search").getByRole("link", { name: /Button\.tsx/ }).click();

    await expect(page).toHaveURL("/tree/src%2Fcomponents%2FButton.tsx?q=btn");
    await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toContainText("Button.tsx");
    await expect(searchBox(page)).toHaveValue("btn");
  });

  test("keeps the current node when typing a query on a details page", async ({ page }) => {
    await page.goto("/tree/src%2Findex.ts");
    await searchBox(page).fill("pack");

    await expect(page).toHaveURL("/tree/src%2Findex.ts?q=pack");
  });

  test("follows the query in the URL when navigating back", async ({ page }) => {
    await searchBox(page).fill("btn");
    await expect(page).toHaveURL("/tree?q=btn");
    await page.getByRole("search").getByRole("link", { name: /Button\.tsx/ }).click();
    await searchBox(page).fill("index");
    await expect(page).toHaveURL(/q=index/);

    await page.goBack();
    await expect(page).toHaveURL("/tree?q=btn");
    await expect(searchBox(page)).toHaveValue("btn");
  });

  test("clears the search with Escape and shows the tree again", async ({ page }) => {
    await searchBox(page).fill("btn");
    await expect(page).toHaveURL(/q=btn/);

    await searchBox(page).press("Escape");
    await expect(page).toHaveURL("/tree");
    await expect(fileTree(page)).toBeVisible();
  });

  test("supports fzf extended syntax", async ({ page }) => {
    await searchBox(page).fill("^pack");
    await expect(page.getByRole("search")).toContainText("1 result.");
    await expect(page.getByRole("search").getByRole("link", { name: /package\.json/ })).toBeVisible();
  });

  test("reports when nothing matches", async ({ page }) => {
    await searchBox(page).fill("zzzz");
    await expect(page.getByRole("search")).toContainText("No results.");
  });
});

test("caps the number of results in a large tree", async ({ page }) => {
  await loadExample(page, "Large (100 folders × 100 files)");
  await searchBox(page).fill("file");

  await expect(page.getByRole("search")).toContainText("Showing first 100 of 10000 results.");
  await expect(page.getByRole("search").getByRole("listitem")).toHaveCount(100);
});
