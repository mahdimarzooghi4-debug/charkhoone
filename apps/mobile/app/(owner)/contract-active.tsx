import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { OwnerBadge, OwnerCard, OwnerRow, OwnerRows } from "@/components/OwnerUi";
import { colors, fonts } from "@/theme";

export default function OwnerContractActiveScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="جزئیات قرارداد" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badges}><OwnerBadge size="hero">فعال</OwnerBadge><OwnerBadge size="hero">مالک</OwnerBadge></View>
          <Text style={styles.heroTitle}>تهران، سعادت‌آباد</Text>
          <Text style={styles.heroDescription}>خیابان نمونه، پلاک ۲۴، واحد ۳</Text>
          <Text style={styles.tracking}>کد رهگیری: ۱۲۳۴۵۶۷۸۹۰۱۲</Text>
        </View>

        <View style={styles.content}>
          <OwnerCard soft style={styles.nextCard}>
            <View style={styles.nextHeader}><OwnerBadge tone="warning">در انتظار تسویه</OwnerBadge><Text style={styles.cardTitle}>دریافتی بعدی</Text></View>
            <Text style={styles.amount}>۱۹٬۹۰۰٬۰۰۰ تومان</Text>
            <OwnerRows gap={8}>
              <OwnerRow label="تاریخ" value="۱۵ آبان ۱۴۰۵" />
              <OwnerRow label="بابت" value="قرارداد سعادت‌آباد" valueStyle={styles.metaValue} labelStyle={styles.metaLabel} />
              <OwnerRow label="مبلغ ناخالص دریافتی" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="کارمزد خدمات چارخونه - ۰٫۵٪" value="−۱۰۰٬۰۰۰ تومان" valueStyle={styles.warningValue} />
              <OwnerRow label="مبلغ خالص قابل تسویه" value="۱۹٬۹۰۰٬۰۰۰ تومان" valueStyle={styles.boldPrimary} labelStyle={styles.netLabel} />
            </OwnerRows>
            <AppButton variant="primary" labelStyle={styles.nextButtonLabel} onPress={() => router.push("/(owner)/receive-pay")}>مشاهده دریافت و پرداخت</AppButton>
          </OwnerCard>

          <OwnerCard title="مستأجر">
            <OwnerRows><OwnerRow label="نام" value="علی رضایی" /><OwnerRow label="کد ملی" value="۰۰۱•••••۷۸۹" /></OwnerRows>
          </OwnerCard>

          <OwnerCard title="شرایط قرارداد">
            <OwnerRows>
              <OwnerRow label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="تاریخ شروع" value="۱۵ مهر ۱۴۰۵" />
              <OwnerRow label="تاریخ پایان" value="۱۵ مهر ۱۴۰۶" />
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="وضعیت تأمین مالی">
            <OwnerRows>
              <OwnerRow label="مبلغ تأمین‌شده" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" />
              <View style={styles.statusRow}>
                <View style={styles.statusIndicator}><Text style={styles.statusText}>تکمیل شده</Text><View style={styles.dot} /></View>
                <Text style={styles.rowLabel}>وضعیت</Text>
              </View>
              <Text style={styles.supporting}>فرایند تأمین مالی قرارداد تکمیل شده است.</Text>
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="وضعیت تسویه">
            <OwnerRows><OwnerRow label="آخرین تسویه" value="انجام شده" valueStyle={styles.statusText} /><OwnerRow label="تاریخ آخرین تسویه" value="۱۵ مهر ۱۴۰۵" /></OwnerRows>
          </OwnerCard>

          <OwnerCard title="اطلاعات ملک">
            <OwnerRows>
              <View style={styles.addressBlock}><Text style={styles.label}>آدرس</Text><Text style={styles.address}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text></View>
              <OwnerRow label="کدپستی" value="۱۹۹۸۷۶۵۴۳۲" />
            </OwnerRows>
          </OwnerCard>

          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction} onPress={() => router.push("/(owner)/receive-pay")}><Text style={styles.quickActionText}>مشاهده دریافت و پرداخت</Text></Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push("/(owner)/receive-pay")}><Text style={styles.quickActionText}>مشاهده سوابق تسویه</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 0 },
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, gap: 8, alignItems: "flex-end" },
  badges: { width: "100%", flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 8 },
  heroTitle: { width: "100%", color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  heroDescription: { width: "100%", color: "#C8D2D0", fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  tracking: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  content: { padding: 16, gap: 16 },
  nextCard: { borderColor: colors.primary },
  nextHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, writingDirection: "rtl" },
  amount: { color: colors.primary, fontFamily: fonts.bold, fontSize: 22, textAlign: "right", writingDirection: "rtl" },
  metaValue: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  metaLabel: { fontSize: 12 },
  warningValue: { color: "#D97706" },
  boldPrimary: { color: colors.primary, fontFamily: fonts.bold },
  netLabel: { color: colors.primary, fontFamily: fonts.semibold },
  nextButtonLabel: { fontFamily: fonts.regular },
  statusRow: { minHeight: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, writingDirection: "rtl" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  rowLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  supporting: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  addressBlock: { gap: 4 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  address: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  quickActions: { gap: 8 },
  quickAction: { height: 44, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickActionText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
});
