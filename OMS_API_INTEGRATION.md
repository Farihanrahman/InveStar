# OMS API Integration Guide

## Overview

This document describes the OMS (Order Management System) API integration structure for the Investar React/TypeScript application. The structure provides a centralized, type-safe way to interact with OMS backend APIs, similar to the Vue.js OMS project but adapted for React with TanStack Query.

## Architecture

The API integration follows a layered architecture:

```
src/
├── lib/
│   └── api/                    # Core API infrastructure
│       ├── client.ts          # Axios client with interceptors
│       ├── constants.ts      # API configuration
│       ├── types.ts           # TypeScript type definitions
│       ├── utils.ts           # Utility functions
│       └── index.ts           # Central exports
├── services/
│   └── oms/                    # OMS service layer
│       ├── authService.ts     # Authentication APIs
│       ├── orderService.ts    # Order management APIs
│       ├── portfolioService.ts # Portfolio APIs
│       ├── dashboardService.ts # Dashboard APIs
│       └── index.ts           # Service exports
└── hooks/
    └── api/                    # TanStack Query hooks
        ├── useAuthApi.ts      # Auth hooks
        ├── useOrderApi.ts     # Order hooks
        ├── usePortfolioApi.ts  # Portfolio hooks
        ├── useDashboardApi.ts  # Dashboard hooks
        └── index.ts           # Hook exports
```

## Key Features

- **Multi-Service Support**: Handles different API base URLs (default, oms, itch)
- **Authentication**: Automatic Supabase token injection
- **Type Safety**: Full TypeScript coverage with proper types
- **Error Handling**: Centralized error handling with toast notifications
- **Caching**: TanStack Query integration for intelligent caching
- **Loading States**: Built-in loading state management
- **Extensibility**: Easy to add new services following the pattern

## Setup

### 1. Install Dependencies

```bash
npm install
```

The `axios` package is already added to `package.json`.

### 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual configuration values. See `.env.example` for detailed documentation of each variable.

**Required Variables**:

- `VITE_OMS_API_BASE_URL` - Your OMS API base URL
- `VITE_OMS_APP_ID` - Application ID (defaults to 'InvestarOMS')
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

**Optional Variables**:

- `VITE_OMS_API_VERSION` - API version (defaults to 'v1')

### 3. Service Configuration

The API client automatically configures itself based on the service name:

- **default**: Authentication service (`auth/api/v1`)
- **oms**: Order Management System (`api`)
- **itch**: ITCH service (`api`)

## Usage Guide

### Using Services Directly

Services can be imported and used directly for one-off API calls:

```typescript
import { authService, orderService, portfolioService } from "@/services/oms"

// Login
const response = await authService.login({
  email: "user@example.com",
  password: "password123",
})

// Create order
const order = await orderService.createOrder({
  symbol: "AAPL",
  side: "BUY",
  quantity: 100,
  orderType: "MARKET",
})

// Get portfolio
const portfolio = await portfolioService.getPortfolio({ limit: 10 })
```

### Using TanStack Query Hooks (Recommended)

For React components, use the provided hooks which include caching, loading states, and automatic refetching:

```typescript
import { useOrders, useCreateOrder } from "@/hooks/api"
import { usePortfolio, usePortfolioDetails } from "@/hooks/api"

function OrdersComponent() {
  // Fetch orders with automatic caching
  const { data: orders, isLoading, error } = useOrders({ limit: 20 })

  // Create order mutation
  const createOrder = useCreateOrder()

  const handleCreateOrder = async () => {
    await createOrder.mutateAsync({
      symbol: "AAPL",
      side: "BUY",
      quantity: 100,
      orderType: "MARKET",
    })
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {orders?.map((order) => (
        <div key={order.id}>
          {order.symbol} - {order.quantity}
        </div>
      ))}
    </div>
  )
}
```

## Service Reference

### Authentication Service

**Location**: `src/services/oms/authService.ts`

**Methods**:

- `login(credentials)` - User login
- `autoLogin(data)` - Auto login with token
- `logout()` - User logout
- `forgotPassword(payload)` - Request password reset
- `setForgottenPassword(payload)` - Set new password with token
- `changePassword(id, payload)` - Change password for authenticated user
- `getSocialLoginUrl(provider, redirectURL)` - Get social login URL

**Hooks**: `useLogin`, `useAutoLogin`, `useLogout`, `useForgotPassword`, `useSetForgottenPassword`, `useChangePassword`

**Example**:

```typescript
import { useLogin } from "@/hooks/api"

const login = useLogin()
await login.mutateAsync({
  email: "user@example.com",
  password: "password123",
})
```

### Order Service

