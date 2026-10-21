import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './styles/tokens.css';
import App from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Не найден элемент #root');
}

registerSW({ immediate: true });

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
