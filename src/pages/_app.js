import '@/styles/globals.css'

import { AppStateProvider, AppStateContext } from '../context/state';

export default function App({ Component, pageProps }) {
  return (
    <AppStateProvider>
      <Component {...pageProps} />
    </AppStateProvider>
  );
}
