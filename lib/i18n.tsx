import React, { createContext, useContext } from 'react';
import { useSettingsStore } from './store/useSettingsStore';

export type Language = "en" | "vi";

export const translations = {
  en: {
    common: {
      dashboard: "Dashboard",
      settings: "Settings",
      help: "Help & Support",
      aboutMT5: "About MT5",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      undo: "Undo",
      redo: "Redo",
      loading: "Loading...",
      error: "Error",
      back: "Back",
      next: "Next",
      previous: "Previous",
      copy: "Copy",
      copied: "Copied",
      csv: "CSV",
      results: "results",
      of: "of",
      showing: "Showing",
      page: "Page",
      language: "Language",
      selectLanguage: "Select Language",
      verificationTests: "Verification Tests",
      explore: "Explore",
      statistics: "Statistics",
      history: "History",
      bookmarks: "Bookmarks"
    },
    comparison: {
      title: "EA Comparison",
      subtitle: "Compare multiple EAs' performance",
      mode: "Comparison Mode",
      withinReport: "Within Report",
      acrossReports: "Across Reports",
      noReports: "No Reports Uploaded",
      uploadPrompt: "Upload at least one MT4 report to start comparing EAs.",
      enterPatterns: "Enter EA patterns above and click Compare to see results.",
      selectReports: "Select two reports and their EAs, then click Run Comparison.",
      runComparison: "Run Comparison",
      compare: "Compare",
      eaIdentifier: "EA Identifier",
      metrics: "Comparative Metrics",
      report: "Report",
      detectedEas: "Detected EAs — click to add",
      patterns: "EA Patterns (comma-separated)",
      modeHint: "Uses session filter mode",
      thresholdHint: "Fuzzy threshold",
      selectReport: "Select Report",
      selectEa: "Select EA",
      noEaDetected: "No EA IDs detected in this report.",
      crossModeRequirement: "Upload at least 2 reports to use cross-report mode."
    },
    chart: {
      equityTitle: "Comparative Equity Curve",
      equityDesc: "Cumulative profit comparison over time"
    },
    dashboard: {
      ready: "Ready to analyze your trading performance?",
      uploadHint: "Upload an MT4 Detailed Report (.htm) to get started.",
      privacy: "Privacy-First: Analysis happens entirely in your browser",
      noReport: "No Report Uploaded",
      loadedPrevious: "Loaded previous statement:",
      clearCache: "Clear Cache",
      trades: "trades",
      analyze: "Analyze",
    },
    analysis: {
      performance: "Performance",
      comparison: "EA Comparison",
      multiEa: "Multi-EA Analysis",
      transactionDetails: "Transaction Details",
      breakdown: "Detailed breakdown of matched trades in",
      netProfit: "Net Profit",
      totalTrades: "Total Trades",
      winRate: "Win Rate",
      maxDrawdown: "Max Drawdown",
      profitFactor: "Profit Factor",
      recoveryFactor: "Recovery Factor",
      equityCurve: "Comparative Equity Curve",
      cumulativeProfit: "Cumulative profit analysis by EA pattern",
    },
    filter: {
      title: "Filter Transactions",
      pattern: "Pattern",
      mode: "Filter Mode",
      modeId: "EA ID Only (Recommended)",
      modeComment: "Comment (Fuzzy Match)",
      modeBoth: "Both (ID AND Comment)",
      threshold: "Similarity Threshold",
      startDate: "Start Date",
      endDate: "End Date",
      analyze: "Analyze Transactions",
      analyzing: "Analyzing...",
      shortcuts: "Shortcuts",
      presets: "Presets",
      noPresets: "No Presets",
      savePreset: "Save Preset",
      panelTitle: "Upload & Analyze",
      storeCurrent: "Store current filter settings",
      presetName: "Preset name...",
      patternPlaceholder: "e.g. BBS41, DCA, 111",
      errors: {
        patternRequired: "Enter comment pattern",
        startDateRequired: "Select start date",
        endDateRequired: "Select end date",
        dateOrder: "End date must be after start date",
        noEaIds: "No EA IDs found in this statement. Try switching to Comment mode.",
      }
    },
    uploader: {
      clickToSelect: "Click to select",
      orDrag: "or drag and drop file here",
      formatHint: "Accepts .htm/.html (MT4 Statement) or .csv (MT5 Export)",
      invalidFile: "Only .htm/.html (MT4) or .csv (MT5) files are accepted",
      aboutMt5: "About MT5 Report Format",
    },
    aboutMT5: {
      title: "About MetaTrader 5 Report",
      back: "Back to Dashboard",
      intro: "This tool supports a specific CSV format exported from MT5 using our custom script. Follow the instructions below to generate a compatible file.",
      requiredFormat: "Required CSV Format",
      columnsNote: "The CSV file must contain all 21 columns in the exact order shown below. The script generates this automatically — do not rename or rearrange columns manually.",
      sectionHeaders: "Required Section Headers",
      headersNote: "The file must also begin with the following section headers (generated automatically by the script):",
      downloadScript: "Download Export Script",
      downloadNote: "Download the compiled .ex5 script and place it in your MT5 terminal's MQL5/Scripts folder.",
      downloadButton: "Download MT5 Report Script (.ex5)",
      refreshNote: "After placing the file, restart MT5 or right-click the Navigator panel and choose Refresh to make the script appear.",
      howToGenerate: "How to Generate the Report",
      publicSource: "Public Source Code (MQL5)",
      sourceNote: "We also provide the full MQL5 source code for transparency. You can download it below to inspect the logic or make your own modifications.",
      sourceButton: "Download MQL5 Source Code (.mq5)",
      magicNoteTitle: "Magic Number Preserved",
      magicNoteBody: "The Magic Number is preserved during export, allowing you to filter by specific Expert Advisors (EA) in the analysis. Use the Filter by ID mode and enter the magic number in the pattern field to isolate a single EA's performance.",
      columns: [
        "Ticket", "Magic Number", "Open Time", "Close Time", "Duration (Hours)",
        "Type", "Volume", "Symbol", "Open Price", "Close Price", "S/L", "T/P",
        "Points", "Profit", "Swap", "Commission", "Net Profit", "Net Profit %",
        "Comment", "Entry ID", "Exit ID"
      ],
      steps: [
        {
          title: "Download & Install Script",
          body: "Download the MT5_Export_Script.ex5 file using the button below. Place it inside the MQL5/Scripts folder of your MT5 terminal, then restart MT5 or right-click the Navigator and select Refresh."
        },
        {
          title: "Open the Navigator",
          body: "In MT5, press Ctrl + N to open the Navigator panel. Expand the Scripts section and locate MT5_Export_Script."
        },
        {
          title: "Drag the Script onto a Chart",
          body: "Drag the script onto any open chart (the symbol does not matter). The script will immediately begin scanning your full trade history."
        },
        {
          title: "Save the CSV File",
          body: "A save dialog will appear. Choose your desired location and save the file as a .csv file."
        },
        {
          title: "Upload to This App",
          body: "Return to the Dashboard and click Analyze Transactions. Select the generated .csv file and press Analyze."
        }
      ]
    }
  },
  vi: {
    common: {
      dashboard: "Bảng điều khiển",
      settings: "Cài đặt",
      help: "Trợ giúp & Hủy hỗ trợ",
      aboutMT5: "Về MT5",
      save: "Lưu",
      cancel: "Hủy",
      confirm: "Xác nhận",
      delete: "Xóa",
      undo: "Hoàn tác",
      redo: "Làm lại",
      loading: "Đang tải...",
      error: "Lỗi",
      back: "Quay lại",
      next: "Tiếp theo",
      previous: "Trước đó",
      copy: "Sao chép",
      copied: "Đã sao chép",
      csv: "CSV",
      results: "kết quả",
      of: "trong",
      showing: "Hiển thị",
      page: "Trang",
      language: "Ngôn ngữ",
      selectLanguage: "Chọn ngôn ngữ",
      verificationTests: "Kiểm tra xác thực",
      explore: "Khám phá",
      statistics: "Thống kê",
      history: "Lịch sử",
      bookmarks: "Dấu trang"
    },
    comparison: {
      title: "So sánh Robot (EA)",
      subtitle: "So sánh hiệu suất giữa các robot",
      mode: "Chế độ so sánh",
      withinReport: "Trong cùng báo cáo",
      acrossReports: "Giữa các báo cáo",
      noReports: "Chưa có báo cáo",
      uploadPrompt: "Tải lên ít nhất một báo cáo MT4 để bắt đầu so sánh.",
      enterPatterns: "Nhập mẫu EA bên trên và nhấn So sánh để xem kết quả.",
      selectReports: "Chọn hai báo cáo và EA tương ứng, sau đó nhấn Chạy so sánh.",
      runComparison: "Chạy so sánh",
      compare: "So sánh",
      eaIdentifier: "Định danh EA",
      metrics: "Chỉ số so sánh",
      report: "Báo cáo",
      detectedEas: "EA phát hiện được — nhấn để thêm",
      patterns: "Mẫu EA (cách nhau bằng dấu phẩy)",
      modeHint: "Dùng chế độ lọc của phiên",
      thresholdHint: "Ngưỡng so khớp",
      selectReport: "Chọn báo cáo",
      selectEa: "Chọn EA",
      noEaDetected: "Không tìm thấy ID EA trong báo cáo này.",
      crossModeRequirement: "Tải lên ít nhất 2 báo cáo để dùng chế độ so sánh chéo."
    },
    chart: {
      equityTitle: "Biểu đồ tăng trưởng so sánh",
      equityDesc: "So sánh lợi nhuận tích lũy theo thời gian"
    },
    dashboard: {
      ready: "Sẵn sàng phân tích hiệu suất giao dịch của bạn?",
      uploadHint: "Tải lên báo cáo chi tiết MT4 (.htm) để bắt đầu.",
      privacy: "Quyền riêng tư: Phân tích diễn ra hoàn toàn trên trình duyệt",
      noReport: "Chưa có báo cáo nào",
      loadedPrevious: "Đã tải báo cáo trước đó:",
      clearCache: "Xóa bộ nhớ đệm",
      trades: "lệnh",
      analyze: "Phân tích",
    },
    analysis: {
      performance: "Hiệu suất",
      comparison: "So sánh EA",
      multiEa: "Phân tích Đa EA",
      transactionDetails: "Chi tiết giao dịch",
      breakdown: "Chi tiết các giao dịch khớp trong",
      netProfit: "Lợi nhuận ròng",
      totalTrades: "Tổng số lệnh",
      winRate: "Tỷ lệ thắng",
      maxDrawdown: "Sụt giảm tài khoản",
      profitFactor: "Hệ số lợi nhuận",
      recoveryFactor: "Hệ số hồi phục",
      equityCurve: "Biểu đồ vốn so sánh",
      cumulativeProfit: "Phân tích lợi nhuận lũy kế theo mẫu EA",
    },
    filter: {
      title: "Lọc giao dịch",
      pattern: "Mẫu lọc",
      mode: "Chế độ lọc",
      modeId: "Theo EA ID (Khuyên dùng)",
      modeComment: "Theo Comment (Mờ)",
      modeBoth: "Cả hai (ID VÀ Comment)",
      threshold: "Ngưỡng tương đồng",
      startDate: "Ngày bắt đầu",
      endDate: "Ngày kết thúc",
      analyze: "Phân tích giao dịch",
      analyzing: "Đang phân tích...",
      shortcuts: "Phím tắt / Lưu nhanh",
      presets: "Mẫu đã lưu",
      noPresets: "Chưa có mẫu nào",
      savePreset: "Lưu mẫu lọc",
      panelTitle: "Tải lên & Phân tích",
      storeCurrent: "Lưu cấu hình lọc hiện tại",
      presetName: "Tên mẫu...",
      patternPlaceholder: "VD: BBS41, DCA, 111",
      errors: {
        patternRequired: "Nhập mẫu comment",
        startDateRequired: "Chọn ngày bắt đầu",
        endDateRequired: "Chọn ngày kết thúc",
        dateOrder: "Ngày kết thúc phải sau ngày bắt đầu",
        noEaIds: "Không tìm thấy EA ID trong báo cáo này. Hãy thử chuyển sang chế độ Comment.",
      }
    },
    uploader: {
      clickToSelect: "Click để chọn",
      orDrag: "hoặc kéo thả file vào đây",
      formatHint: "Nhận file .htm/.html (MT4 Statement) hoặc .csv (MT5 Export)",
      invalidFile: "Chỉ chấp nhận file .htm/.html (MT4) hoặc .csv (MT5)",
      aboutMt5: "Về định dạng báo cáo MT5",
    },
    aboutMT5: {
      title: "Về MetaTrader 5 Report",
      back: "Quay lại Dashboard",
      intro: "Công cụ này hỗ trợ định dạng CSV cụ thể được xuất từ MT5 bằng script tùy chỉnh của chúng tôi. Làm theo hướng dẫn bên dưới để tạo file tương thích.",
      requiredFormat: "Định dạng CSV yêu cầu",
      columnsNote: "File CSV phải chứa đúng 21 cột theo thứ tự hiển thị bên dưới. Script sẽ tự động tạo — không đổi tên hoặc sắp xếp lại các cột theo cách thủ công.",
      sectionHeaders: "Tiêu đề các phần bắt buộc",
      headersNote: "File cũng phải bắt đầu bằng các tiêu đề phần sau (được tạo tự động bởi script):",
      downloadScript: "Tải Script Xuất Báo Cáo",
      downloadNote: "Tải xuống script .ex5 đã biên dịch và đặt nó vào thư mục MQL5/Scripts của terminal MT5 của bạn.",
      downloadButton: "Tải MT5 Report Script (.ex5)",
      refreshNote: "Sau khi đặt file, hãy khởi động lại MT5 hoặc nhấp chuột phải vào bảng Navigator và chọn Refresh để script xuất hiện.",
      howToGenerate: "Cách tạo báo cáo",
      publicSource: "Mã nguồn công khai (MQL5)",
      sourceNote: "Chúng tôi cũng cung cấp mã nguồn MQL5 đầy đủ để đảm bảo tính minh bạch. Bạn có thể tải xuống bên dưới để kiểm tra logic hoặc tự chỉnh sửa.",
      sourceButton: "Tải MQL5 Source Code (.mq5)",
      magicNoteTitle: "Giữ nguyên Magic Number",
      magicNoteBody: "Magic Number được giữ nguyên khi xuất, cho phép bạn lọc theo các Expert Advisor (EA) cụ thể trong phân tích. Sử dụng chế độ Filter by ID và nhập magic number để tách biệt hiệu suất của từng EA.",
      columns: [
        "Số vé (Ticket)", "Số Magic", "Giờ mở", "Giờ đóng", "Thời lượng (Giờ)",
        "Loại", "Khối lượng", "Cặp tiền", "Giá mở", "Giá đóng", "S/L", "T/P",
        "Điểm (Points)", "Lợi nhuận", "Phí qua đêm", "Phí hoa hồng", "Lợi nhuận ròng", "Lợi nhuận ròng %",
        "Ghi chú (Comment)", "Mã vào lệnh", "Mã thoát lệnh"
      ],
      steps: [
        {
          title: "Tải và cài đặt Script",
          body: "Tải xuống file MT5_Export_Script.ex5 bằng nút bên dưới. Đặt nó vào thư mục MQL5/Scripts của terminal MT5 của bạn, sau đó khởi động lại MT5 hoặc Refresh bảng Navigator."
        },
        {
          title: "Mở Navigator",
          body: "Trong MT5, nhấn Ctrl + N để mở bảng Navigator. Mở rộng phần Scripts và tìm MT5_Export_Script."
        },
        {
          title: "Kéo Script vào Biểu đồ",
          body: "Kéo script vào bất kỳ biểu đồ nào đang mở (không quan trọng cặp tiền nào). Script sẽ ngay lập tức quét toàn bộ lịch sử giao dịch của bạn."
        },
        {
          title: "Lưu file CSV",
          body: "Một hộp thoại lưu file sẽ xuất hiện. Chọn vị trí mong muốn và lưu file dưới dạng .csv."
        },
        {
          title: "Tải lên ứng dụng này",
          body: "Quay lại Dashboard và nhấp vào Analyze Transactions. Chọn file .csv vừa tạo và nhấn Analyze."
        }
      ]
    }
  },
};

const TranslationContext = createContext<{ language: Language }>({ language: 'en' });

export const useTranslation = () => {
  const { language } = useSettingsStore();

  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = (translations as any)[language];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path;
      }
    }

    return result;
  };

  return { t, language };
};

export const Trans = ({ i18nKey }: { i18nKey: string }) => {
  const { t } = useTranslation();
  return <React.Fragment>{t(i18nKey)}</React.Fragment>;
};

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const { language } = useSettingsStore();

  return (
    <TranslationContext.Provider value={{ language }}>
      <div data-lang={language} className="contents">
        {children}
      </div>
    </TranslationContext.Provider>
  );
};
