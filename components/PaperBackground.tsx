import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export default function PaperBackground() {
  const { width, height } = useWindowDimensions();
  const lineCount = Math.ceil(height / 32);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: lineCount }, (_, index) => (
        <View
          key={index}
          style={[styles.line, { top: index * 32, width }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    height: 1,
    backgroundColor: COLORS.textPrimary,
    opacity: 0.20,
  },
});