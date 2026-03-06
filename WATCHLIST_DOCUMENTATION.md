# Watchlist Workflow and Data Flow Documentation

## Overview
This document provides a comprehensive overview of the watchlist functionality, including how data flows from the database (Supabase) to the UI, and which files are responsible for each action.

## Database Schema

### Watchlist Table
**Location:** `supabase/migrations/20251126031647_cf6ae2b3-440d-423f-877d-ca7a84a4ea18.sql`

The watchlist table structure:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `symbol` (TEXT) - Stock symbol
- `created_at` (TIMESTAMP) - Auto-generated timestamp
- Unique constraint on `(user_id, symbol)` to prevent duplicates

**Row Level Security (RLS):**
- Users can only SELECT their own watchlist items
- Users can only INSERT to their own watchlist
- Users can only DELETE from their own watchlist

## Core Components and File Responsibilities

### 1. Watchlist Component
**File:** `src/components/Watchlist.tsx`

**Responsibilities:**
- Display watchlist items in two view modes (compact/card)
- Fetch watchlist data from Supabase on mount
- Remove items from watchlist
- Display real-time stock prices
- Handle view mode persistence (localStorage)
- Trigger parent component updates via `onWatchlistUpdate` callback

**Key Functions:**
- `fetchWatchlist()` - Fetches user's watchlist from Supabase
- `removeFromWatchlist(id)` - Deletes item from database and updates local state
- `handleSetViewMode(mode)` - Toggles between compact and card views

**Props:**
- `onStockClick(symbol)` - Callback when stock is clicked
- `stockPrices` - Real-time price data (Record<string, StockPrice>)
- `onWatchlistUpdate()` - Callback to refresh parent components
- `onBuyClick(symbol)` - Optional callback for buy action
- `onSellClick(symbol)` - Optional callback for sell action

**Data Flow:**
1. Component mounts → `useEffect` triggers `fetchWatchlist()`
2. `fetchWatchlist()` queries Supabase: `from("watchlist").select("*").eq("user_id", session.user.id)`
3. Results stored in local state: `setWatchlist(data || [])`
4. Component renders items using `watchlist.map()`
5. Each item displays price from `stockPrices[item.symbol]` prop

### 2. StockSearchBar Component
**File:** `src/components/StockSearchBar.tsx`

**Responsibilities:**
- Search and filter stocks from predefined list
- Add stocks to watchlist
- Check if stock is already in watchlist
- Display watchlist status in search results
- Trigger watchlist refresh after adding

**Key Functions:**
- `fetchWatchlistSymbols()` - Fetches current watchlist symbols
- `addToWatchlist(symbol)` - Inserts new item into Supabase watchlist table
- `isInWatchlist(symbol)` - Checks if symbol exists in local watchlist state

**Props:**
- `onSelectStock(symbol)` - Callback when stock is selected
- `onWatchlistUpdate()` - Callback to refresh watchlist after adding

**Data Flow:**
1. User searches → `filteredStocks` computed from `allStocks` array
2. User clicks stock → `addToWatchlist(symbol)` called
3. Checks authentication → `supabase.auth.getSession()`
4. Checks duplicate → `isInWatchlist(symbol)` check
5. Inserts to database → `supabase.from("watchlist").insert({ user_id, symbol })`
6. Updates local state → `setWatchlistSymbols(prev => [...prev, symbol])`
7. Triggers callback → `onWatchlistUpdateRef.current?.()`
8. Parent component refreshes watchlist

### 3. Portfolio Page
**File:** `src/pages/Portfolio.tsx`

**Responsibilities:**
- Orchestrates watchlist and stock price fetching
- Manages real-time price updates
- Coordinates between StockSearchBar and Watchlist components
- Handles watchlist refresh triggers

**Key Functions:**
- `fetchRealTimePrices()` - Fetches prices for holdings + watchlist symbols
- Uses `watchlistRefreshKey` state to trigger price refetch when watchlist changes

**Integration:**
- Combines watchlist symbols with holdings symbols for price fetching
- Passes `realTimePrices` to Watchlist component
- Handles `onWatchlistUpdate` to increment `watchlistRefreshKey`

