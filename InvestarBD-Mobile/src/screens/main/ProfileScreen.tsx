import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/colors';

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: string;
  hasArrow?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
  onSwitchToggle?: (value: boolean) => void;
}

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleMenuItemPress = (item: ProfileMenuItem) => {
    switch (item.id) {
      case 'personal-info':
        Alert.alert('Personal Information', 'Edit your personal details');
        break;
      case 'security':
        Alert.alert('Security Settings', 'Manage your security preferences');
        break;
      case 'kyc':
        Alert.alert('KYC Verification', 'Complete your KYC verification');
        break;
      case 'bank-accounts':
        Alert.alert('Bank Accounts', 'Manage your linked bank accounts');
        break;
      case 'tax-documents':
        Alert.alert('Tax Documents', 'Download your tax documents');
        break;
      case 'support':
        Alert.alert('Customer Support', 'Contact our support team');
        break;
      case 'about':
        Alert.alert('About', 'InveStar BD v1.0.0\nYour trusted investment partner');
        break;
      case 'logout':
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: handleLogout },
          ]
        );
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon!');
    }
  };

  const handleLogout = () => {
    Alert.alert('Success', 'You have been logged out successfully');
    // TODO: Implement actual logout logic
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'personal-info',
          title: 'Personal Information',
          icon: 'person-outline',
          hasArrow: true,
        },
        {
          id: 'security',
          title: 'Security & Privacy',
          icon: 'shield-outline',
          hasArrow: true,
        },
        {
          id: 'kyc',
          title: 'KYC Verification',
          icon: 'checkmark-circle-outline',
          hasArrow: true,
        },
      ],
    },
    {
      title: 'Financial',
      items: [
        {
          id: 'bank-accounts',
          title: 'Bank Accounts',
          icon: 'card-outline',
          hasArrow: true,
        },
        {
          id: 'tax-documents',
          title: 'Tax Documents',
          icon: 'document-text-outline',
          hasArrow: true,
        },
        {
          id: 'portfolio-summary',
          title: 'Portfolio Summary',
          icon: 'pie-chart-outline',
          hasArrow: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          icon: 'notifications-outline',
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchToggle: setNotificationsEnabled,
        },
        {
          id: 'biometric',
          title: 'Biometric Login',
          icon: 'finger-print-outline',
          hasSwitch: true,
          switchValue: biometricEnabled,
          onSwitchToggle: setBiometricEnabled,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          icon: 'moon-outline',
          hasSwitch: true,
          switchValue: darkModeEnabled,
          onSwitchToggle: setDarkModeEnabled,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help-center',
          title: 'Help Center',
          icon: 'help-circle-outline',
          hasArrow: true,
        },
        {
          id: 'support',
          title: 'Customer Support',
          icon: 'headset-outline',
          hasArrow: true,
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          icon: 'chatbubble-outline',
          hasArrow: true,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'document-outline',
          hasArrow: true,
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'lock-closed-outline',
          hasArrow: true,
        },
        {
          id: 'about',
          title: 'About InveStar BD',
          icon: 'information-circle-outline',
          hasArrow: true,
        },
      ],
    },
  ];

  const renderMenuItem = (item: ProfileMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => !item.hasSwitch && handleMenuItemPress(item)}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
      </View>
      
      <View style={styles.menuItemRight}>
        {item.hasSwitch && (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchToggle}
            trackColor={{
              false: Colors.border,
              true: Colors.primary + '40',
            }}
            thumbColor={item.switchValue ? Colors.primary : Colors.background}
          />
        )}
        {item.hasArrow && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userEmail}>john.doe@example.com</Text>
            <Text style={styles.userPhone}>+880 1234567890</Text>
          </View>
          <View style={styles.verificationBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.gain} />
            <Text style={styles.verificationText}>Verified</Text>
          </View>
        </View>

        {/* Portfolio Summary */}
        <View style={styles.portfolioSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>৳1,25,000</Text>
            <Text style={styles.summaryLabel}>Portfolio Value</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.gain }]}>+7.3%</Text>
            <Text style={styles.summaryLabel}>Total Return</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summaryLabel}>Holdings</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
              {section.items.map(renderMenuItem)}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => handleMenuItemPress({ id: 'logout', title: 'Logout', icon: 'log-out-outline' })}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.appVersion}>InveStar BD v1.0.0</Text>
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
  editButton: {
    padding: Spacing.sm,
  },
  userCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.background,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userPhone: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gain + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  verificationText: {
    fontSize: FontSize.sm,
    color: Colors.gain,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  portfolioSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  menuSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItems: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemTitle: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  menuItemRight: {
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '10',
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  logoutButtonText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});