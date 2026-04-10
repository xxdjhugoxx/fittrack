import React, { useEffect } from 'react';
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

function PermissionRow({ label, sub, status }: { label: string; sub: string; status: string }) {
  const isGranted = status === 'granted';
  const isLimited = status === 'limited';
  const isPending = status === 'undetermined';
  const isDenied = status === 'denied';

  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionInfo}>
        <Text style={styles.permissionLabel}>{label}</Text>
        <Text style={styles.permissionSub}>{sub}</Text>
      </View>
      <View style={[
        styles.badge,
        isGranted || isLimited ? styles.badgeGreen : isDenied ? styles.badgeRed : styles.badgeGray
      ]}>
        <Text style={[
          styles.badgeText,
          isGranted || isLimited ? styles.badgeGreenText : isDenied ? styles.badgeRedText : styles.badgeGrayText
        ]}>
          {isGranted ? '✓ Enabled' : isLimited ? '◐ Limited' : isDenied ? '✗ Denied' : '○ Not Set'}
        </Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { permissionStatus, backgroundPermission, refreshPermissionStatus } = useLocation();

  useEffect(() => {
    refreshPermissionStatus();
  }, []);

  const openSettings = () => {
    Linking.openSettings();
  };

  const hasFullPermission = (permissionStatus === 'granted' || permissionStatus === 'limited') &&
    (backgroundPermission === 'granted' || backgroundPermission === 'limited');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="settings-screen">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Location Access</Text>
        <Text style={styles.sectionDesc}>
          FitTrack needs location access to record your workout route. Background access lets tracking continue when your screen is off.
        </Text>

        <PermissionRow
          label="Foreground Location"
          sub="Required for tracking"
          status={permissionStatus}
        />
        <PermissionRow
          label="Background Location"
          sub="Track with screen off"
          status={backgroundPermission}
        />

        {/* Main CTA */}
        <TouchableOpacity
          style={[styles.enableButton, hasFullPermission && styles.enableButtonActive]}
          onPress={openSettings}
          activeOpacity={0.8}
          testID="location-settings-button"
        >
          <Text style={styles.enableButtonIcon}>
            {hasFullPermission ? '✓' : '⚡'}
          </Text>
          <View style={styles.enableButtonText}>
            <Text style={[styles.enableButtonTitle, hasFullPermission && styles.enableButtonTitleActive]}>
              {hasFullPermission ? 'Settings Updated' : 'Configure Location'}
            </Text>
            <Text style={styles.enableButtonSub}>
              {hasFullPermission ? 'Location permissions are configured' : 'Tap to open system settings'}
            </Text>
          </View>
          <Text style={styles.enableButtonArrow}>›</Text>
        </TouchableOpacity>

        {/* Status message */}
        <View style={[styles.statusCard, hasFullPermission ? styles.statusCardGreen : styles.statusCardAmber]}>
          <Text style={[styles.statusCardText, hasFullPermission ? styles.statusCardGreenText : styles.statusCardAmberText]}>
            {hasFullPermission
              ? '✅ All location permissions granted. You\'re ready to track!'
              : permissionStatus === 'denied'
              ? '⚠️ Location was denied. Open Settings to enable it manually.'
              : permissionStatus === 'undetermined'
              ? '○ Location not yet requested. Start a workout to enable it.'
              : '🔋 Background location recommended for best tracking experience.'}
          </Text>
        </View>
      </View>

      {/* How to enable */}
      {!hasFullPermission && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 How to Enable</Text>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Tap "Configure Location" above</Text>
          </View>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>In your device settings, find FitTrack</Text>
          </View>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Set Location to "Allow all the time" or "Always"</Text>
          </View>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>Return here and start tracking!</Text>
          </View>
        </View>
      )}

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SDK</Text>
          <Text style={styles.infoValue}>Expo SDK 54</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Storage</Text>
          <Text style={styles.infoValue}>On-device only</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>🔋</Text>
          <Text style={styles.tipText}>
            For background tracking to work with the screen off, select "Allow all the time" in location settings
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>📱</Text>
          <Text style={styles.tipText}>
            Keep your phone in a pocket or armband while running for best GPS accuracy
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>🗑</Text>
          <Text style={styles.tipText}>
            Swipe left on any workout in History to delete it
          </Text>
        </View>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090910',
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#5A5A6E',
    lineHeight: 20,
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionSub: {
    fontSize: 12,
    color: '#5A5A6E',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeGreen: {
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
  },
  badgeRed: {
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
  },
  badgeGray: {
    backgroundColor: 'rgba(90, 90, 110, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeGreenText: {
    color: '#00D4AA',
  },
  badgeRedText: {
    color: '#FF4757',
  },
  badgeGrayText: {
    color: '#5A5A6E',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D4AA',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  enableButtonActive: {
    backgroundColor: '#1E3A2E',
  },
  enableButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  enableButtonText: {
    flex: 1,
  },
  enableButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#090910',
  },
  enableButtonTitleActive: {
    color: '#00D4AA',
  },
  enableButtonSub: {
    fontSize: 11,
    color: '#5A5A6E',
    marginTop: 2,
  },
  enableButtonArrow: {
    fontSize: 22,
    color: '#5A5A6E',
    fontWeight: '300',
  },
  statusCard: {
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  statusCardGreen: {
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
  },
  statusCardAmber: {
    backgroundColor: 'rgba(255, 159, 67, 0.08)',
  },
  statusCardText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  statusCardGreenText: {
    color: '#00D4AA',
  },
  statusCardAmberText: {
    color: '#FF9F43',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E1E2C',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1E2C',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#00D4AA',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#C0C0D0',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#14141C',
  },
  infoLabel: {
    fontSize: 14,
    color: '#5A5A6E',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E1E2C',
    gap: 10,
  },
  tipEmoji: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#5A5A6E',
    lineHeight: 20,
  },
  bottomPad: {
    height: 40,
  },
});
