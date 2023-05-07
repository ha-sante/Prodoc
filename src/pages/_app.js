import '@/styles/globals.css'

import { AppStateProvider, AppStateContext } from '../context/state';
import toast, { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';


if (typeof window !== "undefined") {
  const HawkCatcher = (await import('@hawk.so/javascript')).default;
  console.log("claims.there.is.window");
  // Client-side-only code
  const hawk = new HawkCatcher({
    token: process.env.NEXT_PUBLIC_HAWK_PUBLIC_KEY
  });
}

export default function App({ Component, pageProps }) {
  return (
    <AppStateProvider>
      <Component {...pageProps} />
      <Toaster position="bottom-center" />
    </AppStateProvider>
  );
}
