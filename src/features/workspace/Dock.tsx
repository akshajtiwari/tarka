import Octicons from '@expo/vector-icons/Octicons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, fontSize } from '../../theme/fonts';
import { size, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { useTerminalStore } from '../terminal/terminalStore';

const items: Record<
  string,
  { label: string; icon: React.ComponentProps<typeof Octicons>['name'] }
> = {
  code: { label: 'Code', icon: 'code' },
  git: { label: 'Git', icon: 'git-branch' },
  run: { label: 'Run', icon: 'play' },
  agent: { label: 'Agent', icon: 'sparkle-fill' },
};

// Tablets and unfolded phones get a rail on the left instead of a dock at the bottom.
export function useRail() {
  return useWindowDimensions().width >= 768;
}

// Only the parts of the tab navigator's props that the dock uses.
type Props = {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  navigation: { navigate: (name: string, params?: object) => void };
};

export function Dock({ state, navigation }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardState((s) => s.isVisible);
  const rail = useRail();
  // A dot on Run while a program runs there, so it's visible from the other tabs too.
  const running = useTerminalStore((s) => s.mode === 'busy' || s.mode === 'ask');

  // While typing, the key row takes the dock's space. The rail takes no height, so it stays.
  if (keyboardOpen && !rail) return null;

  const placement = rail
    ? [styles.rail, { paddingTop: insets.top + space.sm }]
    : [styles.dock, { paddingBottom: insets.bottom }];
  return (
    <View style={[placement, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {state.routes.map((route, i) => {
        const item = items[route.name];
        if (!item) return null;
        const active = i === state.index;
        const iconColor = active ? colors.accent : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            // Pass the current params on, or the other tabs would not know which project is open.
            onPress={() => navigation.navigate(route.name, state.routes[state.index].params)}
            style={rail ? styles.railItem : styles.item}
          >
            <View>
              <Octicons name={item.icon} size={20} color={iconColor} />
              {route.name === 'run' && running && (
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              )}
            </View>
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
  rail: { width: 80, gap: space.xs, borderRightWidth: StyleSheet.hairlineWidth },
  item: { flex: 1, height: size.dock, alignItems: 'center', justifyContent: 'center', gap: 2 },
  railItem: {
    height: size.dock + space.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: { fontFamily: font.ui, fontSize: fontSize.caption },
  dot: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4 },
});
