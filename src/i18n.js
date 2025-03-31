import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    orderType: 'taker', // Order type (maker or taker)
    manualMargin: false, // Manual margin input
    marginValue: 0, // Manual margin value
    fundingFee: 0, // Funding fee
    resources: {
      en: {
        translation: {
          basicInformation: 'Basic Information',
          orderSettings: 'Order Settings',
          positionSettings: 'Position Settings',
          timeSettings: 'Time Settings',
          feeSettings: 'Fee Settings',
          app: {
            name: 'Crypto Futures Calculator',
            title: 'Cryptocurrency Futures Calculator',
            footerText: 'Crypto Futures Calculator. All rights reserved.'
          },
          inputs: {
            entryPrice: 'Entry Price',
            positionSize: 'Position Size',
            leverage: 'Leverage',
            mmr: 'Maintenance Margin Requirement (%)',
            vipLevel: 'VIP Level',
            closePrice: 'Close Price',
            currentPrice: 'Close Price',
            positionType: 'Position Type',
            long: 'Long',
            short: 'Short',
            marginMode: 'Margin Mode',
            isolated: 'Isolated',
            cross: 'Cross',
            symbol: 'Trading Pair'
          },
          outputs: {
            availableMargin: 'Available Margin',
            liquidationPrice: 'Liquidation Price',
            costValue: 'Cost Value',
            nominalValue: 'Nominal Value',
            tradingFees: 'Trading Fees',
            initialMargin: 'Initial Margin',
            maintenanceMargin: 'Maintenance Margin',
            unrealizedPnL: 'PnL',
            breakEvenPrice: 'Break-Even Price',
            totalEquity: 'Total Equity',
            totalMaintenanceMargin: 'Total Maintenance Margin',
            crossLiquidationThreshold: 'Cross Liquidation Threshold',
            liquidationWarning: 'Warning: High liquidation risk!',
            roi: 'ROI'
          },
          buttons: {
            addPosition: 'Add Position',
            removePosition: 'Remove Position',
            calculate: 'Calculate'
          },
          vipLevels: {
            0: 'VIP 0',
            1: 'VIP 1',
            2: 'VIP 2',
            3: 'VIP 3',
            4: 'VIP 4',
            5: 'VIP 5',
            6: 'VIP 6',
            7: 'VIP 7'
          },
          position: 'Position',
          chart: {
            title: 'Price Chart'
          },
          theme: {
            switchToLight: 'Switch to Light Mode',
            switchToDark: 'Switch to Dark Mode'
          },
          apiSettings: {
            title: 'BitUnix API Settings',
            apiKey: 'API Key',
            apiSecret: 'API Secret',
            enterApiKey: 'Enter your BitUnix API key',
            enterApiSecret: 'Enter your BitUnix API secret',
            disclaimer: 'Your API credentials are stored locally and never sent to our servers.'
          },
          settings: {
            title: 'Settings',
            settingsButton: 'Settings'
          },
          dateTime: {
            entryDateTime: 'Entry Date & Time',
            convertTimeZone: 'Convert from UTC+8 to UTC+3:30',
            enterDateTime: 'Enter date and time (UTC+8)'
          },
          trading: {
            fundingFee: 'Funding Fee',
            manualMargin: 'Manual Margin Input',
            marginValue: 'Margin Value',
            maker: 'Maker',
            taker: 'Taker',
            orderType: 'Open Order Type',
            deductFeeFromMargin: 'Deduct Fees from Margin',
            deductOpenFee: 'Deduct Opening Fee',
            deductCloseFee: 'Deduct Closing Fee',
            closeOrderType: 'Closing Order Type',
            marginAfterPnl: 'Margin After PNL'
          }
        }
      },
      fa: {
        translation: {
          basicInformation: 'اطلاعات اصلی',
          orderSettings: 'تنظیمات سفارش',
          positionSettings: 'تنظیمات پوزیشن',
          timeSettings: 'تنظیمات زمان',
          feeSettings: 'تنظیمات کارمزد',
          app: {
            name: 'محاسبه‌گر معاملات آتی ارز دیجیتال',
            title: 'محاسبه‌گر معاملات آتی ارز دیجیتال',
            footerText: 'محاسبه‌گر معاملات آتی ارز دیجیتال. تمامی حقوق محفوظ است.'
          },
          inputs: {
            entryPrice: 'قیمت ورود',
            positionSize: 'اندازه موقعیت',
            leverage: 'اهرم',
            mmr: 'حاشیه نگهداری (%)',
            vipLevel: 'سطح VIP',
            currentPrice: 'قیمت بستن',
            positionType: 'نوع موقعیت',
            long: 'خرید',
            short: 'فروش',
            marginMode: 'حالت حاشیه',
            isolated: 'ایزوله',
            cross: 'کراس',
            symbol: 'جفت ارز'
          },
          outputs: {
            availableMargin: 'حاشیه در دسترس',
            liquidationPrice: 'قیمت لیکویید',
            costValue: 'ارزش هزینه‌ای',
            nominalValue: 'ارزش اسمی',
            tradingFees: 'کارمزد معامله',
            initialMargin: 'حاشیه اولیه',
            maintenanceMargin: 'حاشیه نگهداری',
            unrealizedPnL: 'سود/زیان تحقق نیافته',
            breakEvenPrice: 'قیمت سر به سر',
            totalEquity: 'کل سرمایه',
            totalMaintenanceMargin: 'کل حاشیه نگهداری',
            crossLiquidationThreshold: 'آستانه لیکویید متقاطع',
            liquidationWarning: 'هشدار: خطر لیکویید بالا!',
            roi: 'بازده سرمایه‌گذاری'
          },
          buttons: {
            addPosition: 'افزودن موقعیت',
            removePosition: 'حذف موقعیت',
            calculate: 'محاسبه'
          },
          vipLevels: {
            0: 'VIP 0',
            1: 'VIP 1',
            2: 'VIP 2',
            3: 'VIP 3',
            4: 'VIP 4',
            5: 'VIP 5',
            6: 'VIP 6',
            7: 'VIP 7'
          },
          position: 'موقعیت',
          chart: {
            title: 'نمودار قیمت'
          },
          theme: {
            switchToLight: 'تغییر به حالت روشن',
            switchToDark: 'تغییر به حالت تاریک'
          },
          apiSettings: {
            title: 'تنظیمات API بیت یونیکس',
            apiKey: 'کلید API',
            apiSecret: 'رمز API',
            enterApiKey: 'کلید API بیت یونیکس خود را وارد کنید',
            enterApiSecret: 'رمز API بیت یونیکس خود را وارد کنید',
            disclaimer: 'اطلاعات API شما به صورت محلی ذخیره می‌شود و هرگز به سرورهای ما ارسال نمی‌شود.'
          },
          settings: {
            title: 'تنظیمات',
            settingsButton: 'تنظیمات'
          },
          dateTime: {
            entryDateTime: 'تاریخ و زمان ورود',
            convertTimeZone: 'تبدیل از UTC+8 به UTC+3:30',
            enterDateTime: 'تاریخ و زمان را وارد کنید (UTC+8)'
          },
          trading: {
            fundingFee: 'کارمزد فاندینگ',
            manualMargin: 'وارد کردن مارجین دستی',
            marginValue: 'مقدار مارجین',
            maker: 'میکر',
            taker: 'تیکر',
            orderType: 'نوع سفارش باز کردن',
            deductFeeFromMargin: 'کسر کارمزد از مارجین',
            deductOpenFee: 'کسر کارمزد باز کردن معامله',
            deductCloseFee: 'کسر کارمزد بستن معامله',
            closeOrderType: 'نوع سفارش بستن معامله',
            marginAfterPnl: 'مارجین بعد از سود/زیان'
          }
        }
      }
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;