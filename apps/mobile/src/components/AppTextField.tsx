import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radii } from "@/theme";

type AppTextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  dark?: boolean;
};

export function AppTextField({ label, helper, dark = false, style, ...props }: AppTextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        style={[styles.input, style]}
        textAlign="right"
      />
      {helper ? <Text style={[styles.helper, dark && styles.helperDark]}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, textAlign: "right", writingDirection: "rtl" },
  labelDark: { color: colors.page },
  input: {
    height: 48,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    writingDirection: "rtl",
  },
  helper: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, textAlign: "right", writingDirection: "rtl" },
  helperDark: { color: colors.border },
});
