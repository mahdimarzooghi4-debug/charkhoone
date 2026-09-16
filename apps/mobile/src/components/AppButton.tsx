import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, type PressableProps, type TextStyle } from "react-native";
import { colors, fonts, radii } from "@/theme";

type AppButtonProps = PropsWithChildren<PressableProps & { variant?: "light" | "primary" | "outline"; labelStyle?: TextStyle }>;

export function AppButton({ children, variant = "light", style, labelStyle, ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      <Text style={[styles.label, variant === "primary" ? styles.labelOnPrimary : styles.labelOnLight, labelStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  light: { backgroundColor: colors.page },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.88 },
  label: { fontFamily: fonts.semibold, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
  labelOnLight: { color: colors.primary },
  labelOnPrimary: { color: colors.surface },
});
