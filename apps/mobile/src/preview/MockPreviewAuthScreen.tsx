import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { LegalText } from "@/components/LegalText";
import { colors, fonts, radii } from "@/theme";
import { useMockPreview } from "./MockPreviewProvider";

const mobilePattern = /^09[0-9]{9}$/;

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632))
    .replace(/[^0-9]/g, "").slice(0, 11);
}

function persianDigits(value: string) {
  return value.replace(/[0-9]/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

/**
 * Figma tenant login 41:8 and OTP 39:26, rendered as full-bleed brand green
 * screens using the existing exact Figma logo asset (image 4).
 *
 * No SMS is sent, no OTP is verified, and the user explicitly enters only
 * the isolated MOCK walkthrough. This never authenticates to real services.
 */
export function MockPreviewAuthScreen({ step }: { step: "login" | "otp" }) {
  const router = useRouter();
  const { demoMobile, setDemoMobile, enterPreview } = useMockPreview();
  const [error, setError] = useState("");
  const [otpDigits, setOtpDigits] = useState("");
  const otpInput = useRef<TextInput>(null);
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
    // Deliberate demo-only entry. Typed sample digits never authorize a user.
    enterPreview();
    router.replace("/preview/home");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <BrandLogo variant="hero" />
        {otp ? <View style={styles.otpLogoSpacer} /> : null}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{otp ? "کد تأیید" : "ورود یا ثبت نام"}</Text>
          <Text style={styles.description}>
            {otp
              ? "کد تأیید موبایل را وارد کنید؛ کد ملی هنگام استعلام خودنویس دریافت می‌شود."
              : "برای ورود فقط شماره موبایل و کد تأیید لازم است."}
          </Text>
        </View>

        {otp ? (
          <>
            <View style={styles.gap16} />
            <View style={styles.phoneRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="ویرایش شماره موبایل" onPress={() => router.replace("/preview/login")}>
                <Text style={styles.editLink}>ویرایش شماره موبایل</Text>
              </Pressable>
              <Text style={styles.mobileNumber}>{persianDigits(demoMobile)}</Text>
            </View>
            <View style={styles.gap16} />
            <View style={styles.otpContainer}>
              <View style={styles.digitsRow} accessible={false}>
                {Array.from({ length: 5 }, (_, index) => (
                  <View key={index} style={styles.digitBox}>
                    <Text style={styles.digitText}>{persianDigits(otpDigits[index] ?? "")}</Text>
                  </View>
                ))}
              </View>
              <TextInput
                ref={otpInput}
                accessibilityLabel="وارد کردن پنج رقم نمونه کد تأیید؛ بدون بررسی پیامک"
                accessibilityHint="کد صرفاً در همین پیش‌نمایش نگهداری می‌شود و هیچ تطبیقی انجام نمی‌شود"
                keyboardType="number-pad"
                autoComplete="off"
                maxLength={5}
                value={otpDigits}
                onChangeText={value => setOtpDigits(normalizeDigits(value).slice(0, 5))}
                style={styles.otpCapture}
                caretHidden
              />
            </View>
            <Text style={styles.previewNote}>پیش‌نمایش: هیچ پیامکی ارسال یا بررسی نمی‌شود.</Text>
            <View style={styles.gap32} />
            <Pressable accessibilityRole="button" accessibilityHint="ادامه به محیط MOCK بدون تأیید هویت" onPress={enter} style={styles.cta}>
              <Text style={styles.ctaText}>تأیید و ادامه</Text>
            </Pressable>
            <View style={styles.gap20} />
            <Text style={styles.countdown}>ارسال مجدد کد در نسخه نمایشی غیرفعال است</Text>
          </>
        ) : (
          <>
            <View style={styles.inputWrapper}>
              <TextInput
                accessibilityLabel="شماره موبایل برای گردش نمایشی"
                accessibilityHint="شماره فقط در حافظه این پیش‌نمایش می‌ماند؛ پیامکی ارسال نمی‌شود"
                value={persianDigits(demoMobile)}
                onChangeText={value => { setDemoMobile(normalizeDigits(value)); setError(""); }}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoComplete="off"
                maxLength={11}
                style={styles.mobileInput}
                textAlign="right"
              />
              <Text style={styles.inputHelper}>پیش‌نمایش: پیامکی ارسال نمی‌شود.</Text>
            </View>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <View style={styles.gap32} />
            <Pressable accessibilityRole="button" accessibilityHint="مشاهده نمونه صفحه کد تأیید، بدون ارسال پیامک" onPress={next} style={styles.cta}>
              <Text style={styles.ctaText}>دریافت کد تأیید</Text>
            </Pressable>
            <View style={styles.gap20} />
          </>
        )}

        <View style={styles.grow} />
        <LegalText />
      </ScrollView>
    </SafeAreaView>
  );
}

const rtl = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  page: { flexGrow: 1, backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, alignItems: "flex-end" },
  otpLogoSpacer: { height: 24, width: "100%" },
  titleGroup: { width: "100%", gap: 12, alignItems: "flex-end" },
  title: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, ...rtl },
  description: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, ...rtl },
  inputWrapper: { width: "100%", gap: 8 },
  mobileInput: { width: "100%", height: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 16, fontFamily: fonts.regular, fontSize: 14, color: colors.text, ...rtl },
  inputHelper: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, ...rtl },
  error: { width: "100%", color: "#FCA5A5", fontFamily: fonts.medium, fontSize: 12, lineHeight: 20, ...rtl },
  gap16: { width: "100%", height: 16 },
  gap20: { width: "100%", height: 20 },
  gap32: { width: "100%", height: 32 },
  phoneRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 },
  editLink: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, textDecorationLine: "underline", ...rtl },
  mobileNumber: { color: colors.page, fontFamily: fonts.medium, fontSize: 14, ...rtl },
  otpContainer: { width: "100%", minHeight: 56, justifyContent: "center", alignItems: "center", position: "relative" },
  digitsRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  digitBox: { height: 56, width: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  digitText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 20 },
  otpCapture: { position: "absolute", height: 56, width: 288, opacity: 0.01, color: "transparent", textAlign: "center" },
  previewNote: { width: "100%", paddingTop: 12, color: colors.border, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "center", writingDirection: "rtl" },
  cta: { width: "100%", height: 48, borderRadius: radii.md, backgroundColor: colors.page, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  ctaText: { color: colors.primary, fontFamily: fonts.medium, textAlign: "center", fontSize: 14, writingDirection: "rtl" },
  countdown: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", writingDirection: "rtl" },
  grow: { width: "100%", flex: 1, minHeight: 24 },
});