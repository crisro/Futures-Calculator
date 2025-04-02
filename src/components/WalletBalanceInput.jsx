import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../contexts/CalculatorContext';

const WalletBalanceInput = () => {
  const { t } = useTranslation();
  const { walletSettings, updateWalletSettings } = useCalculator();
  
  const handleWalletBalanceChange = (e) => {
    const value = parseFloat(e.target.value);
    updateWalletSettings({ walletBalance: value });
  };
  
  return (
    <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-xl font-semibold mb-4">{t('wallet.title')}</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="walletBalance" className="block mb-1 font-medium">
            {t('wallet.balance')}
          </label>
          <input
            id="walletBalance"
            type="number"
            value={walletSettings.walletBalance}
            onChange={handleWalletBalanceChange}
            className="w-full p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
            placeholder={t('wallet.enterBalance')}
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('wallet.crossModeInfo')}
        </div>
      </div>
    </div>
  );
};

export default WalletBalanceInput;