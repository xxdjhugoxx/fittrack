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
            headerShown: false,
            contentStyle: { backgroundColor: '#090910' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout/[id]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </WorkoutProvider>
    </LocationProvider>
  );
}