**Data Flow:**
1. Component mounts → Checks authentication
2. Loads holdings and transactions
3. `useEffect` triggers `fetchRealTimePrices()` when:
   - `holdings` changes
   - `isAuthenticated` changes
   - `userId` changes
   - `watchlistRefreshKey` changes
4. `fetchRealTimePrices()`:
   - Gets symbols from holdings: `holdings.map(h => h.symbol)`
   - Gets symbols from watchlist: `supabase.from("watchlist").select("symbol")`
   - Combines and deduplicates: `[...new Set([...holdingSymbols, ...watchlistSymbols])]`
   - Calls Edge Function: `supabase.functions.invoke('fetch-real-time-prices', { body: { symbols } })`
   - Updates state: `setRealTimePrices(data.prices)`
5. Prices passed to Watchlist component as prop
6. Auto-refresh every 30 seconds via `setInterval`

### 4. MarketCard Component
**File:** `src/components/MarketCard.tsx`

**Responsibilities:**
- Displays individual stock card in card view mode
- Shows price, change, and change percentage
- Provides Buy/Sell/Remove actions
- Used by Watchlist component in card view mode

**Props:**
- `symbol`, `name`, `price`, `change`, `changePercent`, `isPositive`
- `onClick`, `onBuy`, `onSell`, `onRemove` callbacks

## Data Flow Architecture

### Add to Watchlist Flow

```
User Action (StockSearchBar)
    ↓
addToWatchlist(symbol)
    ↓
Check Authentication (supabase.auth.getSession)
    ↓
Check if already in watchlist (local state)
    ↓
Supabase Insert Query
    supabase.from("watchlist").insert({ user_id, symbol })
    ↓
Update Local State (setWatchlistSymbols)
    ↓
Trigger Callback (onWatchlistUpdate)
    ↓
Parent Component (Portfolio) Updates watchlistRefreshKey
    ↓
Watchlist Component Refetches (fetchWatchlist)
    ↓
Price Fetching Updates (fetchRealTimePrices includes new symbol)
    ↓
UI Updates with New Item
```

### Remove from Watchlist Flow

```
User Action (Watchlist Component)
    ↓
removeFromWatchlist(id)
    ↓
Supabase Delete Query
    supabase.from("watchlist").delete().eq("id", id)
    ↓
Update Local State (setWatchlist - filter out removed item)
    ↓
Trigger Callback (onWatchlistUpdate)
    ↓
Parent Component Updates watchlistRefreshKey
    ↓
Price Fetching Updates (removes symbol from price fetch)
    ↓
UI Updates (item removed from display)
```

### Real-Time Price Data Flow

```
Portfolio Component (fetchRealTimePrices)
    ↓
Collect Symbols:
  - From holdings (holdings.map(h => h.symbol))
  - From watchlist (supabase query)
    ↓
Combine and Deduplicate
    ↓
Supabase Edge Function Call
    supabase.functions.invoke('fetch-real-time-prices', { body: { symbols } })
    ↓
Edge Function (supabase/functions/fetch-real-time-prices/index.ts)
    - Fetches from Yahoo Finance API
    - Fetches from CoinGecko (for crypto)
    - Returns price data with fallbacks
    ↓
Update State (setRealTimePrices)
    ↓
Passed as Prop to Watchlist Component
    ↓
Watchlist Maps Prices to Items
    stockPrices[item.symbol]
    ↓
Display in UI (price, change, changePercent)
```

### Initial Load Flow

```
Portfolio Component Mounts
    ↓
Check Authentication
    ↓
Parallel Operations:
    1. Load Holdings (loadHoldings)
    2. Load Transactions (loadTransactions)
    3. Watchlist Component Mounts
        ↓
        fetchWatchlist() - Gets user's watchlist from Supabase
        ↓
        Sets watchlist state
    ↓
fetchRealTimePrices() triggered by useEffect
    ↓
Combines holdings + watchlist symbols
    ↓
Fetches prices via Edge Function
    ↓
Updates realTimePrices state
    ↓
Passes to Watchlist component
    ↓
Watchlist displays items with prices
```

