import { useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { colors, fonts, radii } from "@/theme";

type Props = {
  title: string;
};

/**
 * Direct links to the old tenant financial prototypes must fail closed.
 * The authenticated home, contracts, payments, and financing status pages
 * are the only supported entry points for their persisted mobile evidence.
 */
export function LegacyTenantRouteUnavailable({ title }: Props) {
  const router = useRouter();
  const { status } = useMobileAuth();

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
    }
  }, [router, status]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title={title} />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.heading}>این مسیر هنوز به دادهٔ معتبر متصل نیست</Text>
          <Text style={styles.body}>
            این صفحه از نسخهٔ نمایشی قدیمی است. بدون شاهد ثبت‌شدهٔ backend،
            هیچ مبلغ، نتیجهٔ تراکنش، وضعیت عضویت، قرارداد یا تسویه‌ای در اینجا اعلام نمی‌شود.
          </Text>
          <Text style={styles.body}>
            این مسیر نه پرداختی را آغاز می‌کند و نه آن را موفق، ناموفق یا در انتظار تأیید اعلام می‌کند.
            وضعیت‌های واقعی را فقط در صفحه‌های متصل به حساب احراز هویت‌شده ببینید.
          </Text>
        </View>
        <AppButton onPress={() => router.replace("/(tenant)/home")}>بازگشت به خانه</AppButton>
        <AppButton variant="outline" onPress={() => router.replace("/(tenant)/payments")}>
          مشاهدهٔ پرداخت‌های ثبت‌شده
        </AppButton>
        <AppButton variant="outline" onPress={() => router.replace("/(shared)/contracts")}>
          مشاهدهٔ قراردادهای ثبت‌شده
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 18, gap: 12 },
  heading: { color: colors.primary, fontFamily: fonts.bold, fontSize: 17, textAlign: "right", writingDirection: "rtl" },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 23, textAlign: "right", writingDirection: "rtl" },
});
