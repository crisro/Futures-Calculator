import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../contexts/CalculatorContext';

const ResultsDisplay = ({ positionId }) => {
  const { t } = useTranslation();
  const { calculations, positions, updatePosition } = useCalculator();
  const [showLiquidationCalc, setShowLiquidationCalc] = useState(false);
  const [showFeeCalc, setShowFeeCalc] = useState(false);
  
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
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg dark:text-white">
          {t('outputs.liquidationPrice')}: 
          <span className="text-red-500 ml-2">
            {formatNumber(results.liquidationPrice)}
          </span>
        </h3>
        <button 
          onClick={() => setShowLiquidationCalc(!showLiquidationCalc)}
          className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          {showLiquidationCalc ? t('outputs.hideLiquidationCalc') : t('outputs.showLiquidationCalc')}
        </button>
      </div>
      
      {showLiquidationCalc && results.liquidationCalcSteps && (
        <div className="mb-4 p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
          <h4 className="font-medium text-md mb-2 dark:text-white">{t('outputs.liquidationCalcTitle')}</h4>
          
          {results.liquidationCalcSteps.formula && (
            <div className="mb-3">
              <p className="text-sm font-medium dark:text-gray-300">{t('outputs.liquidationCalcFormula')}</p>
              <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">{results.liquidationCalcSteps.formula}</p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="py-2 px-3 text-left">{t('outputs.liquidationCalcStep')}</th>
                  <th className="py-2 px-3 text-left">{t('outputs.liquidationCalcDescription')}</th>
                  <th className="py-2 px-3 text-left">{t('outputs.liquidationCalcCalculation')}</th>
                  <th className="py-2 px-3 text-left">{t('outputs.liquidationCalcResult')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.liquidationCalcSteps.steps.map((step, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-3">{step.step}</td>
                    <td className="py-2 px-3">{step.description}</td>
                    <td className="py-2 px-3 font-mono">{step.calculation}</td>
                    <td className="py-2 px-3">{step.result !== null ? formatNumber(step.result) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showFeeCalc && results.feeCalcSteps && (
        <div className="mb-4 p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
          <h4 className="font-medium text-md mb-2 dark:text-white">{t('outputs.feeCalcTitle')}</h4>
          
          {results.feeCalcSteps.formula && (
            <div className="mb-3">
              <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">{results.feeCalcSteps.formula}</p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="py-2 px-3 text-left">{t('outputs.feeCalcStep')}</th>
                  <th className="py-2 px-3 text-left">{t('outputs.feeCalcDescription')}</th>
                  <th className="py-2 px-3 text-left">{t('outputs.feeCalcCalculation')}</th>
                  <th className="py-2 px-3 text-left">{t('outputs.feeCalcResult')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.feeCalcSteps.steps.map((step, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-3">{step.step}</td>
                    <td className="py-2 px-3">{step.description}</td>
                    <td className="py-2 px-3 font-mono">{step.calculation}</td>
                    <td className="py-2 px-3">{step.result !== null ? formatNumber(step.result) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
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
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.tradingFees')}</p>
            <button 
              onClick={() => setShowFeeCalc(!showFeeCalc)}
              className="text-xs px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              {showFeeCalc ? t('outputs.hideFeeCalc') : t('outputs.showFeeCalc')}
            </button>
          </div>
          <p className="font-medium dark:text-white">{formatNumber(results.tradingFees)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.initialMargin')}</p>
          <p className="font-medium dark:text-white">{formatNumber(results.initialMargin)}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.unrealizedPnL')}</p>
          <p className={`font-medium ${getColorClass(results.unrealizedPnL)}`}>
            {formatNumber(results.unrealizedPnL)}
          </p>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="marginAfterPnl"
                checked={position.marginAfterPnl || false}
                onChange={(e) => {
                  const { checked } = e.target;
                  updatePosition(positionId, { marginAfterPnl: checked });
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('trading.marginAfterPnl')}
              </span>
            </label>
          </div>
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
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('outputs.marginRate')}
            <span className="ml-1 cursor-help inline-block relative group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-sm text-white rounded-md absolute left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-1 w-48 z-10 pointer-events-none">
                {t('outputs.marginRateInfo')}
              </span>
            </span>
          </p>
          <p className={`font-medium ${results.marginRate > 80 ? 'text-red-500' : results.marginRate > 60 ? 'text-yellow-500' : 'dark:text-white'}`}>
            {formatNumber(results.marginRate, 2)}%
            {results.marginRate > 80 && (
              <span className="ml-2 text-xs text-red-500">{t('outputs.highRiskWarning')}</span>
            )}
          </p>
        </div>
      </div>
      
      {position.marginMode === 'cross' && calculations.crossMargin && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <h4 className="font-semibold mb-2 dark:text-white">{t('inputs.cross')} {t('inputs.marginMode')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.walletBalance')}</p>
              <p className="font-medium dark:text-white">{formatNumber(calculations.crossMargin.walletBalance)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('outputs.totalUnrealizedPnL')}</p>
              <p className={`font-medium ${getColorClass(calculations.crossMargin.totalUnrealizedPnL)}`}>
                {formatNumber(calculations.crossMargin.totalUnrealizedPnL)}
              </p>
            </div>
            
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