import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  onPress: () => void;
  disabled?: boolean;
};

export default function AppButton({ title, icon, theme, onPress, disabled }: Props) {
  if (theme === 'primary') {
    return (
      <View style={styles.buttonOuter}>
        <Pressable
          style={[
            styles.buttonInner,
            styles.primaryFill,
            disabled ? styles.disabled : null,
          ]}
          onPress={onPress}
          disabled={disabled}
        >
          <Ionicons
            name={icon}
            size={22}
            color={COLORS.textOnPrimary}
            style={styles.icon}
          />
          <Text style={[styles.label, styles.labelPrimary]}>{title}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.buttonOuter}>
      <Pressable
        style={[
          styles.buttonInner,
          styles.secondaryFill,
          disabled ? styles.disabled : null,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={icon}
          size={22}
          color={COLORS.textSecondary}
          style={styles.icon}
        />
        <Text style={styles.label}>{title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonOuter: {
    width: '100%',
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 3,
  },
  buttonInner: {
    borderRadius: 9,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryFill: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  secondaryFill: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.6,
  },
  icon: { paddingRight: 10 },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  labelPrimary: { color: COLORS.textOnPrimary, fontWeight: '800' },
});
