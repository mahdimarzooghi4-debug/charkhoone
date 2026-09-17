import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { FigmaSvg } from "@/components/FigmaSvg";
import { ownerAssets } from "@/ownerAssets";
import { colors, fonts, radii } from "@/theme";

type OwnerCardProps = PropsWithChildren<{
  title?: string;
  style?: ViewStyle;
  soft?: boolean;
}>;

export function OwnerCard({ title, children, style, soft = false }: OwnerCardProps) {
  return (
    <View style={[styles.card, soft && styles.softCard, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function OwnerRows({ children, gap = 10 }: PropsWithChildren<{ gap?: number }>) {
  return <View style={[styles.rows, { gap }]}>{children}</View>;
}

export function OwnerRow({
  label,
  value,
  valueStyle,
  labelStyle,
}: {
  label: string;
  value: string;
  valueStyle?: TextStyle;
  labelStyle?: TextStyle;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </View>
  );
}

export function OwnerBadge({
  children,
  tone = "success",
  size = "compact",
}: PropsWithChildren<{
  tone?: "success" | "warning" | "neutral" | "danger" | "owner";
  size?: "compact" | "hero";
}>) {
  const hero = size === "hero";
  return (
    <View style={[styles.badge, hero && styles.badgeHero, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, hero && styles.badgeTextHero, styles[`badgeText_${tone}`]]}>{children}</Text>
    </View>
  );
}

export function OwnerBottomNav() {
  const router = useRouter();
  const items = [
    { label: "حساب من", icon: ownerAssets.navUser, active: false, onPress: () => router.push("/(shared)/profile") },
    { label: "قراردادها", icon: ownerAssets.navFileText, active: false, onPress: () => router.push("/(shared)/contracts") },
    { label: "دریافت و پرداخت", icon: ownerAssets.navCreditCardActive, active: true, onPress: () => router.replace("/(owner)/receive-pay") },
    { label: "خانه", icon: ownerAssets.navHome, active: false, onPress: () => router.replace("/(owner)/contract-active") },
  ] as const;

  return (
    <View style={styles.nav}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.navItem} onPress={item.onPress} accessibilityRole="button">
          <FigmaSvg uri={item.icon} width={24} height={24} />
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
  },
  softCard: { backgroundColor: colors.infoSoft, borderColor: "rgba(13,59,54,0.1)" },
  cardTitle: {
    width: "100%",
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rows: { width: "100%" },
  row: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 20 },
  value: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeHero: { paddingHorizontal: 12, paddingVertical: 6 },
  badge_success: { backgroundColor: "#E6F4E6" },
  badge_warning: { backgroundColor: "#FFF3E0" },
  badge_neutral: { backgroundColor: colors.page },
  badge_danger: { backgroundColor: "#F2D9D9" },
  badge_owner: { backgroundColor: "#E5F0F7" },
  badgeText: { fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  badgeTextHero: { fontSize: 12 },
  badgeText_success: { color: colors.primary },
  badgeText_warning: { color: "#D97706" },
  badgeText_neutral: { color: "#6B7280" },
  badgeText_danger: { color: "#B23333" },
  badgeText_owner: { color: "#33598C" },
  nav: {
    minHeight: 58,
    backgroundColor: colors.page,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  navLabelActive: { color: colors.accent },
});
