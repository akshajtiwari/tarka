import Octicons from '@expo/vector-icons/Octicons';
import { useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';

import { TarkaAndroid } from '../../../modules/tarka-android';
import { Button } from '../../components/Button';
import { font, fontSize } from '../../theme/fonts';
import { space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { GET_TERMUX_URL, TERMUX_SETUP_COMMAND } from './termuxHelp';

const readStatus = () => ({
  installed: !!TarkaAndroid?.isTermuxInstalled(),
  allowed: !!TarkaAndroid?.hasTermuxPermission(),
});

// Termux is a separate app with a real Linux shell. With it, the terminal's `termux <command>`
// runs real tools (gcc, clang, java, node…) on a copy of your project.
export function TermuxSettings() {
  const colors = useTheme();
  const [status, setStatus] = useState(readStatus);

  // Checked again when you come back from installing Termux or from Android's settings.
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (s) => s === 'active' && setStatus(readStatus()),
    );
    return () => sub.remove();
  }, []);

  if (!TarkaAndroid) {
    return <Text style={[styles.note, { color: colors.muted }]}>Termux is for Android only.</Text>;
  }

  const row = (ok: boolean, text: string) => (
    <View style={styles.row}>
      <Octicons
        name={ok ? 'check-circle-fill' : 'circle'}
        size={18}
        color={ok ? colors.success : colors.muted}
      />
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );

  async function allow() {
    await TarkaAndroid!.requestTermuxPermission();
    setStatus(readStatus());
  }

  return (
    <View style={styles.box}>
      <Text style={[styles.note, { color: colors.muted }]}>
        Termux is a free app with a real Linux shell: gcc, clang, java, node and more. With it, type
        termux and a command in the terminal to run it on your project.
      </Text>
      {row(status.installed, status.installed ? 'Termux is installed' : 'Termux is not installed')}
      {!status.installed && (
        <Button label="Get Termux (F-Droid)" onPress={() => Linking.openURL(GET_TERMUX_URL)} />
      )}
      {status.installed &&
        row(
          status.allowed,
          status.allowed ? 'TARKA may run commands in Termux' : 'TARKA needs permission',
        )}
      {status.installed && !status.allowed && (
        <Button label="Allow TARKA to use Termux" variant="primary" onPress={allow} />
      )}
      <Text style={[styles.note, { color: colors.muted }]}>
        Once, in Termux, run this (long-press to copy):
      </Text>
      <Text
        selectable
        style={[styles.code, { color: colors.text, backgroundColor: colors.raised }]}
      >
        {TERMUX_SETUP_COMMAND}
      </Text>
      <Text style={[styles.note, { color: colors.muted }]}>
        Then try in the terminal: termux uname -a
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  text: { flex: 1, fontFamily: font.ui, fontSize: fontSize.body },
  note: { fontFamily: font.ui, fontSize: fontSize.small, lineHeight: 20 },
  code: { fontFamily: font.code, fontSize: fontSize.small, padding: space.md, borderRadius: 6 },
});
