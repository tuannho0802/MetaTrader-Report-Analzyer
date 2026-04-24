# MetaTrader 5 (MT5) Export Guide

This tool supports a specific CSV format exported from MT5 using our custom script. Follow the instructions below to generate a compatible file.

## 📋 Required CSV Format

The CSV file must contain all 21 columns in the exact order shown below. Our script generates this automatically.

1. **Ticket**
2. **Magic Number**
3. **Open Time**
4. **Close Time**
5. **Duration (Hours)**
6. **Type**
7. **Volume**
8. **Symbol**
9. **Open Price**
10. **Close Price**
11. **S/L**
12. **T/P**
13. **Points**
14. **Profit**
15. **Swap**
16. **Commission**
17. **Net Profit**
18. **Net Profit %**
19. **Comment**
20. **Entry ID**
21. **Exit ID**

## 📥 Download Export Script

1. Download the compiled script: [MT5_Report_Script.ex5](../public/script-for-mt5/MT5_Report_Script.ex5)
2. (Optional) Download the source code: [MT5_Report_Script.mq5](../public/script-for-mt5/MT5_Report_Script.mq5)

## 🛠️ Installation & Usage

1. **Place the Script**: Place the `MT5_Report_Script.ex5` file in your MT5 terminal's `MQL5/Scripts` folder.
2. **Refresh MT5**: Restart MT5 or right-click the **Navigator** panel and choose **Refresh**.
3. **Open Navigator**: Press `Ctrl + N` to open the Navigator. Expand the **Scripts** section.
4. **Run Script**: Drag `MT5_Report_Script` onto any open chart.
5. **Save CSV**: A dialog will appear. Choose your location and save the file.
6. **Upload**: Return to the Analyzer dashboard and upload the `.csv` file.

## 💡 Important Note: Magic Number

The Magic Number is preserved during export, allowing you to filter by specific Expert Advisors (EA) in the analysis. Use the **Filter by ID** mode and enter the magic number in the pattern field to isolate a single EA's performance.
