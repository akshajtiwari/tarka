import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../../app/index';
import { useProjectStore } from '../features/projects/projectStore';
import { useSettings } from '../features/settings/settingsStore';

// The home screen shows once settings are loaded and the first-launch setup is done.
beforeEach(async () => {
  await useSettings.persist.rehydrate();
  useSettings.setState({ onboarded: true });
});

test('invites you to create a project when there are none', async () => {
  useProjectStore.setState({ projects: [] });
  await render(<HomeScreen />);
  expect(screen.getByText('No projects yet')).toBeTruthy();
  expect(screen.getByText('New project')).toBeTruthy();
});

test('lists saved projects', async () => {
  useProjectStore.setState({
    projects: [{ id: 'demo', name: 'Demo app', createdAt: 0, openedAt: Date.now() }],
  });
  await render(<HomeScreen />);
  expect(screen.getByText('Demo app')).toBeTruthy();
  expect(screen.getByText('Opened just now')).toBeTruthy();
});
