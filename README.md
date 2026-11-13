# React Native Auth: Expo + Firebase

An Expo (SDK 58) app with **email/password sign-up, sign-in and password reset**, plus **Google Sign-In**, all backed by **Firebase Authentication**.

- Expo Router with protected routes (`Stack.Protected`). Signed-out users only see the auth screens, and signed-in users only see the app.
- The Firebase JS SDK, with the session saved in AsyncStorage so users stay signed in after a restart.
- Native Google Sign-In (`@react-native-google-signin/google-signin`). It returns a Google ID token, which is exchanged for a Firebase credential.
- All config comes from `.env`. No keys are hard-coded or committed.

---

## 1. How it fits together

```
┌──────────────────────────── App (src/) ────────────────────────────┐
│                                                                    │
│  app/(auth)/sign-in.tsx ─┐                                         │
│  app/(auth)/sign-up.tsx ─┼──► context/AuthContext.tsx ──┐          │
│  app/(auth)/forgot-...  ─┘     (useAuth hook)           │          │
│                                                         ▼          │
│  app/_layout.tsx  ◄── onAuthStateChanged ───── lib/firebase.ts     │
│  (route guard)                                  initializeApp()    │
│                                                 initializeAuth()   │
│                                                   + AsyncStorage   │
│                                                         ▲          │
│                     lib/googleSignIn.ts ────────────────┘          │
│                     GoogleSignin.signIn() → idToken                │
│                     → GoogleAuthProvider.credential(idToken)       │
│                     → signInWithCredential(auth, …)                │
│                                                                    │
│  lib/env.ts  ◄── process.env.EXPO_PUBLIC_*  ◄── .env (git-ignored) │
└────────────────────────────────────────────────────────────────────┘
                    │                          │
                    ▼                          ▼
         Firebase Authentication       Google OAuth (native picker)
```

**Email/password:** the screen calls `useAuth().signIn()` / `signUp()`, which call the Firebase SDK. When the call succeeds, `onAuthStateChanged` fires, `user` is set, and the route guard in `src/app/_layout.tsx` moves the user to `(app)`. The screens never navigate by hand.

**Google:** the native account picker returns a Google **ID token**. That token is signed for your **Web client ID**, so Firebase can verify it. `signInWithCredential` then creates or signs in the Firebase user. After that the flow is the same as email/password.

**Sign-out:** the app signs out of Google, so the account picker shows again next time, and then out of Firebase. The route guard then shows the sign-in screen.

### Project layout

```
src/
  app/
    _layout.tsx            AuthProvider + protected-route guard
    (auth)/sign-in.tsx     Sign-in screen
    (auth)/sign-up.tsx     Sign-up screen (name, email, password, confirm)
    (auth)/forgot-password.tsx
    (app)/index.tsx        Home screen for signed-in users (profile + sign out)
  context/AuthContext.tsx  Auth state + actions (useAuth)
  lib/env.ts               Reads and validates env vars
  lib/firebase.ts          Firebase app + Auth with persistence
  lib/googleSignIn.ts      Google → Firebase credential exchange
  lib/authErrors.ts        Firebase error codes → friendly messages
  lib/validation.ts        Email/password validation
  components/              TextField, Button, GoogleButton, AuthLayout
app.config.ts              Expo config (reads .env for native settings)
.env.example               Template for your credentials
```

---

## 2. What I need from you (Firebase / Google credentials)

Set these up in Firebase and put the values in `.env`. **Don't paste them in chat or commit them.**