## File Responsibility Matrix

| Action | Primary File | Supporting Files | Database Operation |
|--------|-------------|------------------|-------------------|
| **Add to Watchlist** | `StockSearchBar.tsx` | `Portfolio.tsx` | INSERT into `watchlist` table |
| **Remove from Watchlist** | `Watchlist.tsx` | `Portfolio.tsx` | DELETE from `watchlist` table |
| **Fetch Watchlist** | `Watchlist.tsx` | - | SELECT from `watchlist` table |
| **Display Watchlist** | `Watchlist.tsx` | `MarketCard.tsx` | - |
| **Fetch Prices** | `Portfolio.tsx` | `fetch-real-time-prices` Edge Function | - |
| **View Mode Toggle** | `Watchlist.tsx` | localStorage | - |
| **Stock Selection** | `Watchlist.tsx` | `Portfolio.tsx` | - |

## State Management

### Local Component State

**Watchlist Component:**
- `watchlist` - Array of WatchlistItem `[{ id, symbol, created_at }]`
- `loading` - Boolean loading state
- `viewMode` - `'compact' | 'card'` (persisted in localStorage)

**StockSearchBar Component:**
- `watchlistSymbols` - Array of strings (symbols) `string[]`
- `searchQuery` - String
- `showResults` - Boolean

**Portfolio Component:**
- `realTimePrices` - `Record<string, StockPrice>` where StockPrice is `{ price: number, change: number, changePercent: number }`
- `watchlistRefreshKey` - Number (used to trigger refetches)

### Data Flow Pattern
The application uses a **callback-based refresh pattern** rather than a global state management solution:
- Components communicate via callback props (`onWatchlistUpdate`)
- Parent components trigger child refreshes by updating keys or refetching
- No Redux/Zustand store - direct Supabase queries in components

## Key Integration Points

### 1. Authentication
All watchlist operations require authentication:
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) return; // or show error
```

### 2. Price Updates
Prices are fetched every 30 seconds via `setInterval` in Portfolio component:
```typescript
const interval = setInterval(fetchRealTimePrices, 30000);
```

### 3. Watchlist Refresh Trigger
When watchlist changes, Portfolio increments `watchlistRefreshKey`:
```typescript
onWatchlistUpdate={() => setWatchlistRefreshKey(prev => prev + 1)}
```
This triggers `useEffect` to refetch prices with updated symbol list.

## Error Handling

### Add to Watchlist
- Checks for duplicate (error code 23505 - unique constraint violation)
- Shows toast notifications for success/failure
- Handles authentication errors with user-friendly messages
- Updates local state optimistically on success

### Remove from Watchlist
- Catches Supabase errors
- Updates local state optimistically (filters out item immediately)
- Shows error toast on failure
- Reverts state change if error occurs (though not currently implemented)

### Price Fetching
- Silently fails (uses fallback prices if available)
- Logs errors to console
- Continues with existing prices on error
- Edge Function has fallback prices for common symbols

## View Modes

### Compact View
- List layout with inline price display
- Shows symbol, name, price, change
- Dropdown menu for actions (Buy/Sell/Remove)
- More items visible at once
- Better for quick scanning

### Card View
- Grid layout using MarketCard component
- More visual with larger cards
- Direct Buy/Sell buttons on cards
- Better for detailed viewing
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

View mode preference is persisted in `localStorage` as `'watchlist-view-mode'`.

## Stock Name Lookup

The Watchlist component includes a `getStockName()` function that maps symbols to company names:
- DSE (Bangladesh) stocks
- US stocks and ETFs
- Cryptocurrencies
- Forex pairs

If a symbol is not found in the lookup, it displays the symbol itself.

## Edge Function: fetch-real-time-prices

**Location:** `supabase/functions/fetch-real-time-prices/index.ts`

**Purpose:** Fetches real-time stock prices from external APIs

**Process:**
1. Receives array of symbols from Portfolio component
2. Processes symbols in batches (5 at a time) to avoid rate limiting
3. For each symbol:
   - Checks if it's a crypto → uses CoinGecko API
   - Checks if it's a forex pair → uses Yahoo Finance
   - Otherwise → uses Yahoo Finance for stocks/ETFs
4. Returns price data with fallback values if API calls fail
5. Calculates `changePercent` from price and change

**Response Format:**
```typescript
{
  prices: {
    [symbol: string]: {
      price: number;
      change: number;
      changePercent: number;
    }
  }
}
```

## Component Interaction Diagram

```
┌─────────────────┐
│  Portfolio.tsx   │
│  (Orchestrator) │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ StockSearchBar  │  │   Watchlist.tsx  │
│                 │  │                  │
│ - Search stocks │  │ - Display items  │
│ - Add to list   │  │ - Remove items   │
│ - Check status  │  │ - View modes     │
└────────┬────────┘  └────────┬────────┘
         │                     │
         │                     │
         │  onWatchlistUpdate   │
         │  (callback)          │
         │                     │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  Supabase DB      │
         │  watchlist table  │
         └──────────────────┘
                    │
                    │
         ┌──────────────────┐
         │  Edge Function   │
         │  fetch-real-time │
         │  -prices         │
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  External APIs    │
         │  - Yahoo Finance  │
         │  - CoinGecko      │
         └──────────────────┘
