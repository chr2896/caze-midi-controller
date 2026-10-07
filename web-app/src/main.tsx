import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { GlobalStyles } from './styles/GlobalStyles.styles';
import { theme } from './styles/theme';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz do editor não encontrado.');
createRoot(root).render(
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <App />
  </ThemeProvider>,
);
