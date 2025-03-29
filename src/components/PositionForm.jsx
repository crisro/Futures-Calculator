import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../contexts/CalculatorContext';

const PositionForm = ({ positionId }) => {
  const { t } = useTranslation();
  const { positions, updatePosition, removePosition } = useCalculator();
  
  const position = positions.find(p => p.id === positionId);
  
  // Initialize entry date and time if not set
  useEffect(() => {
    if (position && !position.entryDateTime) {
      const now = new Date();
      updatePosition(positionId, { 
        entryDateTime: now.toISOString().slice(0, 16),
        convertTimeZone: false,
        manualMargin: false,
        marginValue: 0
      });
    }
  }, [positionId, position, updatePosition]);
  
  const [sections, setSections] = useState({
    basicInfo: true,
    positionSettings: true,
    orderSettings: true,
    timeSettings: true,
    feeSettings: false
  });
  
  if (!position) return null;
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    let processedValue;
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value);
    } else {
      processedValue = value;
    }
    
    updatePosition(positionId, { [name]: processedValue });
  };
  
  const handleRemovePosition = () => {
    removePosition(positionId);
  };

  const toggleSection = (section) => {
    setSections({
      ...sections,
      [section]: !sections[section]
    });
  };

  return (
    <div className="space-y-4">
      {/* Basic Position Information */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('basicInfo')}
        >
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('basicInformation')}</h3>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${sections.basicInfo ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {sections.basicInfo && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Price */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.entryPrice')}
              </label>
              <input
                type="number"
                name="entryPrice"
                value={position.entryPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                step="0.01"
              />
            </div>
            
            {/* Close Price */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.closePrice')}
              </label>
              <input
                type="number"
                name="currentPrice"
                value={position.currentPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                step="0.01"
              />
            </div>
            
            {/* Position Size */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.positionSize')}
              </label>
              <input
                type="number"
                name="positionSize"
                value={position.positionSize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                step="0.001"
              />
            </div>
            
            {/* Symbol Selection */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.symbol')}
              </label>
              <select
                name="symbol"
                value={position.symbol}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="BINANCE:BTCUSDT">BTC/USDT</option>
                <option value="BINANCE:ETHUSDT">ETH/USDT</option>
                <option value="BINANCE:SOLUSDT">SOL/USDT</option>
                <option value="BINANCE:BNBUSDT">BNB/USDT</option>
                <option value="BINANCE:ADAUSDT">ADA/USDT</option>
                <option value="BINANCE:DOGEUSDT">DOGE/USDT</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Position Settings */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('positionSettings')}
        >
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('positionSettings')}</h3>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${sections.positionSettings ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {sections.positionSettings && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position Type */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.positionType')}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="positionType"
                    value="long"
                    checked={position.positionType === 'long'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('inputs.long')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="positionType"
                    value="short"
                    checked={position.positionType === 'short'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('inputs.short')}</span>
                </label>
              </div>
            </div>
            
            {/* Margin Mode */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.marginMode')}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="marginMode"
                    value="isolated"
                    checked={position.marginMode === 'isolated'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('inputs.isolated')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="marginMode"
                    value="cross"
                    checked={position.marginMode === 'cross'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('inputs.cross')}</span>
                </label>
              </div>
            </div>
            
            {/* Leverage */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.leverage')}
              </label>
              <input
                type="number"
                name="leverage"
                value={position.leverage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                step="1"
              />
            </div>
            
            {/* MMR% */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.mmr')}
              </label>
              <input
                type="number"
                name="mmr"
                value={position.mmr}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                step="0.1"
              />
            </div>
            
            {/* VIP Level */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inputs.vipLevel')}
              </label>
              <select
                name="vipLevel"
                value={position.vipLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map(level => (
                  <option key={level} value={level}>
                    {t(`vipLevels.${level}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Order Settings */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('orderSettings')}
        >
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('orderSettings')}</h3>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${sections.orderSettings ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {sections.orderSettings && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Type (Maker/Taker) */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('trading.orderType')}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="orderType"
                    value="maker"
                    checked={position.orderType === 'maker'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('trading.maker')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="orderType"
                    value="taker"
                    checked={position.orderType === 'taker'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('trading.taker')}</span>
                </label>
              </div>
            </div>
            
            {/* Close Order Type */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('trading.closeOrderType') || 'نوع سفارش بستن'}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="closeOrderType"
                    value="maker"
                    checked={position.closeOrderType === 'maker'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('trading.maker')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="closeOrderType"
                    value="taker"
                    checked={position.closeOrderType === 'taker'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('trading.taker')}</span>
                </label>
              </div>
            </div>
            
            {/* Manual Margin Option */}
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="manualMargin"
                  checked={position.manualMargin || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('trading.manualMargin')}
                </span>
              </label>
            </div>
            
            {/* Manual Margin Value - only shown if manualMargin is checked */}
            {position.manualMargin && (
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('trading.marginValue')}
                </label>
                <input
                  type="number"
                  name="marginValue"
                  value={position.marginValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Time Settings */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('timeSettings')}
        >
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('timeSettings') || 'تنظیمات زمان'}</h3>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${sections.timeSettings ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {sections.timeSettings && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Date and Time */}
            <div className="mb-2 col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dateTime.entryDateTime')}
              </label>
              <input
                type="datetime-local"
                name="entryDateTime"
                value={position.entryDateTime || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('dateTime.enterDateTime')}
              />
            </div>
            
            {/* Time Zone Conversion */}
            <div className="mb-2 col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="convertTimeZone"
                  checked={position.convertTimeZone || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('dateTime.convertTimeZone')}
                </span>
              </label>
              {position.entryDateTime && position.convertTimeZone && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {/* تبدیل زمان از UTC+8 به UTC+3:30 */}
                  {(() => {
                    // ایجاد تاریخ از زمان ورودی
                    const date = new Date(position.entryDateTime);
                    
                    // اختلاف زمانی بین UTC+8 و UTC+3:30 (4 ساعت و 30 دقیقه)
                    const timeDiff = 4.5 * 60 * 60 * 1000; // تبدیل به میلی‌ثانیه
                    
                    // ایجاد تاریخ جدید با زمان تنظیم شده برای UTC+3:30
                    const tehranTime = new Date(date.getTime() - timeDiff);
                    
                    return tehranTime.toLocaleString('fa-IR', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  })()} 
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Fee Settings */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 dark:bg-gray-700 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('feeSettings')}
        >
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('feeSettings') || 'تنظیمات کارمزد'}</h3>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${sections.feeSettings ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {sections.feeSettings && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Funding Fee */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('trading.fundingFee')}
              </label>
              <input
                type="number"
                name="fundingFee"
                value={position.fundingFee}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                step="0.01"
              />
            </div>
            
            {/* Deduct Fee From Margin */}
            <div className="mb-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="deductFeeFromMargin"
                  checked={position.deductFeeFromMargin || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('trading.deductFeeFromMargin')}
                </span>
              </label>
            </div>
            
            {/* Deduct Opening Fee - only shown if deductFeeFromMargin is checked */}
            {position.deductFeeFromMargin && (
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="deductOpenFee"
                    checked={position.deductOpenFee || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('trading.deductOpenFee')}
                  </span>
                </label>
              </div>
            )}
            
            {/* Deduct Closing Fee - only shown if deductFeeFromMargin is checked */}
            {position.deductFeeFromMargin && (
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="deductCloseFee"
                    checked={position.deductCloseFee || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('trading.deductCloseFee')}
                  </span>
                </label>
              </div>
            )}
      
          </div>
        )}
      </div>
      
      {/* Remove Position Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleRemovePosition}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
          disabled={positions.length <= 1} // Prevent removing the last position
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {t('buttons.removePosition')}
        </button>
      </div>
    </div>
  );
};

export default PositionForm;