import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { Header } from '../../../src/components/Header';
import { IconButton } from '../../../src/components/IconButton';
import { TextField } from '../../../src/components/TextField';
import { ApprovalCard } from '../../../src/features/agent/ApprovalCard';
import { TimelineRow } from '../../../src/features/agent/TimelineRow';
import { useAgent } from '../../../src/features/agent/useAgent';
import { space } from '../../../src/theme/spacing';
import { useTheme } from '../../../src/theme/useTheme';

export default function AgentScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = useAgent(id);
  const [message, setMessage] = useState('');
  const list = useRef<FlatList>(null);

  function send() {
    agent.send(message);
    setMessage('');
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Agent"
        right={
          <>
            <IconButton icon="gear" label="AI settings" onPress={() => router.push('/settings')} />
            <IconButton icon="plus" label="New conversation" onPress={agent.clear} />
          </>
        }
      />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <FlatList
          ref={list}
          data={agent.items}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.timeline}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <TimelineRow item={item} />}
          ListEmptyComponent={
            <EmptyState
              title="Ask the agent"
              body="It can read and search this project and propose changes. You approve every change before it is written."
            />
          }
        />
        <ApprovalCard />
        <View
          style={[styles.composer, { borderColor: colors.line, backgroundColor: colors.surface }]}
        >
          <TextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="What should change?"
          />
          {agent.running ? (
            <Button label="Stop" onPress={agent.stop} />
          ) : (
            <Button label="Send" variant="primary" onPress={send} disabled={!message.trim()} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  timeline: { padding: space.lg },
  composer: { padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
