// Google OAuth client IDs, read from the EXPO_PUBLIC_GOOGLE_* env vars (see .env).
// A value left as a placeholder ("TU_...") is treated as NOT configured (undefined)
// so the auth provider never uses it by mistake.

function clean(value?: string): string | undefined {
  if (!value || value.includes("TU_")) return undefined;
  return value;
}

export const GOOGLE = {
  webClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  iosClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  androidClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
};
