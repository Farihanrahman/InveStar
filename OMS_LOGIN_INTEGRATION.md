# OMS Login Integration Documentation

## Overview

This document describes the OMS (Order Management System) login API integration that replaces the previous Supabase authentication system. The implementation provides a complete authentication flow using OMS API endpoints, with token management and user state handling throughout the application.

## Architecture

The integration follows a layered architecture:

```
src/
├── lib/
│   └── auth/                    # Authentication utilities
│       ├── tokenStorage.ts     # Token storage in localStorage
│       └── omsAuthContext.tsx  # React context for auth state
├── services/
│   └── oms/
│       └── authService.ts      # OMS authentication API calls
├── hooks/
│   └── api/
│       └── useAuthApi.ts       # React Query hooks for auth
└── pages/
    └── Auth.tsx                # Login page using OMS API
```

## Key Components

### 1. Token Storage (`src/lib/auth/tokenStorage.ts`)

Manages OMS authentication tokens and user data in localStorage.

**Functions:**

- `setOmsToken(token: string)` - Store authentication token
- `getOmsToken()` - Retrieve authentication token
- `removeOmsToken()` - Clear token and user data
- `hasOmsToken()` - Check if token exists
- `setOmsUser(user: OmsUser)` - Store user data
- `getOmsUser()` - Retrieve user data

**Storage Keys:**

- `oms_auth_token` - Authentication token
- `oms_user_data` - User information

### 2. OMS Auth Context (`src/lib/auth/omsAuthContext.tsx`)

React context provider that manages authentication state across the application.

**Exported Hook:**

```typescript
const { isAuthenticated, user, token, setAuth, clearAuth, isLoading } =
  useOmsAuth()
```

**State Properties:**

- `isAuthenticated: boolean` - Whether user is logged in
- `user: OmsUser | null` - Current user data
- `token: string | null` - Current authentication token
- `isLoading: boolean` - Initialization loading state

**Methods:**

- `setAuth(token: string, user: OmsUser)` - Set authentication state
- `clearAuth()` - Clear authentication state

### 3. Authentication Service (`src/services/oms/authService.ts`)

Handles all OMS authentication API calls.

**Login Response Interface:**

```typescript
interface LoginResponse {
  status: string;
  message: string;
  companies: Array<{ id: number; company_name: string }>;
  roles: unknown[];
  session: {
    access_token: string;
    session_last_access: number;
    session_start: number;
    senderSubId: string;
  };
  user_info: {
    id: number;
    first_name: string;
    last_name: string;
    user_name: string;
    email: string;
    role: string;
    senderSubId: string;
    tenants?: Array<{ id: number; ... }>;
    // ... other user fields
  };
}
```

**Methods:**

- `login(credentials: LoginCredentials)` - User login
- `autoLogin(data: AutoLoginData)` - Auto login with token
- `logout()` - User logout
- `forgotPassword(payload)` - Request password reset
- `setForgottenPassword(payload)` - Set new password
- `changePassword(id, payload)` - Change password

### 4. Authentication Hooks (`src/hooks/api/useAuthApi.ts`)

TanStack Query hooks for authentication operations.

**Hooks:**

- `useLogin()` - Login mutation hook
- `useAutoLogin()` - Auto login mutation hook
- `useLogout()` - Logout mutation hook
- `useForgotPassword()` - Forgot password mutation hook
- `useSetForgottenPassword()` - Set forgotten password hook
- `useChangePassword()` - Change password hook

**Example Usage:**

```typescript
const loginMutation = useLogin()

const handleLogin = async () => {
  try {
    const responseData = await loginMutation.mutateAsync({
      email: "user@example.com",
      password: "password123",
    })
    // Response contains session.access_token and user_info
  } catch (error) {
    // Handle error
  }
}
```

### 5. API Client Integration (`src/lib/api/client.ts`)

The API client automatically includes OMS authentication tokens in requests.

**How it works:**

1. Checks for OMS token in localStorage when `requiresAuth: true`
2. Adds `Authorization: Bearer <token>` header
3. Adds `X-USER-ID` header from user data
4. Adds `X-SENDER-SUB-ID` header if available
5. Adds `x-tenant-id` header if available
6. Clears token and redirects to `/auth` on 401 errors

## API Response Structure

### Login Response

The OMS login API returns the following structure:

```json
{
  "status": "OK",
  "message": "",
  "companies": [
    {
      "id": 96,
      "company_name": "Company Name"
    }
  ],
  "roles": [],
  "session": {
    "access_token": "32744|i1kb2p5UGCVwVEPQhZ8bZta5WtHs4CZQJIV4GiGq",
    "session_last_access": 0,
    "session_start": 0,
    "senderSubId": "BEXTRDR001"
  },
  "user_info": {
    "id": 139,
    "first_name": "John",
    "last_name": "Doe",
    "user_name": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "senderSubId": "BEXTRDR001",
    "tenants": [
      {
        "id": 96,
        "name": "Company Name",
        "is_tenant_owner": 1,
        "is_tenant_admin": 1
      }
    ]
    // ... other user fields
  }
}
```

### Token Extraction

- **Token Location**: `response.session.access_token`
- **User Data Location**: `response.user_info`
- **Tenant ID**: `response.user_info.tenants[0].id` (if available)

## Implementation Details

### Login Flow

1. User submits login form in `Auth.tsx`
2. `useLogin` hook calls `authService.login()`
3. API returns response with `session.access_token` and `user_info`
4. Token and user data are stored in localStorage
5. Auth context is updated via `setAuth()`
6. User is redirected to `/wallet`

### Authentication State Management

The `OmsAuthProvider` wraps the entire application and:

