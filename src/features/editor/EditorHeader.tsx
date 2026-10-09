import Octicons from '@expo/vector-icons/Octicons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';

type Props = {
  fileName: string | null;
  dirty: boolean;
  tabCount: number;
  onShowFiles: () => void;
  onShowTabs: () => void;
  onShowMenu: () => void;
  onSave: () => void;
  onRun?: () => void; // only for files that can run (.py, .js, .ts, .html)
  onSwipe: (by: 1 | -1) => void; // swipe left: next open file, swipe right: previous
};

// ☰ | file name ● ▾ | Save ⋯. Tapping the name opens the list of open files,
// swiping the header moves between them.
export const EditorHeader = memo(function EditorHeader({
  fileName,
  dirty,
  tabCount,
  onShowFiles,
  onShowTabs,
  onShowMenu,
  onSave,
  onRun,
  onSwipe,
}: Props) {
  const colors = useTheme();
  // Built once: the header re-renders while you type.
  const swipe = useMemo(
    () =>
      Gesture.Race(
        Gesture.Fling()
          .direction(Directions.LEFT)
          .runOnJS(true)
          .onEnd(() => onSwipe(1)),
        Gesture.Fling()
          .direction(Directions.RIGHT)
          .runOnJS(true)
          .onEnd(() => onSwipe(-1)),
      ),
    [onSwipe],
  );

  return (
    <GestureDetector gesture={swipe}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <IconButton icon="three-bars" label="Show files" onPress={onShowFiles} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open files"
          disabled={tabCount === 0}
          onPress={onShowTabs}
          style={styles.pill}
        >
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {fileName ?? 'No file open'}
          </Text>
          {dirty && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
          {tabCount > 0 && <Octicons name="chevron-down" size={14} color={colors.muted} />}
        </Pressable>
        {dirty && <Button label="Save" onPress={onSave} />}
        {onRun && <IconButton icon="play" label="Run file" onPress={onRun} />}
        {fileName && (
          <IconButton icon="kebab-horizontal" label="Editor menu" onPress={onShowMenu} />
        )}
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  header: {
    height: size.header,
    paddingHorizontal: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.touch,
  },
  name: { flexShrink: 1, fontFamily: font.code, fontSize: fontSize.body },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
