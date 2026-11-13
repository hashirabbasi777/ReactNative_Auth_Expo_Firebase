import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config. Values come from `.env` (loaded automatically by the
 * Expo CLI) so identifiers never need to be hard-coded or committed.
 */
const bundleId = process.env.APP_BUNDLE_ID ?? 'com.example.authexpofirebase';
const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Auth Expo Firebase',
  slug: 'reactnative-auth-expo-firebase',
  version: '1.0.0',
  scheme: 'authexpofirebase',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
  },
  android: {
    package: bundleId,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    // The Google Sign-In plugin requires the iOS URL scheme. Only add it once
    // it is configured so `expo start` works before Google is set up.
    ...(iosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, object]]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
});
