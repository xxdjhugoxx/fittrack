import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.icon, focused && styles.iconFocusedText]}>{icon}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0C0C14',
          borderTopColor: '#1A1A2C',
          borderTopWidth: 1,
          height: 80,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: '#00D4AA',
        tabBarInactiveTintColor: '#3A3A4E',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Track',
          tabBarIcon: ({ focused }) => <TabIcon icon="▶" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon icon="📷" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon icon="☰" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
  },
  icon: {
    fontSize: 16,
    color: '#3A3A4E',
  },
  iconFocusedText: {
    color: '#00D4AA',
  },
});
