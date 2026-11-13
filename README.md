# React Native Auth: Expo + Firebase

An Expo (SDK 58, React Native 0.88) app where users can **register and sign in with email/password or with Google**, backed by **Firebase Authentication**.

## Features

| Feature | Details |
|---|---|
| Email sign-up | Name, email, password + confirmation, with client-side validation. Sets the display name and sends a **verification email**. |
| Email verification | The home screen shows the status, has **Resend email** and **I've verified my email** buttons, and checks again automatically when the app returns to the foreground. |
| Email sign-in | Uses the same generic error for a wrong password and an unknown email, so it doesn't reveal which emails are registered. |
| Forgot password | Sends a Firebase password-reset email. |
| Google sign-up / sign-in | Native Google account picker → ID token → Firebase credential. The first Google sign-in creates the account automatically. |
| Persistent session | Stored in AsyncStorage, so the user stays signed in after restarting the app. |
| Protected routes | Expo Router `Stack.Protected`. Signed-out users only see the auth screens, and signed-in users only see the app. |
| Sign-out | Signs out of Google (so the account picker shows next time) and Firebase. |

---

## 1. How it fits together

```
┌──────────────────────────── App (src/) ────────────────────────────┐
│                                                                    │
│  app/(auth)/sign-in.tsx ─┐                                         │
│  app/(auth)/sign-up.tsx ─┼──► context/AuthContext.tsx ──┐          │
│  app/(auth)/forgot-...  ─┘     (useAuth hook)           │          │
│  app/(app)/index.tsx ───────►  resend / reload / out    │          │
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

- **Email/password:** the screens call `useAuth().signIn()` / `signUp()`. When the call succeeds, `onAuthStateChanged` fires and the route guard in `src/app/_layout.tsx` moves the user to `(app)`. The screens never navigate by hand.
- **Google:** the native picker returns a Google **ID token**, signed for your **Web client ID**. `signInWithCredential` then creates the Firebase user on the first sign-in and signs them in after that.
- **Email verification:** `reloadUser()` calls `user.reload()` to fetch the latest `emailVerified` value from Firebase. Firebase doesn't push this change to the app, so it has to be fetched.
- **Same email, both methods:** Firebase is set to one account per email address by default. If someone signs up with email/password and later uses Google with the same Gmail address, Google is treated as the trusted provider. If the email was **unverified**, Firebase replaces the password sign-in with Google. If it was verified, the two are linked. Verifying your email first keeps both sign-in methods.

### Project layout

```
src/
  app/
    _layout.tsx                AuthProvider + protected-route guard
    (auth)/sign-in.tsx         Email sign-in + Google
    (auth)/sign-up.tsx         Email registration + Google
    (auth)/forgot-password.tsx Password reset
    (app)/index.tsx            Profile, email verification, sign out
  context/AuthContext.tsx      Auth state + actions (useAuth)
  lib/env.ts                   Reads and validates env vars
  lib/firebase.ts              Firebase app + Auth with persistence
  lib/googleSignIn.ts          Google → Firebase credential exchange
  lib/authErrors.ts            Firebase/Google errors → friendly messages
  lib/validation.ts            Email/password validation
  components/                  TextField, Button, GoogleButton, AuthLayout
