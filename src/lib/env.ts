/**
 * Central, validated access to environment variables.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, but ONLY when
 * accessed with the full static name (no destructuring / dynamic keys),
 * which is why each variable is spelled out below.
 */
const raw = {
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

const requiredFirebaseKeys = [
  'firebaseApiKey',
  'firebaseAuthDomain',
  'firebaseProjectId',
  'firebaseAppId',
] as const;

const missing = requiredFirebaseKeys.filter((k) => !raw[k]);
if (missing.length > 0) {
  // Fail loudly in development so misconfiguration is obvious.
  throw new Error(
    `Missing Firebase env vars: ${missing.join(', ')}. ` +
      'Copy .env.example to .env, fill it in, then restart with `npx expo start --clear`.'
  );
}

export const env = {
  firebase: {
    apiKey: raw.firebaseApiKey!,
    authDomain: raw.firebaseAuthDomain!,
    projectId: raw.firebaseProjectId!,
    storageBucket: raw.firebaseStorageBucket,
    messagingSenderId: raw.firebaseMessagingSenderId,
    appId: raw.firebaseAppId!,
  },
  google: {
    webClientId: raw.googleWebClientId,
    iosClientId: raw.googleIosClientId,
  },
};
