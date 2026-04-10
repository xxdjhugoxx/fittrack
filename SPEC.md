# FitTrack — Workout Tracker App Specification

## Concept & Vision

A no-nonsense running and walking workout tracker that just works. User taps "Start Tracking" and the app handles the rest — GPS route, pace, distance, time. Clean, focused, and reliable. No clutter, no gamification fluff.

## Tech Stack

- **Framework:** Expo SDK 52 (stable, well-tested)
- **Language:** TypeScript
- **Location:** expo-location (with background location support)
- **Maps:** react-native-maps
- **Navigation:** @react-navigation/native + @react-navigation/bottom-tabs
- **Storage:** @react-native-async-storage/async-storage
- **State:** React Context API

## Screen Structure

```
App
├── Tab Navigator
│   ├── HomeScreen (Start Tracking)
│   ├── HistoryScreen (Workout List)
│   └── SettingsScreen
└── Stack Navigator (per tab)
    └── WorkoutDetailScreen (modal from History)
```

## Location Permission Logic

**CRITICAL — Must follow this exactly:**

1. **On app launch:** Do NOT prompt for location. Ever.
2. **On "Start Tracking" tap:**
   - If `granted` or `limited`: Begin tracking immediately, no prompt
   - If `undetermined`: Show custom "Enable Location" modal with explanation → then request
   - If `denied`: Show alert with "Open Settings" button → links to app settings
3. **Settings screen button:** Always opens the correct location settings using `Linking.openSettings()`
4. **"Allow all the time" / Background:** Request with `accuracy: expo-location.Accuracy.BestForNavigation`

## Background Tracking

- Use `expo-location.startLocationUpdatesAsync()` with `startsUpdatesImmediately: true`
- Task name: `workout-tracking`
- Foreground notification: "FitTrack is tracking your workout"
- Tracking continues with screen locked/off

## Data Model

```typescript
interface Workout {
  id: string;
  date: string; // ISO
  duration: number; // seconds
  distance: number; // meters
  route: { latitude: number; longitude: number }[];
  avgPace: number; // seconds per km
  avgSpeed: number; // m/s
  calories?: number;
  isRunning: boolean;
}
```

## Screens

### HomeScreen
- Large "START TRACKING" button (tapping starts workout)
- If workout active: shows live stats (distance, time, pace)
- Stop button to end workout → saves to history
- No location prompt shown until Start is tapped

### HistoryScreen
- FlatList of past workouts (newest first)
- Each item shows: date, distance, duration, pace
- Tapping opens WorkoutDetailScreen

### WorkoutDetailScreen
- Full-screen map with route polyline
- Stats card: date, time, distance (mi/km), pace, avg speed
- Dark map style matching app theme

### SettingsScreen
- Location permission status display
- "Enable Location" button (opens system settings)
- App version

## UI Design

- **Theme:** Dark, clean, athletic
- **Primary:** #00D4AA (vibrant teal)
- **Background:** #0D0D0D
- **Surface:** #1A1A1A
- **Text:** #FFFFFF / #888888
- **Accent:** #FF6B6B (stop button)

## File Structure

```
fittrack/
├── SPEC.md
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
├── App.tsx
├── app/
│   ├── _layout.tsx
│   ├── index.tsx (redirects to tabs)
│   ├── tabs/
│   │   ├── _layout.tsx
│   │   ├── index.tsx (Home)
│   │   ├── history.tsx
│   │   └── settings.tsx
│   └── workout/
│       └── [id].tsx
├── src/
│   ├── contexts/
│   │   ├── LocationContext.tsx
│   │   └── WorkoutContext.tsx
│   ├── services/
│   │   └── locationService.ts
│   ├── utils/
│   │   └── formatters.ts
│   └── types/
│       └── index.ts
└── assets/
    └── icon.png
```
