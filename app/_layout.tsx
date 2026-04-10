import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LocationProvider } from '../src/contexts/LocationContext';
import { WorkoutProvider } from '../src/contexts/WorkoutContext';

export default function RootLayout() {
  return (
    <LocationProvider>
      <WorkoutProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0D0D0D' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout/[id]"
            options={{
              title: 'Workout Details',
              presentation: 'modal',
              headerStyle: { backgroundColor: '#0D0D0D' },
            }}
          />
        </Stack>
      </WorkoutProvider>
    </LocationProvider>
  );
}
