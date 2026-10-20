import { expect, test } from "@playwright/test";
import { fileTree, loadExample } from "./helpers";

test.describe("home page", () => {
  test("inserting an example only fills the editor", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Assignment example", exact: true })
      .click();

    await expect(page.getByLabel("Tree JSON")).toHaveValue(/"name": "root"/);
    await expect(page).toHaveURL(/\/$/);
  });

  test("loading a tree opens the tree view with root details", async ({
    page,
  }) => {
    await loadExample(page, "Assignment example");

    await expect(
      fileTree(page).getByRole("link", { name: "root" }),
    ).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 2 })).toContainText("root");
    await expect(main).toContainText("2 (1 folder, 1 file)");
    await expect(main).toContainText("1.8 KB");
  });

  test("shows validation errors with their location", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Invalid fields", exact: true })
      .click();
    await page.getByRole("button", { name: "Load tree" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toContainText("10 problems");
    await expect(alert).toContainText("children[0].name");
    await expect(alert).toContainText("children[9]");
    await expect(page.getByLabel("Tree JSON")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test("reports invalid JSON syntax", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Tree JSON").fill('{ "name": ');
    await page.getByRole("button", { name: "Load tree" }).click();

    await expect(page.getByRole("alert")).toContainText("Invalid JSON");
  });

  test("loads an uploaded file", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Upload file…").setInputFiles({
      name: "tree.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          name: "uploaded",
          type: "folder",
          children: [{ name: "notes.txt", type: "file", size: 2048 }],
        }),
      ),
    });

    await expect(page).toHaveURL(/\/tree$/);
    await expect(
      fileTree(page).getByRole("link", { name: "notes.txt" }),
    ).toBeVisible();
  });

  test("prefills the editor with the loaded tree", async ({ page }) => {
    await loadExample(page, "Assignment example");
    await page.goto("/");

    await expect(page.getByText("A tree is already loaded")).toBeVisible();
    await expect(page.getByLabel("Tree JSON")).toHaveValue(/"Button.tsx"/);
  });
});

test("the home page survives a tree too deep to pretty-print", async ({
  page,
}) => {
  const depth = 3_000;
  const json =
    '{"name":"d","type":"folder","children":['.repeat(depth) +
    '{"name":"leaf.txt","type":"file","size":1}' +
    "]}".repeat(depth);

  await page.goto("/");
  await page.getByLabel("Tree JSON").fill(json);
  await page.getByRole("button", { name: "Load tree" }).click();
  await expect(page).toHaveURL(/\/tree$/);

  for (const visit of ["navigate", "reload"] as const) {
    if (visit === "navigate")
      await page.getByRole("link", { name: "📂 FileTree Explorer" }).click();
    else await page.reload();

    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeHidden();
    await expect(page.getByText("A tree is already loaded")).toBeVisible();
    await expect(page.getByLabel("Tree JSON")).toHaveValue(/leaf\.txt/);
  }
});
