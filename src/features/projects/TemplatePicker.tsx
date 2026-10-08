import Octicons from '@expo/vector-icons/Octicons';

import { ListRow } from '../../components/ListRow';
import { useTheme } from '../../theme/useTheme';
import { templates } from './templates';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export function TemplatePicker({ selectedId, onSelect }: Props) {
  const colors = useTheme();

  return templates.map((template) => (
    <ListRow
      key={template.id}
      title={template.title}
      subtitle={template.description}
      onPress={() => onSelect(template.id)}
      right={
        template.id === selectedId && <Octicons name="check" size={18} color={colors.accent} />
      }
    />
  ));
}
