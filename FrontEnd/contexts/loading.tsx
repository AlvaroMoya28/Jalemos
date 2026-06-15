// Global loading overlay context.
// Call showLoader(label?) before any async operation and hideLoader() when done.
// The PageLoader is rendered once at the root level, so it overlays everything.

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLoader from '@/components/shared/page-loader';

interface LoadingContextValue {
  showLoader: (label?: string) => void;
  hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({
  showLoader: () => {},
  hideLoader: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loaderState, setLoaderState] = useState({ visible: false, label: 'Cargando...' });

  const showLoader = useCallback((label = 'Cargando...') => {
    setLoaderState({ visible: true, label });
  }, []);

  const hideLoader = useCallback(() => {
    setLoaderState(s => ({ ...s, visible: false }));
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoader, hideLoader }}>
      {/* flex:1 wrapper ensures PageLoader's absoluteFill covers the full screen */}
      <View style={styles.fill}>
        {children}
        <PageLoader visible={loaderState.visible} label={loaderState.label} />
      </View>
    </LoadingContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
