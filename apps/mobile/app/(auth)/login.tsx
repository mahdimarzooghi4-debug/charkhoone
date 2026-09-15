import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextField } from "@/components/AppTextField";
import { AuthScaffold } from "@/components/AuthScaffold";
import { colors, fonts } from "@/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState("09121234567");

  return (
    <AuthScaffold>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>ورود یا ثبت نام</Text>
        <Text style={styles.description}>شماره موبایل خودرا وارد کنید.</Text>
      </View>
      <AppTextField
        accessibilityLabel="شماره موبایل"
        keyboardType="phone-pad"
        maxLength={11}
        onChangeText={setMobile}
        value={mobile}
      />
      <View style={styles.gap32} />
      <AppButton onPress={() => router.push("/(auth)/otp")}>دریافت کد تأیید</AppButton>
      <View style={styles.gap20} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  titleGroup: { width: "100%", gap: 12, alignItems: "flex-end" },
  title: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  gap32: { height: 32 },
  gap20: { height: 20 },
});