```

## Code Examples

### Adding to Watchlist
```typescript
// In StockSearchBar.tsx
const addToWatchlist = async (symbol: string, e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login to add to watchlist");
      return;
    }

    if (isInWatchlist(symbol)) {
      toast.info(`${symbol} is already in your watchlist`);
      return;
    }

    const { error } = await supabase
      .from("watchlist")
      .insert({
        user_id: session.user.id,
        symbol: symbol
      });

    if (error) {
      if (error.code === '23505') {
        toast.info(`${symbol} is already in your watchlist`);
      } else {
        throw error;
      }
      return;
    }

    setWatchlistSymbols(prev => [...prev, symbol]);
    toast.success(`${symbol} added to watchlist`);
    onWatchlistUpdateRef.current?.();
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    toast.error("Failed to add to watchlist");
  }
};
```

### Removing from Watchlist
```typescript
// In Watchlist.tsx
const removeFromWatchlist = async (id: string) => {
  try {
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    setWatchlist(prev => prev.filter(item => item.id !== id));
    toast.success("Removed from watchlist");
    onWatchlistUpdate?.();
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    toast.error("Failed to remove from watchlist");
  }
};
```

### Fetching Real-Time Prices
```typescript
// In Portfolio.tsx
const fetchRealTimePrices = async () => {
  setIsLoading(true);
  try {
    // Get symbols from holdings
    const holdingSymbols = holdings.map(h => h.symbol);
    
    // Get symbols from watchlist
    let watchlistSymbols: string[] = [];
    if (isAuthenticated && userId) {
      const { data: watchlistData } = await supabase
        .from("watchlist")
        .select("symbol")
        .eq("user_id", userId);
      watchlistSymbols = watchlistData?.map(item => item.symbol) || [];
    }
    
    // Combine and deduplicate symbols
    const symbols = [...new Set([...holdingSymbols, ...watchlistSymbols])];
    
    if (symbols.length === 0) {
      setIsLoading(false);
      return;
    }
    
    const { data, error } = await supabase.functions.invoke('fetch-real-time-prices', {
      body: { symbols }
    });

    if (error) throw error;
    
    if (data?.prices) {
      setRealTimePrices(data.prices);
      setLastUpdated(new Date());
    }
  } catch (error) {
    console.error('Error fetching real-time prices:', error);
  } finally {
    setIsLoading(false);
  }
};
```

## Summary

The watchlist system uses:
- **Direct Supabase queries** (no state management library)
- **Callback-based communication** between components
- **Real-time price updates** via Edge Function every 30 seconds
- **Optimistic UI updates** with error handling
- **Row Level Security** for data protection
- **Local state management** in React components

The architecture is straightforward and component-based, with the Portfolio page acting as the orchestrator for watchlist and price data coordination. All watchlist operations are user-scoped through Supabase RLS policies, ensuring data security and isolation.
