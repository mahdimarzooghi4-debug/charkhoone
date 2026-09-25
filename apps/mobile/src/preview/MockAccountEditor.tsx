import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, fonts } from "@/theme";
import { useMockPreview } from "./MockPreviewProvider";

export function MockAccountEditor() {
  const { displayName, setDisplayName, photoUri, setPhotoUri } = useMockPreview();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.45 });
    if (!result.canceled && result.assets[0]?.uri) setPhotoUri(result.assets[0].uri);
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="ویرایش نام و عکس نمایشی" onPress={() => { setDraft(displayName); setOpen(true); }} style={styles.open}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.avatar} /> : <View style={styles.placeholder}><Text style={styles.initial}>{displayName.slice(0, 1)}</Text></View>}
      <Text style={styles.link}>ویرایش نام و عکس نمونه</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><View style={styles.sheet}>
        <Text style={styles.title}>ویرایش حساب نمایشی</Text>
        <Text style={styles.note}>تغییرات فقط در این جلسهٔ پیش‌نمایش دیده می‌شوند و در حساب واقعی ذخیره نمی‌شوند.</Text>
        <Pressable accessibilityRole="button" onPress={() => void choosePhoto()} style={styles.action}><Text style={styles.actionText}>انتخاب عکس از دستگاه</Text></Pressable>
        {photoUri && <Pressable accessibilityRole="button" onPress={() => setPhotoUri(null)}><Text style={styles.link}>حذف عکس نمونه</Text></Pressable>}
        <TextInput accessibilityLabel="نام نمایشی" value={draft} onChangeText={setDraft} maxLength={80} style={styles.input} placeholder="نام نمایشی" />
        <Pressable accessibilityRole="button" onPress={() => { if (draft.trim()) setDisplayName(draft.trim()); setOpen(false); }} style={styles.action}><Text style={styles.actionText}>ذخیره در پیش‌نمایش</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setOpen(false)}><Text style={styles.link}>بستن</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  open: { alignItems: "center", gap: 8 }, avatar: { width: 72, height: 72, borderRadius: 36 }, placeholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }, initial: { color: colors.primary, fontFamily: fonts.bold, fontSize: 26 },
  link: { color: colors.primary, fontFamily: fonts.semibold, textAlign: "center", writingDirection: "rtl" }, overlay: { flex: 1, justifyContent: "center", backgroundColor: "#0009", padding: 16 }, sheet: { borderRadius: 18, backgroundColor: colors.surface, padding: 20, gap: 16 }, title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, textAlign: "right" }, note: { color: colors.muted, fontFamily: fonts.regular, textAlign: "right", writingDirection: "rtl" }, input: { borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, color: colors.text, textAlign: "right" }, action: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: "center" }, actionText: { color: "white", fontFamily: fonts.semibold },
});
