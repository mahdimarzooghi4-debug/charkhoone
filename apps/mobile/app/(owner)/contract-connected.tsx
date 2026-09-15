import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { OwnerBadge, OwnerCard, OwnerRow } from "@/components/OwnerUi";
import { ownerAssets } from "@/ownerAssets";
import { colors, fonts, radii } from "@/theme";

export default function OwnerContractConnectedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="قرارداد" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.checkCircle}><FigmaSvg uri={ownerAssets.contractCheck} width={24} height={24} /></View>
          <OwnerBadge>مالک</OwnerBadge>
          <Text style={styles.heroTitle}>قرارداد به حساب شما متصل شد</Text>
          <Text style={styles.heroDescription}>اطلاعات این قرارداد با نقش مالک به حساب شما اضافه شد.</Text>
        </View>

        <View style={styles.content}>
          <OwnerCard soft title="وضعیت قرارداد" style={styles.statusCard}>
            <Text style={styles.statusValue}>در انتظار تکمیل فرایند تأمین مالی</Text>
            <Text style={styles.supporting}>فرایند تأمین مالی توسط مستأجر در حال انجام است.</Text>
          </OwnerCard>

          <OwnerCard title="مستأجر">
            <OwnerRow label="نام" value="علی رضایی" />
            <OwnerRow label="کد ملی" value="۰۰۱•••••۷۸۹" />
          </OwnerCard>

          <OwnerCard title="خلاصه قرارداد">
            <OwnerRow label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" />
            <OwnerRow label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
            <OwnerRow label="تاریخ شروع قرارداد" value="۱۵ مهر ۱۴۰۵" />
            <OwnerRow label="تاریخ پایان قرارداد" value="۱۵ مهر ۱۴۰۶" />
            <OwnerRow label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
          </OwnerCard>

          <OwnerCard title="ملک قرارداد">
            <View style={styles.addressBlock}>
              <Text style={styles.muted}>آدرس</Text>
              <Text style={styles.address}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text>
            </View>
            <OwnerRow label="کدپستی" value="۱۹۹۸۷۶۵۴۳۲" />
          </OwnerCard>

          <View style={styles.nextCard}>
            <Text style={styles.cardTitle}>مرحله بعد</Text>
            <Text style={styles.nextText}>پس از تکمیل بررسی و تأمین مالی مستأجر، برای تأیید نهایی قرارداد به شما اطلاع داده می‌شود.</Text>
          </View>
          <View style={styles.notice}><Text style={styles.noticeText}>در حال حاضر اقدامی از طرف شما لازم نیست.</Text></View>

          <View style={styles.actions}>
            <AppButton variant="primary" onPress={() => router.push("/(owner)/settlement-preference")}>مشاهده قرارداد</AppButton>
            <AppButton variant="outline" onPress={() => router.replace("/(owner)/contract-active")}>رفتن به خانه</AppButton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 24 },
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, alignItems: "center", gap: 16 },
  checkCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  heroTitle: { width: "100%", color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  heroDescription: { width: "100%", color: "#C8D2D0", fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  content: { paddingHorizontal: 16, gap: 16 },
  statusCard: { borderColor: colors.primary },
  statusValue: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  supporting: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  addressBlock: { gap: 4 },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  address: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  nextCard: { backgroundColor: colors.infoSoft, borderRadius: radii.lg, padding: 16, gap: 8 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  nextText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  notice: { backgroundColor: "#FFF3E0", borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 10 },
  noticeText: { color: "#D97706", fontFamily: fonts.medium, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  actions: { gap: 12, paddingVertical: 8 },
});
