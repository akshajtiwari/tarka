import Octicons from '@expo/vector-icons/Octicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import type { InstallStatus } from './usePythonInstall';

type Props = { status: InstallStatus; slow: boolean; onRetry: () => void };

// Shows how the Python download is going. Setup can't continue until Python is ready.
export function PythonStep({ status, slow, onRetry }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.status}>
      {status === 'installing' && (
        <View style={styles.row}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.text, { color: colors.text }]}>Downloading Python…</Text>
        </View>
      )}
      {status === 'installing' && slow && (
        <>
          <Text style={[styles.text, { color: colors.muted }]}>
            This is taking a while. On a slow or broken connection, try again.
          </Text>
          <Button label="Try again" onPress={onRetry} />
        </>
      )}
      {status === 'ready' && (
        <View style={styles.row}>
          <Octicons name="check-circle-fill" size={20} color={colors.success} />
          <Text style={[styles.text, { color: colors.text }]}>Python is ready</Text>
        </View>
      )}
      {status === 'failed' && (
        <>
          <View style={styles.row}>
            <Octicons name="alert" size={20} color={colors.error} />
            <Text style={[styles.text, { color: colors.text }]}>
              {"Couldn't download Python. Check your internet connection."}
            </Text>
          </View>
          <Button label="Try again" variant="primary" onPress={onRetry} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  text: { flex: 1, fontFamily: font.ui, fontSize: fontSize.body },
});
