import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import HomeScreen from '../../app/index';
import { useProjectStore } from '../features/projects/projectStore';
import { useSettings } from '../features/settings/settingsStore';

// A project folder that was deleted in a file manager.
jest.mock('../features/projects/projectFolder', () => ({
  projectDir: () => ({ exists: false }),
  folderPath: () => '/storage/emulated/0/Documents/TARKA/demo',
}));

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

test('a project whose folder is gone is not opened; it can be removed from the list', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  useProjectStore.setState({
    projects: [{ id: 'demo', name: 'Demo app', createdAt: 0, openedAt: Date.now() }],
  });
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByText('Demo app'));

  expect(alert).toHaveBeenCalledWith(
    'Project folder is missing',
    expect.stringContaining('Documents/TARKA/demo'),
    expect.any(Array),
  );
  const buttons = alert.mock.calls[0][2]!;
  buttons.find((b) => b.text === 'Remove from list')!.onPress!();
  expect(useProjectStore.getState().projects).toEqual([]);
});
