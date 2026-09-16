import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts } from "@/theme";

export default function ProfilePhotoSheetScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>تصویر پروفایل</Text>
        <View style={styles.spacer} />
        <Pressable style={styles.action}><Text style={styles.select}>انتخاب تصویر جدید</Text></Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.action}><Text style={styles.delete}>حذف تصویر</Text></Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.action} onPress={() => router.back()}><Text style={styles.cancel}>انصراف</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D9D9D9", alignSelf: "center" },
  title: { color: "#1A1A1A", fontFamily: fonts.semibold, fontSize: 18, textAlign: "right", writingDirection: "rtl", marginTop: 4 },
  spacer: { height: 20 },
  action: { height: 32, justifyContent: "center" },
  select: { color: "#266B54", fontFamily: fonts.medium, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  delete: { color: "#D93333", fontFamily: fonts.medium, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  cancel: { color: "#666666", fontFamily: fonts.regular, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  divider: { height: 1, backgroundColor: "#EBEBEB" },
});
