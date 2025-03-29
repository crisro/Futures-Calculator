import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../contexts/CalculatorContext';

const Settings = () => {
  const { t } = useTranslation();
  const { apiKey, setApiKey, apiSecret, setApiSecret } = useCalculator();
  const [showSecret, setShowSecret] = useState(false);
  
  // Load saved API keys from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('bitunix_api_key');
    const savedApiSecret = localStorage.getItem('bitunix_api_secret');
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedApiSecret) setApiSecret(savedApiSecret);
  }, [setApiKey, setApiSecret]);
  
  // Save API keys to localStorage when they change
  useEffect(() => {
    if (apiKey) localStorage.setItem('bitunix_api_key', apiKey);
    if (apiSecret) localStorage.setItem('bitunix_api_secret', apiSecret);
  }, [apiKey, apiSecret]);
  
  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };
  
  const handleApiSecretChange = (e) => {
    setApiSecret(e.target.value);
  };
  
  const toggleShowSecret = () => {
    setShowSecret(!showSecret);
  };
  
  return (
    <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-xl font-semibold mb-4">{t('settings.title')}</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block mb-1 font-medium">
            {t('apiSettings.apiKey')}
          </label>
          <input
            id="apiKey"
            type="text"
            value={apiKey || ''}
            onChange={handleApiKeyChange}
            className="w-full p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
            placeholder={t('apiSettings.enterApiKey')}
          />
        </div>
        
        <div>
          <label htmlFor="apiSecret" className="block mb-1 font-medium">
            {t('apiSettings.apiSecret')}
          </label>
          <div className="relative">
            <input
              id="apiSecret"
              type={showSecret ? 'text' : 'password'}
              value={apiSecret || ''}
              onChange={handleApiSecretChange}
              className="w-full p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              placeholder={t('apiSettings.enterApiSecret')}
            />
            <button
              type="button"
              onClick={toggleShowSecret}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {showSecret ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('apiSettings.disclaimer')}
        </div>
      </div>
    </div>
  );
};

export default Settings;