import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { colors, fonts, radii } from "@/theme";
import { useMockPreview } from "./MockPreviewProvider";

const mobilePattern = /^09[0-9]{9}$/;

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632))
    .replace(/[^0-9]/g, "").slice(0, 11);
}

/**
 * Screens matching Figma tenant login 41:8 and OTP 39:26, but strictly
 * isolated from live OIDC, phone services, and any authentication claims.
 * No SMS is sent; the final button deliberately enters a MOCK walkthrough.
 */
export function MockPreviewAuthScreen({ step }: { step: "login" | "otp" }) {
  const router = useRouter();
  const { demoMobile, setDemoMobile, enterPreview } = useMockPreview();
  const [error, setError] = useState("");
  const otp = step === "otp";

  const next = () => {
    if (!mobilePattern.test(demoMobile)) {
      setError("شماره موبایل نمایشی باید ۱۱ رقم و با ۰۹ آغاز شود.");
      return;
    }
    setError("");
    router.push("/preview/otp");
  };
  const enter = () => {
    // The preview is not an identity provider and never treats these visual
    // OTP boxes as proof of SMS receipt or ownership of a SIM card.
    enterPreview();
    router.replace("/preview/home");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.brand}><BrandLogo /></View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>پیش‌نمایش موبایل چارخونه</Text>
          <Text style={styles.title}>{otp ? "کد تأیید" : "ورود یا ثبت‌نام"}</Text>
          <Text style={styles.description}>
            {otp ? "این صفحه نمایش نمونه مرحله کد تأیید است؛ هیچ پیامک واقعی ارسال نشده است."
              : "برای مشاهده تجربه ورود، یک شماره نمونه وارد کنید. در این پیش‌نمایش پیامکی ارسال نمی‌شود."}
          </Text>
          {otp ? (
            <>
              <Text style={styles.label}>شماره واردشده (فقط در حافظه این پیش‌نمایش)</Text>
              <Text style={styles.displayPhone}>{demoMobile}</Text>
              <View accessibilityLabel="پنج خانه نمایشی کد تأیید؛ غیرفعال" style={styles.otpRow}>
                {Array.from({ length: 5 }, (_, index) => (
                  <View key={index} style={styles.otpBox}><Text style={styles.otpDigit}>•</Text></View>
                ))}
              </View>
              <Text style={styles.notice}>بدون تأیید شماره، بدون تطبیق کد ملی و بدون ایجاد حساب واقعی؛ صرفاً ادامه گردش نمایشی.</Text>
              <Pressable accessibilityRole="button" onPress={enter} style={styles.button}>
                <Text style={styles.buttonText}>ورود به محیط نمایشی (بدون احراز واقعی)</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.replace("/preview/login")} style={styles.link}>
                <Text style={styles.linkText}>ویرایش شماره نمایشی</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>شماره موبایل</Text>
              <TextInput
                accessibilityLabel="شماره موبایل برای گردش نمایشی"
                accessibilityHint="شماره تنها در حافظه این پیش‌نمایش می‌ماند؛ پیامکی ارسال نمی‌شود"
                value={demoMobile}
                onChangeText={value => { setDemoMobile(normalizeDigits(value)); setError(""); }}
                placeholder="۰۹۱۲•••••••"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoComplete="off"
                maxLength={11}
                style={styles.input}
                textAlign="right"
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" onPress={next} style={styles.button}>
                <Text style={styles.buttonText}>مشاهده صفحه کد تأیید (نمونه)</Text>
              </Pressable>
              <Text style={styles.notice}>ورود واقعی در اپ با ارائه‌دهنده امن OIDC انجام می‌شود. کد ملی هنگام ورود درخواست نمی‌شود؛ پیش از اولین استعلام خودنویس تطبیق لازم است.</Text>
            </>
          )}
        </View>
        <Text style={styles.footer}>MOCK — بدون ارسال پیامک، استعلام، ذخیره دائمی شماره یا ایجاد قرارداد و تعهد</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const rtl = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  page: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24, gap: 24 },
  brand: { backgroundColor: colors.surface, alignItems: "flex-end", alignSelf: "stretch", borderRadius: radii.md, paddingHorizontal: 12, minHeight: 66, justifyContent: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderColor: colors.border, borderWidth: 1, padding: 24, gap: 16 },
  eyebrow: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, ...rtl },
  title: { color: colors.primary, fontFamily: fonts.bold, fontSize: 23, ...rtl },
  description: { color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, ...rtl },
  label: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...rtl },
  input: { borderColor: colors.border, borderWidth: 1, minHeight: 52, borderRadius: radii.md, color: colors.text, backgroundColor: colors.surface, paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 18 },
  displayPhone: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 20, ...rtl },
  otpRow: { flexDirection: "row-reverse", gap: 8, justifyContent: "space-between" },
  otpBox: { width: 50, height: 56, borderWidth: 1, borderRadius: radii.md, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  otpDigit: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 23 },
  button: { minHeight: 50, borderRadius: radii.md, backgroundColor: colors.primary, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.surface, fontFamily: fonts.semibold, textAlign: "center", fontSize: 14, writingDirection: "rtl" },
  link: { padding: 10, alignItems: "center" },
  linkText: { fontFamily: fonts.medium, color: colors.primary, fontSize: 14 },
  notice: { backgroundColor: colors.infoSoft, padding: 12, color: colors.text, fontFamily: fonts.regular, fontSize: 12, lineHeight: 21, ...rtl },
  error: { color: "#B91C1C", fontFamily: fonts.medium, fontSize: 12, ...rtl },
  footer: { color: colors.muted, fontFamily: fonts.regular, lineHeight: 20, fontSize: 11, textAlign: "center" },
});
