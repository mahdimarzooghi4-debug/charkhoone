import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import { colors, fonts, radii } from "@/theme";

export default function SignOutScreen() {
  const router = useRouter();
  const { signOut } = useMobileAuth();
  const [working, setWorking] = useState(false);

  const confirm = async () => {
    setWorking(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } finally {
      setWorking(false);
    }
  };

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>خروج از حساب</Text>
        <Text style={styles.description}>
          session امن ذخیره‌شده روی این دستگاه حذف می‌شود. این عمل به‌تنهایی ادعای revoke شدن token در provider را ندارد.
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.cancel} onPress={() => router.back()} disabled={working}>
            <Text style={styles.cancelText}>انصراف</Text>
          </Pressable>
          <Pressable style={styles.signOut} onPress={confirm} disabled={working}>
            <Text style={styles.signOutText}>{working ? "در حال خروج..." : "خروج از حساب"}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  modal: { width: "100%", backgroundColor: colors.surface, borderRadius: 24, padding: 24, gap: 20 },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  actions: { flexDirection: "row", gap: 12 },
  cancel: { flex: 1, height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  signOut: { flex: 1, height: 48, borderRadius: radii.md, backgroundColor: "#D93333", alignItems: "center", justifyContent: "center" },
  signOutText: { color: colors.surface, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
});
