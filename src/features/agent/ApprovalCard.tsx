import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { font, fontSize } from '../../theme/fonts';
import { radius, space } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';
import { diffRows } from '../git/diffRows';
import { DiffView } from '../git/DiffView';
import { useApprovalStore } from './approvalStore';

// The agent wants to change a file: show exactly what changes and wait for a decision.
export function ApprovalCard() {
  const colors = useTheme();
  const { pending, respond } = useApprovalStore();
  if (!pending) return null;

  const title = pending.kind === 'write' ? `Change ${pending.path}?` : `Delete ${pending.path}?`;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={[styles.diff, { borderColor: colors.line }]}>
        <DiffView rows={diffRows(pending.before, pending.after)} />
      </View>
      <View style={styles.buttons}>
        <View style={styles.button}>
          <Button label="Reject" onPress={() => respond(false)} />
        </View>
        <View style={styles.button}>
          <Button label="Approve" variant="primary" onPress={() => respond(true)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: space.md,
    padding: space.md,
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  title: { fontFamily: font.uiBold, fontSize: fontSize.body },
  diff: {
    maxHeight: 260,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  buttons: { flexDirection: 'row', gap: space.md },
  button: { flex: 1 },
});
