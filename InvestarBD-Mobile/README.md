# 📱 InveStar BD Mobile App

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.10-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-SDK-green.svg)](https://stellar.org/)

> **Complete Investment Platform**: Mobile app for InvestarBD with portfolio management, AI-driven learning, and Stellar blockchain integration

## 🚀 Project Overview

**InveStar BD Mobile** is a comprehensive investment platform mobile app that brings the power of the InvestarBD website to your fingertips. Built with React Native and Expo, this app provides seamless access to investment opportunities, portfolio management, and educational content.

### 🌟 Key Features

- **📊 Portfolio Dashboard**: Real-time portfolio tracking with interactive charts
- **💰 Multi-Asset Investment**: Stocks, bonds, mutual funds, crypto, ETFs, and REITs
- **🤖 AI-Driven Learning**: Personalized educational content and recommendations
- **💳 Digital Wallet**: Secure wallet with Stellar blockchain integration
- **📈 Real-time Market Data**: Live market updates and price tracking
- **🔒 Secure Authentication**: Biometric login and secure key management
- **🌍 Cross-Platform**: Works on both iOS and Android devices
- **🎨 Modern UI/UX**: Clean, intuitive design with smooth animations

## 🛠️ Technology Stack

### Frontend
- **React Native 0.81.4**: Cross-platform mobile framework
- **Expo ~54.0.10**: Development platform and toolchain
- **TypeScript 5.9.2**: Type-safe development
- **React Navigation**: Navigation and routing

### UI/UX
- **@expo/vector-icons**: Icon library
- **expo-linear-gradient**: Gradient components
- **react-native-chart-kit**: Interactive charts
- **react-native-svg**: SVG support

### Blockchain & Finance
- **@stellar/stellar-sdk**: Stellar blockchain integration
- **expo-secure-store**: Secure storage for sensitive data
- **axios**: HTTP client for API calls

### Utilities
- **react-native-toast-message**: Toast notifications
- **react-native-safe-area-context**: Safe area handling

## 📁 Project Structure

```
InvestarBD-Mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── constants/          # App constants and colors
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/            # App screens
│   │   ├── auth/           # Authentication screens
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   └── main/           # Main app screens
│   │       ├── DashboardScreen.tsx
│   │       ├── InvestmentScreen.tsx
│   │       ├── WalletScreen.tsx
│   │       ├── LearnScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── services/           # API services
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images and static assets
├── App.tsx                # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Expo Go app on your mobile device (for testing)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd InvestarBD-Mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
# or
expo start
```

4. **Run on device/simulator**
```bash
# For iOS (requires macOS)
npm run ios

# For Android
npm run android

# For web browser
npm run web
```

5. **Test on physical device**
- Install Expo Go app from App Store/Google Play
- Scan the QR code displayed in terminal/browser
- The app will load on your device

## 📱 App Features

### 🔐 Authentication Flow
- **Welcome Screen**: Onboarding with app features
- **Login/Register**: Secure user authentication
- **Forgot Password**: Password recovery functionality

### 📊 Dashboard
- **Portfolio Overview**: Total value and performance
- **Interactive Charts**: Portfolio performance visualization
- **Market Data**: Real-time market indices
- **Top Holdings**: Your investment breakdown
- **Quick Actions**: Buy, sell, deposit, withdraw

### 💼 Investments
- **Multi-Asset Support**: Stocks, bonds, mutual funds, crypto, ETFs, REITs
- **Search & Filter**: Find investments by name or category
- **Sorting Options**: Sort by name, price, or performance
- **Real-time Prices**: Live price updates and changes

### 💳 Wallet
- **Multi-Currency**: BDT, USD, XLM, USDC support
- **Transaction History**: Complete transaction tracking
- **Quick Actions**: Deposit, withdraw, transfer, exchange
- **Stellar Integration**: Blockchain-based transactions

### 🎓 Learning Module
- **AI-Driven Content**: Personalized learning recommendations
- **Progress Tracking**: Monitor your learning journey
- **Difficulty Levels**: Beginner to advanced content
- **Interactive Modules**: Engaging educational experience

### 👤 Profile
- **User Management**: Personal information and settings
- **Security Settings**: Biometric login, privacy controls
- **Portfolio Summary**: Quick portfolio overview
- **Support Access**: Help center and customer support

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.investarbd.com
EXPO_PUBLIC_STELLAR_NETWORK=testnet
EXPO_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### Expo Configuration
The `app.json` file contains Expo-specific configuration:

```json
{
  "expo": {
    "name": "InveStar BD",
    "slug": "investar-bd-mobile",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"]
  }
}
```

## 📋 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator (macOS only)
npm run web        # Run in web browser
```

## 🎯 Key Achievements

✅ **Complete Mobile App**: Full-featured investment platform  
✅ **Cross-Platform**: Works on iOS, Android, and web  
✅ **Modern UI/UX**: Intuitive design with smooth animations  
✅ **Real-time Data**: Live market data and portfolio updates  
✅ **Secure Authentication**: Biometric login and secure storage  
✅ **AI Learning**: Personalized educational content  
✅ **Stellar Integration**: Blockchain-based wallet functionality  
✅ **Multi-Asset Support**: Comprehensive investment options  
✅ **TypeScript**: Full type safety and better development experience  
✅ **Responsive Design**: Optimized for all screen sizes  

## 📊 App Metrics

- **Screens**: 10+ screens with complete functionality
- **Components**: Reusable UI components
- **Navigation**: Multi-level navigation structure
- **Asset Types**: 6 different investment types supported
- **Currencies**: Multi-currency wallet support
- **Learning Modules**: Comprehensive educational content
- **Lines of Code**: 3,000+ lines of TypeScript

## 🔗 Related Projects

- **InveStar BD Website**: The original web platform
- **InveStar Stellar Wallet**: Blockchain wallet integration
- **InveStar API**: Backend services and data

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📱 App Store Deployment

### iOS App Store
1. Build the app for iOS: `expo build:ios`
2. Submit to App Store Connect
3. Follow Apple's review guidelines

### Google Play Store
1. Build the app for Android: `expo build:android`
2. Upload to Google Play Console
3. Follow Google's review process

## 🔒 Security Features

- **Biometric Authentication**: Fingerprint/Face ID login
- **Secure Storage**: Encrypted local data storage
- **API Security**: Secure communication with backend
- **Session Management**: Automatic session timeout
- **Data Encryption**: Sensitive data encryption

## 🌟 Future Enhancements

- [ ] Push notifications for market alerts
- [ ] Advanced charting with technical indicators
- [ ] Social trading features
- [ ] Voice commands and AI assistant
- [ ] Offline mode support
- [ ] Advanced portfolio analytics
- [ ] Integration with more blockchains
- [ ] Dark mode theme

## 📞 Support

For support and questions:
- Email: support@investarbd.com
- Website: https://www.investarbd.com
- Documentation: [Link to docs]

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Project Status

**Status**: ✅ **COMPLETE & FUNCTIONAL**

The InveStar BD Mobile App is fully operational with:
- Complete authentication flow
- Real-time portfolio dashboard
- Multi-asset investment tracking
- AI-driven learning modules
- Secure digital wallet
- User profile management
- Modern, responsive UI/UX
- Cross-platform compatibility

**Ready for app store deployment!**

---

**Made with ❤️ by the InveStar BD Team**

*Empowering financial literacy and investment opportunities in Bangladesh through technology.*