- Initializes auth state from localStorage on mount
- Provides auth state to all components via context
- Updates state when `setAuth()` or `clearAuth()` is called

### Token Storage

- **Storage Method**: localStorage
- **Token Key**: `oms_auth_token`
- **User Data Key**: `oms_user_data`
- **Persistence**: Survives page refreshes and browser restarts

### Logout Flow

1. User clicks logout
2. `useLogout` hook calls `authService.logout()`
3. Token and user data are cleared from localStorage
4. Auth context state is cleared
5. User is redirected to `/auth`

## Updated Components

The following components were updated to use OMS authentication:

1. **Auth.tsx** - Login page using OMS API
2. **Navigation.tsx** - Uses OMS auth context for user info
3. **AuthRequired.tsx** - Checks OMS token instead of Supabase session
4. **WelcomeHeader.tsx** - Displays user name from OMS user data
5. **Security.tsx** - Uses OMS auth for authentication guard
6. **Wallet.tsx** - Uses OMS auth (still uses Supabase for database queries)

## User Data Mapping

The OMS API response is mapped to a consistent user object:

```typescript
{
  id: String(user_info.id),
  email: user_info.email,
  first_name: user_info.first_name,
  last_name: user_info.last_name,
  user_name: user_info.user_name,
  name: `${first_name} ${last_name}`.trim(),
  full_name: `${first_name} ${last_name}`.trim(),
  role: user_info.role,
  senderSubId: user_info.senderSubId,
  tenant_id: String(user_info.tenants[0].id), // if available
  ...user_info // all other fields
}
```

## API Headers

When making authenticated requests, the following headers are automatically added:

- `Authorization: Bearer <oms_token>`
- `X-USER-ID: <user_id>`
- `X-SENDER-SUB-ID: <senderSubId>` (if available)
- `x-tenant-id: <tenant_id>` (if available)

## Error Handling

### 401 Unauthorized

- Token is automatically cleared from localStorage
- User is redirected to `/auth` page
- Error toast is displayed

### Login Errors

- Error messages are extracted from API response
- Displayed via toast notifications
- User remains on login page

## Migration Notes

### Removed Supabase Auth Dependencies

The following Supabase auth features were removed:

- `supabase.auth.signInWithPassword()`
- `supabase.auth.signUp()`
- `supabase.auth.signInWithOAuth()`
- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange()`

### Kept Supabase for Database

Supabase is still used for:

- Database queries (e.g., `wallet_balances` table)
- Other non-auth database operations

## Usage Examples

### Check Authentication Status

```typescript
import { useOmsAuth } from "@/lib/auth/omsAuthContext"

function MyComponent() {
  const { isAuthenticated, user, isLoading } = useOmsAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return <div>Welcome, {user?.first_name}!</div>
}
```

### Login

```typescript
import { useLogin } from "@/hooks/api/useAuthApi"
import { useOmsAuth } from "@/lib/auth/omsAuthContext"

function LoginForm() {
  const loginMutation = useLogin()
  const { setAuth } = useOmsAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const responseData = await loginMutation.mutateAsync({
        email: email,
        password: password,
      })

      if (responseData?.session?.access_token && responseData?.user_info) {
        const user = {
          id: String(responseData.user_info.id),
          email: responseData.user_info.email,
          // ... map other fields
        }
        setAuth(responseData.session.access_token, user)
        navigate("/wallet")
      }
    } catch (error) {
      // Handle error
    }
  }
}
```

### Logout

```typescript
import { useLogout } from "@/hooks/api/useAuthApi"

function LogoutButton() {
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    // User is automatically redirected to /auth
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

### Protected Route

```typescript
import { useOmsAuth } from "@/lib/auth/omsAuthContext"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useOmsAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth")
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return null

  return <div>Protected Content</div>
}
```

## Environment Variables

No new environment variables are required. The OMS API configuration uses existing variables:

- `VITE_OMS_API_BASE_URL` - OMS API base URL
- `VITE_OMS_APP_ID` - Application ID (defaults to 'InvestarOMS')
- `VITE_OMS_API_VERSION` - API version (defaults to 'v1')

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage, which is accessible to JavaScript
2. **HTTPS**: Ensure all API calls use HTTPS in production
3. **Token Expiration**: Implement token refresh logic if tokens expire
4. **XSS Protection**: Implement Content Security Policy (CSP) to prevent XSS attacks
5. **Token Clearing**: Tokens are automatically cleared on logout and 401 errors

## Troubleshooting

### Login Not Working

1. Check browser console for errors
2. Verify API response structure matches expected format
3. Ensure `session.access_token` and `user_info` are present in response
4. Check network tab to verify API call is successful

### Token Not Persisting

1. Check localStorage in browser DevTools
2. Verify `setOmsToken()` is being called
3. Check for localStorage quota issues

### Navigation Not Working After Login

1. Verify `setAuth()` is called with correct token and user data
2. Check that auth context state is updating
3. Verify navigation path is correct

### API Requests Failing

1. Check that token is being included in Authorization header
2. Verify token format is correct (`Bearer <token>`)
3. Check API response for error messages
4. Verify user data includes required fields (id, email, etc.)

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Remember Me**: Enhanced session management based on remember me option
3. **Social Login**: Integrate OMS social login endpoints
4. **Signup**: Implement OMS signup/registration endpoint
5. **Session Management**: Add session timeout handling
6. **Multi-tenant Support**: Enhanced tenant switching functionality

## Related Documentation

- [OMS API Integration Guide](./OMS_API_INTEGRATION.md) - General OMS API integration
- [API Client Documentation](./src/lib/api/README.md) - API client configuration

## Support

For issues or questions:

1. Check this documentation
2. Review the implementation files
3. Check browser console and network tab for errors
4. Verify API response structure matches expected format

