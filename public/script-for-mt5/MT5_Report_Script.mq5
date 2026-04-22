//+------------------------------------------------------------------+
//| MT5 EA Analyzer - Professional Export Script                     |
//| Exports comprehensive trade data with account information        |
//| Compatible with MT4 EA Profit Filter web app                     |
//+------------------------------------------------------------------+
#property copyright "Professional EA Analysis Tool"
#property version   "2.0"
#property link      "https://copispot.com/"
#property script_show_inputs

//+------------------------------------------------------------------+
//| Import Windows MessageBox for professional notifications         |
//+------------------------------------------------------------------+
#import "user32.dll"
   int MessageBoxW(int hWnd, string lpText, string lpCaption, int uType);
#import

input datetime deals_from = D'2010.01.01 00:00';  // Start Date
input datetime deals_to   = D'2030.12.31 23:59';  // End Date
input string   FileName   = "MT5_EA_Export.csv";  // Export filename

void OnStart() 
{
   Print("========================================");
   Print("  MT5 EA ANALYZER - PROFESSIONAL v2.0  ");
   Print("========================================");
   
   // Validate date range
   if (deals_from >= deals_to) 
   {
      MessageBoxW(0, "Invalid date range!\n\nStart date must be earlier than end date.", "MT5 EA Analyzer - Error", 0x10);
      return;
   }
   
   // Get account information
   string account_name = AccountInfoString(ACCOUNT_NAME);
   string account_server = AccountInfoString(ACCOUNT_SERVER);
   string account_company = AccountInfoString(ACCOUNT_COMPANY);
   long account_number = AccountInfoInteger(ACCOUNT_LOGIN);
   double account_balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double account_equity = AccountInfoDouble(ACCOUNT_EQUITY);
   string account_currency = AccountInfoString(ACCOUNT_CURRENCY);
   int account_leverage = (int)AccountInfoInteger(ACCOUNT_LEVERAGE);
   
   // Get export timestamp
   datetime export_time = TimeCurrent();
   string export_time_str = FormatDateTime(export_time);
   
   // Create output file
   int file_handle = FileOpen(FileName, FILE_TXT|FILE_WRITE|FILE_ANSI);
   if (file_handle == INVALID_HANDLE)
   {
      string error_msg = "Failed to create file!\n\nError code: " + IntegerToString(GetLastError()) + 
                        "\n\nFile: " + FileName;
      MessageBoxW(0, error_msg, "MT5 EA Analyzer - File Error", 0x10);
      return;
   }
   
   // Load trade history
   if (!HistorySelect(deals_from, deals_to))
   {
      MessageBoxW(0, "Failed to load trading history!\n\nPlease check the date range and try again.", 
                  "MT5 EA Analyzer - History Error", 0x10);
      FileClose(file_handle);
      return;
   }
   
   // Write CSV separator
   FileWrite(file_handle, "sep=,");
   
   // Write account information header
   FileWrite(file_handle, "");
   FileWrite(file_handle, "=== ACCOUNT INFORMATION ===");
   FileWrite(file_handle, "Account Name," + account_name);
   FileWrite(file_handle, "Account Number," + IntegerToString(account_number));
   FileWrite(file_handle, "Broker," + account_company);
   FileWrite(file_handle, "Server," + account_server);
   FileWrite(file_handle, "Account Currency," + account_currency);
   FileWrite(file_handle, "Leverage,1:" + IntegerToString(account_leverage));
   FileWrite(file_handle, "Current Balance," + DoubleToString(account_balance, 2));
   FileWrite(file_handle, "Current Equity," + DoubleToString(account_equity, 2));
   FileWrite(file_handle, "");
   
   // Write export information
   FileWrite(file_handle, "=== EXPORT INFORMATION ===");
   FileWrite(file_handle, "Export Date/Time," + export_time_str);
   FileWrite(file_handle, "Date Range From," + FormatDateTime(deals_from));
   FileWrite(file_handle, "Date Range To," + FormatDateTime(deals_to));
   FileWrite(file_handle, "Terminal," + TerminalInfoString(TERMINAL_NAME));
   FileWrite(file_handle, "Terminal Build," + IntegerToString(TerminalInfoInteger(TERMINAL_BUILD)));
   FileWrite(file_handle, "Terminal Company," + TerminalInfoString(TERMINAL_COMPANY));
   FileWrite(file_handle, "Export Path," + TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL5\\Files\\");
   FileWrite(file_handle, "");
   FileWrite(file_handle, "");
   
   // Write column headers (comprehensive for EA analysis)
   string headers = "Ticket,";                // Position ID
   headers += "Magic Number,";                // EA identifier (CRITICAL)
   headers += "Open Time,";                   // Entry timestamp
   headers += "Close Time,";                  // Exit timestamp
   headers += "Duration (Hours),";            // Trade duration
   headers += "Type,";                        // buy/sell
   headers += "Volume,";                      // Lot size
   headers += "Symbol,";                      // Trading pair
   headers += "Open Price,";                  // Entry price
   headers += "Close Price,";                 // Exit price
   headers += "S/L,";                         // Stop Loss
   headers += "T/P,";                         // Take Profit
   headers += "Points,";                      // Price difference in points
   headers += "Profit,";                      // Gross profit
   headers += "Swap,";                        // Swap charges
   headers += "Commission,";                  // Commission
   headers += "Net Profit,";                  // Total P/L
   headers += "Net Profit %,";                // Percentage return
   headers += "Comment,";                     // EA comment/name
   headers += "Entry ID,";                    // Deal ticket for entry
   headers += "Exit ID";                      // Deal ticket for exit
   
   FileWrite(file_handle, "=== TRADING HISTORY ===");
   FileWrite(file_handle, headers);
   
   // Process positions
   int deals_total = HistoryDealsTotal();
   ulong positions_array[];
   ArrayResize(positions_array, deals_total, true);
   
   // Collect unique position IDs
   int unique_count = 0;
   for (int i = 0; i < deals_total; i++)
   {
      ulong deal_ticket = HistoryDealGetTicket(i);
      if (deal_ticket > 0 && HistoryDealGetInteger(deal_ticket, DEAL_ENTRY) == DEAL_ENTRY_IN)
      {
         ulong pos_id = HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID);
         
         // Check for duplicates
         bool is_duplicate = false;
         for (int j = 0; j < unique_count; j++)
         {
            if (positions_array[j] == pos_id)
            {
               is_duplicate = true;
               break;
            }
         }
         
         if (!is_duplicate && pos_id > 0)
         {
            positions_array[unique_count] = pos_id;
            unique_count++;
         }
      }
   }
   
   int exported_count = 0;
   double total_profit = 0;
   double total_commission = 0;
   double total_swap = 0;
   
   // Process each position
   for (int i = 0; i < unique_count; i++)
   {
      ulong pos_id = positions_array[i];
      if (pos_id == 0) continue;
      
      if (!HistorySelectByPosition(pos_id)) continue;
      
      // Position data variables
      ulong ticket = pos_id;
      long magic_number = 0;
      datetime open_dt = 0;
      datetime close_dt = 0;
      string open_time_str = "";
      string close_time_str = "";
      string type_str = "";
      double volume = 0;
      string symbol = "";
      double open_price = 0;
      double close_price = 0;
      double sl = 0;
      double tp = 0;
      double profit = 0;
      double swap = 0;
      double commission = 0;
      double net_profit = 0;
      string comment = "";
      ulong entry_deal_id = 0;
      ulong exit_deal_id = 0;
      
      bool is_closed = false;
      int deals_in_position = HistoryDealsTotal();
      
      // Loop through deals in this position
      for (int j = 0; j < deals_in_position; j++)
      {
         ulong deal_ticket = HistoryDealGetTicket(j);
         if (deal_ticket == 0) continue;
         
         ENUM_DEAL_ENTRY deal_entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
         
         // Process DEAL_IN (opening trade)
         if (deal_entry == DEAL_ENTRY_IN)
         {
            entry_deal_id = deal_ticket;
            
            // Get magic number
            magic_number = HistoryDealGetInteger(deal_ticket, DEAL_MAGIC);
            
            // Get open time
            open_dt = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);
            open_time_str = FormatDateTime(open_dt);
            
            // Get direction
            ENUM_DEAL_TYPE deal_type = (ENUM_DEAL_TYPE)HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
            type_str = (deal_type == DEAL_TYPE_BUY) ? "buy" : "sell";
            
            // Get volume
            volume = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
            
            // Get symbol
            symbol = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
            
            // Get open price
            open_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
            
            // Get SL/TP from order
            ulong order_ticket = HistoryDealGetInteger(deal_ticket, DEAL_ORDER);
            if (HistoryOrderSelect(order_ticket))
            {
               sl = HistoryOrderGetDouble(order_ticket, ORDER_SL);
               tp = HistoryOrderGetDouble(order_ticket, ORDER_TP);
            }
            
            // Get comment
            comment = HistoryDealGetString(deal_ticket, DEAL_COMMENT);
         }
         
         // Process DEAL_OUT (closing trade)
         if (deal_entry == DEAL_ENTRY_OUT || deal_entry == DEAL_ENTRY_INOUT || deal_entry == DEAL_ENTRY_OUT_BY)
         {
            is_closed = true;
            exit_deal_id = deal_ticket;
            
            // Get close time
            close_dt = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);
            close_time_str = FormatDateTime(close_dt);
            
            // Get close price
            close_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
            
            // Accumulate financials
            profit += HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
            swap += HistoryDealGetDouble(deal_ticket, DEAL_SWAP);
            commission += HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
            
            // Update magic number if found in closing deal
            long closing_magic = HistoryDealGetInteger(deal_ticket, DEAL_MAGIC);
            if (closing_magic != 0) magic_number = closing_magic;
         }
      }
      
      // Only export closed positions
      if (!is_closed) continue;
      
      // Calculate net profit
      net_profit = profit + swap + commission;
      
      // Calculate duration in hours
      double duration_hours = 0;
      if (close_dt > open_dt)
      {
         duration_hours = (double)(close_dt - open_dt) / 3600.0;
      }
      
      // Calculate points difference
      double points = 0;
      if (symbol != "")
      {
         double point_size = SymbolInfoDouble(symbol, SYMBOL_POINT);
         if (point_size > 0)
         {
            if (type_str == "buy")
               points = (close_price - open_price) / point_size;
            else
               points = (open_price - close_price) / point_size;
         }
      }
      
      // Calculate profit percentage (based on required margin)
      double profit_percent = 0;
      if (symbol != "" && volume > 0)
      {
         double contract_size = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
         double margin_rate = SymbolInfoDouble(symbol, SYMBOL_MARGIN_INITIAL);
         if (margin_rate > 0 && contract_size > 0)
         {
            double required_margin = (volume * contract_size * open_price * margin_rate) / account_leverage;
            if (required_margin > 0)
            {
               profit_percent = (net_profit / required_margin) * 100.0;
            }
         }
      }
      
      // Update totals
      total_profit += profit;
      total_commission += commission;
      total_swap += swap;
      
      // Build CSV row with enhanced data
      string row = IntegerToString(ticket) + ",";
      row += IntegerToString(magic_number) + ",";
      row += open_time_str + ",";
      row += close_time_str + ",";
      row += DoubleToString(duration_hours, 2) + ",";
      row += type_str + ",";
      row += DoubleToString(volume, 2) + ",";
      row += symbol + ",";
      row += DoubleToString(open_price, 5) + ",";
      row += DoubleToString(close_price, 5) + ",";
      row += DoubleToString(sl, 5) + ",";
      row += DoubleToString(tp, 5) + ",";
      row += DoubleToString(points, 1) + ",";
      row += DoubleToString(profit, 2) + ",";
      row += DoubleToString(swap, 2) + ",";
      row += DoubleToString(commission, 2) + ",";
      row += DoubleToString(net_profit, 2) + ",";
      row += DoubleToString(profit_percent, 2) + ",";
      row += comment + ",";
      row += IntegerToString(entry_deal_id) + ",";
      row += IntegerToString(exit_deal_id);
      
      FileWrite(file_handle, row);
      exported_count++;
   }
   
   // Write summary statistics
   FileWrite(file_handle, "");
   FileWrite(file_handle, "");
   FileWrite(file_handle, "=== EXPORT SUMMARY ===");
   FileWrite(file_handle, "Total Positions Exported," + IntegerToString(exported_count));
   FileWrite(file_handle, "Total Gross Profit," + DoubleToString(total_profit, 2));
   FileWrite(file_handle, "Total Commission," + DoubleToString(total_commission, 2));
   FileWrite(file_handle, "Total Swap," + DoubleToString(total_swap, 2));
   FileWrite(file_handle, "Total Net Profit," + DoubleToString(total_profit + total_commission + total_swap, 2));
   
   FileClose(file_handle);
   
   // Success notification
   Print("========================================");
   Print("  EXPORT COMPLETED SUCCESSFULLY!");
   Print("========================================");
   Print("Exported Positions: ", exported_count);
   Print("Total Net Profit: ", DoubleToString(total_profit + total_commission + total_swap, 2), " ", account_currency);
   Print("File: ", FileName);
   Print("Location: ", TerminalInfoString(TERMINAL_DATA_PATH), "\\MQL5\\Files\\");
   Print("========================================");
   
   // Professional MessageBox notification
   string success_message = "✅ Export Completed Successfully!\n\n";
   success_message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
   success_message += "Account: " + account_name + "\n";
   success_message += "Broker: " + account_company + "\n";
   success_message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
   success_message += "Exported Positions: " + IntegerToString(exported_count) + "\n";
   success_message += "Total Net P/L: " + DoubleToString(total_profit + total_commission + total_swap, 2) + " " + account_currency + "\n\n";
   success_message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
   success_message += "File: " + FileName + "\n\n";
   success_message += "Location:\n" + TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL5\\Files\\\n\n";
    success_message += "Or you can find it in MetaTrader 5 - Files -> Open Data Folder (Ctrl + Shift + D) -> MQL5\\Files\\\n";
   success_message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
   
   MessageBoxW(0, success_message, "MT5 EA Analyzer - Export Success", 0x40);
}

//+------------------------------------------------------------------+
//| Format datetime to YYYY/MM/DD HH:MM:SS                          |
//+------------------------------------------------------------------+
string FormatDateTime(datetime dt)
{
   MqlDateTime time_struct;
   TimeToStruct(dt, time_struct);
   
   string result = IntegerToString(time_struct.year, 4, '0') + "/";
   result += IntegerToString(time_struct.mon, 2, '0') + "/";
   result += IntegerToString(time_struct.day, 2, '0') + " ";
   result += IntegerToString(time_struct.hour, 2, '0') + ":";
   result += IntegerToString(time_struct.min, 2, '0') + ":";
   result += IntegerToString(time_struct.sec, 2, '0');
   
   return result;
}
//+------------------------------------------------------------------+