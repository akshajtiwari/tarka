import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../../../src/components/Header';
import { HomeButton } from '../../../src/components/HomeButton';
import { IconButton } from '../../../src/components/IconButton';
import { TerminalView } from '../../../src/features/terminal/TerminalView';
import { useTerminalStore } from '../../../src/features/terminal/terminalStore';
import { useTheme } from '../../../src/theme/useTheme';

// The Run tab is the terminal. The editor's Run file button opens it too.
export default function RunScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.term.bg }}>
      <Header
        title="Terminal"
        left={<HomeButton />}
        right={
          <IconButton
            icon="trash"
            label="Clear terminal"
            onPress={() => useTerminalStore.getState().clear()}
          />
        }
      />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TerminalView projectId={id} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
