import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

function Party({ name, role, pending }: { name: string; role: string; pending?: boolean }) {
  return (
    <View style={styles.party}>
      <View style={styles.partyStatus}><Text style={[styles.partyStatusText, pending && styles.pendingText]}>{pending ? "در انتظار تأیید" : "تأیید شده"}</Text><View style={[styles.partyIconWrap, pending && styles.partyIconPending]}><FigmaSvg uri={pending ? figmaAssets.finalPartyClock : figmaAssets.finalPartyCheck} width={10} height={10} /></View></View>
      <View style={styles.partyInfo}><Text style={styles.partyName}>{name}</Text><Text style={styles.partyRole}>{role}</Text></View>
    </View>
  );
}

export default function FinalConfirmationScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="وضعیت درخواست" />
        <View style={styles.hero}>
          <View style={styles.circle}><FigmaSvg uri={figmaAssets.finalCheck} width={24} height={24} /></View>
          <Text style={styles.heroTitle}>پرداخت آورده با موفقیت انجام شد</Text>
          <Text style={styles.heroText}>برای ادامه فرایند، تأیید نهایی طرفین قرارداد لازم است.</Text>
          <View style={styles.statusBadge}><Text style={styles.statusText}>آورده پرداخت شد</Text></View>
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>جزئیات پرداخت</Text><Row label="مبلغ پرداخت‌شده" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" /><Row label="وضعیت" value="پرداخت موفق" /><Row label="تاریخ پرداخت" value="۱۲ شهریور ۱۴۰۵" /><Row label="شماره پیگیری" value="۱۲۳۴۵۶۷۸۹" /></View>
        <View style={styles.card}><Text style={styles.cardTitle}>تأیید نهایی طرفین</Text><Party name="علی رضایی" role="مستأجر" /><Party name="محمد رضایی" role="مالک" pending /></View>

        <View style={styles.stepCard}>
          <View style={styles.stepper}>
            <View style={styles.step}><FigmaSvg uri={figmaAssets.finalStepIdle} width={24} height={24} /><Text style={styles.idleStep}>فعال‌سازی</Text></View>
            <View style={styles.lineIdle} />
            <View style={styles.step}><FigmaSvg uri={figmaAssets.finalStepCurrent} width={24} height={24} /><Text style={styles.currentStep}>تأیید طرفین</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>پرداخت آورده</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>تأیید بانک</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>ثبت درخواست</Text></View>
          </View>
        </View>

        <View style={[styles.card, styles.infoCard]}><Text style={styles.infoTitle}>در انتظار تأیید مالک</Text><Text style={styles.infoText}>پس از تکمیل تأیید نهایی طرفین، فرایند مالی قرارداد طبق مسیر تعیین‌شده ادامه پیدا می‌کند.</Text><Text style={styles.infoNote}>نتیجه تغییر وضعیت از طریق چارخونه به شما اطلاع داده می‌شود.</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>قرارداد مرتبط</Text><Row label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><Row label="ملک" value="تهران، سعادت‌آباد" /></View>
        <View style={styles.actions}><AppButton onPress={() => router.replace("/(tenant)/home")}>بازگشت به خانه</AppButton><AppButton variant="outline" onPress={() => router.push("/(tenant)/contract-active")}>مشاهده جزئیات قرارداد</AppButton></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 32, gap: 16 },
  hero: { marginHorizontal: 16, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12, alignItems: "center", gap: 12 },
  circle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  heroTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  heroText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  statusBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  value: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  party: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: radii.sm, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  partyStatus: { flexDirection: "row", alignItems: "center", gap: 8 },
  partyStatusText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" },
  pendingText: { color: colors.accent },
  partyIconWrap: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" },
  partyIconPending: { backgroundColor: "#FFF3E0" },
  partyInfo: { alignItems: "flex-end", gap: 2 },
  partyName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  partyRole: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  stepCard: { marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16 },
  stepper: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  step: { flex: 1, alignItems: "center", gap: 6 },
  idleStep: { color: colors.muted, fontFamily: fonts.regular, fontSize: 9, textAlign: "center", writingDirection: "rtl" },
  currentStep: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 9, textAlign: "center", writingDirection: "rtl" },
  doneStep: { color: colors.primary, fontFamily: fonts.regular, fontSize: 9, textAlign: "center", writingDirection: "rtl" },
  lineIdle: { width: 12, height: 2, backgroundColor: colors.border, marginTop: 11 },
  lineDone: { width: 12, height: 2, backgroundColor: colors.primary, marginTop: 11 },
  doneCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  doneCheck: { color: colors.surface, fontFamily: fonts.bold, fontSize: 12 },
  infoCard: { backgroundColor: colors.infoSoft, borderColor: colors.primary },
  infoTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  infoText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  infoNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  actions: { marginHorizontal: 16, gap: 16 },
});
