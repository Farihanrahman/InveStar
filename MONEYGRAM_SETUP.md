# InveStar Wallet - MoneyGram Ramps Integration

## 🚀 Overview

Your InveStar Stellar wallet is now fully integrated with **MoneyGram Ramps**, enabling instant fiat on/off-ramps for global money transfers. Users can now send money worldwide directly from their Stellar wallet to any MoneyGram location.

## 🔧 Setup Instructions

### 1. Get MoneyGram API Credentials

1. **Visit MoneyGram Developer Portal**: https://developer.moneygram.com/
2. **Sign up for an account** and complete the registration process
3. **Apply for API access** to MoneyGram Ramps
4. **Get your API credentials**:
   - API Key
   - API Secret
   - Sandbox credentials for testing
   - Production credentials for live transactions

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# MoneyGram API Configuration
NEXT_PUBLIC_MONEYGRAM_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_MONEYGRAM_API_SECRET=your_actual_api_secret_here

# Environment (sandbox for testing, production for live)
NEXT_PUBLIC_ENVIRONMENT=sandbox

# Wallet Configuration
NEXT_PUBLIC_WALLET_DOMAIN=investar-wallet.com
```

### 3. Update Configuration

Edit `config/moneygram.ts` to use your actual API credentials:

```typescript
export const MONEYGRAM_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_MONEYGRAM_API_KEY || 'your_actual_api_key',
  API_SECRET: process.env.NEXT_PUBLIC_MONEYGRAM_API_SECRET || 'your_actual_api_secret',
  ENVIRONMENT: (process.env.NEXT_PUBLIC_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  // ... other config
}
```

### 4. Test the Integration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your wallet** at `http://localhost:3001`

3. **Navigate to "MoneyGram Ramps" tab**

4. **Test with sandbox credentials**:
   - Enter an amount (e.g., 100 USD)
   - Select destination currency and country
   - Get a quote
   - Create a test transfer

## 🌍 Features

### ✅ **Global Money Transfers**
- Send money to 200+ countries
- 350,000+ MoneyGram locations worldwide
- Instant quotes and competitive rates

### ✅ **Multiple Currencies**
- Support for 100+ currencies
- Real-time exchange rates
- Transparent fee structure

### ✅ **Secure Transactions**
- OAuth 2.0 authentication
- Encrypted API communication
- Stellar blockchain security

### ✅ **User-Friendly Interface**
- Simple quote process
- Recipient information collection
- Transaction status tracking
- Pickup code generation

## 🔄 Transaction Flow

1. **Get Quote**: User enters amount and destination
2. **Review Quote**: See exchange rate, fees, and total
3. **Enter Recipient**: Name, phone, email, pickup location
4. **Create Transfer**: Generate transaction on MoneyGram
5. **Commit Transfer**: Finalize the transaction
6. **Track Status**: Monitor transaction progress

## 📋 API Endpoints Used

- **OAuth Token**: `POST /oauth/token`
- **Quote**: `POST /v1/transfer/quote`
- **Create Transfer**: `POST /v1/transfer`
- **Commit Transfer**: `PUT /v1/transfer/{id}/commit`
- **Transaction Status**: `GET /v1/transfer/{id}`
- **FX Rates**: `GET /v1/fx/rates`
- **Countries**: `GET /v1/reference/countries`
- **Currencies**: `GET /v1/reference/currencies`

## 🛡️ Security Features

- **API Key Authentication**: Secure OAuth 2.0 flow
- **Environment Separation**: Sandbox vs Production
- **Error Handling**: Comprehensive error management
- **Input Validation**: Form validation and sanitization
- **Transaction Logging**: Complete audit trail

## 🚀 Production Deployment

### 1. **Switch to Production**
```typescript
// In config/moneygram.ts
ENVIRONMENT: 'production'
```

### 2. **Update API Credentials**
```bash
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_MONEYGRAM_API_KEY=your_production_api_key
NEXT_PUBLIC_MONEYGRAM_API_SECRET=your_production_api_secret
```

### 3. **Deploy to Production**
```bash
npm run build
npm start
```

## 📊 Monitoring & Analytics

### Transaction Tracking
- Real-time status updates
- Transaction history
- Pickup code management
- Error reporting

### Performance Metrics
- Quote response times
- Transaction success rates
- API error rates
- User engagement metrics

## 🔧 Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify credentials in MoneyGram Developer Portal
   - Check environment (sandbox vs production)
   - Ensure API access is approved

2. **Quote Failures**
   - Verify currency codes are supported
   - Check destination country availability
   - Ensure amount is within limits

3. **Transaction Errors**
   - Validate recipient information
   - Check pickup location availability
   - Verify transaction limits

### Debug Mode
Enable debug logging in `services/moneygram.ts`:
```typescript
console.log('API Response:', data)
```

## 📞 Support

- **MoneyGram Developer Support**: https://developer.moneygram.com/support
- **API Documentation**: https://developer.moneygram.com/moneygram-developer/docs
- **Stellar Documentation**: https://developers.stellar.org/

## 🎯 Next Steps

1. **Complete MoneyGram API registration**
2. **Test with sandbox credentials**
3. **Implement production deployment**
4. **Add additional features**:
   - Transaction notifications
   - Recipient verification
   - Advanced reporting
   - Mobile app integration

---

**Your InveStar wallet is now ready for global money transfers with MoneyGram Ramps!** 🌍💸 