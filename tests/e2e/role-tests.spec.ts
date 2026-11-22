import { test, expect } from '@playwright/test';

test('redirection admin vers /admin après login', async ({ page }) => {
  // Se connecter en tant qu'admin
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'admin.national@test.com');
  await page.fill('input[type="password"]', 'AdminDev2024!');
  await page.click('button[type="submit]');

  // Devrait être redirigé vers /admin
  await expect(page).toHaveURL(/.*\/admin/);
});

test('redirection superviseur national vers /superviseur-national après login', async ({ page }) => {
  // Se connecter en tant que superviseur national
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'superviseur.national@test.com');
  await page.fill('input[type="password"]', 'SuperviseurDev2024!');
  await page.click('button[type="submit]');

  // Devrait être redirigé vers /superviseur-national
  await expect(page).toHaveURL(/.*\/superviseur-national/);
});

test('redirection superviseur régional vers /superviseur-regional après login', async ({ page }) => {
  // Se connecter en tant que superviseur régional
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'superviseur.regional@test.com');
  await page.fill('input[type="password"]', 'SuperviseurRegionalDev2024!');
  await page.click('button[type="submit]');

  // Devrait être redirigé vers /superviseur-regional
  await expect(page).toHaveURL(/.*\/superviseur-regional/);
});

test('redirection agent de santé vers /agent après login', async ({ page }) => {
  // Se connecter en tant qu'agent de santé
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'agent.sante@test.com');
  await page.fill('input[type="password"]', 'AgentDev2024!');
  await page.click('button[type="submit]');

  // Devrait être redirigé vers /agent
  await expect(page).toHaveURL(/.*\/agent/);
});

test('agent qui accède à /admin est renvoyé vers /agent', async ({ page }) => {
  // Se connecter en tant qu'agent
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'agent.sante@test.com');
  await page.fill('input[type="password"]', 'AgentDev2024!');
  await page.click('button[type="submit]');

  // Essayer d'accéder à /admin
  await page.goto('/admin');

  // Devrait être redirigé vers /agent
  await expect(page).toHaveURL(/.*\/agent/);
});

test('agent qui accède à /superviseur-national est renvoyé vers /agent', async ({ page }) => {
  // Se connecter en tant qu'agent
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'agent.sante@test.com');
  await page.fill('input[type="password"]', 'AgentDev2024!');
  await page.click('button[type="submit]');

  // Essayer d'accéder à /superviseur-national
  await page.goto('/superviseur-national');

  // Devrait être redirigé vers /agent
  await expect(page).toHaveURL(/.*\/agent/);
});

test('agent qui accède à /superviseur-regional est renvoyé vers /agent', async ({ page }) => {
  // Se connecter en tant qu'agent
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'agent.sante@test.com');
  await page.fill('input[type="password"]', 'AgentDev2024!');
  await page.click('button[type="submit]');

  // Essayer d'accéder à /superviseur-regional
  await page.goto('/superviseur-regional');

  // Devrait être redirigé vers /agent
  await expect(page).toHaveURL(/.*\/agent/);
});

test('superviseur régional ne peut pas accéder à /admin', async ({ page }) => {
  // Se connecter en tant que superviseur régional
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'superviseur.regional@test.com');
  await page.fill('input[type="password"]', 'SuperviseurRegionalDev2024!');
  await page.click('button[type="submit]');

  // Essayer d'accéder à /admin
  await page.goto('/admin');

  // Devrait être redirigé vers /superviseur-regional (pas /agent, mais sa propre page)
  await expect(page).toHaveURL(/.*\/superviseur-regional/);
});