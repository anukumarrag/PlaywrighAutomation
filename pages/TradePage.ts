import { Page } from '@playwright/test';
import { TradeData } from '../utils/tradeComparison';

/**
 * Page Object for the Trade detail page.
 * Provides methods to navigate to a specific trade and extract its data.
 *
 * Selectors mirror a typical trading platform that renders trade details
 * inside a summary card with labelled data attributes:
 *
 *   <div data-testid="trade-detail">
 *     <span data-testid="trade-id">TRD-001</span>
 *     <span data-testid="trade-price">100.50</span>
 *     <span data-testid="trade-quantity">200</span>
 *     <span data-testid="trade-status">Filled</span>
 *   </div>
 */
export class TradePage {
  constructor(private readonly page: Page, private readonly baseUrl: string) {}

  /**
   * Navigate to the buy-trades list and open the detail view for the trade
   * matching the given tradeId.
   */
  async navigateToBuyTrade(tradeId: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}/trades?type=buy`);
    await this.page
      .getByRole('row', { name: new RegExp(tradeId) })
      .getByRole('link')
      .click();
    await this.page.waitForSelector('[data-testid="trade-detail"]', { timeout: 30_000 });
  }

  /**
   * Extract the static trade fields (tradeId, price, quantity, status) from the
   * currently displayed trade detail view.  Dynamic fields such as timestamps and
   * usernames are deliberately not captured so that cross-environment comparisons
   * remain focused on core business data.
   */
  async extractTradeData(): Promise<TradeData> {
    const tradeId = await this.page
      .locator('[data-testid="trade-id"]')
      .innerText();
    const price = await this.page
      .locator('[data-testid="trade-price"]')
      .innerText();
    const quantity = await this.page
      .locator('[data-testid="trade-quantity"]')
      .innerText();
    const status = await this.page
      .locator('[data-testid="trade-status"]')
      .innerText();

    return {
      tradeId: tradeId.trim(),
      price: price.trim(),
      quantity: quantity.trim(),
      status: status.trim(),
    };
  }
}
