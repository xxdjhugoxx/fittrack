# FitTrack — Production Specification

## 1. Project Overview
- **Name**: FitTrack
- **Type**: Fitness / Workout Tracking App (Expo React Native)
- **Core**: GPS running & walking tracker with AI calorie scanning via food photo
- **Platforms**: iOS (Expo Go + App Store), Android (Expo Go), Web (Chrome)
- **Expo SDK**: 54
- **Router**: Expo Router v6 (file-based, `/app` directory)

---

## 2. UI/UX Specification

### Color Palette
| Role | Hex | Usage |
|---|---|---|
| Background | `#090910` | Page backgrounds |
| Card | `#14141C` | Cards, panels |
| Card border | `#1E1E2C` | Dividers, borders |
| Accent | `#00D4AA` | Primary CTA, active states |
| Danger | `#FF4757` | Stop button, delete |
| Warning | `#FF9F43` | Walking activity |
| Text primary | `#FFFFFF` | Headings, important text |
| Text secondary | `#5A5A6E` | Labels, descriptions |
| Text muted | `#3A3A4E` | Placeholder, tertiary |
| Text disabled | `#2A2A3C` | Disabled states |

### Typography
- **Headings**: System font, weight 900, letter-spacing -1.5
- **Body**: System font, weight 400-600
- **Monospace**: `Menlo` (iOS) / `monospace` (Android) for coordinates

### Spacing
- Page padding: 24px horizontal
- Card gap: 12–16px
- Card radius: 16–24px
- Bottom tab height: 80px (with 24px bottom padding for home indicator)

### Dark Theme
- Background: `#090910` (near black)
- Cards: `#14141C` (dark card surface)
- Accent teal: `#00D4AA`
- Activity colors: Running `#00D4AA`, Walking `#FF9F43`
- Stop button: `#FF4757` (red)

---

## 3. Screen Structure

### Tab 1 — Track (Home)
- Activity selector (Running / Walking) — togglable before tracking
- Large Start button (green for Run, orange for Walk) with pulse animation
- Live stats: distance (km + miles), duration (live ticker), pace
- Background tracking badge when active
- Shows GPS point count during tracking
- Tapping Stop saves workout and navigates to detail

### Tab 2 — Scan (NEW)
- Camera button to take food photo
- Gallery picker
- Manual entry fallback
- AI analysis with GPT-4o vision (with API key placeholder)
- Results screen: total calories, per-item breakdown, macros
- Add to daily log button

### Tab 3 — History
- Summary bar (total km, total time, workout count)
- Workout cards: activity icon, type, date, km, time, pace, miles
- Left accent bar (teal = run, orange = walk)
- Tap card → navigates to `/workout/[id]`
- Long press → delete confirmation
- Empty state

### Tab 4 — Settings
- Location section with foreground + background permission rows
- Status badge (Enabled / Denied / Not Set)
- "Configure Location" button → `Linking.openSettings()`
- Status card: green if full permission, amber if not
- Step-by-step guide (4 steps) when permission not granted
- App info section (version, platform, SDK, storage)
- Tips section

### Workout Detail (`/workout/[id]`)
- Back button
- Activity type + date
- Distance card: km + miles (large, centered)
- Stats grid: duration, pace, speed, calories
- Route visualization: START → END visual bar, GPS stats, all coordinates
- Detailed metrics table

---

## 4. Navigation Structure
```
RootLayout
├── LocationProvider
└── WorkoutProvider
    └── Stack (headerShown: false)
        ├── Tabs (4 screens: Track, Scan, History, Settings)
        └── workout/[id] (card presentation)
```

---

## 5. Functionality Specification

### Location Permission Flow
1. **First tap Start** → Alert explains why location is needed → user confirms → `requestAllLocationPermissions()` (foreground + background)
2. **Permission granted** → immediately starts tracking, no more prompts
3. **Permission denied** → Alert with "Open Settings" button → `Linking.openSettings()`
4. **Subsequent starts** (permission already granted) → starts immediately, no dialog
5. **Location Context** reads permission status on mount, refreshes on Settings visibility

### Tracking Flow
1. User selects Running or Walking
2. Taps START → permission check → if granted, `startBackgroundTracking()` → begins live tracking
3. Background task (`LOCATION_TASK_NAME`) runs `TaskManager.defineTask` to receive GPS updates
4. Updates flow: location → route → distance/duration/pace state
5. Taps STOP → `stopBackgroundTracking()` → saves workout to AsyncStorage → navigate to detail

### Calorie Scan Flow
1. User taps "Take Photo" or "From Gallery"
2. `ImagePicker.launchCameraAsync()` / `ImagePicker.launchImageLibraryAsync()`
3. Photo captured → passed to `analyzeFoodWithAI()` (GPT-4o vision)
4. Results displayed: total calories, per-item with confidence, protein/carbs/fat
5. Fallback: manual entry (food name + calories)

### Data Persistence
- Workouts stored in `@fittrack_workouts` AsyncStorage key
- Saved as JSON array, newest first
- Loaded on app start

---

## 6. Permissions Required
| Permission | Platform | Purpose |
|---|---|---|
| `NSCameraUsageDescription` | iOS | Food photo capture |
| `NSPhotoLibraryUsageDescription` | iOS | Gallery image selection |
| `NSLocationWhenInUseUsageDescription` | iOS | Foreground GPS tracking |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | iOS | Background tracking |
| `ACCESS_FINE_LOCATION` | Android | Precise GPS |
| `ACCESS_COARSE_LOCATION` | Android | Network location |
| `ACCESS_BACKGROUND_LOCATION` | Android | Background tracking |

---

## 7. Technical Stack
- **Expo SDK**: 54
- **expo-router**: 6.0.23
- **expo-location**: 19.0.8 + expo-task-manager
- **expo-image-picker**: 55.0.18
- **@react-native-async-storage/async-storage**: 2.2.0
- **React**: 19.1.0
- **React Native**: 0.81.5
- **uuid**: 9.0.0

---

## 8. testID Map
| Screen / Element | testID |
|---|---|
| Home screen | `home-screen` |
| Start button | `start-button` |
| Stop button | `stop-button` |
| Activity: Running | `activity-running` |
| Activity: Walking | `activity-walking` |
| Duration display | `duration-display` |
| Pace display | `pace-display` |
| Miles display | `miles-display` |
| Distance display | `distance-display` |
| Route points | `route-points` |
| Background badge | `background-badge` |
| Scan screen | `scan-screen` |
| Take photo button | `take-photo-button` |
| Gallery button | `gallery-button` |
| Manual entry button | `manual-entry-button` |
| Manual food input | `manual-food-input` |
| Manual calories input | `manual-calories-input` |
| Submit manual button | `submit-manual-button` |
| Scan results screen | `scan-results-screen` |
| Add to log button | `add-to-log-button` |
| History list | `history-list` |
| History empty | `history-empty` |
| Workout card | `workout-card-{id}` |
| Settings screen | `settings-screen` |
| Location settings button | `location-settings-button` |
| Workout detail screen | `workout-detail-screen` |
| Back button | `back-button` |
| Distance card | `distance-card` |
| Workout activity type | `workout-activity-type` |
| Workout date | `workout-date` |
| Distance km | `distance-km` |
| Distance miles | `distance-miles` |
| Stat duration | `stat-duration` |
| Stat pace | `stat-pace` |
| Stat speed | `stat-speed` |
| Stat calories | `stat-calories` |
| Workout scroll | `workout-scroll` |
