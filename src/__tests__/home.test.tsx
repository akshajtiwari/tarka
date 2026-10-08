import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../../app/index';
import { useProjectStore } from '../features/projects/projectStore';

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
