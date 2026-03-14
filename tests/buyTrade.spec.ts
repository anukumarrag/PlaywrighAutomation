import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { TradePage } from '../pages/TradePage';
import { compareTrades, TradeData } from '../utils/tradeComparison';

// ---------------------------------------------------------------------------
// Environment configuration
// ---------------------------------------------------------------------------

/**
 * Load UAT and Production settings from .env.uat / .env.prod files.
 *
 * For local development, copy the example files and fill in real values:
 *   cp .env.uat.example .env.uat
 *   cp .env.prod.example .env.prod
 *
 * In CI/CD pipelines, inject the values as environment variables directly
 * (e.g. GitHub Actions secrets) and the dotenv call becomes a no-op.
 * Real credential files (.env.uat, .env.prod) are git-ignored.
 */
function loadEnvFile(filename: string): Record<string, string> {
  // Try the real credentials file first; fall back to the example template.
  const candidates = [
    path.resolve(__dirname, '..', filename),
    path.resolve(__dirname, '..', `${filename}.example`),
  ];
  for (const candidate of candidates) {
    const result = dotenv.config({ path: candidate, override: false });
    if (!result.error) {
      return result.parsed ?? {};
    }
  }
  return {};
}

const uatEnv = loadEnvFile('.env.uat');
const prodEnv = loadEnvFile('.env.prod');

const UAT_BASE_URL = uatEnv['BASE_URL'] ?? '';
const UAT_USERNAME = uatEnv['USERNAME'] ?? '';
const UAT_PASSWORD = uatEnv['PASSWORD'] ?? '';

const PROD_BASE_URL = prodEnv['BASE_URL'] ?? '';
const PROD_USERNAME = prodEnv['USERNAME'] ?? '';
const PROD_PASSWORD = prodEnv['PASSWORD'] ?? '';

/**
 * The trade ID shared across both environments that we want to compare.
 * In a real run this can also be supplied via an environment variable so the
 * same test suite can be parameterised from a CI pipeline.
 */
const TRADE_ID_TO_COMPARE = process.env['TRADE_ID'] ?? 'TRD-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Open a fresh browser context, log in and extract the buy-trade data for the
 * given tradeId from the specified environment.
 *
 * A new context is used for each environment so that session cookies from UAT
 * never bleed over into the Production session.
 */
async function extractTradeDataFromEnv(
  browser: import('@playwright/test').Browser,
  baseUrl: string,
  username: string,
  password: string,
  tradeId: string,
): Promise<TradeData> {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const loginPage = new LoginPage(page, baseUrl);
    await loginPage.login(username, password);

    const tradePage = new TradePage(page, baseUrl);
    await tradePage.navigateToBuyTrade(tradeId);
    return await tradePage.extractTradeData();
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Buy Trade – UAT vs Production data comparison', () => {
  test(
    `trade "${TRADE_ID_TO_COMPARE}" has matching price, quantity and status across environments`,
    async ({ browser }) => {
      // ------------------------------------------------------------------
      // 1. Extract the trade data from both environments independently.
      //    Dynamic fields (timestamps, created-by usernames, etc.) are NOT
      //    extracted, so they cannot cause a false mismatch.
      // ------------------------------------------------------------------
      const [uatData, prodData] = await Promise.all([
        extractTradeDataFromEnv(
          browser,
          UAT_BASE_URL,
          UAT_USERNAME,
          UAT_PASSWORD,
          TRADE_ID_TO_COMPARE,
        ),
        extractTradeDataFromEnv(
          browser,
          PROD_BASE_URL,
          PROD_USERNAME,
          PROD_PASSWORD,
          TRADE_ID_TO_COMPARE,
        ),
      ]);

      // ------------------------------------------------------------------
      // 2. Compare using the utility function which returns a structured
      //    result listing each field and whether it matched.
      // ------------------------------------------------------------------
      const result = compareTrades(uatData, prodData);

      // Log the comparison table to the test output for easy debugging.
      console.log(`\nTrade comparison for ID: ${result.tradeId}`);
      console.log('─'.repeat(50));
      for (const { field, uat, prod, match } of result.fields) {
        const indicator = match ? '✓' : '✗';
        console.log(
          `${indicator}  ${field.padEnd(10)} UAT=${uat}  PROD=${prod}`,
        );
      }
      console.log('─'.repeat(50));

      // ------------------------------------------------------------------
      // 3. Assert individual fields to surface clear failure messages.
      // ------------------------------------------------------------------
      for (const { field, uat, prod } of result.fields) {
        expect(
          prod,
          `Field "${field}" differs between environments – UAT="${uat}" PROD="${prod}"`,
        ).toBe(uat);
      }

      // Belt-and-braces assertion on the aggregate flag.
      expect(result.allMatch, 'One or more trade fields differ between UAT and Production').toBe(true);
    },
  );
});
