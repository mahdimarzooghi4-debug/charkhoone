import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextField } from "@/components/AppTextField";
import { AuthScaffold } from "@/components/AuthScaffold";
import { colors, fonts } from "@/theme";

export default function IdentityScreen() {
  const router = useRouter();
  const [nationalId, setNationalId] = useState("0012345678");

  return (
    <AuthScaffold>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>تأیید هویت</Text>
        <Text style={styles.description}>برای ادامه، کد ملی متعلق به صاحب این شماره موبایل را وارد کنید.</Text>
      </View>
      <View style={styles.mobileRow}>
        <Pressable onPress={() => router.back()}><Text style={styles.edit}>ویرایش</Text></Pressable>
        <Text style={styles.mobile}>شماره موبایل تأییدشده: ۰۹۱۲۱۲۳۴۵۶۷</Text>
      </View>
      <View style={styles.fieldWrap}>
        <AppTextField
          dark
          label="کد ملی"
          helper="کد ملی باید متعلق به صاحب شماره موبایل تأییدشده باشد."
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={setNationalId}
          value={nationalId}
        />
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
  mobile: { color: colors.border, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  fieldWrap: { width: "100%", marginTop: 16 },
  gap32: { height: 32 },
});