app.config.ts                  Expo config (reads .env, wires google-services.json)
.env.example                   Template for your credentials
```

---

## 2. Requirements

| Tool | Version |
|---|---|
| Node.js | **24.12 or newer** (the Firebase SDK requires it) |
| Android SDK | Platform-tools, plus **CMake 3.31+** (see [Troubleshooting](#6-troubleshooting)) |
| JDK | 17, or the JDK bundled with Android Studio |
| Device | An Android phone with USB debugging, or an emulator with Google Play |

Dependency versions are pinned exactly in `package.json` and `package-lock.json`. Install with `npm ci` to get exactly those versions. To upgrade, use `npx expo install <pkg>` or `npx expo install --fix`, not plain `npm install <pkg>`.

---

## 3. Firebase & Google setup

### 3.1 Firebase console

1. **Create a project** at https://console.firebase.google.com.
2. **Add a Web app** (the `</>` icon) and copy its `firebaseConfig` values into `.env`. This app uses the JS SDK, so it needs the *web* config.
3. **Authentication → Sign-in method:**
   - Enable **Email/Password**.
   - Enable **Google**, set a support email and save. Copy the **Web client ID** shown under *Web SDK configuration*.
4. **Add an Android app** with the same package name as `APP_BUNDLE_ID` (default `com.example.authexpofirebase`):
   - Add the **SHA-1** and **SHA-256** of your signing key. See [3.3](#33-getting-the-sha-1).
   - Download **`google-services.json`** and put it in the **project root** (next to `app.config.ts`), **not** in `android/app`. It's git-ignored, and `expo prebuild` copies it into the native project.
5. *(iOS only)* Add an **iOS app** with the same bundle ID. From its `GoogleService-Info.plist`, copy `CLIENT_ID` into `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `REVERSED_CLIENT_ID` into `GOOGLE_IOS_URL_SCHEME`.
6. *(Recommended)* **Authentication → Settings → Password policy:** set a minimum length of 8 or more, to match the app.
7. *(Optional)* **Authentication → Templates:** customise the verification and password-reset emails.

### 3.2 `.env`

```bash
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
```

| Variable | Where to find it |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Project settings → General → *Your apps* → Web app → `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | same → `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | same → `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | same → `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same → `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | same → `appId` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Authentication → Sign-in method → Google → *Web client ID* (also listed as "Web client (auto created by Google Service)" in Google Cloud → Credentials). **Not** the Android client ID. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS only: `CLIENT_ID` from `GoogleService-Info.plist` |
| `GOOGLE_IOS_URL_SCHEME` | iOS only: `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` |
| `APP_BUNDLE_ID` | Package name / bundle ID. Must match the apps registered in Firebase. |

The app shows an error at startup if a required Firebase value is missing.

### 3.3 Getting the SHA-1

For the **debug** build that `npx expo run:android` installs:

```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

or `cd android && ./gradlew signingReport`. Every developer machine and CI or EAS keystore has its own SHA-1, and **each one must be added** to the Android app in Firebase. For EAS builds, run `npx eas-cli@latest credentials`. For Play Store releases, also add the **App signing key** SHA-1 from Play Console → Setup → App integrity.

After you add a SHA-1, download `google-services.json` again and replace the one in the project root.

---

## 4. Run it

```bash
npm ci                                 # install exact locked versions
npx expo run:android --device          # build the dev client, install it on the phone, start Metro
```

The first native build takes about 10–15 minutes. After that:

```bash
npx expo start --dev-client            # just start Metro. The installed app reconnects.
```

Rebuild with `npx expo run:android` only after you add a native package or change `app.config.ts` or `google-services.json`. After you edit `.env`, restart Metro with `npx expo start --dev-client --clear`, because `EXPO_PUBLIC_*` values are built into the bundle.

> Google Sign-In uses native code, so it **does not work in Expo Go**. Always use the development build.

**iOS** (needs a Mac): `npx expo run:ios`.

**Cloud builds with EAS:** `.env` and `google-services.json` are not uploaded. Add the env vars with `npx eas-cli@latest env:create` (or in the dashboard), and upload `google-services.json` as a **file** env var named `GOOGLE_SERVICES_JSON`. Then:

```bash
npx eas-cli@latest build --profile development --platform android
```

### Scripts

