/**
 * OMS Services Index
 * Central export point for all OMS services
 */

export { default as authService } from './authService';
export { default as dashboardService } from './dashboardService';
export { default as portfolioService } from './portfolioService';
export { default as orderService } from './orderService';

export type {
  LoginCredentials,
  AutoLoginData,
  LoginResponse,
  ForgotPasswordPayload,
  SetForgottenPasswordPayload,
  ChangePasswordPayload,
} from './authService';

export type { 
  CreateOrderPayload, 
  CreateOrderResponse, 
  ApiResponse,
  ReplaceOrderPayload,
  Order,
  OrderSummary,
  ExecutionReport 
} from './orderService';

export type {
  Transaction,
  Portfolio,
  PortfolioDetails,
  FundTransactionPayload,
  PositionFileUploadPayload,
} from './portfolioService';

export type {
  DseIndex,
  DseIndexSymbol,
  CreateDseIndexSymbolPayload,
  UpdateDseIndexSymbolPayload,
  TradeInformation,
  News,
} from './dashboardService';

