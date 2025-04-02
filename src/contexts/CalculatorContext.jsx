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
  convertTimeZone: true,
  orderType: 'taker', // میکر یا تیکر بودن سفارش
  manualMargin: false, // وارد کردن مارجین بصورت دستی
  marginValue: 0, // مقدار مارجین دستی
  fundingFee: -0.0000001, // کارمزد فاندینگ فی
  deductFeeFromMargin: false, // کم کردن کارمزد از مارجین
  deductOpenFee: false, // کم کردن کارمزد باز کردن معامله
  deductCloseFee: false, // کم کردن کارمزد بستن معامله
  closeOrderType: 'taker', // میکر یا تیکر بودن کارمزد بستن معامله
  marginAfterPnl: false, // اضافه کردن مارجین بعد از محاسبه سود/زیان
};

// Default wallet settings
const defaultWalletSettings = {
  walletBalance: 10000, // Default wallet balance for cross margin mode
};

export const CalculatorProvider = ({ children }) => {
  const [positions, setPositions] = useState([]);
  const [calculations, setCalculations] = useState({});
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [bitUnixService] = useState(new BitUnixService());
  const [walletSettings, setWalletSettings] = useState(defaultWalletSettings);
  
  // Add a new position - defined with useCallback to prevent recreation on each render
  const addPosition = React.useCallback(() => {
    const newPosition = {
      ...defaultPosition,
      id: positions.length > 0 ? Math.max(...positions.map(p => p.id)) + 1 : 1,
    };
    
    setPositions(prevPositions => [...prevPositions, newPosition]);
  }, [positions]);
  
  // Initialize with one position
  useEffect(() => {
    if (positions.length === 0) {
      addPosition();
    }
  }, [positions.length, addPosition]);
  
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
  
  // Calculate position metrics based on input values - wrapped in useCallback to prevent recreation
  const calculatePositionMetrics = React.useCallback((position, crossPositions = [], walletBalance = null) => {
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
    
    // Calculate available margin based on fee deduction options and margin mode
    let availableMargin;
    
    // For cross margin mode, use wallet balance as the available margin
    if (marginMode === 'cross' && walletBalance !== null) {
      availableMargin = walletBalance;
    } else {
      availableMargin = initialMargin;
    }
    
    // Apply funding fee to available margin
    if (position.fundingFee !== 0) {
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
    
    // Recalculate unrealized PnL
    let unrealizedPnL;
    if (positionType === 'long') {
      unrealizedPnL = (currentPrice - entryPrice) * positionSize - totalFees;
    } else { // short
      unrealizedPnL = (entryPrice - currentPrice) * positionSize - totalFees;
    }
    
    // Calculate liquidation price based on margin mode
    let liquidationPrice;
    // Create an object to store the step-by-step calculation details
    const liquidationCalcSteps = {
      steps: [],
      formula: '',
      variables: {}
    };
    
    if (marginMode === 'isolated') {
      // Isolated margin liquidation price calculation
      const maintenanceMarginRate = mmr / 100;
      const maintenanceMarginPerUnit = maintenanceMarginRate * entryPrice;
      const marginPerUnit = availableMargin / positionSize;
      
      // Store variables for the calculation steps
      liquidationCalcSteps.variables = {
        entryPrice,
        positionSize,
        availableMargin,
        mmr,
        maintenanceMarginRate,
        maintenanceMarginPerUnit,
        marginPerUnit
      };
      
      if (positionType === 'long') {
        // For long positions
        liquidationCalcSteps.formula = 'Entry Price - ((Available Margin - Position Size * MMR * Entry Price) / Position Size)';
        
        // Step 1: Calculate maintenance margin
        const maintMargin = positionSize * maintenanceMarginRate * entryPrice;
        liquidationCalcSteps.steps.push({
          step: 1,
          description: 'Calculate maintenance margin',
          calculation: `${positionSize} * ${maintenanceMarginRate} * ${entryPrice} = ${maintMargin.toFixed(4)}`,
          result: maintMargin
        });
        
        // Step 2: Calculate available margin minus maintenance margin
        const marginDiff = availableMargin - maintMargin;
        liquidationCalcSteps.steps.push({
          step: 2,
          description: 'Calculate available margin minus maintenance margin',
          calculation: `${availableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} = ${marginDiff.toFixed(4)}`,
          result: marginDiff
        });
        
        // Step 3: Calculate margin per unit of position size
        const marginPerUnitCalc = marginDiff / positionSize;
        liquidationCalcSteps.steps.push({
          step: 3,
          description: 'Calculate margin per unit of position size',
          calculation: `${marginDiff.toFixed(4)} / ${positionSize} = ${marginPerUnitCalc.toFixed(4)}`,
          result: marginPerUnitCalc
        });
        
        // Step 4: Calculate liquidation price
        liquidationPrice = entryPrice - marginPerUnitCalc;
        liquidationCalcSteps.steps.push({
          step: 4,
          description: 'Calculate liquidation price',
          calculation: `${entryPrice} - ${marginPerUnitCalc.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
      } else { // short
        // For short positions
        liquidationCalcSteps.formula = 'Entry Price + ((Available Margin - Position Size * MMR * Entry Price) / Position Size)';
        
        // Step 1: Calculate maintenance margin
        const maintMargin = positionSize * maintenanceMarginRate * entryPrice;
        liquidationCalcSteps.steps.push({
          step: 1,
          description: 'Calculate maintenance margin',
          calculation: `${positionSize} * ${maintenanceMarginRate} * ${entryPrice} = ${maintMargin.toFixed(4)}`,
          result: maintMargin
        });
        
        // Step 2: Calculate available margin minus maintenance margin
        const marginDiff = availableMargin - maintMargin;
        liquidationCalcSteps.steps.push({
          step: 2,
          description: 'Calculate available margin minus maintenance margin',
          calculation: `${availableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} = ${marginDiff.toFixed(4)}`,
          result: marginDiff
        });
        
        // Step 3: Calculate margin per unit of position size
        const marginPerUnitCalc = marginDiff / positionSize;
        liquidationCalcSteps.steps.push({
          step: 3,
          description: 'Calculate margin per unit of position size',
          calculation: `${marginDiff.toFixed(4)} / ${positionSize} = ${marginPerUnitCalc.toFixed(4)}`,
          result: marginPerUnitCalc
        });
        
        // Step 4: Calculate liquidation price
        liquidationPrice = entryPrice + marginPerUnitCalc;
        liquidationCalcSteps.steps.push({
          step: 4,
          description: 'Calculate liquidation price',
          calculation: `${entryPrice} + ${marginPerUnitCalc.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
      }
    } else { // cross margin
      // For cross margin, consider all positions' margins and PnLs
      let totalAvailableMargin = walletBalance !== null ? walletBalance : availableMargin;
      let totalMaintenanceMargin = maintenanceMargin;
      let totalUnrealizedPnL = unrealizedPnL;
      
      // Store initial variables for cross margin calculation
      liquidationCalcSteps.variables = {
        entryPrice,
        positionSize,
        walletBalance: walletBalance !== null ? walletBalance : availableMargin,
        mmr,
        maintenanceMargin,
        unrealizedPnL
      };
      
      liquidationCalcSteps.steps.push({
        step: 1,
        description: 'Initial values for cross margin calculation',
        calculation: `Wallet Balance: ${totalAvailableMargin.toFixed(4)}, Maintenance Margin: ${maintenanceMargin.toFixed(4)}, Unrealized PnL: ${unrealizedPnL.toFixed(4)}`,
        result: null
      });
      
      // Add maintenance margins and PnLs from other cross positions
      let stepCounter = 2;
      crossPositions.forEach(crossPos => {
        if (crossPos.id !== position.id && crossPos.marginMode === 'cross') {
          // Add this position's maintenance margin to the total
          const crossMaintMargin = crossPos.positionSize * (crossPos.mmr / 100) * crossPos.currentPrice;
          totalMaintenanceMargin += crossMaintMargin;
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: `Add maintenance margin from position #${crossPos.id}`,
            calculation: `${totalMaintenanceMargin.toFixed(4)} + ${crossMaintMargin.toFixed(4)} = ${totalMaintenanceMargin.toFixed(4)}`,
            result: totalMaintenanceMargin
          });
          
          // Add unrealized PnL from this position
          let crossPnL;
          if (crossPos.positionType === 'long') {
            crossPnL = (crossPos.currentPrice - crossPos.entryPrice) * crossPos.positionSize;
          } else { // short
            crossPnL = (crossPos.entryPrice - crossPos.currentPrice) * crossPos.positionSize;
          }
          // Subtract trading fees from PnL
          const crossFeeRates = FEE_STRUCTURE[crossPos.vipLevel] || FEE_STRUCTURE[0];
          const crossOpenFeeRate = crossPos.orderType === 'maker' ? crossFeeRates.maker : crossFeeRates.taker;
          const crossCloseFeeRate = crossPos.closeOrderType === 'maker' ? crossFeeRates.maker : crossFeeRates.taker;
          const crossTotalFees = (crossPos.entryPrice * crossPos.positionSize) * (crossOpenFeeRate / 100) + 
                               (crossPos.currentPrice * crossPos.positionSize) * (crossCloseFeeRate / 100) - 
                               crossPos.fundingFee;
          crossPnL -= crossTotalFees;
          
          const prevTotalPnL = totalUnrealizedPnL;
          totalUnrealizedPnL += crossPnL;
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: `Add unrealized PnL from position #${crossPos.id}`,
            calculation: `${prevTotalPnL.toFixed(4)} + ${crossPnL.toFixed(4)} = ${totalUnrealizedPnL.toFixed(4)}`,
            result: totalUnrealizedPnL
          });
        }
      });
      
      // In cross mode, the total available margin is wallet balance + total unrealized PnL
      if (walletBalance !== null) {
        const prevTotalMargin = totalAvailableMargin;
        totalAvailableMargin = walletBalance + totalUnrealizedPnL;
        
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate total available margin (wallet balance + total unrealized PnL)',
          calculation: `${walletBalance.toFixed(4)} + ${totalUnrealizedPnL.toFixed(4)} = ${totalAvailableMargin.toFixed(4)}`,
          result: totalAvailableMargin
        });
      }
      
      // Calculate cross margin liquidation price
      if (positionType === 'long') {
        // How much price drop would cause liquidation
        const priceDrop = (totalAvailableMargin - totalMaintenanceMargin) / positionSize;
        liquidationPrice = entryPrice - priceDrop;
        
        liquidationCalcSteps.formula = 'Entry Price - ((Total Available Margin - Total Maintenance Margin) / Position Size)';
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate price drop that would cause liquidation',
          calculation: `(${totalAvailableMargin.toFixed(4)} - ${totalMaintenanceMargin.toFixed(4)}) / ${positionSize} = ${priceDrop.toFixed(4)}`,
          result: priceDrop
        });
        
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate liquidation price',
          calculation: `${entryPrice} - ${priceDrop.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
      } else { // short
        // How much price increase would cause liquidation
        const priceIncrease = (totalAvailableMargin - totalMaintenanceMargin) / positionSize;
        liquidationPrice = entryPrice + priceIncrease;
        
        liquidationCalcSteps.formula = 'Entry Price + ((Total Available Margin - Total Maintenance Margin) / Position Size)';
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate price increase that would cause liquidation',
          calculation: `(${totalAvailableMargin.toFixed(4)} - ${totalMaintenanceMargin.toFixed(4)}) / ${positionSize} = ${priceIncrease.toFixed(4)}`,
          result: priceIncrease
        });
        
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate liquidation price',
          calculation: `${entryPrice} + ${priceIncrease.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
      }
    }
    

    // Recalculate unrealized PnL
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
    roi = unrealizedPnL / (entryPrice * positionSize / leverage);
    
    // Calculate margin rate (ratio of maintenance margin to available margin)
    // When margin rate approaches 100%, it indicates high risk of liquidation
    // Corrected formula: as available margin decreases (more losses), margin rate increases
    let marginRate;
    
    // Calculate effective margin (available margin minus unrealized PnL if negative)
    let effectiveMargin = availableMargin;
    if (unrealizedPnL < 0) {
      // If we're in loss, reduce the effective margin
      effectiveMargin = availableMargin + unrealizedPnL;
    }
    
    if (effectiveMargin <= 0) {
      // If effective margin is zero or negative, position is already liquidated
      marginRate = 100;
    } else if (effectiveMargin <= maintenanceMargin) {
      // If effective margin is less than maintenance margin, position is at high risk
      marginRate = 99;
    } else {
      // Normal case: margin rate increases as effective margin approaches maintenance margin
      marginRate = (maintenanceMargin / effectiveMargin) * 100;
    }
    
    // Ensure margin rate is always positive and increases with risk
    if (marginRate < 0) {
      // If margin rate is negative (due to calculation issues), set to 100%
      marginRate = 100;
    }
    
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
      roi,
      marginRate,
      liquidationCalcSteps // Include the step-by-step calculation details
    };
  }, []);
  
  // Calculate all results - defined with useCallback to prevent recreation on each render
  const calculateResults = React.useCallback(() => {
    const newCalculations = {};
    let totalEquity = 0;
    let totalMaintenanceMargin = 0;
    let totalUnrealizedPnL = 0;
    
    // Get cross margin positions
    const crossPositions = positions.filter(p => p.marginMode === 'cross');
    
    // Calculate results for each position
    positions.forEach(position => {
      // For cross margin positions, pass the wallet balance and all cross positions
      const result = position.marginMode === 'cross'
        ? calculatePositionMetrics(position, crossPositions, walletSettings.walletBalance)
        : calculatePositionMetrics(position);
      
      newCalculations[position.id] = result;
      
      // Add to totals for cross margin calculations
      if (position.marginMode === 'cross') {
        totalUnrealizedPnL += result.unrealizedPnL;
        totalMaintenanceMargin += result.maintenanceMargin;
      }
    });
    
    // Add cross margin calculations if there are cross margin positions
    if (crossPositions.length > 0) {
      // For cross margin, total equity is wallet balance + total unrealized PnL
      totalEquity = walletSettings.walletBalance + totalUnrealizedPnL;
      
      newCalculations.crossMargin = {
        totalEquity,
        totalMaintenanceMargin,
        walletBalance: walletSettings.walletBalance,
        totalUnrealizedPnL,
        // Calculate cross margin liquidation threshold
        crossLiquidationThreshold: totalMaintenanceMargin / totalEquity
      };
    }
    
    setCalculations(newCalculations);
  }, [positions, calculatePositionMetrics, walletSettings.walletBalance]);
  
  // Calculate results whenever positions change
  useEffect(() => {
    calculateResults();
  }, [calculateResults]);
  
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
    bitUnixService,
    walletSettings,
    updateWalletSettings: (updates) => setWalletSettings(prev => ({ ...prev, ...updates }))
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