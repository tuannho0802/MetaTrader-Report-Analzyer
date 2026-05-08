# MetaTrader Report Analyzer

A professional, privacy-first trading journal and analytics tool for MetaTrader 4 (MT4) and MetaTrader 5 (MT5).

🌐 **Bilingual Support** – Fully localized in **English** and **Tiếng Việt** with persistent settings.

## 🚀 Overview

**MetaTrader Report Analyzer** is a high-performance web application that allows traders to deep-dive into their trading performance. Processed entirely within your browser for maximum privacy, it offers advanced filtering by EA ID (Magic Number), fuzzy comment matching, and multi-session analysis.

## ✨ Key Features

- **Multi-Platform Support**: Seamlessly parse MT4 `.htm` Detailed Reports and custom MT5 `.csv` exports.
- **Advanced EA Comparator**:
  - Compare performance across different EAs or different reports side-by-side.
  - **Equity & Drawdown Charts**: Shared time-series visualization.
  - **Profit Distribution**: Histogram of trade outcomes.
  - **Monthly Heatmaps**: Grid-based performance breakdown.
  - **16+ Deep Metrics**: Sharpe Ratio, Profit Factor, Max Drawdown, Expectancy, Recovery Factor, Profit per Day, and more.
- **Trade Explorer (/explore)**: Deep-dive into a single session with hourly, daily, and monthly profit distribution charts.
- **Statistics Dashboard (/statistics)**: Aggregate EA leaderboard (ranked by profit), global equity trends, and top symbols analysis.
- **Session Management (/history)**: Advanced workspace control with active, archived, and soft-deleted session support.
- **True Archive Persistence**: Offloads archived report data (trades) to a secondary IndexedDB to keep RAM usage minimal and UI performance high even with thousands of trades.
- **Robust MT4 Parser**: Enhanced detection for initial balance, support for non-breaking spaces in numeric values, and fallback balance derivation from trade history.
- **Multi-Provider Currency Conversion**: 
  - Real-time exchange rates with a 4-tier fallback strategy (ExchangeRate-API, Frankfurter, fawazahmed0, and Hardcoded).
  - Native support for **VND**, **USD**, **EUR**, **JPY**, and **USC** (Cent accounts).
  - Offline mode with user-facing fallback alerts and hardcoded reference rates.
- **Privacy-First Architecture**: Your trading data never leaves your computer, stored locally in IndexedDB (Dexie).
- **Settings & Backup (/settings)**: Multi-language toggle, theme selection, and data management (backup/restore).

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
5. Visit **Explore** and **Statistics** for deeper visual insights.

### 3. MT5 Export Instructions
MT5 requires a custom script to include all necessary metadata.
👉 [View MT5 Export Guide](docs/MT5_EXPORT_GUIDE.md) or visit the `/AboutMT5` page in-app.

## 📂 Documentation

- **[System Design](metatrader-analyzer-skills/system-design.md)** - Architecture and technical decisions.
- **[File Structure](metatrader-analyzer-skills/file-structure.md)** - Codebase organization.
- **[i18n System](docs/i18n.md)** - Translation architecture.
- **[Parser Logic](metatrader-analyzer-skills/parser-skills.md)** - Details on MT4 and MT5 extraction.
- **[Workflows](metatrader-analyzer-skills/workflows.md)** - Development and deployment guide.

## 📄 License

MIT License. Developed for traders who value privacy and deep insights.
