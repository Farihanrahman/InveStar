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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';
import { LearningModule } from '../../types';

type Category = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function LearnScreen() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: 'library-outline' },
    { id: 'beginner', name: 'Beginner', icon: 'school-outline' },
    { id: 'intermediate', name: 'Intermediate', icon: 'trending-up-outline' },
    { id: 'advanced', name: 'Advanced', icon: 'trophy-outline' },
  ];

  useEffect(() => {
    loadLearningModules();
  }, []);

  const loadLearningModules = () => {
    // Mock learning modules data
    const mockModules: LearningModule[] = [
      {
        id: '1',
        title: 'Introduction to Stock Market',
        description: 'Learn the basics of stock market investing and key concepts.',
        difficulty: 'beginner',
        duration: 30,
        completed: true,
        progress: 100,
        category: 'Basics',
      },
      {
        id: '2',
        title: 'Understanding Financial Statements',
        description: 'How to read and analyze company financial statements.',
        difficulty: 'intermediate',
        duration: 45,
        completed: false,
        progress: 60,
        category: 'Analysis',
      },
      {
        id: '3',
        title: 'Portfolio Diversification Strategies',
        description: 'Learn how to build a well-diversified investment portfolio.',
        difficulty: 'intermediate',
        duration: 35,
        completed: false,
        progress: 0,
        category: 'Strategy',
      },
      {
        id: '4',
        title: 'Advanced Options Trading',
        description: 'Master complex options strategies and risk management.',
        difficulty: 'advanced',
        duration: 60,
        completed: false,
        progress: 0,
        category: 'Trading',
      },
      {
        id: '5',
        title: 'Cryptocurrency Fundamentals',
        description: 'Understanding blockchain technology and crypto investing.',
        difficulty: 'beginner',
        duration: 40,
        completed: false,
        progress: 25,
        category: 'Crypto',
      },
      {
        id: '6',
        title: 'Risk Management in Trading',
        description: 'Learn how to manage risk and protect your investments.',
        difficulty: 'intermediate',
        duration: 50,
        completed: false,
        progress: 0,
        category: 'Risk Management',
      },
    ];

    setModules(mockModules);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLearningModules();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredModules = modules.filter((module) => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.difficulty === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: LearningModule['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return Colors.gain;
      case 'intermediate':
        return Colors.warning;
      case 'advanced':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const handleModulePress = (module: LearningModule) => {
    Alert.alert(
      module.title,
      `${module.description}\n\nDuration: ${module.duration} minutes\nProgress: ${module.progress}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Learning', onPress: () => startModule(module) },
      ]
    );
  };

  const startModule = (module: LearningModule) => {
    Alert.alert('Coming Soon', 'Learning modules will be available in the next update!');
  };

  const renderModuleItem = ({ item }: { item: LearningModule }) => (
    <TouchableOpacity style={styles.moduleItem} onPress={() => handleModulePress(item)}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleIcon}>
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'play-circle-outline'}
            size={24}
            color={item.completed ? Colors.gain : Colors.primary}
          />
        </View>
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleTitle}>{item.title}</Text>
          <Text style={styles.moduleDescription}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.moduleDetails}>
        <View style={styles.moduleMetadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metadataText}>{item.duration} min</Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) + '20' },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(item.difficulty) },
              ]}
            >
              {item.difficulty}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="folder-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metadataText}>{item.category}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.progress}%`,
                  backgroundColor: item.completed ? Colors.gain : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item.id as Category)}
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

  const completedModules = modules.filter(m => m.completed).length;
  const totalProgress = modules.reduce((sum, module) => sum + module.progress, 0) / modules.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <TouchableOpacity style={styles.achievementsButton}>
          <Ionicons name="trophy-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedModules}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{modules.length - completedModules}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(totalProgress)}%</Text>
              <Text style={styles.statLabel}>Overall</Text>
            </View>
          </View>
          
          <View style={styles.overallProgressContainer}>
            <Text style={styles.overallProgressLabel}>Learning Progress</Text>
            <View style={styles.overallProgressBar}>
              <View
                style={[
                  styles.overallProgressFill,
                  { width: `${totalProgress}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* AI Assistant Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerContent}>
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
            <View style={styles.aiBannerText}>
              <Text style={styles.aiBannerTitle}>AI Learning Assistant</Text>
              <Text style={styles.aiBannerSubtitle}>
                Get personalized recommendations based on your progress
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.aiBannerButton}>
            <Text style={styles.aiBannerButtonText}>Ask AI</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search learning modules..."
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

        {/* Learning Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Learning Modules</Text>
          {filteredModules.map((module) => (
            <View key={module.id}>
              {renderModuleItem({ item: module })}
            </View>
          ))}
        </View>

        {/* Recommended Section */}
        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <View style={styles.recommendedItem}>
            <Ionicons name="bulb-outline" size={24} color={Colors.warning} />
            <View style={styles.recommendedText}>
              <Text style={styles.recommendedTitle}>Market Analysis Basics</Text>
              <Text style={styles.recommendedSubtitle}>
                Based on your portfolio, you might benefit from learning technical analysis
              </Text>
            </View>
            <TouchableOpacity style={styles.recommendedButton}>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Learning Path */}
        <View style={styles.learningPath}>
          <Text style={styles.sectionTitle}>Suggested Learning Path</Text>
          <View style={styles.pathContainer}>
            <View style={styles.pathItem}>
              <View style={[styles.pathIcon, { backgroundColor: Colors.gain }]}>
                <Ionicons name="checkmark" size={16} color={Colors.background} />
              </View>
              <Text style={styles.pathText}>Stock Market Basics</Text>
            </View>
            <View style={styles.pathLine} />
            <View style={styles.pathItem}>
              <View style={[styles.pathIcon, { backgroundColor: Colors.primary }]}>
                <Text style={styles.pathIconText}>2</Text>
              </View>
              <Text style={styles.pathText}>Financial Analysis</Text>
            </View>
            <View style={styles.pathLine} />
            <View style={styles.pathItem}>
              <View style={[styles.pathIcon, { backgroundColor: Colors.border }]}>
                <Text style={styles.pathIconText}>3</Text>
              </View>
              <Text style={[styles.pathText, { color: Colors.textSecondary }]}>
                Portfolio Management
              </Text>
            </View>
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
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  achievementsButton: {
    padding: Spacing.sm,
  },
  progressSummary: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  overallProgressContainer: {
    marginTop: Spacing.md,
  },
  overallProgressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  aiBanner: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiBannerText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  aiBannerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  aiBannerButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  aiBannerButtonText: {
    fontSize: FontSize.sm,
    color: Colors.background,
    fontWeight: '600',
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
  modulesSection: {
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  moduleItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  moduleIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  moduleDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  moduleDetails: {
    marginTop: Spacing.sm,
  },
  moduleMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  metadataText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    minWidth: 30,
  },
  recommendedSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  recommendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  recommendedText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recommendedTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  recommendedSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  recommendedButton: {
    padding: Spacing.sm,
  },
  learningPath: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  pathContainer: {
    alignItems: 'center',
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  pathIconText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  pathText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  pathLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
    marginLeft: 16,
  },
});