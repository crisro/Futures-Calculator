# Cryptocurrency Futures Calculator

A sophisticated web application for calculating liquidation and other key metrics in cryptocurrency futures trading. This application provides a user-friendly interface for traders to calculate important metrics such as liquidation price, available margin, cost value, and more.

## Features

- **Core Calculations**: Liquidation price, available margin, cost value, nominal value, and more
- **Multiple Positions**: Support for both isolated and cross margin modes
- **Fee Structure**: VIP-level-based fee calculations
- **TradingView Integration**: Real-time price charts
- **Multilingual Support**: English and Persian languages
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm start
# or
yarn start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter your position details (entry price, position size, leverage, etc.)
2. Select your VIP level
3. Choose between isolated or cross margin mode
4. View the calculated metrics including liquidation price
5. Add multiple positions if needed
6. Toggle between light and dark themes as preferred
7. Switch between English and Persian languages

## Calculations

### Available Margin
Available Margin = (Average Open Price * Position Size) / Leverage

### Liquidation Price
- For long positions: Liquidation Price = Average Open Price - ((Available Margin - Position Size * MMR% * Average Open Price) / Position Size)
- For short positions: Liquidation Price = Average Open Price + ((Available Margin - Position Size * MMR% * Average Open Price) / Position Size)

### Cost Value
Cost Value = Average Open Price * Position Size

### Nominal Value
Nominal Value = Position Size * Current Market Price

### Unrealized PnL
- For long positions: Unrealized PnL = (Current Price - Average Open Price) * Position Size
- For short positions: Unrealized PnL = (Average Open Price - Current Price) * Position Size

## License

MIT#   F u t u r e s - C a l c u l a t o r  
 