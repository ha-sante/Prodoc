import '@/styles/globals.css'

import { AppStateStoreProvider } from '../context/state';
import toast, { Toaster } from 'react-hot-toast';

import 'animate.css';

export default function App({ Component, pageProps }) {
  return (
    <AppStateStoreProvider>
      <Component {...pageProps} />
      <Toaster position="bottom-center" />
    </AppStateStoreProvider>
  );
}
