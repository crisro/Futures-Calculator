import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import PositionForm from './components/PositionForm';
import ResultsDisplay from './components/ResultsDisplay';
import TradingViewChart from './components/TradingViewChart';
import Settings from './components/Settings';
import { useCalculator } from './contexts/CalculatorContext';
import './App.css';

function App() {
  const { t } = useTranslation();
  const { positions, addPosition } = useCalculator();
  const [theme, setTheme] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check for user's preferred theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Listen for add-position event from PositionForm
  useEffect(() => {
    const addPositionHandler = () => {
      addPosition();
    };
    
    window.addEventListener('add-position', addPositionHandler);
    
    return () => {
      window.removeEventListener('add-position', addPositionHandler);
    };
  }, [addPosition]);

  return (
    <div className="min-h-screen bg-primary-light dark:bg-primary-dark text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header toggleTheme={toggleTheme} theme={theme} toggleSettings={toggleSettings} />
      
      <main className="container mx-auto px-4 py-6">
        {showSettings && <Settings />}
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            {positions.map((position) => (
              <div key={position.id} className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md">
                <h2 className="text-xl font-semibold mb-3">
                  {t('position')} #{position.id}
                </h2>
                <PositionForm positionId={position.id} />
                <ResultsDisplay positionId={position.id} />
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-3 sticky top-4">
            <TradingViewChart />
          </div>
        </div>
      </main>
      
      <footer className="py-3 text-center text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700">
        &copy; {new Date().getFullYear()} {t('app.footerText')}
        <div className="mt-1">Developed by Erfan Razmi</div>
      </footer>
    </div>
  );
}

export default App;