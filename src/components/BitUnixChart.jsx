import React, { useEffect, useRef } from 'react';
import { useCalculator } from '../contexts/CalculatorContext';

const BitUnixChart = ({ height }) => {
  const { positions } = useCalculator();
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  
  // Get the symbol from the first position (or default to BTC/USDT)
  const symbol = positions.length > 0 ? positions[0].symbol : 'BTCUSDT';
  
  // Convert TradingView symbol format to BitUnix format
  const getBitUnixSymbol = (tvSymbol) => {
    // Remove exchange prefix if present (e.g., BINANCE:BTCUSDT -> BTCUSDT)
    const cleanSymbol = tvSymbol.includes(':') ? tvSymbol.split(':')[1] : tvSymbol;
    return cleanSymbol;
  };

  useEffect(() => {
    if (containerRef.current) {
      // Store a reference to the current container to avoid closure issues
      const currentContainer = containerRef.current;
      
      // Create iframe to embed BitUnix chart
      if (!iframeRef.current) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = `${height}px`;
        iframe.style.border = 'none';
        iframe.allow = 'fullscreen';
        iframe.title = 'BitUnix Chart';
        
        // Set the source to BitUnix chart page with the correct symbol
        const bitUnixSymbol = getBitUnixSymbol(symbol);
        iframe.src = `https://www.bitunix.com/contract-trade/${bitUnixSymbol}`;
        
        currentContainer.appendChild(iframe);
        iframeRef.current = iframe;
      } else {
        // Update existing iframe height
        iframeRef.current.style.height = `${height}px`;
        
        // Update symbol if needed
        const bitUnixSymbol = getBitUnixSymbol(symbol);
        const currentSrc = iframeRef.current.src;
        const newSrc = `https://www.bitunix.com/contract-trade/${bitUnixSymbol}`;
        
        if (!currentSrc.includes(bitUnixSymbol)) {
          iframeRef.current.src = newSrc;
        }
      }
      
      // Clean up function
      return () => {
        // Clean up iframe on component unmount
        if (iframeRef.current && currentContainer) {
          currentContainer.removeChild(iframeRef.current);
          iframeRef.current = null;
        }
      };
    }
  }, [symbol, height]);

  return (
    <div 
      id="bitunix_chart" 
      className="w-full"
      ref={containerRef}
    />
  );
};

export default BitUnixChart;