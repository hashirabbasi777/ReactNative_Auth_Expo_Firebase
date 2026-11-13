import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, type UserCredential } from 'firebase/auth';
import { Platform } from 'react-native';

import { env } from './env';
import { auth } from './firebase';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!env.google.webClientId) {
    throw new Error('Google Sign-In is not configured: set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
  }
  GoogleSignin.configure({
    // The WEB client ID is what Firebase uses to verify the returned ID token.
    webClientId: env.google.webClientId,
    iosClientId: env.google.iosClientId,
    scopes: ['profile', 'email'],
  });
  configured = true;
}

/**
 * Native Google account picker -> Google ID token -> Firebase credential.
 * Returns null if the user cancelled.
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  ensureConfigured();
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelled

    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google did not return an ID token. Check the web client ID.');

    const credential = GoogleAuthProvider.credential(idToken);
    return await signInWithCredential(auth, credential);
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services is not available or outdated.');
        case '10': // Android DEVELOPER_ERROR: SHA-1 / package / web client ID mismatch
        case 'DEVELOPER_ERROR':
          throw new Error(
            'Google Sign-In is misconfigured (DEVELOPER_ERROR). Check the SHA-1 and package name in Firebase and the web client ID in .env.'
          );
      }
    }
    throw error;
  }
}

/** Clears the cached Google account so the picker shows next time. */
export async function signOutFromGoogle() {
  if (!configured) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google — nothing to do.
  }
}