**Location**: `src/services/oms/orderService.ts`

**Methods**:

- `createOrder(payload)` - Create new order
- `getOrders(opts)` - Get orders with filters
- `cancelOrder(id)` - Cancel an order
- `replaceOrder(id, payload, isRelease)` - Replace/modify order
- `submitToExchange(orderId, opts)` - Submit order to exchange
- `getOrderSummary(opts)` - Get order summary
- `getSymbolOrderSummary(opts)` - Get symbol-specific order summary
- `cancelAllOrders()` - Cancel all orders
- `getExecutionData(payload)` - Get execution reports
- `checkStatus(orderId, opts)` - Check order status
- `exportTradeData()` - Export trade data as XML

**Hooks**: `useOrders`, `useCreateOrder`, `useCancelOrder`, `useReplaceOrder`, `useOrderSummary`, `useExecutionData`, `useOrderStatus`, `useExportTradeData`

**Example**:

```typescript
import { useOrders, useCreateOrder } from "@/hooks/api"

// Fetch orders
const { data: orders } = useOrders({
  page: 1,
  limit: 20,
  status: "PENDING",
})

// Create order
const createOrder = useCreateOrder()
await createOrder.mutateAsync({
  symbol: "AAPL",
  side: "BUY",
  quantity: 100,
  price: 150.0,
  orderType: "LIMIT",
})
```

### Portfolio Service

**Location**: `src/services/oms/portfolioService.ts`

**Methods**:

- `getTransactions(opts)` - Get transaction history
- `getPortfolio(opts)` - Get portfolio positions
- `getPortfolioDetails(opts)` - Get detailed portfolio information
- `fundTransaction(clientCode, body)` - Create fund transaction (deposit/withdrawal)
- `uploadPositionFile(formData)` - Upload position file

**Hooks**: `useTransactions`, `usePortfolio`, `usePortfolioDetails`, `useFundTransaction`, `useUploadPositionFile`

**Example**:

```typescript
import { usePortfolio, usePortfolioDetails } from "@/hooks/api"

// Get portfolio
const { data: portfolio } = usePortfolio()

// Get detailed portfolio with stats
const { data: details } = usePortfolioDetails()
// details.totalValue, details.totalGain, etc.
```

### Dashboard Service

**Location**: `src/services/oms/dashboardService.ts`

**Methods**:

- `getDseIndices(opts)` - Get DSE indices
- `getDseIndexSymbols(opts)` - Get DSE index symbols
- `createDseIndexSymbol(payload)` - Create DSE index symbol
- `updateDseIndexSymbol(id, payload)` - Update DSE index symbol
- `deleteDseIndexSymbol(id)` - Delete DSE index symbol
- `getTradeInformations(opts)` - Get trade informations
- `getSingleTradeInformation(id, opts)` - Get single trade information
- `getNews(opts)` - Get news

**Hooks**: `useDseIndices`, `useDseIndexSymbols`, `useTradeInformations`, `useNews`, `useCreateDseIndexSymbol`, `useUpdateDseIndexSymbol`, `useDeleteDseIndexSymbol`

**Example**:

```typescript
import { useDseIndices, useNews } from "@/hooks/api"

// Get indices (auto-refetches every 30 seconds)
const { data: indices } = useDseIndices()

// Get news
const { data: news } = useNews({ limit: 10 })
```

## Type Definitions

All types are exported from the service files and can be imported:

```typescript
import type {
  LoginCredentials,
  Order,
  Portfolio,
  Transaction,
  DseIndex,
  News,
} from "@/services/oms"
```

Common types are also available:

```typescript
import type {
  QueryOptions,
  ApiResponse,
  PaginationParams,
} from "@/lib/api/types"
```

## Query Options

Most services accept `QueryOptions` for filtering, pagination, and sorting:

```typescript
interface QueryOptions {
  page?: number
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  [key: string]: unknown // Additional filters
}

// Example usage
const { data } = useOrders({
  page: 1,
  limit: 20,
  status: "PENDING",
  symbol: "AAPL",
  sortBy: "createdAt",
  sortOrder: "desc",
})
```

## Error Handling

Errors are automatically handled by the API client interceptors:

1. **Unauthorized (401)**: Automatically signs out user and redirects to `/auth`
2. **Other Errors**: Shows error toast notification with message
3. **Cancelled Requests**: Silently ignored

You can also handle errors manually in hooks:

```typescript
const { data, error, isError } = useOrders()

if (isError) {
  console.error("Failed to fetch orders:", error)
}
```

For mutations:

