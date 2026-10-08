import Octicons from '@expo/vector-icons/Octicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, fontSize } from '../../theme/fonts';
import { size } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';

const items: Record<
  string,
  { label: string; icon: React.ComponentProps<typeof Octicons>['name'] }
> = {
  code: { label: 'Code', icon: 'code' },
  git: { label: 'Git', icon: 'git-branch' },
  run: { label: 'Run', icon: 'play' },
  agent: { label: 'Agent', icon: 'sparkle-fill' },
};

// Only the parts of the tab navigator's props that the dock uses.
type Props = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function Dock({ state, navigation }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardState((state) => state.isVisible);

  // While typing, the key row takes this space.
  if (keyboardOpen) return null;

  return (
    <View
      style={[
        styles.dock,
        { backgroundColor: colors.surface, borderColor: colors.line, paddingBottom: insets.bottom },
      ]}
    >
      {state.routes.map((route, i) => {
        const item = items[route.name];
        if (!item) return null;
        const active = i === state.index;
        const color = active ? colors.accent : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => navigation.navigate(route.name)}
            style={styles.item}
          >
            <Octicons name={item.icon} size={20} color={color} />
            <Text style={[styles.label, { color: active ? colors.text : colors.muted }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  item: { flex: 1, height: size.dock, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: font.ui, fontSize: fontSize.caption },
});
