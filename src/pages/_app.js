import '@/styles/globals.css'

import { AppStateProvider, AppStateContext } from '../context/state';
import toast, { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <AppStateProvider>
      <Component {...pageProps} />
      <Toaster position="bottom-center" />
    </AppStateProvider>
  );
}
