# FitTrack — Workout Tracker

A running and walking GPS tracker built with Expo SDK 52 + React Native.

## Features

- 🏃 Live GPS route tracking
- 📍 Background tracking (screen off)
- 📋 Workout history with detail view
- 🗺️ Route map with polyline
- ⚙️ Location permission management
- 📱 iOS & Android

## How to Run

### 1. On your Mac

```bash
# Navigate to the project
cd ~/path/to/fittrack

# Install dependencies
npm install

# Start Expo
npx expo start --ios
```

This will open the iOS simulator and launch the app.

### 2. Build for App Store

```bash
# Run prebuild to generate native projects
npx expo prebuild --platform ios

# Open in Xcode
open ios/workspace.xcworkspace

# Sign with your Apple Developer account in Xcode
# Product → Archive → Distribute
```

## Project Structure

```
fittrack/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout (providers)
│   ├── (tabs)/            # Tab navigator
│   │   ├── index.tsx      # Home / Start Tracking
│   │   ├── history.tsx    # Workout list
│   │   └── settings.tsx   # Location settings
│   └── workout/
│       └── [id].tsx       # Workout detail (modal)
├── src/
│   ├── contexts/          # React Context providers
│   ├── services/          # Location tracking service
│   ├── types/             # TypeScript types
│   └── utils/             # Formatters and helpers
└── SPEC.md                # Full specification
```

## Key Design Decisions

### Location Permission Flow
- **Never prompts on app launch**
- Permission is requested ONLY when user taps "Start Tracking"
- If denied, shows alert with "Open Settings" button
- Background permission requested after foreground is granted
- Settings screen has a working "Open System Settings" button

### Background Tracking
- Uses `expo-task-manager` with `expo-location`
- Foreground notification while tracking
- Tracking continues with screen off
- Task name: `workout-tracking`

## Customization

### Change App Name / Bundle ID
Edit `app.json`:
- `name`: Display name
- `ios.bundleIdentifier`: e.g. `com.yourname.fittrack`
- `android.package`: e.g. `com.yourname.fittrack`

### Add App Icon
Replace `assets/icon.png` with your 1024x1024 PNG icon.

## Troubleshooting

**Location not working?**
→ Go to Settings → Location → Make sure "Allow all the time" is enabled for FitTrack

**Build fails?**
→ Run `npx expo doctor` to check for issues

**Background tracking stops?**
→ On iOS, make sure "Background App Refresh" is enabled in Settings
