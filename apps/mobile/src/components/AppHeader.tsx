import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts } from "@/theme";

type AppHeaderProps = { title: string; bordered?: boolean };

export function AppHeader({ title, bordered = false }: AppHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.wrapper}>
      <BrandLogo />
      <View style={[styles.bar, bordered && styles.barBordered]}>
        <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={() => router.back()} style={styles.back}>
          <View style={styles.backIcon}><FigmaSvg uri={figmaAssets.back} width={24} height={40} /></View>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  bar: {
    width: "100%",
    height: 56,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barBordered: { borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backIcon: { width: 24, height: 40, transform: [{ rotate: "180deg" }] },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text, textAlign: "right", writingDirection: "rtl" },
});
