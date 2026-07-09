// Google Sign-In with expo-auth-session.
// Requests an id_token from Google and hands it to the auth context, which sends it to
// the Jalemos backend (/api/auth/google). Existing accounts are logged in directly; new
// accounts are routed to the "complete your profile" screen to pick a username.

import { GOOGLE } from "@/constants/google";
import { GoogleProfilePrefill, useAuth } from "@/contexts/auth";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

// Closes the in-app browser automatically when returning to the app.
WebBrowser.maybeCompleteAuthSession();

// On iOS, Expo Go accepts the redirect using the "reverse client ID" scheme
// (com.googleusercontent.apps.XXXX:/oauthredirect). We derive it from the iOS client ID.
const iosRedirectUri = GOOGLE.iosClientId
  ? `com.googleusercontent.apps.${GOOGLE.iosClientId.replace(".apps.googleusercontent.com", "")}:/oauthredirect`
  : undefined;

/**
 * Hook backing the "Continuar con Google" button.
 * @param onError called with a human-readable message when sign-in fails.
 */
export function useGoogleSignIn(onError?: (message: string) => void) {
  // Opt this hook out of the React Compiler (experiments.reactCompiler). The compiler's
  // auto-memoization interacts badly with expo-auth-session's internal hooks here and
  // triggers an infinite render/navigation loop; running it un-memoized is correct.
  "use no memo";

  const { loginWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // iOS uses iosClientId; Android uses androidClientId; web/Expo Go fall back to web.
    clientId: GOOGLE.webClientId,
    webClientId: GOOGLE.webClientId,
    androidClientId: GOOGLE.androidClientId,
    iosClientId: GOOGLE.iosClientId,
    // On iOS force the redirect to the iOS client scheme (works in Expo Go).
    ...(Platform.OS === "ios" && iosRedirectUri ? { redirectUri: iosRedirectUri } : {}),
  });

  // Logs the exact redirectUri the app uses (handy for registering it in Google Cloud).
  useEffect(() => {
    if (request?.redirectUri) {
      console.log("[Google] redirectUri =", request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setSubmitting(false);
        onError?.("Google no devolvió un id_token.");
        return;
      }
      setSubmitting(true);
      loginWithGoogle(idToken)
        .then((r) => {
          if (r.success) {
            // Existing account — logged in. Route by role.
            router.replace(
              r.user?.role === "admin" ? "/(tabs)/admin-applications" : "/(tabs)/search",
            );
          } else if (r.needsProfile && r.prefill) {
            // New Google account — collect a username before creating it.
            const prefill: GoogleProfilePrefill = r.prefill;
            router.push({
              pathname: "/complete-google-profile",
              params: {
                idToken,
                email: prefill.email,
                firstName: prefill.firstName,
                lastName: prefill.lastName,
                suggestedUsername: prefill.suggestedUsername,
                photoUrl: prefill.photoUrl ?? "",
              },
            });
          } else {
            onError?.(r.error ?? "No se pudo iniciar sesión con Google.");
          }
        })
        .finally(() => setSubmitting(false));
    } else if (response.type === "error") {
      setSubmitting(false);
      onError?.("No se pudo iniciar sesión con Google.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    // true once Google is ready to be used.
    ready: !!request,
    // true while the backend call is in flight.
    submitting,
    signIn: () => promptAsync(),
  };
}
