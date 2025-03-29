import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CalculatorProvider } from './contexts/CalculatorContext';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CalculatorProvider>
      <App />
    </CalculatorProvider>
  </React.StrictMode>
);