import { ListRow } from '../../components/ListRow';
import { timeAgo } from '../../lib/timeAgo';
import type { Project } from './projectStore';

type Props = {
  project: Project;
  onOpen: () => void;
  onShowActions: () => void;
};

export function ProjectRow({ project, onOpen, onShowActions }: Props) {
  return (
    <ListRow
      icon="repo"
      title={project.name}
      subtitle={`Opened ${timeAgo(project.openedAt)}`}
      onPress={onOpen}
      onLongPress={onShowActions}
    />
  );
}
