import { expect, test, type Page } from "@playwright/test";

// Fluxo principal do usuário: buscar, filtrar, ordenar e paginar o catálogo.
const resultCount = (page: Page) => page.locator("p", { hasText: /obras? encontradas?/ }).first();
const resultTitles = (page: Page) => page.locator("article h3");

test.describe("Busca & Curadoria", () => {
  test("busca pela barra do topo e abre os resultados", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("banner").getByRole("searchbox", { name: "Buscar" });
    await search.fill("frieren");
    await search.press("Enter");

    await expect(page).toHaveURL(/\/busca\?q=frieren$/);
    await expect(page).toHaveTitle("Busca & Curadoria · RateMedia");
    await expect(resultCount(page)).toContainText("1 obra encontrada");
    await expect(resultTitles(page)).toHaveText(["Sousou no Frieren"]);
  });

  test("filtra por tipo de mídia pelo formulário e remove o filtro pelo chip", async ({ page }) => {
    await page.goto("/busca");
    await expect(resultCount(page)).toContainText("14 obras encontradas");

    await page.getByRole("radio", { name: /^Animes/ }).check();
    await page.getByRole("button", { name: "Aplicar Filtros" }).click();

    await expect(page).toHaveURL(/tipo=anime/);
    await expect(resultCount(page)).toContainText("6 obras encontradas");
    for (const kind of await page.locator("article span.uppercase").allTextContents()) expect(kind).toBe("Anime");

    await page.getByRole("link", { name: "Tipo: Anime" }).click();
    await expect(page).not.toHaveURL(/tipo=/);
    await expect(resultCount(page)).toContainText("14 obras encontradas");
  });

  test("filtra por nota mínima", async ({ page }) => {
    await page.goto("/busca?min=5");
    await expect(page.getByRole("link", { name: "Nota: ≥5.0" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Nota mínima" })).toHaveValue("5");
    await expect(resultTitles(page)).toHaveText(["Vagabond"]);
  });

  test("ordena de A a Z mantendo a busca na URL", async ({ page }) => {
    await page.goto("/busca");
    await expect(resultTitles(page).first()).toHaveText("Vagabond"); // padrão: mais bem avaliados

    await page.getByRole("navigation", { name: "Ordenar por" }).getByRole("link", { name: "A-Z" }).click();
    await expect(page).toHaveURL(/ordem=az/);
    await expect(resultTitles(page).first()).toHaveText("Arcane: Season 2");
  });

  test("pagina os resultados (12 por página)", async ({ page }) => {
    await page.goto("/busca");
    await expect(page.getByText("Página 1 de 2")).toBeVisible();
    await expect(resultTitles(page)).toHaveCount(12);

    await page.getByRole("link", { name: "Próxima página" }).click();
    await expect(page).toHaveURL(/pagina=2/);
    await expect(page.getByText("Página 2 de 2")).toBeVisible();
    await expect(resultTitles(page)).toHaveCount(2);
    await expect(page.getByText(/Exibindo\s*13–14\s*de\s*14 resultados/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Próxima página" })).toHaveCount(0);
  });

  test("mostra estado vazio quando nada corresponde aos filtros", async ({ page }) => {
    await page.goto("/busca?q=obra-que-nao-existe");
    await expect(resultCount(page)).toContainText("0 obras encontradas");
    await expect(page.getByText("Nada encontrado com esses filtros.")).toBeVisible();

    await page.getByRole("link", { name: "Limpar busca" }).click();
    await expect(resultCount(page)).toContainText("14 obras encontradas");
  });

  test("ignora parâmetros inválidos na URL sem quebrar a página", async ({ page }) => {
    const response = await page.goto("/busca?pagina=999&ordem=hack&min=abc&tipo=%3Cscript%3E");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Nada encontrado com esses filtros.")).toBeVisible();
    // O valor malicioso aparece como texto escapado no chip, não como HTML.
    await expect(page.getByRole("link", { name: "Tipo: <script>" })).toBeVisible();
    await expect(page.getByText("Página 1 de 1")).toBeVisible();
  });
});
