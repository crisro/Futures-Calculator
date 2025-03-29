import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../contexts/CalculatorContext';

const ResultsDisplay = ({ positionId }) => {
  const { t } = useTranslation();
  const { calculations, positions } = useCalculator();
  
  const position = positions.find(p => p.id === positionId);
  const results = calculations[positionId];
  
  if (!results) {
    return null;
  }
  
  const formatNumber = (num, decimals = 4) => {
    return parseFloat(num).toFixed(decimals);
  };
  
  const getColorClass = (value, isPositive = true) => {
    if (value > 0) {
      return isPositive ? 'text-green-500' : 'text-red-500';
    } else if (value < 0) {
      return isPositive ? 'text-red-500' : 'text-green-500';
    }
    return '';
  };
  
  return (
    <div className="mt-4 p-4 border dark:border-gray-700 rounded-lg bg-secondary-light dark:bg-secondary-dark">
      <h3 className="font-semibold text-lg mb-3 dark:text-white">
        {t('outputs.liquidationPrice')}: 
        <span className="text-red-500 ml-2">
          {formatNumber(results.liquidationPrice)}
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.availableMargin')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.availableMargin)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.costValue')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.costValue)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.nominalValue')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.nominalValue)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.tradingFees')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.tradingFees)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.initialMargin')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.initialMargin)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.maintenanceMargin')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.maintenanceMargin)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.unrealizedPnL')}</p>
          <p className={`font-medium ${getColorClass(results.unrealizedPnL)}`}>
            {formatNumber(results.unrealizedPnL)}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.roi')}</p>
          <p className={`font-medium ${getColorClass(results.roi)}`}>
            {(results.roi * 100).toFixed(2)}%
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.breakEvenPrice')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.breakEvenPrice)}</p>
        </div>
      </div>
      
      {position.marginMode === 'cross' && calculations.crossMargin && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <h4 className="font-semibold mb-2 dark:text-white">{t('inputs.cross')} {t('inputs.marginMode')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.totalEquity')}</p>
              <p className="font-medium dark:text-white">{formatNumber(calculations.crossMargin.totalEquity)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.totalMaintenanceMargin')}</p>
              <p className="font-medium dark:text-white">{formatNumber(calculations.crossMargin.totalMaintenanceMargin)}</p>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.crossLiquidationThreshold')}</p>
              <p className="font-medium dark:text-white">
                {(calculations.crossMargin.crossLiquidationThreshold * 100).toFixed(2)}%
                {calculations.crossMargin.crossLiquidationThreshold > 0.8 && (
                  <span className="ml-2 text-red-500">{t('outputs.liquidationWarning')}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;