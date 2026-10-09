import { router } from 'expo-router';

import { IconButton } from './IconButton';

// Back to the projects list from anywhere inside a project (open files are saved on the way out).
export function HomeButton() {
  return <IconButton icon="home" label="Go to projects" onPress={() => router.dismissTo('/')} />;
}
