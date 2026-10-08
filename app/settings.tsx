import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../src/components/EmptyState';
import { Header } from '../src/components/Header';
import { IconButton } from '../src/components/IconButton';
import { useTheme } from '../src/theme/useTheme';

export default function SettingsScreen() {
  const colors = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Settings"
        left={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />
      <View>
        <EmptyState title="Nothing to set yet" body="Theme, editor and git settings will live here." />
      </View>
    </SafeAreaView>
  );
}
