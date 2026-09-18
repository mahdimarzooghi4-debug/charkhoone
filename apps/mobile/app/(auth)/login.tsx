import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AuthScaffold } from "@/components/AuthScaffold";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import { colors, fonts, radii } from "@/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { status, error, signIn } = useMobileAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/(tenant)/home");
    }
  }, [router, status]);

  const beginSignIn = async () => {
    setSubmitting(true);
    try {
      await signIn();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>ورود امن به چارخونه</Text>
        <Text style={styles.description}>
          ورود توسط ارائه‌دهنده واقعی OIDC انجام می‌شود. چارخونه در اپ موبایل رمز عبور یا کد تأیید محلی تولید نمی‌کند.
        </Text>
      </View>

      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>Authorization Code + PKCE</Text>
        <Text style={styles.securityText}>
          پس از احراز هویت، توکن دسترسی فقط در فضای امن دستگاه نگه‌داری می‌شود و برای API واقعی چارخونه ارسال می‌شود.
        </Text>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          ورود آماده نیست: {error}
        </Text>
      ) : null}

      <View style={styles.gap32} />
      <AppButton
        disabled={submitting || status === "loading" || status === "config-error"}
        onPress={beginSignIn}
      >
        {submitting || status === "loading" ? "در حال آماده‌سازی..." : "ادامه با OIDC"}
      </AppButton>
      <View style={styles.gap20} />
      <Text style={styles.note}>
        هیچ client secret، شماره موبایل نمونه یا OTP ساختگی داخل اپ نگه‌داری نمی‌شود.
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  titleGroup: { width: "100%", gap: 12, alignItems: "flex-end" },
  title: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  securityCard: { width: "100%", marginTop: 24, padding: 16, gap: 8, backgroundColor: colors.surface, borderRadius: radii.md },
  securityTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right" },
  securityText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  error: { width: "100%", marginTop: 16, color: "#B91C1C", fontFamily: fonts.medium, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  gap32: { height: 32 },
  gap20: { height: 20 },
  note: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "center", writingDirection: "rtl" },
});
