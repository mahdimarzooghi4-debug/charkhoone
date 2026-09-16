import { Image, StyleSheet, View } from "react-native";
import { figmaAssets } from "@/figmaAssets";

type BrandLogoProps = {
  variant?: "hero" | "header";
};

export function BrandLogo({ variant = "header" }: BrandLogoProps) {
  const hero = variant === "hero";
  return (
    <View style={hero ? styles.hero : styles.header}>
      <Image
        accessibilityLabel="چارخونه"
        resizeMode="contain"
        source={{ uri: hero ? figmaAssets.logoHero : figmaAssets.logoHeader }}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 350 / 152 },
  header: { width: 139, height: 60, alignSelf: "flex-end" },
  image: { width: "100%", height: "100%" },
});
