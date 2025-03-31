import React, { createContext, useContext, useState, useEffect } from 'react';
import BitUnixService from '../services/BitUnixService';

// Fee structure based on VIP levels
const FEE_STRUCTURE = {
  0: { maker: 0.0200, taker: 0.0600 },
  1: { maker: 0.0200, taker: 0.0500 },
  2: { maker: 0.0160, taker: 0.0500 },
  3: { maker: 0.0140, taker: 0.0400 },
  4: { maker: 0.0120, taker: 0.0375 },
  5: { maker: 0.0100, taker: 0.0350 },
  6: { maker: 0.0080, taker: 0.0315 },
  7: { maker: 0.0060, taker: 0.0300 },
};

// Create context
const CalculatorContext = createContext();

// Default position values
const defaultPosition = {
  entryPrice: 30000,
  positionSize: 1,
  leverage: 10,
  mmr: 0.5,
  vipLevel: 0,
  currentPrice: 30000,
  positionType: 'long',
  marginMode: 'isolated',
  symbol: 'BINANCE:BTCUSDT',
  entryDateTime: new Date().toISOString().slice(0, 16),
  convertTimeZone: false,
  orderType: 'taker', // میکر یا تیکر بودن سفارش
  manualMargin: false, // وارد کردن مارجین بصورت دستی
  marginValue: 0, // مقدار مارجین دستی
  fundingFee: -0.000001, // کارمزد فاندینگ فی
  deductFeeFromMargin: false, // کم کردن کارمزد از مارجین
  deductOpenFee: false, // کم کردن کارمزد باز کردن معامله
  deductCloseFee: false, // کم کردن کارمزد بستن معامله
  closeOrderType: 'taker', // میکر یا تیکر بودن کارمزد بستن معامله
  marginAfterPnl: true, // اضافه کردن مارجین بعد از محاسبه سود/زیان
};

