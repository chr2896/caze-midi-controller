import 'styled-components';
export const theme = {
  colors: {
    background: '#0d1013',
    text: '#e2e6e9',
    accent: '#73d8df',
    muted: '#94a1ab',
    border: '#2b3238',
  },
  fonts: { body: "'Rajdhani', sans-serif", heading: "'Oxanium', sans-serif", lcd: 'monospace' },
};
type AppTheme = typeof theme;
declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
