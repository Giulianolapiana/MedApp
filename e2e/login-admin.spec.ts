import { test, expect } from '@playwright/test';

test.describe('Login Administrativo', () => {
  // Configurar baseURL para que apunte al portal de administración
  test.use({ baseURL: 'http://localhost:5173' });

  test('debe permitir a un administrador iniciar sesión', async ({ page }) => {
    await page.goto('/login');
    
    // Validar que carga el form usando el título correcto
    await expect(page.getByRole('heading', { name: /Bienvenido de vuelta/i })).toBeVisible({ timeout: 10000 });
    
    // Validar que el botón Iniciar Sesión está
    await expect(page.getByRole('button', { name: /Iniciar sesión/i })).toBeVisible();
  });
});
