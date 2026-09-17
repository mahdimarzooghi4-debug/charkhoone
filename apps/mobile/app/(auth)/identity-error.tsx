import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AuthScaffold } from "@/components/AuthScaffold";
import { colors, fonts, radii } from "@/theme";

export default function IdentityErrorScreen() {
  const router = useRouter();
  const [nationalId, setNationalId] = useState("0012345678");

  return (
    <AuthScaffold>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>تأیید هویت</Text>
        <Text style={styles.description}>برای ادامه، کد ملی متعلق به صاحب این شماره موبایل را وارد کنید.</Text>
      </View>
      <View style={styles.mobileRow}>
        <Pressable onPress={() => router.replace("/(auth)/login")}><Text style={styles.edit}>ویرایش</Text></Pressable>
        <Text style={styles.mobile}>شماره موبایل تأییدشده: ۰۹۱۲۱۲۳۴۵۶۷</Text>
      </View>
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>کد ملی</Text>
        <TextInput
          accessibilityLabel="کد ملی"
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={setNationalId}
          value={nationalId}
          style={styles.input}
          textAlign="right"
        />
        <Text style={styles.error}>کد ملی متعلق به صاحب شماره موبایل نمی باشد، لطفا دوباره تلاش کنید.</Text>
      </View>
      <View style={styles.gap32} />
      <AppButton onPress={() => router.push("/(shared)/contract-tracking")}>استعلام و ادامه</AppButton>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  titleGroup: { width: "100%", gap: 12, alignItems: "flex-end", marginTop: 24 },
  title: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  mobileRow: { width: "100%", marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  edit: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, textDecorationLine: "underline", writingDirection: "rtl" },
  mobile: { color: colors.border, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  fieldWrap: { width: "100%", marginTop: 16, gap: 8 },
  label: { width: "100%", color: colors.page, fontFamily: fonts.medium, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  input: { width: "100%", height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.muted, fontFamily: fonts.regular, fontSize: 14, writingDirection: "rtl" },
  error: { width: "100%", color: "#FF383C", fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  gap32: { height: 32 },
});
