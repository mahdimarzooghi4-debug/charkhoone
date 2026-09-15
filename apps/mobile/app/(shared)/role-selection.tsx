import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function KeyValue({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.kvRow}>
      <Text style={[styles.kvValue, accent && styles.accent]}>{value}</Text>
      <Text style={styles.kvLabel}>{label}</Text>
    </View>
  );
}

export default function RoleSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>نقش خود را در این قرارداد انتخاب کنید</Text>
          <Text style={styles.cardDescription}>اطلاعات طرفین از قرارداد ثبت‌شده در سامانه خودنویس دریافت شده است.</Text>
          <View style={styles.roles}>
            <View style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleTitle}>مالک</Text>
                <FigmaSvg uri={figmaAssets.roleUnselected} width={16} height={16} />
              </View>
              <Text style={styles.roleName}>محمد رضایی</Text>
              <Text style={styles.roleCode}>کد ملی: ۰۰۲•••••۴۵۶</Text>
            </View>
            <View style={[styles.roleCard, styles.roleCardSelected]}>
              <View style={styles.roleHeader}>
                <Text style={[styles.roleTitle, styles.onPrimary]}>مستأجر</Text>
                <FigmaSvg uri={figmaAssets.roleSelected} width={16} height={16} />
              </View>
              <Text style={[styles.roleName, styles.onPrimary]}>علی رضایی</Text>
              <Text style={[styles.roleCode, styles.onPrimaryMuted]}>کد ملی: ۰۰۱•••••۷۸۹</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>مشخصات کلی قرارداد</Text>
          <KeyValue label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
          <KeyValue label="تاریخ شروع قرارداد" value="۱۵ مهر ۱۴۰۵" />
          <KeyValue label="تاریخ پایان قرارداد" value="۱۵ مهر ۱۴۰۶" />
          <KeyValue label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" />
          <KeyValue label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" accent />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ملک قرارداد</Text>
          <Text style={styles.kvLabel}>آدرس ملک</Text>
          <Text style={styles.propertyAddress}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text>
          <KeyValue label="کدپستی" value="۱۹۹۸۷۶۵۴۳۲" />
          <KeyValue label="پلاک" value="۲۴" />
          <KeyValue label="واحد" value="۳" />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>در مرحله بعد، طرح‌های تأمین مالی واجد شرایط این قرارداد نمایش داده می‌شوند.</Text>
        </View>
      </ScrollView>
      <View style={styles.bottomAction}>
        <AppButton onPress={() => router.replace("/(tenant)/financing-plans")}>تأیید نقش و ادامه</AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, gap: 12 },
  cardTitle: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  cardDescription: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  roles: { flexDirection: "row", gap: 12 },
  roleCard: { flex: 1, minHeight: 111, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, gap: 8, alignItems: "flex-end" },
  roleCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleHeader: { width: "100%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  roleTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  roleName: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  roleCode: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  onPrimary: { color: colors.surface },
  onPrimaryMuted: { color: colors.surface, opacity: 0.8 },
  kvRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kvValue: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  kvLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, writingDirection: "rtl" },
  accent: { color: colors.accent },
  propertyAddress: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.sm, padding: 12 },
  noticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, textAlign: "right", writingDirection: "rtl" },
  bottomAction: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 10, backgroundColor: colors.primary },
});
