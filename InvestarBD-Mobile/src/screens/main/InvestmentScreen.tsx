import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';
import { Investment } from '../../types';

type InvestmentCategory = 'all' | 'stocks' | 'bonds' | 'mutual_funds' | 'crypto' | 'etf' | 'reit';

export default function InvestmentScreen() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InvestmentCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'stocks', name: 'Stocks', icon: 'trending-up-outline' },
    { id: 'bonds', name: 'Bonds', icon: 'shield-outline' },
    { id: 'mutual_funds', name: 'Mutual Funds', icon: 'pie-chart-outline' },
    { id: 'crypto', name: 'Crypto', icon: 'logo-bitcoin' },
    { id: 'etf', name: 'ETF', icon: 'business-outline' },
    { id: 'reit', name: 'REIT', icon: 'home-outline' },
  ];

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = () => {
    // Mock investment data
    const mockInvestments: Investment[] = [
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
      {
        id: '3',
        name: 'BRAC Bank Ltd',
        symbol: 'BRACBANK',
        type: 'stock',
        currentPrice: 45.8,
        change: 2.3,
        changePercent: 5.29,
        quantity: 200,
        totalValue: 9160,
      },
      {
        id: '4',
        name: 'Bangladesh Government Bond',
        symbol: 'BGB-2025',
        type: 'bond',
        currentPrice: 1000,
        change: 0.5,
        changePercent: 0.05,
        quantity: 10,
        totalValue: 10000,
      },
      {
        id: '5',
        name: 'VIPB Balanced Fund',
        symbol: 'VIPB',
        type: 'mutual_fund',
        currentPrice: 12.45,
        change: 0.15,
        changePercent: 1.22,
        quantity: 800,
        totalValue: 9960,
      },
      {
        id: '6',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'crypto',
        currentPrice: 45000,
        change: 1250,
        changePercent: 2.86,
        quantity: 0.1,
        totalValue: 4500,
      },
    ];

    setInvestments(mockInvestments);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvestments();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredInvestments = investments
    .filter((investment) => {
      const matchesSearch = investment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          investment.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || investment.type === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.currentPrice - a.currentPrice;
        case 'change':
          return b.changePercent - a.changePercent;
        default:
          return 0;
      }
    });

  const renderInvestmentItem = ({ item }: { item: Investment }) => (
    <TouchableOpacity style={styles.investmentItem}>
      <View style={styles.investmentIcon}>
        <Text style={styles.investmentIconText}>
          {item.symbol.substring(0, 2)}
        </Text>
      </View>
      
      <View style={styles.investmentInfo}>
        <Text style={styles.investmentName}>{item.name}</Text>
        <Text style={styles.investmentSymbol}>{item.symbol}</Text>
        <View style={styles.investmentDetails}>
          <Text style={styles.investmentQuantity}>
            {item.quantity} {item.type === 'crypto' ? item.symbol : 'shares'}
          </Text>
          <View style={styles.investmentType}>
            <Text style={styles.investmentTypeText}>
              {item.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.investmentPriceInfo}>
        <Text style={styles.investmentPrice}>
          ৳{item.currentPrice.toLocaleString()}
        </Text>
        <View style={styles.investmentChange}>
          <Ionicons
            name={item.change >= 0 ? 'trending-up' : 'trending-down'}
            size={12}
            color={item.change >= 0 ? Colors.gain : Colors.loss}
          />
          <Text
            style={[
              styles.investmentChangeText,
              { color: item.change >= 0 ? Colors.gain : Colors.loss },
            ]}
          >
            {Math.abs(item.changePercent).toFixed(2)}%
          </Text>
        </View>
        <Text style={styles.investmentValue}>
          ৳{item.totalValue.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item.id as InvestmentCategory)}
    >
      <Ionicons
        name={item.icon as any}
        size={20}
        color={selectedCategory === item.id ? Colors.background : Colors.textSecondary}
      />
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === item.id && styles.categoryButtonTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Investments</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search investments..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {[
            { key: 'name', label: 'Name' },
            { key: 'price', label: 'Price' },
            { key: 'change', label: 'Change' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === option.key && styles.sortButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Investment List */}
      <FlatList
        data={filteredInvestments}
        renderItem={renderInvestmentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trending-up-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No investments found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Start investing to see your portfolio'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color={Colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  addButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  categoryButtonTextActive: {
    color: Colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  sortLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.background,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  investmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  investmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  investmentIconText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  investmentSymbol: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  investmentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  investmentQuantity: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  investmentType: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  investmentTypeText: {
    fontSize: 10,
    color: Colors.background,
    fontWeight: '600',
  },
  investmentPriceInfo: {
    alignItems: 'flex-end',
  },
  investmentPrice: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  investmentChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  investmentChangeText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  investmentValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});