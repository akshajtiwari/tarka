import { migrateSettings } from '../features/settings/settingsStore';

test('the one model saved by older versions becomes the model of the chosen provider', () => {
  const old = { aiProvider: 'openai', aiModel: 'qwen2.5-coder:3b', gitName: 'Ada' };
  expect(migrateSettings(old, 0)).toEqual({
    aiProvider: 'openai',
    aiModels: { openai: 'qwen2.5-coder:3b' },
    gitName: 'Ada',
  });
  expect(migrateSettings({ aiProvider: 'anthropic', aiModel: '' }, 0)).toMatchObject({
    aiModels: {},
  });
});
