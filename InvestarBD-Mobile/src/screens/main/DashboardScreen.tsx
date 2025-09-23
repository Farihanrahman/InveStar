import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';
import { Portfolio, Investment, MarketData } from '../../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1D');

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock portfolio data
    const mockPortfolio: Portfolio = {
      totalValue: 125000,
      totalGain: 8500,
      totalGainPercent: 7.3,
      investments: [
        {
          id: '1',
          name: 'Square Pharmaceuticals',
          symbol: 'SQURPHARMA',
          type: 'stock',
          currentPrice: 250.5,
          change: 12.5,
          changePercent: 5.25,
          quantity: 100,
          totalValue: 25050,
        },
        {
          id: '2',
          name: 'Grameenphone Ltd',
          symbol: 'GP',
          type: 'stock',
          currentPrice: 340.2,
          change: -5.8,
          changePercent: -1.68,
          quantity: 50,
          totalValue: 17010,
        },
      ],
    };

    const mockMarketData: MarketData[] = [
      {
        symbol: 'DSEX',
        name: 'DSEX Index',
        price: 6125.45,
        change: 45.2,
        changePercent: 0.74,
        volume: 12500000,
      },
      {
        symbol: 'DSES',
        name: 'DSES Index',
        price: 1345.22,
        change: -8.5,
        changePercent: -0.63,
        volume: 8500000,
      },
    ];

    setPortfolio(mockPortfolio);
    setMarketData(mockMarketData);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const chartData = {
    labels: ['9AM', '11AM', '1PM', '3PM', '5PM'],
    datasets: [
      {
        data: [120000, 122500, 121800, 124200, 125000],
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
      },
    ],
  };

  const periods = ['1D', '1W', '1M', '3M', '1Y'];

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
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>John Doe</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Summary Card */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.portfolioCard}
        >
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
          <Text style={styles.portfolioValue}>
            ৳{portfolio?.totalValue.toLocaleString()}
          </Text>
          <View style={styles.portfolioGain}>
            <Ionicons
              name={portfolio && portfolio.totalGain >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={Colors.background}
            />
            <Text style={styles.portfolioGainText}>
              ৳{Math.abs(portfolio?.totalGain || 0).toLocaleString()} (
              {Math.abs(portfolio?.totalGainPercent || 0).toFixed(2)}%)
            </Text>
          </View>
        </LinearGradient>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Portfolio Performance</Text>
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <LineChart
            data={chartData}
            width={width - 32}
            height={200}
            chartConfig={{
              backgroundColor: Colors.background,
              backgroundGradientFrom: Colors.background,
              backgroundGradientTo: Colors.background,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: Colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Market Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {marketData.map((market) => (
            <View key={market.symbol} style={styles.marketItem}>
              <View style={styles.marketInfo}>
                <Text style={styles.marketName}>{market.name}</Text>
                <Text style={styles.marketSymbol}>{market.symbol}</Text>
              </View>
              <View style={styles.marketPriceInfo}>
                <Text style={styles.marketPrice}>{market.price.toLocaleString()}</Text>
                <View style={styles.marketChange}>
                  <Ionicons
                    name={market.change >= 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={market.change >= 0 ? Colors.gain : Colors.loss}
                  />
                  <Text
                    style={[
                      styles.marketChangeText,
                      { color: market.change >= 0 ? Colors.gain : Colors.loss },
                    ]}
                  >
                    {Math.abs(market.change).toFixed(2)} ({Math.abs(market.changePercent).toFixed(2)}%)
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Top Holdings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Holdings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {portfolio?.investments.map((investment) => (
            <View key={investment.id} style={styles.holdingItem}>
              <View style={styles.holdingIcon}>
                <Text style={styles.holdingIconText}>
                  {investment.symbol.substring(0, 2)}
                </Text>
              </View>
              <View style={styles.holdingInfo}>
                <Text style={styles.holdingName}>{investment.name}</Text>
                <Text style={styles.holdingSymbol}>
                  {investment.quantity} shares • ৳{investment.currentPrice}
                </Text>
              </View>
              <View style={styles.holdingPriceInfo}>
                <Text style={styles.holdingValue}>
                  ৳{investment.totalValue.toLocaleString()}
                </Text>
                <View style={styles.holdingChange}>
                  <Ionicons
                    name={investment.change >= 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={investment.change >= 0 ? Colors.gain : Colors.loss}
                  />
                  <Text
                    style={[
                      styles.holdingChangeText,
                      { color: investment.change >= 0 ? Colors.gain : Colors.loss },
                    ]}
                  >
                    {Math.abs(investment.changePercent).toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="add" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Buy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="remove" size={24} color={Colors.error} />
              </View>
              <Text style={styles.actionText}>Sell</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="wallet" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="card" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
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
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  notificationButton: {
    padding: Spacing.sm,
  },
  portfolioCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  portfolioLabel: {
    fontSize: FontSize.sm,
    color: Colors.background,
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  portfolioValue: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: Spacing.sm,
  },
  portfolioGain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioGainText: {
    fontSize: FontSize.md,
    color: Colors.background,
    marginLeft: Spacing.xs,
  },
  chartSection: {
    backgroundColor: Colors.background,
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
  },
  periodButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.background,
  },
  chart: {
    borderRadius: BorderRadius.md,
  },
  section: {
    margin: Spacing.md,
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
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  marketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  marketSymbol: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  marketPriceInfo: {
    alignItems: 'flex-end',
  },
  marketPrice: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  marketChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  marketChangeText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
  },
  holdingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  holdingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  holdingIconText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  holdingSymbol: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  holdingPriceInfo: {
    alignItems: 'flex-end',
  },
  holdingValue: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  holdingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  holdingChangeText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
});