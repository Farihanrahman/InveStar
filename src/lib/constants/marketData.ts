/**
 * Market Data Constants
 * Centralized market data to avoid duplication across components
 */

export interface MarketStock {
  symbol: string;
  name: string;
  basePrice: number;
  baseChange: number;
}

// DSE (Dhaka Stock Exchange) market data
export const DSE_MARKET_DATA: MarketStock[] = [
  { symbol: "DSEBD", name: "DSE Broad Index", basePrice: 6234.45, baseChange: 45.23 },
  { symbol: "SQURPHARMA", name: "Square Pharma", basePrice: 245.80, baseChange: 5.20 },
  { symbol: "BATBC", name: "British American Tobacco", basePrice: 485.50, baseChange: -3.20 },
  { symbol: "GP", name: "Grameenphone", basePrice: 325.60, baseChange: 8.40 },
  { symbol: "BRAC", name: "BRAC Bank", basePrice: 48.75, baseChange: -0.85 },
  { symbol: "RENATA", name: "Renata Limited", basePrice: 892.30, baseChange: 12.50 },
  { symbol: "BEXIMCO", name: "Beximco Limited", basePrice: 142.30, baseChange: 2.10 },
  { symbol: "WALTONHIL", name: "Walton Hi-Tech", basePrice: 1245.00, baseChange: -15.30 },
  { symbol: "ICB", name: "Investment Corp. of BD", basePrice: 87.50, baseChange: 1.25 },
  { symbol: "LANKABAFIN", name: "LankaBangla Finance", basePrice: 32.40, baseChange: 0.45 },
];

// US market data
export const US_MARKET_DATA: MarketStock[] = [
  { symbol: "SPY", name: "S&P 500 ETF", basePrice: 485.32, baseChange: 3.45 },
  { symbol: "QQQ", name: "Nasdaq-100 ETF", basePrice: 412.87, baseChange: 5.23 },
  { symbol: "VTI", name: "Total Stock Market ETF", basePrice: 245.67, baseChange: 2.12 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", basePrice: 442.34, baseChange: 3.21 },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF", basePrice: 485.12, baseChange: 3.41 },
  { symbol: "VEA", name: "FTSE Developed Markets ETF", basePrice: 52.34, baseChange: -0.23 },
  { symbol: "AAPL", name: "Apple Inc.", basePrice: 182.52, baseChange: 2.15 },
  { symbol: "MSFT", name: "Microsoft Corp.", basePrice: 415.45, baseChange: 5.67 },
  { symbol: "GOOGL", name: "Alphabet Inc.", basePrice: 175.42, baseChange: 3.21 },
  { symbol: "AMZN", name: "Amazon.com Inc.", basePrice: 185.67, baseChange: 4.32 },
  { symbol: "NVDA", name: "NVIDIA Corp.", basePrice: 875.32, baseChange: 15.67 },
  { symbol: "META", name: "Meta Platforms Inc.", basePrice: 505.23, baseChange: 8.45 },
  { symbol: "TSLA", name: "Tesla Inc.", basePrice: 245.67, baseChange: -3.21 },
  { symbol: "BRK-B", name: "Berkshire Hathaway B", basePrice: 412.34, baseChange: 2.12 },
  { symbol: "JPM", name: "JPMorgan Chase", basePrice: 195.67, baseChange: 1.45 },
  { symbol: "V", name: "Visa Inc.", basePrice: 275.32, baseChange: 2.87 },
  { symbol: "JNJ", name: "Johnson & Johnson", basePrice: 158.45, baseChange: -0.87 },
  { symbol: "WMT", name: "Walmart Inc.", basePrice: 165.23, baseChange: 1.23 },
  { symbol: "PG", name: "Procter & Gamble", basePrice: 152.67, baseChange: 0.98 },
  { symbol: "MA", name: "Mastercard Inc.", basePrice: 445.32, baseChange: 4.56 },
  { symbol: "UNH", name: "UnitedHealth Group", basePrice: 525.45, baseChange: 3.21 },
  { symbol: "HD", name: "Home Depot Inc.", basePrice: 345.67, baseChange: 2.34 },
  { symbol: "DIS", name: "Walt Disney Co.", basePrice: 112.34, baseChange: 1.23 },
  { symbol: "PYPL", name: "PayPal Holdings", basePrice: 62.45, baseChange: -0.87 },
  { symbol: "NFLX", name: "Netflix Inc.", basePrice: 485.23, baseChange: 7.65 },
  { symbol: "INTC", name: "Intel Corp.", basePrice: 42.67, baseChange: -1.23 },
  { symbol: "AMD", name: "Advanced Micro Devices", basePrice: 175.34, baseChange: 4.56 },
  { symbol: "CRM", name: "Salesforce Inc.", basePrice: 265.45, baseChange: 3.21 },
  { symbol: "ADBE", name: "Adobe Inc.", basePrice: 545.67, baseChange: 5.43 },
  { symbol: "ORCL", name: "Oracle Corp.", basePrice: 125.34, baseChange: 1.87 },
];

