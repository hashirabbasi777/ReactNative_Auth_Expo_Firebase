import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { env } from './env';

// Re-use the app on Fast Refresh instead of initializing twice.
export const firebaseApp = getApps().length ? getApp() : initializeApp(env.firebase);

function createAuth(): Auth {
  if (Platform.OS === 'web') return getAuth(firebaseApp);
  try {
    // Persist the session in AsyncStorage so users stay signed in across restarts.
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (e.g. Fast Refresh).
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();
