# MetaTrader 5 (MT5) Export Guide

This tool supports a specific CSV format exported from MT5 using our custom script. Follow the instructions below to generate a compatible file.

## 📋 Required CSV Format

The CSV file must contain exactly **21 columns** in the exact order shown below. Our script handles this automatically — do not modify the headers or column order manually.

1. **Ticket**
2. **Magic Number** (Mapped to EA ID)
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
17. **Net Profit** (Includes Swap & Commission)
18. **Net Profit %**
19. **Comment**
20. **Entry ID**
21. **Exit ID**

## 📥 Download Export Script

Download these files to your computer:
- **Compiled Script**: [MT5_Report_Script.ex5](../public/script-for-mt5/MT5_Report_Script.ex5) (Required)
- **Source Code**: [MT5_Report_Script.mq5](../public/script-for-mt5/MT5_Report_Script.mq5) (Optional, for transparency)

## 🛠️ Installation & Usage

1. **Install the Script**:
   - Open your MT5 Terminal.
   - Go to `File` > `Open Data Folder`.
   - Navigate to `MQL5` > `Scripts`.
   - Copy the `MT5_Report_Script.ex5` file into this folder.
2. **Refresh Navigator**: In the MT5 Navigator panel (Ctrl+N), right-click **Scripts** and select **Refresh**.
3. **Run the Script**: Drag `MT5_Report_Script` from the Navigator onto any open chart.
4. **Export Data**: A "Save As" dialog will appear. Save the file as a `.csv`.
5. **Upload & Analyze**: Return to the **MetaTrader Report Analyzer**, click "Analyze Transactions", and select your generated CSV file.

## 💡 Pro Tip: Magic Number Filtering

The Magic Number is preserved in the CSV. To analyze a specific EA, use the **Filter by ID** mode and enter the Magic Number. This provides much higher accuracy than comment-based fuzzy matching.
