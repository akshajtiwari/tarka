// Slate (dark) and Chalk (light) palettes. See docs/UI.md for where each color is used.
// Brass (`accent`) is only for the caret, the active line, focus and the main action.

export type Colors = {
  bg: string;
  surface: string;
  raised: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  success: string;
  warning: string;
  error: string;
  running: string;
  syntax: {
    keyword: string;
    string: string;
    number: string;
    function: string;
    type: string;
    property: string;
    comment: string;
    invalid: string;
  };
};

export const dark: Colors = {
  bg: '#1B2124',
  surface: '#222A2D',
  raised: '#2B3437',
  line: '#38423F',
  text: '#E6E1D3',
  muted: '#97A19E',
  accent: '#C9A227',
  onAccent: '#1B2124',
  success: '#7FB685',
  warning: '#E2B04A',
  error: '#E5736A',
  running: '#79A7D3',
  syntax: {
    keyword: '#C8A2D8',
    string: '#A7C796',
    number: '#E7A37E',
    function: '#8DB6D9',
    type: '#E2C27A',
    property: '#B9D2CE',
    comment: '#818D8A',
    invalid: '#E5736A',
  },
};

export const light: Colors = {
  bg: '#EEF1F0',
  surface: '#F8FAF9',
  raised: '#E3E8E6',
  line: '#CBD3D0',
  text: '#1D2528',
  muted: '#5E6966',
  accent: '#7C5F05',
  onAccent: '#FFFFFF',
  success: '#2F7A3A',
  warning: '#8F6200',
  error: '#B3261E',
  running: '#2B5F91',
  syntax: {
    keyword: '#7E4596',
    string: '#3F6E2C',
    number: '#9A4B22',
    function: '#255A8C',
    type: '#7C5F05',
    property: '#2E6B63',
    comment: '#6A7572',
    invalid: '#B3261E',
  },
};
