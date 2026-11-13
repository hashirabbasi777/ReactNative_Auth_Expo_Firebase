import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/lib/firebase';
import { signInWithGoogle, signOutFromGoogle } from '@/lib/googleSignIn';

type AuthContextValue = {
  user: User | null;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Re-sends the verification email to the signed-in user. */
  resendVerification: () => Promise<void>;
  /** Re-fetches the user from Firebase (e.g. after they click the verification link). */
  reloadUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  // Bumped when the profile changes in place (onAuthStateChanged doesn't fire for that).
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    // Single source of truth: Firebase tells us whenever auth state changes.
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async signUp(name, email, password) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await sendEmailVerification(cred.user);
        setProfileVersion((v) => v + 1); // re-render with the new displayName
      },
      async signInWithGoogle() {
        await signInWithGoogle();
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email.trim());
      },
      async resendVerification() {
        if (!auth.currentUser) return;
        await sendEmailVerification(auth.currentUser);
      },
      async reloadUser() {
        if (!auth.currentUser) return;
        // reload() updates the user in place without firing onAuthStateChanged.
        await auth.currentUser.reload();
        setProfileVersion((v) => v + 1);
      },
      async signOut() {
        await signOutFromGoogle();
        await firebaseSignOut(auth);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, initializing, profileVersion]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
