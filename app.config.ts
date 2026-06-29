import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config. Reads public values from the environment so the same
 * codebase can target different Supabase projects / map keys per build.
 *
 * Set these in a local `.env` (see `.env.example`) or in your EAS build env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   GOOGLE_MAPS_ANDROID_API_KEY   (Android only; iOS uses Apple Maps)
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'bikeryder',
  slug: 'bikeryder',
  version: '0.1.0',
  scheme: 'bikeryder',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bikeryder.app',
    infoPlist: {
      // Required so iOS keeps delivering location updates while a ride is recording.
      UIBackgroundModes: ['location'],
      NSLocationWhenInUseUsageDescription:
        'bikeryder uses your location to record your ride route, distance, and speed.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'bikeryder needs background location so it can keep recording your ride when the screen is off.',
    },
  },
  android: {
    package: 'com.bikeryder.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#0B0F14',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0B0F14',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'bikeryder needs background location so it can keep recording your ride when the screen is off.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: '51649e39-2765-494b-ab37-37a73cafcded',
    },
  },
});
