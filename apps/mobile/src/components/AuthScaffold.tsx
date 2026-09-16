import type { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { LegalText } from "@/components/LegalText";
import { colors } from "@/theme";

type AuthScaffoldProps = PropsWithChildren<{ footer?: ReactNode }>;

export function AuthScaffold({ children, footer }: AuthScaffoldProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.content}>
          <BrandLogo variant="hero" />
          {children}
          <View style={styles.spacer} />
          {footer ?? <LegalText />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  keyboard: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, alignItems: "flex-end" },
  spacer: { flex: 1, minHeight: 24 },
});
