import { expect, test } from "@playwright/test";
import { fileTree, loadExample } from "./helpers";

test.describe("tree view and details", () => {
  test.beforeEach(async ({ page }) => {
    await loadExample(page, "Assignment example");
  });

  test("expands folders and opens file details", async ({ page }) => {
    const tree = fileTree(page);
    await tree.getByRole("button", { name: "Expand src" }).click();
    await tree.getByRole("button", { name: "Expand components" }).click();
    await tree.getByRole("link", { name: "Button.tsx" }).click();

    await expect(page).toHaveURL("/tree/src%2Fcomponents%2FButton.tsx");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 2 })).toContainText(
      "Button.tsx",
    );
    await expect(main).toContainText("512 B");
    await expect(main).toContainText("root/src/components/Button.tsx");
    await expect(page).toHaveTitle("Button.tsx · FileTree Explorer");
  });

  test("collapses an expanded folder", async ({ page }) => {
    const tree = fileTree(page);
    await tree.getByRole("button", { name: "Expand src" }).click();
    await expect(tree.getByRole("link", { name: "index.ts" })).toBeVisible();

    await tree.getByRole("button", { name: "Collapse src" }).click();
    await expect(tree.getByRole("link", { name: "index.ts" })).toBeHidden();
  });

  test("shows folder details with links to children", async ({ page }) => {
    await fileTree(page).getByRole("link", { name: "src" }).click();

    const main = page.getByRole("main");
    await expect(main).toContainText("2 (1 folder, 1 file)");
    await expect(main).toContainText("1.5 KB");

    await main
      .getByRole("table")
      .getByRole("link", { name: "components" })
      .click();
    await expect(page).toHaveURL("/tree/src%2Fcomponents");
  });

  test("navigates up with breadcrumbs", async ({ page }) => {
    await page.goto("/tree/src%2Fcomponents%2FButton.tsx");
    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "src" })
      .click();

    await expect(page).toHaveURL("/tree/src");
  });

  test("restores the tree after a reload on a deep link and reveals the node", async ({
    page,
  }) => {
    await page.goto("/tree/src%2Fcomponents%2FButton.tsx");
    await page.reload();

    await expect(
      page.getByRole("main").getByRole("heading", { level: 2 }),
    ).toContainText("Button.tsx");
    await expect(
      fileTree(page).getByRole("treeitem", { selected: true }),
    ).toContainText("Button.tsx");
  });

  test("closing the tree returns home and guards the tree route", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Close tree" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/tree");
    await expect(page).toHaveURL("/");
  });

  test("shows a message for an unknown node", async ({ page }) => {
    await page.goto("/tree/does-not-exist");
    await expect(
      page.getByRole("heading", { name: "Node not found" }),
    ).toBeVisible();
  });

  test("shows a not found page for unknown routes", async ({ page }) => {
    await page.goto("/nope");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });

  test("supports keyboard navigation", async ({ page }) => {
    const tree = fileTree(page);
    const link = (name: string) =>
      tree.getByRole("link", { name, exact: true });

    await link("root").focus();
    await page.keyboard.press("ArrowDown");
    await expect(link("src")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(
      tree.getByRole("button", { name: "Collapse src" }),
    ).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(link("index.ts")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(link("src")).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(link("index.ts")).toBeHidden();

    await page.keyboard.press("End");
    await expect(link("package.json")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/tree/package.json");
  });
});

test("handles special characters in node URLs", async ({ page }) => {
  await loadExample(page, "Special characters in names");
  const tree = fileTree(page);
  await tree.getByRole("button", { name: "Expand my documents" }).click();
  await tree.getByRole("link", { name: "100% done.md" }).click();

  await expect(page).toHaveURL("/tree/my%20documents%2F100%25%20done.md");
  await page.reload();
  await expect(
    page.getByRole("main").getByRole("heading", { level: 2 }),
  ).toContainText("100% done.md");
});
