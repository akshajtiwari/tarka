import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { useTheme } from '../../theme/useTheme';

type Props = {
  title: string;
  body: string;
};

// shortcut: placeholder for panels that are not built yet, delete once Git, Run and Agent exist.
export function PanelPlaceholder({ title, body }: Props) {
  const colors = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={title} />
      <EmptyState title={`${title} is on the way`} body={body} />
    </SafeAreaView>
  );
}
