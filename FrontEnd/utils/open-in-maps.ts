import { Linking, Platform, Alert, ActionSheetIOS } from 'react-native';

export function openInMaps(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  originLabel: string, destLabel: string,
) {
  const encodedOrigin = encodeURIComponent(originLabel);
  const encodedDest   = encodeURIComponent(destLabel);

  const urls = {
    googleMaps: `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`,
    waze:       `waze://?ll=${destLat},${destLng}&navigate=yes&from=${originLat},${originLng}`,
    appleMaps:  `maps://?saddr=${encodedOrigin}&daddr=${encodedDest}`,
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Google Maps', 'Apple Maps', 'Waze', 'Cancelar'],
        cancelButtonIndex: 3,
        title: 'Abrir ruta en',
      },
      async (idx) => {
        if (idx === 0) await tryOpen(urls.googleMaps, 'https://maps.google.com');
        if (idx === 1) await tryOpen(urls.appleMaps, '');
        if (idx === 2) await tryOpen(urls.waze, urls.googleMaps);
      },
    );
  } else {
    Alert.alert('Abrir ruta en', 'Elige una aplicación de navegación', [
      { text: 'Google Maps', onPress: () => tryOpen(urls.googleMaps, 'https://maps.google.com') },
      { text: 'Waze',        onPress: () => tryOpen(urls.waze, urls.googleMaps) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }
}

async function tryOpen(primary: string, fallback: string) {
  try {
    const canOpen = await Linking.canOpenURL(primary);
    if (canOpen) { await Linking.openURL(primary); return; }
    if (fallback) await Linking.openURL(fallback);
  } catch {
    if (fallback) await Linking.openURL(fallback).catch(() => {});
  }
}