export const CalculatorProvider = ({ children }) => {
  const [positions, setPositions] = useState([]);
  const [calculations, setCalculations] = useState({});
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [bitUnixService] = useState(new BitUnixService());
  
  // Initialize with one position
  useEffect(() => {
    if (positions.length === 0) {
      addPosition();
    }
  }, []);
  
  // Calculate results whenever positions change
  useEffect(() => {
    calculateResults();
  }, [positions]);
  
  // Add a new position
  const addPosition = () => {
    const newPosition = {
      ...defaultPosition,
      id: positions.length > 0 ? Math.max(...positions.map(p => p.id)) + 1 : 1,
    };
    
    setPositions([...positions, newPosition]);
  };
  
  // Update a position
  const updatePosition = (id, updates) => {
    setPositions(positions.map(position => 
      position.id === id ? { ...position, ...updates } : position
    ));
  };
  
  // Remove a position
  const removePosition = (id) => {
    setPositions(positions.filter(position => position.id !== id));
    
    // Also remove calculations for this position
    const newCalculations = { ...calculations };
    delete newCalculations[id];
    setCalculations(newCalculations);
  };
  
  // Calculate position metrics based on input values
  const calculatePositionMetrics = (position, crossPositions = []) => {
    const {
      entryPrice,
      positionSize,
      leverage,
      mmr,
      vipLevel,
      currentPrice,
      positionType,
      marginMode,
      manualMargin,
      marginValue
    } = position;
    
    // Get fee rates based on VIP level
    const feeRates = FEE_STRUCTURE[vipLevel] || FEE_STRUCTURE[0];
    
    // Calculate initial margin (respect manual margin if enabled)
    let initialMargin;
    if (manualMargin && marginValue > 0) {
      initialMargin = marginValue;
    } else {
      initialMargin = (entryPrice * positionSize) / leverage;
    }
    
    // Funding fee is no longer included in initial margin calculation
    // It will only affect available margin and other derived calculations
    
    // Calculate opening transaction fees based on order type (maker/taker)
    const openFeeRate = position.orderType === 'maker' ? feeRates.maker : feeRates.taker;
    const openingTransactionFees = (entryPrice * positionSize) * (openFeeRate / 100);
    
    // Calculate closing transaction fees based on close order type (maker/taker)
    const closeFeeRate = position.closeOrderType === 'maker' ? feeRates.maker : feeRates.taker;
    const closingTransactionFees = (currentPrice * positionSize) * (closeFeeRate / 100);
    
    // Calculate available margin based on fee deduction options
    let availableMargin = initialMargin;
    
    // Apply funding fee to available margin
    if (position.fundingFee != 0) {
      availableMargin += position.fundingFee;
    }
    
    // If deducting fees from margin, adjust the available margin
    if (position.deductFeeFromMargin) {
      if (position.deductOpenFee) {
        availableMargin -= openingTransactionFees;
      }
      if (position.deductCloseFee) {
        availableMargin -= closingTransactionFees;
      }
    }
    
    // Calculate break-even price (entry price adjusted for fees)
    let breakEvenPrice;
    // Calculate total fees including opening and closing fees
    const totalFees = openingTransactionFees + closingTransactionFees - position.fundingFee;
    const feesPerUnit = totalFees / positionSize;
    
    if (positionType === 'long') {
      breakEvenPrice = entryPrice + feesPerUnit;
    } else { // short
      breakEvenPrice = entryPrice - feesPerUnit;
    }
    
    // Calculate cost value based on fee deduction options
    // Cost value is just the initial margin since funding fee is not included in initial margin
    let costValue = initialMargin;
    
    // Add opening fees if not deducted from margin
    if (!position.deductFeeFromMargin || !position.deductOpenFee) {
      costValue += openingTransactionFees;
    }
    
    // Calculate nominal value (Entry Price * Position Size)
    const nominalValue = entryPrice * positionSize;
    
    // Calculate trading fees based on order type (maker/taker)
    const tradingFees = nominalValue * (openFeeRate / 100 + closeFeeRate / 100);
    
    // Calculate maintenance margin 
    const maintenanceMargin = positionSize * (mmr / 100) * currentPrice;
    
  
    // Calculate liquidation price based on margin mode
    let liquidationPrice;
    
    if (marginMode === 'isolated') {
      // Isolated margin liquidation price calculation
      if (positionType === 'long') {
        liquidationPrice = entryPrice - ((availableMargin - positionSize * (mmr / 100) * entryPrice) / positionSize);
      } else { // short
        liquidationPrice = entryPrice + ((availableMargin - positionSize * (mmr / 100) * entryPrice) / positionSize);
      }
    } else { // cross margin
      // For cross margin, consider all positions' margins and PnLs
      let totalAvailableMargin = availableMargin;
      let totalMaintenanceMargin = maintenanceMargin;
      
      // Add margins and maintenance margins from other cross positions
      crossPositions.forEach(crossPos => {
        if (crossPos.id !== position.id) {
          // Add this position's margin to the total
          const crossMargin = crossPos.manualMargin && crossPos.marginValue > 0 ? 
            crossPos.marginValue : 
            (crossPos.entryPrice * crossPos.positionSize) / crossPos.leverage;
          
          totalAvailableMargin += crossMargin;
          
          // Add this position's maintenance margin to the total
          const crossMaintMargin = crossPos.positionSize * (crossPos.mmr / 100) * crossPos.currentPrice;
          totalMaintenanceMargin += crossMaintMargin;
          
          // Add unrealized PnL from this position
          let crossPnL;
          if (crossPos.positionType === 'long') {
            crossPnL = (crossPos.currentPrice - crossPos.entryPrice) * crossPos.positionSize;
          } else { // short
            crossPnL = (crossPos.entryPrice - crossPos.currentPrice) * crossPos.positionSize;
          }
          totalAvailableMargin += crossPnL;
        }
      });
      
      // Calculate cross margin liquidation price
      if (positionType === 'long') {
        // How much price drop would cause liquidation
        const priceDrop = (totalAvailableMargin - totalMaintenanceMargin) / positionSize;
        liquidationPrice = entryPrice - priceDrop;
      } else { // short
        // How much price increase would cause liquidation
        const priceIncrease = (totalAvailableMargin - totalMaintenanceMargin) / positionSize;
        liquidationPrice = entryPrice + priceIncrease;
      }
    }
    

    // Calculate unrealized PnL
    let unrealizedPnL;
    if (positionType === 'long') {
      unrealizedPnL = (currentPrice - entryPrice) * positionSize - totalFees;
    } else { // short
      unrealizedPnL = (entryPrice - currentPrice) * positionSize - totalFees;
    }
    
    // Apply margin after PNL if enabled
    if (position.marginAfterPnl) {
      availableMargin += unrealizedPnL;
    }
    
    // Calculate ROI
    let roi;
    roi = (unrealizedPnL * leverage) / (entryPrice * positionSize);
    
    return {
      availableMargin,
      costValue,
      nominalValue,
      tradingFees,
      initialMargin,
      maintenanceMargin,
      liquidationPrice,
      unrealizedPnL,
      breakEvenPrice,
      roi
    };
  };
  
  // Calculate all results
  const calculateResults = () => {
    const newCalculations = {};
    let totalEquity = 0;
    let totalMaintenanceMargin = 0;
    
    positions.forEach(position => {
      const result = calculatePositionMetrics(position);
      newCalculations[position.id] = result;
      
      // Add to totals for cross margin calculations
      totalEquity += result.availableMargin + result.unrealizedPnL;
      totalMaintenanceMargin += result.maintenanceMargin;
    });
    
    // Add cross margin calculations if there are multiple positions
    if (positions.length > 1) {
      newCalculations.crossMargin = {
        totalEquity,
        totalMaintenanceMargin,
        // Calculate cross margin liquidation threshold (simplified)
        crossLiquidationThreshold: totalMaintenanceMargin / totalEquity
      };
    }
    
    setCalculations(newCalculations);
  };
  
  // Update BitUnix service credentials when API key or secret changes
  useEffect(() => {
    if (apiKey && apiSecret) {
      bitUnixService.setCredentials(apiKey, apiSecret);
    }
  }, [apiKey, apiSecret, bitUnixService]);

  // Provide context value
  const contextValue = {
    positions,
    calculations,
    addPosition,
    updatePosition,
    removePosition,
    apiKey,
    setApiKey,
    apiSecret,
    setApiSecret,
    bitUnixService
  };
  
  return (
    <CalculatorContext.Provider value={contextValue}>
      {children}
    </CalculatorContext.Provider>
  );
};

// Custom hook to use the calculator context
export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
}