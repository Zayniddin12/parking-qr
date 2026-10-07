import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, initI18n } from '@autoparking/i18n';
import { AuthProvider } from '@autoparking/auth';
import { App } from './App';
import { registerMessages } from './i18n/messages';
import './styles.css';

const i18n = initI18n('uz');
// Merge the Business-Panel-specific uz/ru/en labels (bp.*) into the shared i18n.
registerMessages(i18n);
const queryClient = new QueryClient();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </I18nextProvider>
  </StrictMode>,
);
