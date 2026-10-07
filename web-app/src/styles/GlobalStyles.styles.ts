import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    font-family: ${({ theme }) => theme.fonts.body};
    font-weight: 500;
    letter-spacing: .025em;
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    color-scheme: dark;
    font-synthesis: small-caps;
    font-variant-caps: small-caps;
    --accent: ${({ theme }) => theme.colors.accent};
    --muted: ${({ theme }) => theme.colors.muted};
    --line: ${({ theme }) => theme.colors.border};
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  h1, h2, h3, p { margin-top: 0; }
  input, select { font: inherit; font-variant-caps: normal; }
  input:focus-visible, select:focus-visible, summary:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }
  summary { cursor: pointer; line-height: 1.6; }
  summary:hover { color: var(--accent); }
  input[type=range] { width: 100%; accent-color: var(--accent); margin: 15px 0 0; }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; scroll-behavior: auto !important; }
  }
`;
