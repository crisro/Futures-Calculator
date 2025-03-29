import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../contexts/CalculatorContext';

const TradingViewChart = () => {
  const { t } = useTranslation();
  const { positions } = useCalculator();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(800);
  
  // Get the symbol from the first position (or default to BTC/USDT)
  const symbol = positions.length > 0 ? positions[0].symbol : 'BINANCE:BTCUSDT';
  
  useEffect(() => {
    // Create the TradingView widget when the component mounts
    if (containerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if (window.TradingView) {
          new window.TradingView.widget({
            autosize: true,
            symbol: symbol,
            interval: '5',
            timezone: 'Asia/Tehran',
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            withdateranges: true,
            show_popup_button: true,
            popup_width: 1000,
            popup_height: 650,
            hide_side_toolbar: false,
            container_id: 'tradingview_chart'

          });
        }
      };
      
      containerRef.current.appendChild(script);
      
      // Clean up
      return () => {
        if (containerRef.current && script.parentNode) {
          containerRef.current.removeChild(script);
        }
      };
    }
  }, [symbol]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const increaseChartSize = () => {
    setChartHeight(chartHeight + 100);
  };

  const decreaseChartSize = () => {
    if (chartHeight > 300) {
      setChartHeight(chartHeight - 100);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700 ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : 'h-full'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">
          {t('chart.title')}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={decreaseChartSize}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            title={t('chart.decreaseSize') || 'کوچک کردن نمودار'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={increaseChartSize}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            title={t('chart.increaseSize') || 'بزرگ کردن نمودار'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            title={isFullscreen ? (t('chart.exitFullscreen') || 'خروج از حالت تمام صفحه') : (t('chart.fullscreen') || 'نمایش تمام صفحه')}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div 
        id="tradingview_chart" 
        className={`w-full`}
        style={{ height: `${chartHeight}px` }} 
        ref={containerRef}
      />
    </div>
  );
};

export default TradingViewChart;