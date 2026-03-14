import { Page } from '@playwright/test';

/**
 * Page Object for the Login page.
 * Handles navigating to the application and authenticating a user.
 */
export class LoginPage {
  constructor(private readonly page: Page, private readonly baseUrl: string) {}

  /**
   * Navigate to the login page and sign in with the provided credentials.
   */
  async login(username: string, password: string): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
    // Wait until the dashboard / trade list is visible before returning.
    await this.page.waitForURL(`${this.baseUrl}/dashboard`, { timeout: 30_000 });
  }
}
