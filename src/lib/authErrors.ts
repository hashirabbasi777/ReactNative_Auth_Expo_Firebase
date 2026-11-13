import { FirebaseError } from 'firebase/app';

/** Map Firebase error codes to user-friendly messages (never leak raw errors). */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/missing-password':
        return 'Please enter your password.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        // Same message for all three to avoid revealing which emails exist.
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 8 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'This email is already linked to another sign-in method.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in Firebase.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
