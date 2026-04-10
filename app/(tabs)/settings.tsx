import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { useLocation } from '../../src/contexts/LocationContext';

function PermissionBadge({ status }: { status: string }) {
  const isGranted = status === 'granted' || status === 'limited';
  return (
    <View style={[styles.badge, isGranted ? styles.badgeGreen : styles.badgeRed]}>
      <Text style={[styles.badgeText, isGranted ? styles.badgeGreenText : styles.badgeRedText]}>
        {status === 'granted' ? '✓ Enabled' : status === 'limited' ? '◐ Limited' : '✕ Disabled'}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { permissionStatus, backgroundPermission, refreshPermissionStatus } = useLocation();

  const openLocationSettings = () => {
    Linking.openSettings();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Location Access</Text>
        <Text style={styles.sectionDesc}>
          FitTrack needs location access to track your route. Background access lets the app keep tracking when your screen is off.
        </Text>

        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Foreground Location</Text>
            <Text style={styles.permissionSub}>Required for tracking</Text>
          </View>
          <PermissionBadge status={permissionStatus} />
        </View>

        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>Background Location</Text>
            <Text style={styles.permissionSub}>Track with screen off</Text>
          </View>
          <PermissionBadge status={backgroundPermission} />
        </View>

        <TouchableOpacity
          style={[
            styles.enableButton,
            permissionStatus === 'granted' && styles.enableButtonAlt,
          ]}
          onPress={openLocationSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.enableButtonText}>
            {permissionStatus === 'granted'
              ? '🔄 Open System Settings'
              : '🔓 Enable Location in Settings'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.permissionHelp}>
          {permissionStatus === 'denied'
            ? 'Location was denied. Tap the button above to open Settings and enable it manually.'
            : permissionStatus === 'undetermined'
            ? 'Location permission has not been requested yet. Tap Start Tracking to enable it.'
            : 'Your location is configured. You\'re all set to start tracking.'}
        </Text>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Build</Text>
          <Text style={styles.aboutValue}>Expo SDK 52</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • Make sure "Allow all the time" is selected for background tracking to work with the screen off
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • For best accuracy, keep your phone in a pocket or armband while running
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • Workouts are saved locally on your device
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionSub: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeGreen: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
  },
  badgeRed: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeGreenText: {
    color: '#00D4AA',
  },
  badgeRedText: {
    color: '#FF4757',
  },
  enableButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  enableButtonAlt: {
    backgroundColor: '#2A2A2A',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  permissionHelp: {
    fontSize: 12,
    color: '#666666',
    marginTop: 12,
    lineHeight: 18,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#888888',
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 20,
  },
});
