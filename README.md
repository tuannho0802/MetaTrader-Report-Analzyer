# MetaTrader Report Analyzer

A professional, privacy-first trading journal and analytics tool for MetaTrader 4 (MT4) and MetaTrader 5 (MT5).

🌐 **Bilingual Support** – Fully localized in **English** and **Tiếng Việt** with persistent settings.

## 🚀 Overview

**MetaTrader Report Analyzer** (formerly MT4 EA Profit Filter) is a high-performance web application that allows traders to deep-dive into their trading performance. Processed entirely within your browser for maximum privacy, it offers advanced filtering by EA ID (Magic Number), fuzzy comment matching, and multi-session analysis.

## ✨ Key Features

- **Multi-Platform Support**: Seamlessly parse MT4 `.htm` Detailed Reports and custom MT5 `.csv` exports.
- **Advanced EA Comparator (P0-P5)**:
  - Compare performance across different EAs or different reports side-by-side.
  - **Equity & Drawdown Charts**: Shared time-series visualization.
  - **Profit Distribution**: Histogram of trade outcomes.
  - **Monthly Heatmaps**: Grid-based performance breakdown.
  - **Deep Metrics**: Auto-calculated Sharpe Ratio, Profit Factor, Max Drawdown, and more.
- **Dynamic Currency Detection**: Automatically handles and formats account currencies (USD, EUR, JPY, USC, etc.).
- **Report Date Range**: Isolate performance within specific timeframes with built-in validation.
- **Multi-Session Workspace**: Analyze and switch between up to 5 reports simultaneously.
- **Privacy-First Architecture**: Your trading data never leaves your computer.

## 🛠️ Getting Started

### 1. Installation
```bash
npm install
npm run dev
```

### 2. Usage
1. Upload an MT4 Detailed Report (`.htm`) or an MT5 CSV export.
2. Configure your filters (EA ID or Comment) and date range.
3. Explore the dashboard cards, charts, and detailed trade table.
4. Use the **Compare** tab to benchmark multiple strategies.

### 3. MT5 Export Instructions
MT5 requires a custom script to include all necessary metadata.
👉 [View MT5 Export Guide](docs/MT5_EXPORT_GUIDE.md) or visit the `/AboutMT5` page in-app.

## 📂 Documentation

- **[System Design](metatrader-analyzer-skills/system-design.md)** - Architecture and technical decisions.
- **[File Structure](metatrader-analyzer-skills/file-structure.md)** - Codebase organization.
- **[i18n System](docs/i18n.md)** - Translation architecture.
- **[Parser Logic](metatrader-analyzer-skills/parser-skills.md)** - Details on MT4 and MT5 extraction.

## 📄 License

MIT License. Developed for traders who value privacy and deep insights.
