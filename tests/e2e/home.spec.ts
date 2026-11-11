import { expect, test } from "@playwright/test";

// Fluxo: visitante abre a página inicial e explora as categorias.
test.describe("Página inicial", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("carrega destaque, seções principais e atalhos de conta", async ({ page }) => {
    await expect(page).toHaveTitle("RateMedia");
    await expect(page.getByRole("heading", { level: 1, name: /cyberpunk: edgerunners/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Em Alta Esta Semana" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Populares por Categoria" })).toBeVisible();

    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    await expect(header.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/cadastro");
  });

  test("filtra os populares por categoria sem recarregar a página", async ({ page }) => {
    const tabs = page.getByRole("navigation", { name: "Filtrar por categoria" });
    await expect(page.getByText("Dandadan")).toBeVisible();

    await tabs.getByRole("link", { name: "Filmes" }).click();
    await expect(page).toHaveURL(/\?cat=movie$/);
    await expect(page.getByText("Oppenheimer")).toBeVisible();
    await expect(page.getByText("Dandadan")).toHaveCount(0);

    await tabs.getByRole("link", { name: "Mesas RPG" }).click();
    await expect(page).toHaveURL(/\?cat=rpg$/);
    await expect(page.getByText("Chamado de Cthulhu")).toBeVisible();

    await tabs.getByRole("link", { name: "Todos" }).click();
    await expect(page.getByText("Dandadan")).toBeVisible();
  });

  test("menu principal leva à busca e às campanhas", async ({ page }) => {
    const header = page.getByRole("banner");

    await header.getByRole("link", { name: "Descobrir" }).click();
    await expect(page).toHaveURL(/\/busca$/);
    await expect(page.getByText("14 obras encontradas")).toBeVisible();

    await page.getByRole("banner").getByRole("link", { name: "Campanhas RPG" }).click();
    await expect(page).toHaveURL(/\/campanhas$/);
    await expect(page.getByRole("heading", { name: "Campanhas de RPG" })).toBeVisible();
  });
});
