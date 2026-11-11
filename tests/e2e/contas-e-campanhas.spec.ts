import { expect, test } from "@playwright/test";

// Fluxos de conta (login/cadastro) e de campanhas de RPG vistos por um visitante.
test.describe("Login e cadastro", () => {
  test("formulário de login valida campos obrigatórios no navegador", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();

    const email = page.getByPlaceholder("E-mail");
    await page.getByRole("main").getByRole("button", { name: "Entrar" }).click();

    // O envio é bloqueado e o usuário continua na página.
    await expect(page).toHaveURL(/\/login$/);
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);

    await email.fill("isso-nao-e-email");
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
    await expect(page.getByPlaceholder("Senha")).toHaveAttribute("type", "password");
  });

  test("preserva o destino (?next) para voltar depois do login", async ({ page }) => {
    await page.goto("/login?next=/minha-biblioteca");
    await expect(page.locator('input[name="next"]')).toHaveValue("/minha-biblioteca");
  });

  test("navega entre login e cadastro", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("main").getByRole("link", { name: "Cadastre-se" }).click();

    await expect(page).toHaveURL(/\/cadastro$/);
    await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();
    await expect(page.getByPlaceholder("Nome de usuário")).toHaveAttribute("minlength", "3");

    await page.getByRole("main").getByRole("link", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Campanhas de RPG", () => {
  test("lista campanhas e oferece o botão de criar", async ({ page }) => {
    await page.goto("/campanhas");
    await expect(page.getByRole("heading", { name: "Campanhas de RPG" })).toBeVisible();
    // Sem banco configurado (modo demonstração) a lista fica vazia.
    await expect(page.getByText("Nenhuma campanha cadastrada.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Nova campanha" })).toHaveAttribute("href", "/campanhas/nova");
  });
});

test.describe("Robustez", () => {
  test("rota inexistente responde 404", async ({ page }) => {
    const response = await page.goto("/rota-que-nao-existe");
    expect(response?.status()).toBe(404);
  });

  test("páginas principais carregam sem erros no console", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      // 404 de recurso opcional (ex.: favicon) não é erro da aplicação.
      if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) errors.push(msg.text());
    });

    for (const path of ["/", "/busca", "/campanhas", "/login", "/cadastro"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });
});
