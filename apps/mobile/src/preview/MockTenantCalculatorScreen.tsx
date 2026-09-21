import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";
import { clampMockAmount, formatMockNumber, parseMockAmount, MOCK_CASH_DEPOSIT_MAX, MOCK_CASH_DEPOSIT_STEP, MOCK_MONTHLY_RENT_MAX, MOCK_MONTHLY_RENT_STEP } from "./mockTenantData";
import { useMockPreview } from "./MockPreviewProvider";

/**
 * Figma "Calculator / Manual Estimate" (65:55) for the isolated tenant MOCK.
 * The Figma figure of 18.5m is a stale visual fixture; C3-approved interest-only
 * amount starts at 6,708,333 toman. Local inputs calculate without bank calls.
 */
function PreviewAmount({ label, value, maximum, step, limit, onChange }: {
  label: string;
  value: number;
  maximum: number;
  step: number;
  limit: string;
  onChange: (amount: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(240);
  const [editing, setEditing] = useState<string | null>(null);
  const progress = maximum > 0 ? value / maximum : 0;
  const percentage = `${progress * 100}%` as `${number}%`;

  const commit = () => {
    if (editing !== null) onChange(clampMockAmount(parseMockAmount(editing), maximum));
    setEditing(null);
  };
  const moveTo = (locationX: number) => {
    if (!Number.isFinite(locationX) || trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const next = Math.round(ratio * maximum / step) * step;
    onChange(clampMockAmount(next, maximum));
  };

  return (
    <View style={styles.amountGroup}>
      <Text style={styles.amountLabel}>{label}</Text>
      <View style={styles.amountValueRow}>
        <Text style={styles.currency}>تومان</Text>
        <TextInput
          accessibilityLabel={`${label} به تومان`}
          keyboardType="number-pad"
          selectTextOnFocus
          value={editing === null ? formatMockNumber(value) : editing}
          onFocus={() => setEditing(String(value))}
          onChangeText={setEditing}
          onBlur={commit}
          onSubmitEditing={commit}
          style={styles.amountValue}
        />
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: maximum, now: value }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={event => onChange(clampMockAmount(value + (event.nativeEvent.actionName === "increment" ? step : -step), maximum))}
        onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={event => moveTo(event.nativeEvent.locationX)}
        onResponderMove={event => moveTo(event.nativeEvent.locationX)}
        style={styles.sliderTrack}
      >
        {/* Keep the base, fill and thumb on the same 19px center line. */}
        <View pointerEvents="none" style={styles.sliderBase} />
        <View pointerEvents="none" style={[styles.sliderFill, { width: percentage }]} />
        <View pointerEvents="none" style={[styles.sliderThumb, { left: `${progress * 100}%` as `${number}%` }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLimit}>۰</Text>
        <Text style={styles.sliderLimit}>{limit}</Text>
      </View>
      <View style={styles.adjustRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`افزایش ${label}`} onPress={() => onChange(clampMockAmount(value + step, maximum))} style={styles.adjustButton}><Text style={styles.adjustText}>+ افزایش</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`کاهش ${label}`} onPress={() => onChange(clampMockAmount(value - step, maximum))} style={styles.adjustButton}><Text style={styles.adjustText}>− کاهش</Text></Pressable>
      </View>
    </View>
  );
}

export function MockTenantCalculatorScreen() {
  const router = useRouter();
  const { cashDeposit, monthlyRent, setCashDeposit, setMonthlyRent, financialModel } = useMockPreview();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brand}><BrandLogo /></View>
      <View style={styles.appBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="بازگشت به خانه مستأجر" onPress={() => router.replace("/preview/home")} style={styles.back}><View pointerEvents="none" style={styles.backIcon}><FigmaSvg uri={figmaAssets.back} width={24} height={40} /></View></Pressable>
        <Text style={styles.appBarTitle}>محاسبه شرایط</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>شرایط قرارداد را وارد کنید</Text>
        <Text style={styles.intro}>با وارد کردن مبلغ رهن و اجاره، محدوده تقریبی قابل تأمین را مشاهده کنید.</Text>
        <View style={styles.card}>
          <PreviewAmount label="مبلغ رهن" value={cashDeposit} maximum={MOCK_CASH_DEPOSIT_MAX} step={MOCK_CASH_DEPOSIT_STEP} limit="۲ میلیارد" onChange={setCashDeposit} />
          <View style={styles.divider} />
          <PreviewAmount label="اجاره ماهانه" value={monthlyRent} maximum={MOCK_MONTHLY_RENT_MAX} step={MOCK_MONTHLY_RENT_STEP} limit="۱۰۰ میلیون" onChange={setMonthlyRent} />
        </View>
        <View style={styles.estimate}>
          <Text style={styles.estimateTitle}>پرداخت ماهانه تقریبی شما (فقط سود)</Text>
          <Text style={styles.estimateValue}>{financialModel.monthlyInterest}</Text>
          <Text style={styles.estimateCaption}>برآورد C3 با نرخ اسمی سالانه {financialModel.annualRate}؛ بازپرداخت اصل، مطابق قرارداد نهایی بانک خواهد بود.</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>برآورد اولیه</Text>
          <Text style={styles.infoText}>پس از محاسبه، محدوده قابل تأمین، شرایط مالی و آورده نمونه برای شما نمایش داده می‌شود.</Text>
          <Text style={styles.mockNotice}>MOCK: رهن و اجاره را با لمس یا کشیدن اسلایدر، دکمه‌های کم‌وزیاد یا ورود عدد تغییر دهید. استعلام بانک و پرداخت واقعی انجام نمی‌شود.</Text>
        </View>
        <View style={styles.grow} />
        <Link href="/preview/calculator-result" style={styles.cta}>محاسبه شرایط</Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const rtl = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  brand: { height: 60, alignItems: "flex-end", paddingHorizontal: 16 },
  appBar: { height: 56, paddingHorizontal: 16, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 44, alignItems: "center", justifyContent: "center" },
  backIcon: { width: 24, height: 40, transform: [{ rotate: "180deg" }] },
  appBarTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, ...rtl },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
  heading: { color: colors.surface, fontFamily: fonts.bold, fontSize: 18, ...rtl },
  intro: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, ...rtl },
  card: { marginTop: 4, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 20, gap: 16 },
  amountGroup: { width: "100%", gap: 12, alignItems: "flex-end" },
  amountLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, ...rtl },
  amountValueRow: { width: "100%", flexDirection: "row", alignItems: "baseline", justifyContent: "flex-end", gap: 8 },
  currency: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, ...rtl },
  amountValue: { minWidth: 155, color: colors.primary, fontFamily: fonts.bold, fontSize: 25, padding: 0, ...rtl },
  sliderTrack: { position: "relative", height: 38, width: "100%", overflow: "visible" },
  sliderBase: { position: "absolute", top: 17, left: 0, right: 0, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  sliderFill: { position: "absolute", top: 17, left: 0, height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  sliderThumb: { position: "absolute", top: 10, height: 18, width: 18, marginLeft: -9, borderRadius: 9, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.surface },
  sliderLabels: { width: "100%", flexDirection: "row", justifyContent: "space-between" },
  sliderLimit: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, ...rtl },
  adjustRow: { width: "100%", flexDirection: "row", gap: 8 },
  adjustButton: { flex: 1, minHeight: 42, borderRadius: 8, backgroundColor: colors.page, alignItems: "center", justifyContent: "center" },
  adjustText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, textAlign: "center" },
  divider: { height: 1, backgroundColor: colors.border },
  estimate: { borderRadius: radii.md, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface, padding: 14, gap: 6, alignItems: "flex-end" },
  estimateTitle: { width: "100%", color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, ...rtl },
  estimateValue: { width: "100%", color: colors.primary, fontFamily: fonts.bold, fontSize: 20, ...rtl },
  estimateCaption: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, ...rtl },
  info: { marginTop: 8, gap: 6, alignItems: "flex-end" },
  infoTitle: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 14, ...rtl },
  infoText: { width: "100%", color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...rtl },
  mockNotice: { width: "100%", marginTop: 4, color: "#FAD39C", fontFamily: fonts.regular, fontSize: 10, lineHeight: 17, ...rtl },
  grow: { flexGrow: 1, minHeight: 6 },
  cta: { height: 48, lineHeight: 48, borderRadius: radii.md, backgroundColor: colors.page, color: colors.primary, fontFamily: fonts.semibold, fontSize: 15, textAlign: "center", textDecorationLine: "none" },
});
