import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';
import { WalletBalance, Transaction } from '../../types';

export default function WalletScreen() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'balances' | 'transactions'>('balances');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = () => {
    // Mock wallet data
    const mockBalances: WalletBalance[] = [
      {
        currency: 'BDT',
        balance: 50000,
        usdValue: 50000,
      },
      {
        currency: 'USD',
        balance: 2500,
        usdValue: 2500,
      },
      {
        currency: 'XLM',
        balance: 10000,
        usdValue: 1200,
      },
      {
        currency: 'USDC',
        balance: 1500,
        usdValue: 1500,
      },
    ];

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'deposit',
        amount: 10000,
        currency: 'BDT',
        status: 'completed',
        timestamp: '2024-01-15T10:30:00Z',
        fee: 0,
      },
      {
        id: '2',
        type: 'buy',
        amount: 5000,
        currency: 'BDT',
        asset: 'SQURPHARMA',
        status: 'completed',
        timestamp: '2024-01-14T14:20:00Z',
        fee: 50,
      },
      {
        id: '3',
        type: 'withdrawal',
        amount: 2000,
        currency: 'BDT',
        status: 'pending',
        timestamp: '2024-01-13T09:15:00Z',
        fee: 25,
      },
      {
        id: '4',
        type: 'sell',
        amount: 3000,
        currency: 'BDT',
        asset: 'GP',
        status: 'completed',
        timestamp: '2024-01-12T16:45:00Z',
        fee: 30,
      },
    ];

    setBalances(mockBalances);
    setTransactions(mockTransactions);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalBalance = balances.reduce((sum, balance) => sum + balance.usdValue, 0);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'arrow-down';
      case 'withdrawal':
        return 'arrow-up';
      case 'buy':
        return 'add-circle';
      case 'sell':
        return 'remove-circle';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return Colors.gain;
      case 'withdrawal':
        return Colors.error;
      case 'buy':
        return Colors.primary;
      case 'sell':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return Colors.gain;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleQuickAction = (action: string) => {
    Alert.alert('Coming Soon', `${action} feature will be available soon!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            ৳{totalBalance.toLocaleString()}
          </Text>
          <Text style={styles.balanceSubtext}>
            Across all currencies and assets
          </Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('Deposit')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.gain + '20' }]}>
              <Ionicons name="add" size={24} color={Colors.gain} />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('Withdraw')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.error + '20' }]}>
              <Ionicons name="remove" size={24} color={Colors.error} />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('Transfer')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="swap-horizontal" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('Exchange')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
              <Ionicons name="repeat" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionText}>Exchange</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'balances' && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab('balances')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'balances' && styles.tabButtonTextActive,
              ]}
            >
              Balances
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'transactions' && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab('transactions')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'transactions' && styles.tabButtonTextActive,
              ]}
            >
              Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {selectedTab === 'balances' ? (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Currency Balances</Text>
            {balances.map((balance, index) => (
              <View key={index} style={styles.balanceItem}>
                <View style={styles.balanceItemLeft}>
                  <View style={styles.currencyIcon}>
                    <Text style={styles.currencyIconText}>
                      {balance.currency.substring(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.balanceItemInfo}>
                    <Text style={styles.currencyName}>{balance.currency}</Text>
                    <Text style={styles.currencyBalance}>
                      {balance.balance.toLocaleString()} {balance.currency}
                    </Text>
                  </View>
                </View>
                <View style={styles.balanceItemRight}>
                  <Text style={styles.usdValue}>
                    ৳{balance.usdValue.toLocaleString()}
                  </Text>
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: getTransactionColor(transaction.type) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.type) as any}
                      size={20}
                      color={getTransactionColor(transaction.type)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      {transaction.asset && ` - ${transaction.asset}`}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.timestamp)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          transaction.type === 'deposit' || transaction.type === 'sell'
                            ? Colors.gain
                            : Colors.error,
                      },
                    ]}
                  >
                    {transaction.type === 'deposit' || transaction.type === 'sell' ? '+' : '-'}
                    ৳{transaction.amount.toLocaleString()}
                  </Text>
                  <View style={styles.transactionStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(transaction.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(transaction.status) },
                      ]}
                    >
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stellar Integration Banner */}
        <View style={styles.stellarBanner}>
          <View style={styles.stellarBannerContent}>
            <Ionicons name="planet-outline" size={24} color={Colors.primary} />
            <View style={styles.stellarBannerText}>
              <Text style={styles.stellarBannerTitle}>Stellar Network</Text>
              <Text style={styles.stellarBannerSubtitle}>
                Fast, secure, and low-cost transactions
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.stellarBannerButton}>
            <Text style={styles.stellarBannerButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  balanceCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.background,
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  balanceValue: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: Spacing.sm,
  },
  balanceSubtext: {
    fontSize: FontSize.sm,
    color: Colors.background,
    opacity: 0.8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.background,
  },
  tabButtonText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.text,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  balanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  currencyIconText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  balanceItemInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  currencyBalance: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  balanceItemRight: {
    alignItems: 'flex-end',
  },
  usdValue: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  moreButton: {
    padding: Spacing.xs,
    marginTop: Spacing.xs,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  transactionDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
  stellarBanner: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stellarBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stellarBannerText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  stellarBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  stellarBannerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  stellarBannerButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  stellarBannerButtonText: {
    fontSize: FontSize.sm,
    color: Colors.background,
    fontWeight: '600',
  },
});