import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_600SemiBold,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';

// Passed to useFonts() in app/_layout.tsx. The keys become the fontFamily names below.
export const fontFiles = {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_600SemiBold,
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
};

export const font = {
  ui: 'AtkinsonHyperlegibleNext_400Regular',
  uiBold: 'AtkinsonHyperlegibleNext_600SemiBold',
  code: 'JetBrainsMono_400Regular',
  codeBold: 'JetBrainsMono_600SemiBold',
};

export const fontSize = { caption: 12, small: 14, body: 16, title: 20, display: 28 };
