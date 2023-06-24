import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import Swal from 'sweetalert2';

interface UserAuth {
  user: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  loading: boolean;
}

interface UserAuthProviderProps {
  children: React.ReactNode;
}

const UserAuthContext = createContext<UserAuth>({
  user: null,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
  error: null,
  loading: false,
});
export const UserAuthProvider = ({ children }: UserAuthProviderProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const signUp = async (email: string, password: string) => {
    setLoading(true);

    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        router.push('/');
        setLoading(false);
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.message.slice(9),
          confirmButtonColor: '#34275d',
        });
      })
      .finally(() => setLoading(false));
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        router.push('/');
        setLoading(false);
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.message.slice(9),
          confirmButtonColor: '#34275d',
        });
      })
      .finally(() => setLoading(false));
  };

  const logout = async () => {
    setLoading(true);

    signOut(auth)
      .then(() => {
        setUser(null);
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.message,
          confirmButtonColor: '#34275d',
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
          setLoading(false);
        } else {
          setUser(null);
          setLoading(true);
          router.push('/login');
        }

        setInitialLoading(false);
      }),
    [auth]
  );
  const memoedValue = useMemo(
    () => ({ user, signUp, signIn, error, loading, logout }),
    [user, loading, error]
  );

  return (
    <UserAuthContext.Provider value={memoedValue}>
      {!initialLoading && children}
    </UserAuthContext.Provider>
  );
};

export default function userAuth() {
  return useContext(UserAuthContext);
}
