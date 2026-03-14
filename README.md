# PlaywrighAutomation

Playwright automation project for comparing **buy trade** data between UAT and Production environments.

## What it does

The test suite navigates to both the UAT and Production trading platforms, logs in, opens the detail view for a specific buy-trade record and extracts the core business data:

| Field      | Extracted |
|------------|-----------|
| Trade ID   | ✓         |
| Price      | ✓         |
| Quantity   | ✓         |
| Status     | ✓         |
| Timestamp  | ✗ (ignored – dynamic) |
| Username   | ✗ (ignored – dynamic) |

It then asserts that `price`, `quantity` and `status` are identical across both environments for the same trade record.

## Project structure

```
PlaywrighAutomation/
├── playwright.config.ts       # Playwright configuration
├── tsconfig.json              # TypeScript configuration
├── .env.uat.example           # Template for UAT credentials (copy to .env.uat)
├── .env.prod.example          # Template for Production credentials (copy to .env.prod)
├── pages/
│   ├── LoginPage.ts           # Page Object – login flow
│   └── TradePage.ts           # Page Object – trade detail extraction
├── utils/
│   └── tradeComparison.ts     # compareTrades() helper + TradeData interface
└── tests/
    └── buyTrade.spec.ts       # Main comparison test
```

## Setup

```bash
npm install
npx playwright install chromium
```

## Configuration

Copy the example files and fill in the real base URLs and credentials for each environment:

```bash
cp .env.uat.example .env.uat
cp .env.prod.example .env.prod
```

Then edit the copied files:

```
# .env.uat
BASE_URL=https://uat.trading-platform.example.com
USERNAME=uat_user
PASSWORD=uat_password
```

`.env.uat` and `.env.prod` are git-ignored so real credentials are never committed.
In CI/CD pipelines you can inject `BASE_URL`, `USERNAME` and `PASSWORD` directly as
environment variables; the dotenv loading step will be a no-op and the injected
values will be used instead.

To compare a specific trade, set the `TRADE_ID` environment variable (default: `TRD-001`):

```bash
TRADE_ID=TRD-042 npm test
```

## Running the tests

```bash
# Run the buy-trade comparison test
npm test

# View the HTML report
npm run report
```
