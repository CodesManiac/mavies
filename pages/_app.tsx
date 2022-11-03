import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserAuthProvider } from './../hooks/userAuth';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserAuthProvider>
      <Component {...pageProps} />
    </UserAuthProvider>
  );
}

export default MyApp;
