import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts } from "@/theme";

type AppHeaderProps = { title: string };

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.wrapper}>
      <BrandLogo />
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={() => router.back()} style={styles.back}>
          <Image source={{ uri: figmaAssets.back }} style={styles.backIcon} resizeMode="contain" />
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
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backIcon: { width: 24, height: 40, transform: [{ rotate: "180deg" }] },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text, textAlign: "right", writingDirection: "rtl" },
});