```typescript
const createOrder = useCreateOrder()

const handleSubmit = async () => {
  try {
    await createOrder.mutateAsync(orderData)
    // Success - toast shown automatically
  } catch (error) {
    // Error toast shown automatically, but you can add custom handling
    console.error("Order creation failed:", error)
  }
}
```

## Custom Configuration

### Request Configuration

You can customize individual requests:

```typescript
import { omsClient } from "@/lib/api/client"

// Disable notifications
await omsClient.post("/endpoint", data, {
  showNotification: false,
})

// Custom notification
await omsClient.post("/endpoint", data, {
  notifyOptions: {
    message: "Custom success message",
    description: "Additional details",
    type: "success",
  },
})

// Disable auth requirement
await omsClient.get("/public-endpoint", {
  requiresAuth: false,
})

// Local error handling (no toast)
await omsClient.post("/endpoint", data, {
  isLocalErrorHandling: true,
})
```

### Creating Custom Service Clients

```typescript
import { createApiClient } from "@/lib/api/client"

// Create client for custom service
const customClient = createApiClient("oms")
```

## Authentication

The API client automatically:

- Retrieves Supabase session tokens
- Adds `Authorization: Bearer <token>` header
- Adds `X-USER-ID` header from user profile
- Adds `X-SENDER-SUB-ID` if available in user metadata
- Adds `x-tenant-id` from user metadata or localStorage

For requests that don't require authentication:

```typescript
await apiClient.post("/public-endpoint", data, {
  requiresAuth: false,
})
```

## Caching Strategy

TanStack Query hooks use the following caching strategies:

- **Orders/Portfolio**: 30 seconds stale time
- **Execution Data**: 10 seconds stale time (frequently updated)
- **Indices**: 1 minute stale time, auto-refetch every 30 seconds
- **News**: 5 minutes stale time
- **Order Status**: Polls every 5 seconds when enabled

You can customize caching in hooks:

```typescript
const { data } = useOrders(
  { limit: 20 },
  {
    staleTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
  }
)
```

## Best Practices

1. **Use Hooks in Components**: Prefer TanStack Query hooks over direct service calls in React components
2. **Type Safety**: Always use TypeScript types when working with API responses
3. **Error Handling**: Let the interceptors handle common errors, add custom handling only when needed
4. **Query Keys**: TanStack Query automatically generates query keys based on service and options
5. **Invalidation**: Mutations automatically invalidate related queries
6. **Loading States**: Use `isLoading` and `isFetching` from hooks for UI feedback

## Adding New Services

To add a new service:

1. **Create Service File**: `src/services/oms/newService.ts`

```typescript
import { omsClient } from "@/lib/api/client"
import { objectToApiQueryString } from "@/lib/api/utils"
import type { AxiosResponse } from "axios"
import type { QueryOptions } from "@/lib/api/types"

const newService = {
  getItems: (opts: QueryOptions = {}): Promise<AxiosResponse<Item[]>> => {
    return omsClient.get(`/endpoint${objectToApiQueryString(opts)}`)
  },

  createItem: (payload: CreateItemPayload): Promise<AxiosResponse<Item>> => {
    return omsClient.post("/endpoint", payload)
  },
}

export default newService
```

2. **Create Hook File**: `src/hooks/api/useNewServiceApi.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import newService from "@/services/oms/newService"

export const useItems = (opts: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["items", opts],
    queryFn: () => newService.getItems(opts).then((res) => res.data),
  })
}

export const useCreateItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemPayload) => newService.createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
```

3. **Export from Index Files**: Add exports to `src/services/oms/index.ts` and `src/hooks/api/index.ts`

## Troubleshooting

### Authentication Issues

If you're getting 401 errors:

- Check that Supabase session is active
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
- Check browser console for auth errors

### API URL Issues

If requests are going to wrong URL:

- Verify `VITE_OMS_API_BASE_URL` in `.env`
- Check service name is correct (default, oms, itch)
- Use browser DevTools Network tab to inspect requests

### Type Errors

If TypeScript complains:

- Ensure types are imported correctly
- Check service response types match API responses
- Update types if API structure changes

## Migration from Vue.js Pattern

This structure mirrors the Vue.js OMS project:

| Vue.js                | React/TypeScript               |
| --------------------- | ------------------------------ |
| `client(serviceName)` | `createApiClient(serviceName)` |
| `client().post()`     | `apiClient.post()` or hooks    |
| `useCommonStore`      | TanStack Query state           |
| `Notify.create()`     | `toast` from sonner            |
| `useAuthStore`        | Supabase auth                  |

## Additional Resources

- [Axios Documentation](https://axios-http.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## Support

For issues or questions:

1. Check this documentation
2. Review service files for implementation details
3. Check browser console and network tab for errors
4. Verify environment variables are set correctly