// Crypto market data
export const CRYPTO_MARKET_DATA: MarketStock[] = [
  { symbol: "BTC", name: "Bitcoin", basePrice: 43250.00, baseChange: 1250.00 },
  { symbol: "ETH", name: "Ethereum", basePrice: 2280.00, baseChange: 85.50 },
  { symbol: "XLM", name: "Stellar Lumens", basePrice: 0.125, baseChange: 0.008 },
  { symbol: "SOL", name: "Solana", basePrice: 98.50, baseChange: 5.25 },
  { symbol: "ADA", name: "Cardano", basePrice: 0.58, baseChange: 0.02 },
  { symbol: "DOT", name: "Polkadot", basePrice: 7.85, baseChange: 0.35 },
  { symbol: "DOGE", name: "Dogecoin", basePrice: 0.082, baseChange: -0.003 },
  { symbol: "USDC", name: "USD Coin", basePrice: 1.00, baseChange: 0.00 },
];

// Forex market data
export const FOREX_MARKET_DATA: MarketStock[] = [
  { symbol: "EURUSD", name: "EUR/USD", basePrice: 1.0845, baseChange: 0.0023 },
  { symbol: "GBPUSD", name: "GBP/USD", basePrice: 1.2685, baseChange: 0.0018 },
  { symbol: "USDJPY", name: "USD/JPY", basePrice: 148.25, baseChange: -0.45 },
  { symbol: "AUDUSD", name: "AUD/USD", basePrice: 0.6725, baseChange: 0.0012 },
  { symbol: "USDCAD", name: "USD/CAD", basePrice: 1.3485, baseChange: -0.0008 },
  { symbol: "USDCHF", name: "USD/CHF", basePrice: 0.8745, baseChange: 0.0015 },
];

// Get all symbols for a market type
export const DSE_SYMBOLS = DSE_MARKET_DATA.map(s => s.symbol);
export const US_SYMBOLS = US_MARKET_DATA.map(s => s.symbol);
export const CRYPTO_SYMBOLS = CRYPTO_MARKET_DATA.map(s => s.symbol);
export const FOREX_SYMBOLS = FOREX_MARKET_DATA.map(s => s.symbol);

// All market symbols combined
export const ALL_MARKET_SYMBOLS = [...DSE_SYMBOLS, ...US_SYMBOLS, ...CRYPTO_SYMBOLS, ...FOREX_SYMBOLS];

// Static stock prices map (for fallback)
export const STOCK_PRICES: Record<string, number> = {
  // Tech Stocks
  AAPL: 182.52,
  GOOGL: 142.38,
  MSFT: 415.45,
  NVDA: 138.45,
  AMZN: 218.75,
  TSLA: 248.32,
  META: 612.89,
  
  // NASDAQ ETFs
  QQQ: 485.32,
  VGT: 572.18,
  VOOG: 342.65,
  VUG: 358.42,
  ARKK: 48.75,
  SOXX: 525.80,
  XLK: 228.45,
  
  // Mutual Funds
  VFIAX: 458.32,
  FXAIX: 185.67,
  VTSAX: 128.45,
  VIGAX: 168.92,
  VGTSX: 18.34,
  
  // Other Stocks
  JPM: 238.56,
  V: 322.15,
  WMT: 98.45,
  
  // Bangladesh Stocks
  SQURPHARMA: 245.80,
  GP: 325.60,
  BRACBANK: 48.25,
  BEXIMCO: 112.30,
  RENATA: 892.50,
  ACI: 185.40,
  OLYMPIC: 156.80,
  BATBC: 458.30,
  BSRMSTEEL: 68.45,
  LHBL: 95.80,
};

// Find stock info by symbol
export const findStockInfo = (symbol: string): MarketStock | undefined => {
  return (
    DSE_MARKET_DATA.find(s => s.symbol === symbol) ||
    US_MARKET_DATA.find(s => s.symbol === symbol) ||
    CRYPTO_MARKET_DATA.find(s => s.symbol === symbol) ||
    FOREX_MARKET_DATA.find(s => s.symbol === symbol)
  );
};

// Get static price for a symbol
export const getStaticPrice = (symbol: string): number => {
  const stockInfo = findStockInfo(symbol);
  return STOCK_PRICES[symbol] ?? stockInfo?.basePrice ?? 100;
};
