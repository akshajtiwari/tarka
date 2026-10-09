import { SafeAreaView } from 'react-native-safe-area-context';

import { BusyLine } from '../../components/BusyLine';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { HomeButton } from '../../components/HomeButton';
import { useTheme } from '../../theme/useTheme';

type Props = {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
  busy?: string | null; // what is running, e.g. "Starting a repository…"
};

// The Git tab when there is nothing to list: no repository yet, or its status could not be read.
export function GitMessage({ title, body, action, onAction, busy }: Props) {
  const colors = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Git" left={<HomeButton />} />
      {busy && <BusyLine label={busy} />}
      <EmptyState title={title} body={body}>
        <Button label={action} variant="primary" onPress={onAction} />
      </EmptyState>
    </SafeAreaView>
  );
}