| Command | What it does |
|---|---|
| `npm run android` | `expo run:android` (native build + install) |
| `npm run start:dev-client` | Start Metro for the installed dev build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npx expo-doctor` | Check dependency and config health |

---

## 5. Testing the flows

1. **Email registration:** Sign up with a name, an email and a password of 8+ characters. You land on the home screen with *Email verified: No*.
2. **Verify:** open the link in the email, then go back to the app. It refreshes automatically, or you can tap **I've verified my email**. Use **Resend email** if the email doesn't arrive, and check your spam folder.
3. **Sign out → sign in** with the same email and password.
4. **Forgot password:** enter the email and follow the link in the reset email.
5. **Google:** tap **Continue with Google** on the sign-in or sign-up screen and pick an account. The first time creates the account, and after that it signs in.
6. Check the users in Firebase Console → Authentication → Users.

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Red screen "Missing Firebase env vars" | Fill in `.env`, then `npx expo start --dev-client --clear`. |
| Google: *DEVELOPER_ERROR* / code `10` | The SHA-1 of the keystore that signed the app isn't in Firebase, the package name doesn't match, or `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is not the **web** client. Fix it in Firebase, download `google-services.json` again and rebuild. |
| Google: "did not return an ID token" | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is missing or wrong. |
| "This sign-in method is not enabled" | Enable Email/Password or Google in Firebase → Authentication → Sign-in method. |
| Verification email never arrives | Check spam, use **Resend email**, and check Firebase → Authentication → Templates. Resending too quickly returns "Too many attempts". |
| **Windows:** CMake / ninja error about a long path or "Filename longer than 260 characters" | Keep the project at a **short path** (e.g. `D:\rn\auth`). Install **CMake 3.31+** (Android Studio → SDK Manager → SDK Tools → *Show Package Details* → CMake). Point the build at it in `android/local.properties` with `cmake.dir=D\:\\Android\\Sdk\\cmake\\3.31.6`. Then delete the `.cxx` folders under `android/app` and `node_modules/*/android`, and rebuild. |
| "Cannot lock execution history cache" / Gradle lock errors | Another Gradle daemon holds the lock, often from Android Studio or the VS Code *Gradle for Java* extension. Run `cd android && ./gradlew --stop`, close those tools and rebuild. |
| "There is not enough space on the disk" | Gradle and Kotlin use `%TEMP%` on C:. Keep at least 10 GB free there. |
| vivo / Xiaomi / Oppo: install fails or hangs | Enable **USB debugging** *and* **Install via USB** in Developer options. Keep the phone unlocked and accept the install prompt. |
| `adb devices` shows `offline` / `unauthorized` | Reconnect the cable, unlock the phone and accept the RSA prompt. If it's still offline, run `adb kill-server`, then `adb devices`. |

> `android/` and `ios/` are **generated** by `expo prebuild` and git-ignored. Configure native settings in `app.config.ts` instead. `android/local.properties` is local to your machine, so add `cmake.dir` again if you regenerate with `npx expo prebuild --clean`.

---

## 7. Security notes

- **`.env` is git-ignored.** Only `.env.example`, which holds no real values, is committed. `google-services.json`, `GoogleService-Info.plist` and service-account JSON files are also ignored.
- **`EXPO_PUBLIC_*` values ship inside the app.** Anyone can extract them from the binary. That is fine for the Firebase web config and OAuth client IDs, which are identifiers and not secrets. **Never** put a Firebase Admin / service-account key, or any other server secret, in `.env`. Those belong on a backend (e.g. Cloud Functions).
- Your data is actually protected by:
  - **Firestore/Storage Security Rules.** Check `request.auth != null`, ownership and, where needed, `request.auth.token.email_verified`.
  - **API key restrictions** in Google Cloud Console → Credentials.
  - **Firebase App Check** (recommended before production).
  - **Authorized domains** under Authentication → Settings. Remove any you don't use.
- Error messages are **generic**, so they don't reveal whether an email is registered. Password reset always reports success.
- Sessions are stored by the Firebase SDK in AsyncStorage. ID tokens are short-lived and refresh automatically.

---

## 8. Before publishing

- Change `APP_BUNDLE_ID` from `com.example.authexpofirebase` to your own ID, register it in Firebase and download `google-services.json` again.
- Add the release / Play App Signing SHA-1 to Firebase.
- Store policies (Google Play and the App Store) require apps that create accounts to offer **account deletion**. Add a "Delete account" action (`deleteUser`, after re-authentication) before publishing.
- Enable App Check and lock down Security Rules.
