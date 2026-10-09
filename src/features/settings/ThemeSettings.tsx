import Octicons from '@expo/vector-icons/Octicons';
import { View } from 'react-native';

import { ListRow } from '../../components/ListRow';
import { useTheme } from '../../theme/useTheme';
import { useSettings, type ThemeChoice } from './settingsStore';

const themes: { value: ThemeChoice; title: string }[] = [
  { value: 'system', title: 'Same as the phone' },
  { value: 'dark', title: 'Dark (slate)' },
  { value: 'light', title: 'Light (chalk)' },
];

export function ThemeSettings() {
  const colors = useTheme();
  const { theme, setTheme } = useSettings();

  return (
    <View>
      {themes.map((t) => (
        <ListRow
          key={t.value}
          title={t.title}
          onPress={() => setTheme(t.value)}
          right={theme === t.value && <Octicons name="check" size={18} color={colors.accent} />}
        />
      ))}
    </View>
  );
}
