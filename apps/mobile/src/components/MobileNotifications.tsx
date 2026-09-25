import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { MobileBootstrapResponse } from "@/api/mobileApi";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts } from "@/theme";

export type Notice = { id: string; title: string; detail: string; date: string };

export function noticesFromBootstrap(data: MobileBootstrapResponse | null): Notice[] {
  if (!data) return [];
  const notices: Notice[] = [];
  const application = data.latestCreditApplication;
  if (application) notices.push({ id: `application:${application.creditApplicationId}:${application.status}:${application.updatedAtUtc}`, title: "وضعیت درخواست تأمین مالی", detail: `وضعیت فعلی: ${application.status}`, date: application.updatedAtUtc });
  for (const contract of data.contracts) notices.push({ id: `contract:${contract.contractId}:${contract.status}:${contract.updatedAtUtc}`, title: "وضعیت قرارداد", detail: `وضعیت فعلی: ${contract.status}`, date: contract.updatedAtUtc });
  for (const payment of data.payments) notices.push({ id: `payment:${payment.paymentInstructionId}:${payment.status}:${payment.updatedAtUtc}`, title: "وضعیت پرداخت", detail: `وضعیت فعلی: ${payment.status} • ماه ${payment.contractMonthNumber.toLocaleString("fa-IR")}`, date: payment.updatedAtUtc });
  return notices.sort((a, b) => b.date.localeCompare(a.date));
}

async function readSeen(key: string): Promise<string[]> {
  try {
    const raw = Platform.OS === "web" ? globalThis.localStorage?.getItem(key) : await SecureStore.getItemAsync(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

async function saveSeen(key: string, ids: string[]) {
  try {
    const value = JSON.stringify(ids.slice(0, 200));
    if (Platform.OS === "web") globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch { /* Read state is optional when device storage is unavailable. */ }
}

export function MobileNotifications({ data, preview = false, previewNotices = [], previewSeen = [], onPreviewRead }: { data: MobileBootstrapResponse | null; preview?: boolean; previewNotices?: Notice[]; previewSeen?: string[]; onPreviewRead?: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[] | null>(null);
  const key = `charkhoone.mobile.notices.${data?.userId ?? "anonymous"}`;
  const realNotices = useMemo(() => noticesFromBootstrap(data), [data]);
  const notices = preview ? previewNotices : realNotices;

  useEffect(() => {
    let active = true;
    setSeen(null);
    if (preview || !data) return;
    readSeen(key).then(ids => { if (active) setSeen(ids); });
    return () => { active = false; };
  }, [data?.userId, key, preview]);

  const unread = preview ? notices.filter(item => !previewSeen.includes(item.id)).length : seen === null ? 0 : notices.filter(item => !seen.includes(item.id)).length;
  const markRead = () => {
    if (preview) { onPreviewRead?.([...new Set([...previewSeen, ...notices.map(item => item.id)])]); return; }
    if (!data || seen === null) return;
    const ids = [...new Set([...notices.map(item => item.id), ...seen])];
    setSeen(ids);
    void saveSeen(key, ids);
  };

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={unread ? `اعلان‌ها، ${unread.toLocaleString("fa-IR")} خوانده‌نشده` : "اعلان‌ها"} onPress={() => setOpen(true)} style={styles.bell}>
      <FigmaSvg uri={figmaAssets.bell} width={20} height={20} />
      {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}</Text></View>}
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><View style={styles.sheet}>
        <View style={styles.heading}><Pressable accessibilityRole="button" accessibilityLabel="بستن اعلان‌ها" onPress={() => setOpen(false)}><Text style={styles.close}>✕</Text></Pressable><Text style={styles.title}>اعلان‌ها</Text></View>
        <ScrollView contentContainerStyle={styles.list}>
          {preview && <Text style={styles.hint}>اعلان‌های نمونه؛ هیچ پیام واقعی یا اعلان فوری ارسال نشده است.</Text>}
          {!preview && !data ? <Text style={styles.empty}>در حال دریافت وضعیت حساب...</Text>
            : notices.length === 0 ? <Text style={styles.empty}>اعلانی برای این حساب ثبت نشده است.</Text>
            : notices.map(item => <View key={item.id} style={styles.item}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text><Text style={styles.date}>{preview ? item.date : new Date(item.date).toLocaleString("fa-IR")}</Text></View>)}
        </ScrollView>
        {unread > 0 && <Pressable accessibilityRole="button" onPress={markRead} style={styles.readButton}><Text style={styles.readText}>علامت‌گذاری همه به‌عنوان خوانده‌شده</Text></Pressable>}
        {!preview && <Text style={styles.hint}>این فهرست از وضعیت فعلی درخواست، قرارداد و پرداخت حساب شما ساخته می‌شود. اعلان فوری و پوش هنوز فعال نیست.</Text>}
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  bell: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 0, right: 0, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  badgeText: { color: "white", fontFamily: fonts.bold, fontSize: 10 },
  overlay: { flex: 1, justifyContent: "center", backgroundColor: "#0009", padding: 16 },
  sheet: { maxHeight: "80%", borderRadius: 18, backgroundColor: colors.surface, padding: 18, gap: 16 },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 19, writingDirection: "rtl" },
  close: { color: colors.muted, fontSize: 20, padding: 4 },
  list: { gap: 10 },
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 6, alignItems: "flex-end" },
  itemTitle: { fontFamily: fonts.semibold, color: colors.text, writingDirection: "rtl" },
  detail: { fontFamily: fonts.regular, color: colors.text, writingDirection: "rtl" },
  date: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11 },
  empty: { fontFamily: fonts.regular, color: colors.muted, textAlign: "center", writingDirection: "rtl", padding: 24 },
  readButton: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: "center" },
  readText: { fontFamily: fonts.semibold, color: "white", writingDirection: "rtl" },
  hint: { fontFamily: fonts.regular, color: colors.muted, textAlign: "right", writingDirection: "rtl", fontSize: 11 },
});
