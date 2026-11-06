import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { colors, fonts, radii } from "@/theme";

type LegalDocumentKind = "terms" | "privacy";

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocument = {
  title: string;
  updated: string;
  sections: LegalSection[];
};

const documents: Record<LegalDocumentKind, LegalDocument> = {
  terms: {
    title: "قوانین و مقررات استفاده از چارخونه",
    updated: "آخرین به‌روزرسانی: مهر ۱۴۰۵",
    sections: [
      {
        heading: "۱. دامنه استفاده",
        paragraphs: [
          "استفاده از وب‌سایت، پنل‌ها و خدمات چارخونه به معنی پذیرش این شرایط و همچنین شرایط اختصاصی هر خدمت است.",
        ],
      },
      {
        heading: "۲. حساب کاربری و اطلاعات",
        bullets: [
          "کاربر مسئول صحت اطلاعاتی است که برای ثبت‌نام، احراز هویت و دریافت خدمت ارائه می‌کند.",
          "حفظ محرمانگی اطلاعات ورود و جلوگیری از استفاده غیرمجاز از حساب بر عهده صاحب حساب است.",
          "در صورت مشاهده فعالیت مشکوک، موضوع باید در اولین فرصت به چارخونه اعلام شود.",
        ],
      },
      {
        heading: "۳. استفاده مجاز",
        paragraphs: [
          "استفاده از خدمات برای تقلب، جعل اطلاعات، دسترسی غیرمجاز، اختلال در سامانه یا هر فعالیت مغایر قوانین جاری مجاز نیست.",
        ],
      },
      {
        heading: "۴. خدمات مالی و قراردادها",
        paragraphs: [
          "جزئیات اعتبار، تسهیلات، پرداخت، کارمزد و تعهدات طرفین در قرارداد یا شرایط اختصاصی همان خدمت مشخص می‌شود. در صورت تعارض، متن قرارداد اختصاصی خدمت ملاک خواهد بود.",
        ],
      },
      {
        heading: "۵. تغییرات خدمات و شرایط",
        paragraphs: [
          "چارخونه ممکن است برای بهبود خدمات یا رعایت الزامات قانونی، بخش‌هایی از سامانه یا این شرایط را به‌روزرسانی کند. نسخه جاری همواره در همین صفحه منتشر می‌شود.",
        ],
      },
      {
        heading: "۶. تماس",
        paragraphs: [
          "برای پرسش‌های مربوط به این شرایط با info@char-khoone.ir یا شماره ۰۲۱۶۶۴۸۵۳۷۴ تماس بگیرید.",
        ],
      },
    ],
  },
  privacy: {
    title: "حریم خصوصی",
    updated: "آخرین به‌روزرسانی: مهر ۱۴۰۵",
    sections: [
      {
        heading: "۱. اطلاعاتی که دریافت می‌شود",
        paragraphs: [
          "بسته به نوع خدمت، اطلاعاتی مانند مشخصات هویتی و تماس، اطلاعات قرارداد و درخواست، سوابق فرآیندی و داده‌های فنی لازم برای ارائه امن و صحیح خدمت دریافت می‌شود.",
        ],
      },
      {
        heading: "۲. هدف استفاده از اطلاعات",
        bullets: [
          "ایجاد و مدیریت حساب کاربری و احراز هویت.",
          "بررسی و پردازش درخواست‌ها و ارائه خدمات مرتبط با چارخونه.",
          "پیشگیری از سوءاستفاده، تقلب و دسترسی غیرمجاز.",
          "پشتیبانی، اطلاع‌رسانی و بهبود کیفیت خدمات.",
        ],
      },
      {
        heading: "۳. اشتراک‌گذاری اطلاعات",
        paragraphs: [
          "اطلاعات فقط در حد لازم برای ارائه خدمت، اجرای تعهدات قراردادی یا رعایت الزامات قانونی با ارائه‌دهندگان خدمت و شرکای مرتبط به اشتراک گذاشته می‌شود.",
        ],
      },
      {
        heading: "۴. امنیت و نگهداری",
        paragraphs: [
          "چارخونه برای حفاظت از اطلاعات از کنترل‌های فنی و سازمانی متناسب استفاده می‌کند و اطلاعات را فقط تا زمانی که برای ارائه خدمت، الزامات قراردادی یا تکالیف قانونی لازم باشد نگهداری می‌کند.",
        ],
      },
      {
        heading: "۵. درخواست‌های مرتبط با اطلاعات شخصی",
        paragraphs: [
          "کاربران می‌توانند برای پرسش درباره اطلاعات ثبت‌شده یا درخواست بررسی و اصلاح اطلاعات خود از راه‌های تماس رسمی چارخونه اقدام کنند؛ رسیدگی به درخواست‌ها تابع الزامات قانونی و قراردادی خواهد بود.",
        ],
      },
      {
        heading: "۶. تماس",
        paragraphs: [
          "برای موضوعات مرتبط با حریم خصوصی با info@char-khoone.ir یا شماره ۰۲۱۶۶۴۸۵۳۷۴ تماس بگیرید.",
        ],
      },
    ],
  },
};

export function LegalDocumentScreen({ document }: { document: LegalDocumentKind }) {
  const router = useRouter();
  const content = documents[document];

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BrandLogo variant="header" />
        <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={goBack} hitSlop={12}>
          <Text style={styles.back}>بازگشت</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" style={styles.title}>{content.title}</Text>
        <Text style={styles.updated}>{content.updated}</Text>
        {content.sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{section.heading}</Text>
            {section.paragraphs?.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>{paragraph}</Text>
            ))}
            {section.bullets?.map((bullet, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { color: colors.page, fontFamily: fonts.medium, fontSize: 13 },
  scroll: {
    flex: 1,
    backgroundColor: colors.page,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 20 },
  title: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 30,
    textAlign: "right",
    writingDirection: "rtl",
  },
  updated: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
    writingDirection: "rtl",
  },
  section: { width: "100%", gap: 8 },
  sectionTitle: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
    writingDirection: "rtl",
  },
  paragraph: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 24,
    textAlign: "right",
    writingDirection: "rtl",
  },
  bulletRow: { width: "100%", flexDirection: "row-reverse", alignItems: "flex-start", gap: 8 },
  bulletMark: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15, lineHeight: 24 },
  bulletText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 24,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
