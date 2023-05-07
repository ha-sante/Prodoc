import '@/styles/globals.css'

import { AppStateProvider, AppStateContext } from '../context/state';
import toast, { Toaster } from 'react-hot-toast';

import HawkCatcher from '@hawk.so/javascript';

if (typeof window !== "undefined") {
  // Client-side-only code
  if (window) {
    const hawk = new HawkCatcher({
      token: process.env.NEXT_PUBLIC_HAWK_PUBLIC_KEY
    });
  }
}

export default function App({ Component, pageProps }) {
  return (
    <AppStateProvider>
      <Component {...pageProps} />
      <Toaster position="bottom-center" />
    </AppStateProvider>
  );
}
