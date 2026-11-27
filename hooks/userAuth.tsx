import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

interface UserAuth {
  user: User | null;
  initializing: boolean;
  submitting: boolean;
  error: string | null;
  notice: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearMessages: () => void;
  logout: () => Promise<void>;
}

interface UserAuthProviderProps {
  children: React.ReactNode;
}

const getErrorCode = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return '';
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
};

const getAuthErrorMessage = (error: unknown): string => {
  switch (getErrorCode(error)) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Sign in instead.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently unavailable.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

const UserAuthContext = createContext<UserAuth>({
  user: null,
  initializing: true,
  submitting: false,
  error: null,
  notice: null,
  signUp: async () => {},
  signIn: async () => {},
  resetPassword: async () => {},
  clearMessages: () => {},
  logout: async () => {},
});

export const UserAuthProvider = ({ children }: UserAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const router = useRouter();

  const clearMessages = () => {
    setError(null);
    setNotice(null);
  };

  const runAuthAction = async (
    action: () => Promise<void>,
    successNotice?: string
  ) => {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await action();
      if (successNotice) {
        setNotice(successNotice);
      }
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const signUp = (email: string, password: string) =>
    runAuthAction(async () => {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(credential.user);
      await router.replace('/');
    });

  const signIn = (email: string, password: string) =>
    runAuthAction(async () => {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(credential.user);
      await router.replace('/');
    });

  const resetPassword = (email: string) =>
    runAuthAction(async () => {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (caught) {
        if (getErrorCode(caught) !== 'auth/user-not-found') {
          throw caught;
        }
      }
    }, 'If an account exists for that email, a reset link has been sent.');

  const logout = async () => {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await signOut(auth);
      setUser(null);
      await router.replace('/login');
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setInitializing(false);
      },
      () => {
        setError('Unable to restore your session. Please try again.');
        setInitializing(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) {
      return;
    }

    if (user && router.pathname === '/login') {
      void router.replace('/');
    }
  }, [initializing, user, router]);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        initializing,
        submitting,
        error,
        notice,
        signUp,
        signIn,
        resetPassword,
        clearMessages,
        logout,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export default function userAuth() {
  return useContext(UserAuthContext);
}
