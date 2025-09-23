import {
  Keypair,
  Server,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Account,
} from '@stellar/stellar-sdk';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Stellar Configuration
const STELLAR_NETWORK = process.env.EXPO_PUBLIC_STELLAR_NETWORK || 'testnet';
const HORIZON_URL = 
  STELLAR_NETWORK === 'mainnet' 
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

const server = new Server(HORIZON_URL);
const networkPassphrase = 
  STELLAR_NETWORK === 'mainnet' 
    ? Networks.PUBLIC 
    : Networks.TESTNET;

// Stellar Wallet Class
export class StellarWallet {
  private keypair: Keypair | null = null;
  private account: Account | null = null;

  // Generate new keypair
  static generateKeypair(): Keypair {
    return Keypair.random();
  }

  // Create wallet from secret key
  static fromSecret(secretKey: string): StellarWallet {
    const wallet = new StellarWallet();
    wallet.keypair = Keypair.fromSecret(secretKey);
    return wallet;
  }

  // Get public key
  getPublicKey(): string {
    if (!this.keypair) {
      throw new Error('Wallet not initialized');
    }
    return this.keypair.publicKey();
  }

  // Get secret key
  getSecretKey(): string {
    if (!this.keypair) {
      throw new Error('Wallet not initialized');
    }
    return this.keypair.secret();
  }

  // Load account from Stellar network
  async loadAccount(): Promise<void> {
    if (!this.keypair) {
      throw new Error('Wallet not initialized');
    }

    try {
      this.account = await server.loadAccount(this.keypair.publicKey());
    } catch (error) {
      console.error('Error loading account:', error);
      throw new Error('Account not found or not funded');
    }
  }

  // Get account balance
  async getBalance(assetCode?: string): Promise<number> {
    await this.loadAccount();
    
    if (!this.account) {
      throw new Error('Account not loaded');
    }

    const balance = this.account.balances.find(b => {
      if (!assetCode || assetCode === 'XLM') {
        return b.asset_type === 'native';
      }
      return b.asset_code === assetCode;
    });

    return balance ? parseFloat(balance.balance) : 0;
  }

  // Send payment
  async sendPayment(
    destinationId: string,
    amount: string,
    assetCode?: string,
    assetIssuer?: string
  ): Promise<string> {
    if (!this.keypair || !this.account) {
      throw new Error('Wallet or account not initialized');
    }

    const asset = assetCode && assetIssuer 
      ? new Asset(assetCode, assetIssuer)
      : Asset.native();

    const transaction = new TransactionBuilder(this.account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: destinationId,
          asset: asset,
          amount: amount,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);

    try {
      const result = await server.submitTransaction(transaction);
      return result.hash;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  // Create trustline for custom asset
  async createTrustline(assetCode: string, assetIssuer: string): Promise<string> {
    if (!this.keypair || !this.account) {
      throw new Error('Wallet or account not initialized');
    }

    const asset = new Asset(assetCode, assetIssuer);

    const transaction = new TransactionBuilder(this.account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset: asset,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.keypair);

    try {
      const result = await server.submitTransaction(transaction);
      return result.hash;
    } catch (error) {
      console.error('Error creating trustline:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(limit: number = 10): Promise<any[]> {
    if (!this.keypair) {
      throw new Error('Wallet not initialized');
    }

    try {
      const transactions = await server
        .transactions()
        .forAccount(this.keypair.publicKey())
        .order('desc')
        .limit(limit)
        .call();

      return transactions.records;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }
}

// Wallet Storage Functions
export const walletStorage = {
  // Save wallet securely
  async saveWallet(secretKey: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('stellar_secret_key', secretKey);
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw new Error('Failed to save wallet');
    }
  },

  // Load wallet from storage
  async loadWallet(): Promise<StellarWallet | null> {
    try {
      const secretKey = await SecureStore.getItemAsync('stellar_secret_key');
      if (secretKey) {
        return StellarWallet.fromSecret(secretKey);
      }
      return null;
    } catch (error) {
      console.error('Error loading wallet:', error);
      return null;
    }
  },

  // Delete wallet from storage
  async deleteWallet(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('stellar_secret_key');
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw new Error('Failed to delete wallet');
    }
  },

  // Check if wallet exists
  async hasWallet(): Promise<boolean> {
    try {
      const secretKey = await SecureStore.getItemAsync('stellar_secret_key');
      return !!secretKey;
    } catch (error) {
      console.error('Error checking wallet:', error);
      return false;
    }
  },
};

// Utility Functions
export const stellarUtils = {
  // Validate Stellar address
  isValidStellarAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  },

  // Format amount for display
  formatAmount(amount: number, decimals: number = 7): string {
    return amount.toFixed(decimals).replace(/\.?0+$/, '');
  },

  // Convert stroops to XLM
  stroopsToXLM(stroops: number): number {
    return stroops / 10000000;
  },

  // Convert XLM to stroops
  xlmToStroops(xlm: number): number {
    return Math.round(xlm * 10000000);
  },

  // Get asset display name
  getAssetDisplayName(asset: any): string {
    if (asset.asset_type === 'native') {
      return 'XLM';
    }
    return `${asset.asset_code}-${asset.asset_issuer.substring(0, 4)}...`;
  },

  // Format transaction for display
  formatTransaction(tx: any): {
    id: string;
    type: string;
    amount: string;
    asset: string;
    timestamp: string;
    hash: string;
  } {
    return {
      id: tx.id,
      type: tx.type || 'payment',
      amount: tx.amount || '0',
      asset: tx.asset_type === 'native' ? 'XLM' : tx.asset_code,
      timestamp: tx.created_at,
      hash: tx.hash,
    };
  },
};

// Create and fund testnet account
export const createTestnetAccount = async (): Promise<{
  publicKey: string;
  secretKey: string;
}> => {
  if (STELLAR_NETWORK !== 'testnet') {
    throw new Error('This function only works on testnet');
  }

  const keypair = StellarWallet.generateKeypair();
  
  try {
    // Fund account using Friendbot
    await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`
    );

    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  } catch (error) {
    console.error('Error creating testnet account:', error);
    throw new Error('Failed to create testnet account');
  }
};

// MoneyGram Integration Helper
export const moneyGramIntegration = {
  // Convert Stellar payment to MoneyGram transfer
  async stellarToMoneyGram(
    stellarTxHash: string,
    recipientInfo: {
      name: string;
      phone: string;
      country: string;
    },
    amount: number
  ): Promise<string> {
    // This would integrate with MoneyGram API
    // For now, return a mock transaction ID
    Alert.alert(
      'MoneyGram Transfer',
      `Stellar transaction ${stellarTxHash.substring(0, 8)}... converted to MoneyGram transfer for ${recipientInfo.name}`
    );
    
    return `MG${Date.now()}`;
  },

  // Get MoneyGram pickup locations
  async getPickupLocations(country: string, city?: string): Promise<any[]> {
    // Mock pickup locations
    return [
      {
        id: '1',
        name: 'MoneyGram Agent - Dhaka Central',
        address: 'Motijheel Commercial Area, Dhaka',
        phone: '+880-2-123456789',
        hours: '9:00 AM - 9:00 PM',
      },
      {
        id: '2',
        name: 'MoneyGram Agent - Gulshan',
        address: 'Gulshan Avenue, Dhaka',
        phone: '+880-2-987654321',
        hours: '10:00 AM - 8:00 PM',
      },
    ];
  },
};

export default StellarWallet;