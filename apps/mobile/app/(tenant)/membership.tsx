import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function MembershipPlan({ selected, title, limit, fee, recommended }: { selected?: boolean; title: string; limit: string; fee: string; recommended?: boolean }) {
  return (
    <View style={[styles.plan, selected && styles.planSelected]}>
      <View style={styles.planHeader}>
        <FigmaSvg uri={selected ? figmaAssets.membershipSelected : figmaAssets.membershipUnselected} width={18} height={18} />
        <View style={styles.headerRight}>
          {recommended ? <View style={styles.recommended}><Text style={styles.recommendedText}>مناسب برای این قرارداد</Text></View> : null}
          <Text style={styles.planTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.kv}><Text style={styles.valuePrimary}>{limit}</Text><Text style={styles.label}>سقف تأمین مالی:</Text></View>
      <View style={styles.kv}><Text style={styles.value}>{fee}</Text><Text style={styles.label}>حق عضویت:</Text></View>
    </View>
  );
}

export default function MembershipScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="عضویت چارخونه" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contextCard}><Text style={styles.contextText}>برای ادامه درخواست تأییدشده، یک طرح عضویت انتخاب کنید و حق عضویت چارخونه را پرداخت کنید.</Text><View style={styles.infoBadge}><Text style={styles.infoBadgeText}>ⓘ</Text></View></View>
        <View style={styles.heading}><Text style={styles.title}>طرح‌های عضویت در دسترس</Text><Text style={styles.description}>حق عضویت بر اساس سقف تأمین مالی مورد نیاز و تعداد استفاده محاسبه شده است.</Text></View>
        <MembershipPlan selected recommended title="طرح ۱ بار استفاده" limit="تا ۵۰۰٬۰۰۰٬۰۰۰ تومان" fee="۲٬۵۰۰٬۰۰۰ تومان (نمونه)" />
        <MembershipPlan title="طرح ۲ بار استفاده" limit="تا ۷۵۰٬۰۰۰٬۰۰۰ تومان" fee="۴٬۰۰۰٬۰۰۰ تومان (نمونه)" />
        <MembershipPlan title="طرح ۳ بار استفاده" limit="تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان" fee="۵٬۵۰۰٬۰۰۰ تومان (نمونه)" />
      </ScrollView>
      <View style={styles.bottom}>
        <Text style={styles.bottomNote}>بعد از فعال‌شدن عضویت، مرحله پرداخت آورده برای این قرارداد در دسترس قرار می‌گیرد.</Text>
        <AppButton onPress={() => router.push("/(tenant)/contribution-required")}>پرداخت</AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: 16, paddingBottom: 140, gap: 12 },
  contextCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  contextText: { flex: 1, color: colors.primary, fontFamily: fonts.medium, fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  infoBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" },
  infoBadgeText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 14 },
  heading: { gap: 4, marginTop: 8 },
  title: { color: colors.page, fontFamily: fonts.bold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  plan: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  planSelected: { borderColor: colors.accent },
  planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  headerRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  recommended: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  recommendedText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  planTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, writingDirection: "rtl" },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  value: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  valuePrimary: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.primary, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 12 },
  bottomNote: { color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, textAlign: "center", writingDirection: "rtl" },
});
