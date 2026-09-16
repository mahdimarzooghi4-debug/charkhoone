import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { OwnerBadge, OwnerCard, OwnerRow, OwnerRows } from "@/components/OwnerUi";
import { ownerAssets } from "@/ownerAssets";
import { colors, fonts, radii } from "@/theme";

export default function OwnerFinalConfirmationScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="تایید نهایی قرارداد" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.checkCircle}><FigmaSvg uri={ownerAssets.finalCheck} width={24} height={24} /></View>
          <OwnerBadge tone="warning" size="hero">نیاز به تأیید شما</OwnerBadge>
          <Text style={styles.heroTitle}>قرارداد آماده تأیید نهایی است</Text>
          <Text style={styles.heroDescription}>فرایند تأمین مالی مستأجر تکمیل شده است. لطفاً اطلاعات قرارداد را بررسی و تأیید کنید.</Text>
        </View>

        <View style={styles.content}>
          <OwnerCard title="مستأجر">
            <OwnerRows>
              <OwnerRow label="نام" value="علی رضایی" />
              <View style={styles.statusRow}><View style={styles.statusValue}><Text style={styles.successText}>آورده پرداخت شده</Text><View style={styles.dot} /></View><Text style={styles.label}>وضعیت آورده</Text></View>
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="شرایط قرارداد">
            <OwnerRows>
              <OwnerRow label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="تاریخ شروع" value="۱۵ مهر ۱۴۰۵" />
              <OwnerRow label="تاریخ پایان" value="۱۵ مهر ۱۴۰۶" />
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="تأمین مالی قرارداد">
            <OwnerRows>
              <OwnerRow label="مبلغ تأمین‌شده" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="وضعیت تأمین مالی" value="تأیید شده" valueStyle={styles.successText} />
            </OwnerRows>
            <Text style={styles.supporting}>پس از تکمیل تأیید نهایی، مبلغ تأمین مالی وارد مسیر مالی تعیین‌شده این قرارداد می‌شود.</Text>
          </OwnerCard>

          <Pressable style={styles.cardPressable} onPress={() => router.push("/(owner)/settlement-preference")}>
            <Text style={styles.cardTitle}>روش دریافت انتخاب‌شده</Text>
            <OwnerRows>
              <OwnerRow label="روش انتخابی" value="دریافت ماهانه" />
              <OwnerRow label="مبلغ ناخالص دریافتی" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
              <OwnerRow label="کارمزد خدمات چارخونه - ۰٫۵٪" value="−۱۰۰٬۰۰۰ تومان" />
              <OwnerRow label="مبلغ خالص قابل تسویه" value="۱۹٬۹۰۰٬۰۰۰ تومان" valueStyle={styles.boldValue} />
            </OwnerRows>
            <Text style={styles.changeLink}>تغییر روش دریافت</Text>
          </Pressable>

          <OwnerCard title="ملک قرارداد">
            <OwnerRows>
              <View style={styles.addressBlock}><Text style={styles.label}>آدرس</Text><Text style={styles.address}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text></View>
              <OwnerRow label="کدپستی" value="۱۹۹۸۷۶۵۴۳۲" />
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="طرفین قرارداد">
            <View style={styles.partyBlock}><Text style={styles.partyLabel}>مالک</Text><View style={styles.partyRow}><Text style={styles.partyCode}>کد ملی: ۰۰۲•••••۴۵۶</Text><Text style={styles.partyName}>محمد رضایی</Text></View></View>
            <View style={styles.divider} />
            <View style={styles.partyBlock}><Text style={styles.partyLabel}>مستأجر</Text><View style={styles.partyRow}><Text style={styles.partyCode}>کد ملی: ۰۰۱•••••۷۸۹</Text><Text style={styles.partyName}>علی رضایی</Text></View></View>
          </OwnerCard>

          <OwnerCard soft title="پس از تأیید شما">
            <OwnerRows>
              {[
                "تأیید نهایی طرفین تکمیل می‌شود",
                "مبلغ تأمین مالی وارد مسیر مالی قرارداد می‌شود",
                "قرارداد در چارخونه فعال می‌شود",
              ].map((step, index) => (
                <View key={step} style={styles.stepRow}><Text style={styles.stepText}>{step}</Text><View style={styles.numBox}><Text style={styles.numText}>{index + 1}</Text></View></View>
              ))}
            </OwnerRows>
          </OwnerCard>

          <Pressable style={styles.checkboxRow} onPress={() => setAccepted((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
            <Text style={styles.checkboxText}>اطلاعات قرارداد را بررسی کرده‌ام و تأیید نهایی آن را می‌پذیرم.</Text>
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>{accepted ? <FigmaSvg uri={ownerAssets.finalCheck} width={12} height={12} /> : null}</View>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <AppButton labelStyle={styles.actionLabel} onPress={() => router.replace("/(owner)/contract-active")}>تأیید نهایی قرارداد</AppButton>
          <AppButton labelStyle={styles.actionLabel} variant="primary" onPress={() => router.back()}>بازگشت به قرارداد</AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 32 },
  hero: { padding: 24, gap: 16, alignItems: "center" },
  checkCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  heroTitle: { width: "100%", color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  heroDescription: { width: "100%", color: "#C8D2D0", fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  content: { padding: 16, gap: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 20 },
  statusValue: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  successText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, writingDirection: "rtl" },
  supporting: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  cardPressable: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  boldValue: { fontFamily: fonts.bold },
  changeLink: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  addressBlock: { gap: 4 },
  address: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  partyBlock: { gap: 4 },
  partyLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  partyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  partyCode: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  partyName: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  divider: { height: 1, backgroundColor: colors.border },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 20 },
  stepText: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  numBox: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(13,59,54,0.15)", alignItems: "center", justifyContent: "center" },
  numText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, minHeight: 20 },
  checkboxText: { flex: 1, color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.page },
  actions: { paddingHorizontal: 16, gap: 7 },
  actionLabel: { fontFamily: fonts.medium },
});