| Variable | Where to find it |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → General → *Your apps* → Web app → `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | same → `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | same → `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | same → `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same → `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | same → `appId` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Firebase → Authentication → Sign-in method → Google → *Web SDK configuration* → **Web client ID** (also in Google Cloud Console → Credentials, "Web client (auto created by Google Service)") |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS only. Add an iOS app in Firebase, or create an iOS OAuth client in Google Cloud, and use its client ID |
| `GOOGLE_IOS_URL_SCHEME` | iOS only. The **reversed** iOS client ID, e.g. `com.googleusercontent.apps.1234-abcd` |
| `APP_BUNDLE_ID` | Your app's package name / bundle ID, e.g. `com.yourcompany.authapp`. It must match what you register in Firebase |

### Firebase console checklist

1. **Create a project** at https://console.firebase.google.com.
2. **Add a Web app** (the `</>` icon). Copy the `firebaseConfig` values into `.env`. This app uses the JS SDK, so it is the web config you need.
3. **Authentication → Sign-in method:**
   - Enable **Email/Password**.
   - Enable **Google**, set a support email, and save. Copy the **Web client ID** shown there.
4. **Android (for Google Sign-In):**
   - Add an **Android app** in Firebase with the same package name as `APP_BUNDLE_ID`.
   - Add your signing certificate's **SHA-1** (and SHA-256). For a local debug build, run `cd android && ./gradlew signingReport` after `npx expo prebuild`. For EAS builds, run `npx eas-cli credentials`.
   - Adding it creates the Android OAuth client in Google Cloud for you. Without the right SHA-1, Google Sign-In fails with `DEVELOPER_ERROR`.
5. **iOS (for Google Sign-In):**
   - Add an **iOS app** with the same bundle ID. Open the downloaded `GoogleService-Info.plist` and copy `CLIENT_ID` into `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `REVERSED_CLIENT_ID` into `GOOGLE_IOS_URL_SCHEME`. You don't need to add the plist file to the project.
6. *(Recommended)* **Authentication → Settings → Password policy:** require a minimum length that matches the app (8 or more characters).

---

## 3. Run it

```bash
npm install
```

```bash
cp .env.example .env   # then fill in the values
```

Google Sign-In uses native code, so it **does not work in Expo Go**. Use a development build:

```bash
npx expo run:android      # or: npx expo run:ios (needs a Mac)
```

You can also build it in the cloud with EAS. Set the env vars there with `eas env:create` or in the EAS dashboard, because `.env` is not uploaded:

```bash
npx eas-cli@latest build --profile development --platform android
```

After the dev build is installed, start Metro:

```bash
npx expo start --dev-client
```

> After you change `.env`, restart with `npx expo start --clear`. `EXPO_PUBLIC_*` values are inlined into the bundle when it is built.

Checks:

```bash
npm run typecheck
```

---

## 4. Security notes

- **`.env` is git-ignored.** Only `.env.example`, which holds no real values, is committed. `google-services.json`, `GoogleService-Info.plist` and service-account JSON files are also ignored.
- **`EXPO_PUBLIC_*` values ship inside the app.** Anyone can pull them out of the binary. That is fine for the Firebase web config and OAuth client IDs, which are identifiers and not secrets. **Never** put a Firebase Admin / service-account key, or any other server secret, in `.env` with the `EXPO_PUBLIC_` prefix. Secrets like that belong on a backend (e.g. Cloud Functions).
- Your data is actually protected by:
  - **Firestore/Storage Security Rules.** Check `request.auth != null` and ownership, and never leave rules open.
  - **API key restrictions.** In Google Cloud Console → Credentials, restrict the browser key to the Firebase APIs you use. Add Android/iOS app restrictions if you create separate native keys.
  - **Firebase App Check** (recommended before production). It blocks requests that don't come from your real app.
  - **Authorized domains** under Authentication → Settings. Remove any you don't use.
- The app shows **generic error messages**, so it doesn't reveal whether an email is registered. Sign-in returns the same message for a wrong password and for an unknown user, and password reset always reports success.
- **Email verification** is sent on sign-up, and the home screen shows `emailVerified`. To require verified emails, gate features on `user.emailVerified` and check it again in Security Rules (`request.auth.token.email_verified`).
- Sessions are stored by the Firebase SDK in AsyncStorage. Firebase uses short-lived ID tokens and refreshes them automatically.
