# MetaTrader Report Analyzer

A professional, privacy-first trading journal and analytics tool for MetaTrader 4 (MT4) and MetaTrader 5 (MT5).

🌐 **Bilingual Support** – Fully localized in **English** and **Tiếng Việt** with persistent language settings across sessions.

## 🚀 Overview

MetaTrader Report Analyzer allows traders to deep-dive into their performance by parsing standard MetaTrader reports. Unlike generic tools, it offers advanced filtering by **EA ID (Magic Number)**, comment fuzzy matching, and multi-session analysis, all processed entirely within your browser for maximum privacy.

## ✨ Key Features

- **Multi-Platform Support**: Parse MT4 `.htm` Detailed Reports and MT5 `.csv` exports (via custom script).
- **EA Comparator**: Compare performance across different Expert Advisors or different reports side-by-side with shared equity curves.
- **Advanced Filtering**: 
  - Filter by Magic Number (EA ID) extracted from trade ticket metadata.
  - Fuzzy matching for trade comments with adjustable similarity thresholds.
  - Precise date range filtering.
- **Multi-Session Workspace**: Analyze multiple reports simultaneously in a tabbed interface.
- **Persistent Data**: Uses **IndexedDB** (Dexie) and **Zustand Persistence** to save your analysis sessions and settings locally.
- **Privacy-First**: No data is ever sent to a server. All parsing and calculations happen on the client side.
- **Bilingual Interface**: Seamlessly switch between English and Vietnamese.

## 🛠️ Getting Started

### 1. Installation
```bash
npm install
npm run dev
```

### 2. Usage
1. Open the application.
2. Upload an MT4 Detailed Report (`.htm`) or an MT5 CSV export.
3. Use the **Language Switcher** in the header to select your preferred language.
4. Enter EA identifiers in the **Filter Form** to isolate specific strategies.
5. Explore results in the **KpiCards**, **Equity Chart**, and **Results Table**.

### 3. MT5 Export Instructions
To analyze MT5 reports, you need to use our custom export script. 
👉 [See MT5 Export Guide](docs/MT5_EXPORT_GUIDE.md) or visit the `/AboutMT5` page within the app.

## 📂 Documentation

- [MT5 Export Guide](docs/MT5_EXPORT_GUIDE.md) - How to generate compatible MT5 files.
- [i18n System](docs/i18n.md) - Documentation for the translation architecture.
- [System Design](metatrader-analyzer-skills/system-design.md) - Technical architecture and decisions.

## 📄 License

This project is open-source and available under the MIT License.
