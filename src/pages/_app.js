import '@/styles/globals.css'

import { AppStateStoreProvider } from '../context/state';
import toast, { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  // <AppStateStoreProvider>
  {/* <Toaster position="bottom-center" />
    </AppStateStoreProvider> */}

  console.log("Parent <App> called")

  return (
    <Component {...pageProps} />
  );
}
