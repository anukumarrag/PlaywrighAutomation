/**
 * Trade data extracted from a single trade record.
 * Dynamic fields such as timestamps and usernames are intentionally excluded
 * so that environment comparisons focus only on core business values.
 */
export interface TradeData {
  tradeId: string;
  price: string;
  quantity: string;
  status: string;
}

/**
 * Result of comparing the same trade across two environments.
 */
export interface ComparisonResult {
  tradeId: string;
  fields: {
    field: keyof Omit<TradeData, 'tradeId'>;
    uat: string;
    prod: string;
    match: boolean;
  }[];
  allMatch: boolean;
}

/**
 * Compares a trade record extracted from UAT against the same record from Production.
 * Only price, quantity and status are compared; dynamic data (timestamps, usernames)
 * is not included in TradeData and is therefore not evaluated.
 *
 * @param uat  - Trade data extracted from the UAT environment.
 * @param prod - Trade data extracted from the Production environment.
 * @returns    ComparisonResult describing each field comparison.
 */
export function compareTrades(uat: TradeData, prod: TradeData): ComparisonResult {
  const fieldsToCompare: (keyof Omit<TradeData, 'tradeId'>)[] = [
    'price',
    'quantity',
    'status',
  ];

  const fields = fieldsToCompare.map((field) => ({
    field,
    uat: uat[field],
    prod: prod[field],
    match: uat[field] === prod[field],
  }));

  return {
    tradeId: uat.tradeId,
    fields,
    allMatch: fields.every((f) => f.match),
  };
}
