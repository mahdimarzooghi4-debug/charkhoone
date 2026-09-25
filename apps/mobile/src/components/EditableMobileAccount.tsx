import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import { getMobileAccount, removeMobileAccountPhoto, updateMobileAccountName, updateMobileAccountPhoto, type MobileAccount } from "@/api/mobileApi";
import { colors, fonts, radii } from "@/theme";

export function EditableMobileAccount() {
  const { status, apiRequest } = useMobileAuth();
  const [account, setAccount] = useState<MobileAccount | null>(null);
  const [name, setName] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    getMobileAccount(apiRequest).then(value => {
      if (active) { setAccount(value); setName(value.preferredName ?? ""); }
    }).catch(() => { if (active) setMessage("دریافت حساب انجام نشد. بعداً دوباره وارد صفحه شوید."); });
    return () => { active = false; };
  }, [apiRequest, status]);

  const saveName = async () => {
    if (name.trim().length < 2 || name.trim().length > 120) { setMessage("نام نمایشی باید بین ۲ تا ۱۲۰ نویسه باشد."); return; }
    setWorking(true); setMessage("");
    try { setAccount(await updateMobileAccountName(apiRequest, name.trim())); setMessage("نام نمایشی ذخیره شد."); }
    catch { setMessage("ذخیره نام انجام نشد. دوباره تلاش کنید."); }
    finally { setWorking(false); }
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.45, base64: true });
      if (result.canceled) return;
      const image = result.assets[0];
      if (!image?.base64) { setMessage("خواندن عکس ممکن نشد."); return; }
      const mimeType = image.mimeType === "image/png" || image.mimeType === "image/webp" ? image.mimeType : "image/jpeg";
      if (image.base64.length > 680_000) { setMessage("حجم عکس زیاد است؛ عکس کوچک‌تری انتخاب کنید."); return; }
      setWorking(true); setMessage("");
      setAccount(await updateMobileAccountPhoto(apiRequest, `data:${mimeType};base64,${image.base64}`));
      setMessage("عکس پروفایل ذخیره شد.");
    } catch { setMessage("ذخیره عکس انجام نشد. دوباره تلاش کنید."); }
    finally { setWorking(false); }
  };

  const deletePhoto = async () => {
    setWorking(true); setMessage("");
    try { setAccount(await removeMobileAccountPhoto(apiRequest)); setMessage("عکس پروفایل حذف شد."); }
    catch { setMessage("حذف عکس انجام نشد."); }
    finally { setWorking(false); }
  };

  return <View style={styles.card}>
    <Text style={styles.title}>اطلاعات قابل ویرایش حساب</Text>
    <View style={styles.avatar}>{account?.avatarDataUrl
      ? <Image source={{ uri: account.avatarDataUrl }} style={styles.avatarImage} accessibilityLabel="عکس پروفایل" />
      : <Text style={styles.avatarInitial}>حساب من</Text>}</View>
    <Pressable accessibilityRole="button" disabled={working || !account} onPress={pickPhoto} style={styles.action}><Text style={styles.actionText}>انتخاب و ذخیره عکس</Text></Pressable>
    {account?.avatarDataUrl ? <Pressable accessibilityRole="button" disabled={working} onPress={deletePhoto} style={styles.action}><Text style={styles.actionText}>حذف عکس</Text></Pressable> : null}
    <Text style={styles.label}>نام نمایشی</Text>
    <TextInput accessibilityLabel="نام نمایشی" value={name} onChangeText={setName} maxLength={120} placeholder="نامی که در حساب نمایش داده می‌شود" style={styles.input} />
    <Pressable accessibilityRole="button" disabled={working || !account} onPress={saveName} style={styles.action}><Text style={styles.actionText}>ذخیره نام</Text></Pressable>
    {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
    <Text style={styles.hint}>نام نمایشی و عکس قابل تغییرند؛ اطلاعات هویتی تأییدشده و شماره تماس از این بخش تغییر نمی‌کنند.</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 10, alignItems: "flex-end" },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, writingDirection: "rtl" },
  avatar: { width: 72, height: 72, backgroundColor: colors.border, borderRadius: 36, overflow: "hidden", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  avatarImage: { width: 72, height: 72 }, avatarInitial: { fontFamily: fonts.medium, color: colors.primary },
  action: { width: "100%", padding: 11, backgroundColor: colors.accentSoft, borderRadius: 10, alignItems: "center" },
  actionText: { fontFamily: fonts.semibold, color: colors.primary, writingDirection: "rtl" },
  label: { fontFamily: fonts.medium, color: colors.text, writingDirection: "rtl" },
  input: { width: "100%", minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, fontFamily: fonts.regular, writingDirection: "rtl", textAlign: "right" },
  message: { fontFamily: fonts.regular, color: colors.primary, writingDirection: "rtl" },
  hint: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11, writingDirection: "rtl", textAlign: "right" },
});
