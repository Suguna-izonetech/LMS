import io
from datetime import datetime, date
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_excel_report(report_title: str, headers: list, rows: list) -> io.BytesIO:
    """
    Generates a beautifully styled Excel workbook using openpyxl and returns it as a BytesIO stream.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = report_title[:30] # Excel tab title limit is 30 chars
    
    # Enable grid lines
    ws.views.sheetView[0].showGridLines = True
    
    # 1. Add Title Block
    ws.merge_cells("A1:F1")
    title_cell = ws["A1"]
    title_cell.value = f"KITE LMS - {report_title}"
    title_cell.font = Font(name="Arial", size=16, bold=True, color="ffffff")
    title_fill = PatternFill(start_color="4f46e5", end_color="4f46e5", fill_type="solid") # Indigo theme
    title_cell.fill = title_fill
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 40
    
    # Blank row
    ws.row_dimensions[2].height = 15
    
    # 2. Add Headers
    header_fill = PatternFill(start_color="1e1b4b", end_color="1e1b4b", fill_type="solid") # Dark slate
    header_font = Font(name="Arial", size=11, bold=True, color="ffffff")
    thin_border = Border(
        left=Side(style='thin', color='dddddd'),
        right=Side(style='thin', color='dddddd'),
        top=Side(style='thin', color='dddddd'),
        bottom=Side(style='thin', color='dddddd')
    )
    
    header_row_index = 3
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=header_row_index, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
        
    ws.row_dimensions[header_row_index].height = 25
    
    # 3. Add Data Rows
    data_font = Font(name="Arial", size=10)
    for row_idx, row_data in enumerate(rows, 4):
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.border = thin_border
            
            # Format numbers, dates, alignments
            if isinstance(val, (int, float)):
                cell.alignment = Alignment(horizontal="right")
                if "%" in headers[col_idx-1]:
                    cell.number_format = '0.0%'
            elif isinstance(val, (datetime, date)):
                cell.number_format = 'YYYY-MM-DD HH:MM'
                cell.alignment = Alignment(horizontal="center")
            else:
                cell.alignment = Alignment(horizontal="left")
                
        ws.row_dimensions[row_idx].height = 20
        
    # 4. Auto-fit columns with safety padding
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        
        # Don't size based on title row (row 1) since it is merged
        for cell in col[2:]: # Read from row 3 onwards
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    # Write to stream
    file_stream = io.BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)
    return file_stream
