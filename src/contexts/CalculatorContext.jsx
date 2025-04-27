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
  includeLiquidationFee: false, // Include liquidation fee in liquidation price calculation
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
    
    // Create an object to store the step-by-step fee calculation details
    const feeCalcSteps = {
      steps: [],
      formula: '',
      variables: {}
    };
    
    // Store variables for the fee calculation steps
    feeCalcSteps.variables = {
      entryPrice,
      currentPrice,
      positionSize,
      vipLevel,
      orderType: position.orderType,
      closeOrderType: position.closeOrderType,
      fundingFee: position.fundingFee
    };
    
    // Calculate opening transaction fees based on order type (maker/taker)
    const openFeeRate = position.orderType === 'maker' ? feeRates.maker : feeRates.taker;
    const openingTransactionFees = (entryPrice * positionSize) * (openFeeRate / 100);
    
    // Add step for opening fee calculation
    feeCalcSteps.steps.push({
      step: 1,
      description: 'Calculate opening transaction fees',
      calculation: `opening fee = avrage entery price * size * fee rate = (${entryPrice} * ${positionSize}) * (${openFeeRate} / 100) = ${openingTransactionFees.toFixed(4)}`,
      result: openingTransactionFees
    });
    
    // Calculate closing transaction fees based on close order type (maker/taker)
    const closeFeeRate = position.closeOrderType === 'maker' ? feeRates.maker : feeRates.taker;
    const closingTransactionFees = (currentPrice * positionSize) * (closeFeeRate / 100);
    
    // Add step for closing fee calculation
    feeCalcSteps.steps.push({
      step: 2,
      description: 'Calculate closing transaction fees',
      calculation: `closing fee = avrage closing price * size * fee rate = (${currentPrice} * ${positionSize}) * (${closeFeeRate} / 100) = ${closingTransactionFees.toFixed(4)}`,
      result: closingTransactionFees
    });
    
    // Funding fee step removed as per requirements
    
    // Calculate available margin based on fee deduction options and margin mode
    let availableMargin;
    
    // For cross margin mode, use wallet balance as the available margin
    if (marginMode === 'cross' && walletBalance !== null) {
      availableMargin = walletBalance;
    } else {
      availableMargin = initialMargin;
    }
    
    // Initial available margin step removed as per requirements
    let stepCounter = 7;
    
    // We're not applying funding fee to available margin as per requirements
    
    // If deducting fees from margin, adjust the available margin
    if (position.deductFeeFromMargin) {
      if (position.deductOpenFee) {
        const prevMargin = availableMargin;
        availableMargin -= openingTransactionFees;
        
        feeCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Deduct opening fees from margin',
          calculation: `${prevMargin.toFixed(4)} - ${openingTransactionFees.toFixed(4)} = ${availableMargin.toFixed(4)}`,
          result: availableMargin
        });
      }
      if (position.deductCloseFee) {
        const prevMargin = availableMargin;
        availableMargin -= closingTransactionFees;
        
        feeCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Deduct closing fees from margin',
          calculation: `${prevMargin.toFixed(4)} - ${closingTransactionFees.toFixed(4)} = ${availableMargin.toFixed(4)}`,
          result: availableMargin
        });
      }
    }
    
    // Calculate break-even price (entry price adjusted for fees)
    let breakEvenPrice;
    // Calculate total fees including opening and closing fees
    const totalFees = openingTransactionFees + closingTransactionFees - position.fundingFee;
    
    // Add step for total fees calculation
    feeCalcSteps.steps.push({
      step: 4,
      description: 'Calculate total fees',
      calculation: `Trasnction fee = opening fee + closing fee = ${openingTransactionFees.toFixed(4)} + ${closingTransactionFees.toFixed(4)} = ${(openingTransactionFees + closingTransactionFees).toFixed(4)}`,
      result: openingTransactionFees + closingTransactionFees
    });
    
    const feesPerUnit = totalFees / positionSize;
    
    // Fees per unit calculation step removed as per requirements
    
    // Only calculate break-even price for short positions as per requirements
    if (positionType === 'long') {
      breakEvenPrice = entryPrice + feesPerUnit;
    } else { // short
      breakEvenPrice = entryPrice - feesPerUnit;
      
      // Add step for break-even price calculation (short)
      feeCalcSteps.formula = 'Entry Price - Fees Per Unit';
      feeCalcSteps.steps.push({
        step: 6,
        description: 'Calculate break-even price (short position)',
        calculation: `${entryPrice} - ${feesPerUnit.toFixed(4)} = ${breakEvenPrice.toFixed(4)}`,
        result: breakEvenPrice
      });
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
    
    // Create an object to store the step-by-step PNL calculation details
    const pnlCalcSteps = {
      steps: [],
      formula: '',
      variables: {}
    };
    
    // Store variables for the PNL calculation steps
    pnlCalcSteps.variables = {
      entryPrice,
      currentPrice,
      positionSize,
      positionType,
      totalFees
    };
    
    if (positionType === 'long') {
      // For long positions
      pnlCalcSteps.formula = 'PNL = (Current Price - Entry Price) * Position Size - Total Fees';
      
      // Step 1: Calculate price difference
      const priceDiff = currentPrice - entryPrice;
      pnlCalcSteps.steps.push({
        step: 1,
        description: 'Calculate price difference',
        calculation: `${currentPrice} - ${entryPrice} = ${priceDiff.toFixed(4)}`,
        result: priceDiff
      });
      
      // Step 2: Multiply by position size
      const rawPnl = priceDiff * positionSize;
      pnlCalcSteps.steps.push({
        step: 2,
        description: 'Multiply price difference by position size',
        calculation: `${priceDiff.toFixed(4)} * ${positionSize} = ${rawPnl.toFixed(4)}`,
        result: rawPnl
      });
      
      // Step 3: Subtract total fees
      unrealizedPnL = rawPnl - totalFees;
      pnlCalcSteps.steps.push({
        step: 3,
        description: 'Subtract total fees',
        calculation: `${rawPnl.toFixed(4)} - ${totalFees.toFixed(4)} = ${unrealizedPnL.toFixed(4)}`,
        result: unrealizedPnL
      });
    } else { // short
      // For short positions
      pnlCalcSteps.formula = 'PNL = (Entry Price - Current Price) * Position Size - Total Fees';
      
      // Step 1: Calculate price difference
      const priceDiff = entryPrice - currentPrice;
      pnlCalcSteps.steps.push({
        step: 1,
        description: 'Calculate price difference',
        calculation: `${entryPrice} - ${currentPrice} = ${priceDiff.toFixed(4)}`,
        result: priceDiff
      });
      
      // Step 2: Multiply by position size
      const rawPnl = priceDiff * positionSize;
      pnlCalcSteps.steps.push({
        step: 2,
        description: 'Multiply price difference by position size',
        calculation: `${priceDiff.toFixed(4)} * ${positionSize} = ${rawPnl.toFixed(4)}`,
        result: rawPnl
      });
      
      // Step 3: Subtract total fees
      unrealizedPnL = rawPnl - totalFees;
      pnlCalcSteps.steps.push({
        step: 3,
        description: 'Subtract total fees',
        calculation: `${rawPnl.toFixed(4)} - ${totalFees.toFixed(4)} = ${unrealizedPnL.toFixed(4)}`,
        result: unrealizedPnL
      });
    }
    
    // Calculate liquidation price based on margin mode
    let liquidationPrice;
    // Create an object to store the step-by-step calculation details
    const liquidationCalcSteps = {
      steps: [],
      formula: '',
      variables: {}
    };
    
    // Calculate liquidation fee if enabled
    let liquidationFee = 0;
    if (position.includeLiquidationFee) {
      // Liquidation fee is 0.025% * exit price * size
      // For liquidation calculation, we use the liquidation price as the exit price
      // Since we don't know the liquidation price yet, we'll use a two-step approach
      // First calculate without fee, then adjust with fee
      const liquidationFeeRate = 0.00025; // 0.025%
      liquidationCalcSteps.steps.push({
        step: liquidationCalcSteps.steps.length + 1,
        description: 'Note: Including liquidation fee in calculation',
        calculation: `Liquidation fee rate: ${liquidationFeeRate * 100}% (0.025%)`,
        result: null
      });
    }
    
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
        
        // Step 4: Calculate liquidation price (without fee initially)
        liquidationPrice = entryPrice - marginPerUnitCalc;
        liquidationCalcSteps.steps.push({
          step: 4,
          description: 'Calculate initial liquidation price',
          calculation: `${entryPrice} - ${marginPerUnitCalc.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
        
        // Step 5: Adjust liquidation price if liquidation fee is enabled
        if (position.includeLiquidationFee) {
          const liquidationFeeRate = 0.00025; // 0.025%
          const initialLiqPrice = liquidationPrice;
          
          // For long positions, liquidation fee reduces the liquidation price
          // Liquidation fee = liquidation fee rate * liquidation price * position size
          // This fee effectively reduces available margin, so liquidation happens earlier
          
          // Calculate liquidation fee based on initial liquidation price
          liquidationFee = liquidationFeeRate * initialLiqPrice * positionSize;
          
          // Recalculate margin difference with fee included
          const adjustedMarginDiff = availableMargin - maintMargin - liquidationFee;
          
          // Recalculate margin per unit
          const adjustedMarginPerUnit = adjustedMarginDiff / positionSize;
          
          // Recalculate liquidation price
          liquidationPrice = entryPrice - adjustedMarginPerUnit;
          
          liquidationCalcSteps.steps.push({
            step: 5,
            description: 'Calculate liquidation fee',
            calculation: `${liquidationFeeRate} * ${initialLiqPrice.toFixed(4)} * ${positionSize} = ${liquidationFee.toFixed(4)}`,
            result: liquidationFee
          });
          
          liquidationCalcSteps.steps.push({
            step: 6,
            description: 'Adjust margin difference with liquidation fee',
            calculation: `${availableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} - ${liquidationFee.toFixed(4)} = ${adjustedMarginDiff.toFixed(4)}`,
            result: adjustedMarginDiff
          });
          
          liquidationCalcSteps.steps.push({
            step: 7,
            description: 'Recalculate margin per unit',
            calculation: `${adjustedMarginDiff.toFixed(4)} / ${positionSize} = ${adjustedMarginPerUnit.toFixed(4)}`,
            result: adjustedMarginPerUnit
          });
          
          liquidationCalcSteps.steps.push({
            step: 8,
            description: 'Calculate final liquidation price with fee',
            calculation: `${entryPrice} - ${adjustedMarginPerUnit.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
            result: liquidationPrice
          });
        }
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
        
        // Step 4: Calculate liquidation price (without fee initially)
        liquidationPrice = entryPrice + marginPerUnitCalc;
        liquidationCalcSteps.steps.push({
          step: 4,
          description: 'Calculate initial liquidation price',
          calculation: `${entryPrice} + ${marginPerUnitCalc.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
        
        // Step 5: Adjust liquidation price if liquidation fee is enabled
        if (position.includeLiquidationFee) {
          const liquidationFeeRate = 0.00025; // 0.025%
          const initialLiqPrice = liquidationPrice;
          
          // For short positions, liquidation fee increases the liquidation price
          // Liquidation fee = liquidation fee rate * liquidation price * position size
          // This fee effectively reduces available margin, so liquidation happens earlier
          
          // Calculate liquidation fee based on initial liquidation price
          liquidationFee = liquidationFeeRate * initialLiqPrice * positionSize;
          
          // Recalculate margin difference with fee included
          const adjustedMarginDiff = availableMargin - maintMargin - liquidationFee;
          
          // Recalculate margin per unit
          const adjustedMarginPerUnit = adjustedMarginDiff / positionSize;
          
          // Recalculate liquidation price
          liquidationPrice = entryPrice + adjustedMarginPerUnit;
          
          liquidationCalcSteps.steps.push({
            step: 5,
            description: 'Calculate liquidation fee',
            calculation: `${liquidationFeeRate} * ${initialLiqPrice.toFixed(4)} * ${positionSize} = ${liquidationFee.toFixed(4)}`,
            result: liquidationFee
          });
          
          liquidationCalcSteps.steps.push({
            step: 6,
            description: 'Adjust margin difference with liquidation fee',
            calculation: `${availableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} - ${liquidationFee.toFixed(4)} = ${adjustedMarginDiff.toFixed(4)}`,
            result: adjustedMarginDiff
          });
          
          liquidationCalcSteps.steps.push({
            step: 7,
            description: 'Recalculate margin per unit',
            calculation: `${adjustedMarginDiff.toFixed(4)} / ${positionSize} = ${adjustedMarginPerUnit.toFixed(4)}`,
            result: adjustedMarginPerUnit
          });
          
          liquidationCalcSteps.steps.push({
            step: 8,
            description: 'Calculate final liquidation price with fee',
            calculation: `${entryPrice} + ${adjustedMarginPerUnit.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
            result: liquidationPrice
          });
        }
      }
    } else { // cross margin
      // For cross margin, use isolated margin formula but with Total Available Margin
      // Calculate total available margin from wallet balance and unrealized PnL
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
        totalAvailableMargin = walletBalance + totalUnrealizedPnL;
        
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate total available margin (wallet balance + total unrealized PnL)',
          calculation: `${walletBalance.toFixed(4)} + ${totalUnrealizedPnL.toFixed(4)} = ${totalAvailableMargin.toFixed(4)}`,
          result: totalAvailableMargin
        });
      }
      
      // Use isolated margin formula but with Total Available Margin instead of Available Margin
      const maintenanceMarginRate = mmr / 100;
      const maintenanceMarginPerUnit = maintenanceMarginRate * entryPrice;
      const marginPerUnit = totalAvailableMargin / positionSize;
      
      liquidationCalcSteps.steps.push({
        step: stepCounter++,
        description: 'Calculate maintenance margin per unit',
        calculation: `${maintenanceMarginRate} * ${entryPrice} = ${maintenanceMarginPerUnit.toFixed(4)}`,
        result: maintenanceMarginPerUnit
      });
      
      liquidationCalcSteps.steps.push({
        step: stepCounter++,
        description: 'Calculate total available margin per unit',
        calculation: `${totalAvailableMargin.toFixed(4)} / ${positionSize} = ${marginPerUnit.toFixed(4)}`,
        result: marginPerUnit
      });
      
      if (positionType === 'long') {
        // For long positions - using isolated formula with total available margin
        liquidationCalcSteps.formula = 'Entry Price - ((Total Available Margin - Position Size * MMR * Entry Price) / Position Size)';
        
        // Step 1: Calculate maintenance margin
        const maintMargin = positionSize * maintenanceMarginRate * entryPrice;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate maintenance margin',
          calculation: `${positionSize} * ${maintenanceMarginRate} * ${entryPrice} = ${maintMargin.toFixed(4)}`,
          result: maintMargin
        });
        
        // Step 2: Calculate total available margin minus maintenance margin
        const marginDiff = totalAvailableMargin - maintMargin;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate total available margin minus maintenance margin',
          calculation: `${totalAvailableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} = ${marginDiff.toFixed(4)}`,
          result: marginDiff
        });
        
        // Step 3: Calculate margin per unit of position size
        const marginPerUnitCalc = marginDiff / positionSize;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate margin per unit of position size',
          calculation: `${marginDiff.toFixed(4)} / ${positionSize} = ${marginPerUnitCalc.toFixed(4)}`,
          result: marginPerUnitCalc
        });
        
        // Step 4: Calculate liquidation price (without fee initially)
        liquidationPrice = entryPrice - marginPerUnitCalc;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate initial liquidation price',
          calculation: `${entryPrice} - ${marginPerUnitCalc.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
        
        // Step 5: Adjust liquidation price if liquidation fee is enabled
        if (position.includeLiquidationFee) {
          const liquidationFeeRate = 0.00025; // 0.025%
          const initialLiqPrice = liquidationPrice;
          
          // For long positions, liquidation fee reduces the liquidation price
          // Liquidation fee = liquidation fee rate * liquidation price * position size
          // This fee effectively reduces available margin, so liquidation happens earlier
          
          // Calculate liquidation fee based on initial liquidation price
          liquidationFee = liquidationFeeRate * initialLiqPrice * positionSize;
          
          // Recalculate margin difference with fee included
          const adjustedMarginDiff = totalAvailableMargin - maintMargin - liquidationFee;
          
          // Recalculate margin per unit
          const adjustedMarginPerUnit = adjustedMarginDiff / positionSize;
          
          // Recalculate liquidation price
          liquidationPrice = entryPrice - adjustedMarginPerUnit;
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Calculate liquidation fee',
            calculation: `${liquidationFeeRate} * ${initialLiqPrice.toFixed(4)} * ${positionSize} = ${liquidationFee.toFixed(4)}`,
            result: liquidationFee
          });
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Adjust margin difference with liquidation fee',
            calculation: `${totalAvailableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} - ${liquidationFee.toFixed(4)} = ${adjustedMarginDiff.toFixed(4)}`,
            result: adjustedMarginDiff
          });
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Recalculate margin per unit',
            calculation: `${adjustedMarginDiff.toFixed(4)} / ${positionSize} = ${adjustedMarginPerUnit.toFixed(4)}`,
            result: adjustedMarginPerUnit
          });
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Calculate final liquidation price with fee',
            calculation: `${entryPrice} - ${adjustedMarginPerUnit.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
            result: liquidationPrice
          });
        }
      } else { // short
        // For short positions - using isolated formula with total available margin
        liquidationCalcSteps.formula = 'Entry Price + ((Total Available Margin - Position Size * MMR * Entry Price) / Position Size)';
        
        // Step 1: Calculate maintenance margin
        const maintMargin = positionSize * maintenanceMarginRate * entryPrice;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate maintenance margin',
          calculation: `${positionSize} * ${maintenanceMarginRate} * ${entryPrice} = ${maintMargin.toFixed(4)}`,
          result: maintMargin
        });
        
        // Step 2: Calculate total available margin minus maintenance margin
        const marginDiff = totalAvailableMargin - maintMargin;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate total available margin minus maintenance margin',
          calculation: `${totalAvailableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} = ${marginDiff.toFixed(4)}`,
          result: marginDiff
        });
        
        // Step 3: Calculate margin per unit of position size
        const marginPerUnitCalc = marginDiff / positionSize;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate margin per unit of position size',
          calculation: `${marginDiff.toFixed(4)} / ${positionSize} = ${marginPerUnitCalc.toFixed(4)}`,
          result: marginPerUnitCalc
        });
        
        // Step 4: Calculate liquidation price (without fee initially)
        liquidationPrice = entryPrice + marginPerUnitCalc;
        liquidationCalcSteps.steps.push({
          step: stepCounter++,
          description: 'Calculate initial liquidation price',
          calculation: `${entryPrice} + ${marginPerUnitCalc.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
          result: liquidationPrice
        });
        
        // Step 5: Adjust liquidation price if liquidation fee is enabled
        if (position.includeLiquidationFee) {
          const liquidationFeeRate = 0.00025; // 0.025%
          const initialLiqPrice = liquidationPrice;
          
          // For short positions, liquidation fee increases the liquidation price
          // Liquidation fee = liquidation fee rate * liquidation price * position size
          // This fee effectively reduces available margin, so liquidation happens earlier
          
          // Calculate liquidation fee based on initial liquidation price
          liquidationFee = liquidationFeeRate * initialLiqPrice * positionSize;
          
          // Recalculate margin difference with fee included
          const adjustedMarginDiff = totalAvailableMargin - maintMargin - liquidationFee;
          
          // Recalculate margin per unit
          const adjustedMarginPerUnit = adjustedMarginDiff / positionSize;
          
          // Recalculate liquidation price
          liquidationPrice = entryPrice + adjustedMarginPerUnit;
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Calculate liquidation fee',
            calculation: `${liquidationFeeRate} * ${initialLiqPrice.toFixed(4)} * ${positionSize} = ${liquidationFee.toFixed(4)}`,
            result: liquidationFee
          });
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Adjust margin difference with liquidation fee',
            calculation: `${totalAvailableMargin.toFixed(4)} - ${maintMargin.toFixed(4)} - ${liquidationFee.toFixed(4)} = ${adjustedMarginDiff.toFixed(4)}`,
            result: adjustedMarginDiff
          });
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Recalculate margin per unit',
            calculation: `${adjustedMarginDiff.toFixed(4)} / ${positionSize} = ${adjustedMarginPerUnit.toFixed(4)}`,
            result: adjustedMarginPerUnit
          });
          
          liquidationCalcSteps.steps.push({
            step: stepCounter++,
            description: 'Calculate final liquidation price with fee',
            calculation: `${entryPrice} + ${adjustedMarginPerUnit.toFixed(4)} = ${liquidationPrice.toFixed(4)}`,
            result: liquidationPrice
          });
        }
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
    
    // Filter out the specified calculation steps before returning
    const filteredFeeCalcSteps = {
      ...feeCalcSteps,
      steps: feeCalcSteps.steps.filter(step => {
        // Filter out steps related to fees per unit, initial available margin, and funding fee
        return !(
          step.description.includes('Calculate fees per unit') ||
          step.description.includes('Set initial available margin') ||
          step.description.includes('Apply funding fee')
        );
      })
    };
    
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
      liquidationCalcSteps, // Include the step-by-step liquidation calculation details
      feeCalcSteps: filteredFeeCalcSteps, // Include the filtered step-by-step fee calculation details
      pnlCalcSteps // Include the step-by-step PNL calculation details
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