import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './pages/LandingPage';
import { pathFromPage } from './lib/navigation/routes';
import type { Page } from './types/navigation';
import './index.css';

function goTo(page: Page) {
  window.location.href = pathFromPage(page);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LandingPage goTo={goTo} />
  </React.StrictMode>,
);
