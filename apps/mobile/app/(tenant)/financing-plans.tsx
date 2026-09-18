import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { colors, fonts, radii } from "@/theme";

export default function FinancingPlansScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="انتخاب طرح تأمین مالی" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>فهرست طرح واقعی هنوز به موبایل متصل نشده است</Text>
          <Text style={styles.description}>
            backend فعلی endpoint خواندن طرح‌های قابل انتخاب برای کاربر را ارائه نمی‌کند. برای جلوگیری از نمایش بانک، نرخ یا مبلغ ساختگی، این نسخه هیچ طرح نمونه‌ای نشان نمی‌دهد.
          </Text>
          <Text style={styles.note}>
            مبلغ‌های مالی در چارخونه فقط با واحد ریال و از داده authoritative backend نمایش داده خواهند شد.
          </Text>
        </View>
        <AppButton variant="outline" onPress={() => router.back()}>بازگشت</AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 20, gap: 12 },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 17, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  note: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
});
