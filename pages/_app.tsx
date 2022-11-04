import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserAuthProvider } from './../hooks/userAuth';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <UserAuthProvider>
        <Component {...pageProps} />
      </UserAuthProvider>
    </RecoilRoot>
  );
}

export default MyApp;
