import re

routes_path = "src/routes.py"
with open(routes_path, "r", encoding="utf-8") as f:
    routes_content = f.read()

# 1. Fix /api/saldos: Add back the keys totalIngresos, totalEgresos, balance, totalMovimientos
# Find the return jsonify({ ... }) of api_get_saldos
saldos_return_pattern = r"(def api_get_saldos\(\):.*?)return jsonify\(\{"
saldos_replacement = r"\1total_movimientos = 0\n    if ingresos_sheet:\n        total_movimientos += sum(1 for row in ingresos_sheet.iter_rows(min_row=2) if row[0].value)\n    if egresos_sheet:\n        total_movimientos += sum(1 for row in egresos_sheet.iter_rows(min_row=2) if row[0].value)\n\n    return jsonify({\n        'totalIngresos': float(saldo_banco_actual + saldo_caja_actual), # Or keep track of all ingresos total\n"

# Actually, it's better to just recalculate everything properly.
# Let's replace the whole api_get_saldos endpoint again.
saldos_full = """@main_bp.route('/api/saldos', methods=['GET'])
def api_get_saldos():
    wb = get_workbook(data_only=True)
    ingresos_sheet = wb["Ingresos"] if "Ingresos" in wb.sheetnames else None
    egresos_sheet = wb["Egresos"] if "Egresos" in wb.sheetnames else None

    hoy = datetime.now().date()
    ym = hoy.strftime("%Y-%m")

    saldo_inicial = 0.0
    ingresos_banco_mes = 0.0
    egresos_banco_mes = 0.0
    ingresos_caja_mes = 0.0
    egresos_caja_mes = 0.0
    
    saldo_banco_actual = 0.0
    saldo_caja_actual = 0.0
    
    total_ingresos_historico = 0.0
    total_egresos_historico = 0.0
    total_movimientos = 0
    
    if ingresos_sheet:
        for row in ingresos_sheet.iter_rows(min_row=2, values_only=True):
            if not any(row): continue
            total_movimientos += 1
            fecha = parse_date_cell(row[0])
            medio = str(row[1]).strip().lower() if row[1] else ""
            valor = 0.0
            try: valor = float(row[7] or 0)
            except: pass
            
            total_ingresos_historico += valor
            
            if medio == "banco":
                saldo_banco_actual += valor
            elif medio == "caja":
                saldo_caja_actual += valor
                
            if fecha:
                f_ym = fecha.strftime("%Y-%m")
                if f_ym < ym:
                    saldo_inicial += valor
                elif f_ym == ym:
                    if medio == "banco": ingresos_banco_mes += valor
                    elif medio == "caja": ingresos_caja_mes += valor

    if egresos_sheet:
        for row in egresos_sheet.iter_rows(min_row=2, values_only=True):
            if not any(row): continue
            total_movimientos += 1
            fecha = parse_date_cell(row[0])
            medio = str(row[1]).strip().lower() if row[1] else ""
            valor = 0.0
            try: valor = float(row[7] or 0)
            except: pass
            
            total_egresos_historico += valor
            
            if medio == "banco":
                saldo_banco_actual -= valor
            elif medio == "caja":
                saldo_caja_actual -= valor
                
            if fecha:
                f_ym = fecha.strftime("%Y-%m")
                if f_ym < ym:
                    saldo_inicial -= valor
                elif f_ym == ym:
                    if medio == "banco": egresos_banco_mes += valor
                    elif medio == "caja": egresos_caja_mes += valor

    return jsonify({
        "saldoInicial": float(saldo_inicial),
        "ingresosBanco": float(ingresos_banco_mes),
        "egresosBanco": float(egresos_banco_mes),
        "saldoBanco": float(saldo_banco_actual),
        "ingresosCaja": float(ingresos_caja_mes),
        "egresosCaja": float(egresos_caja_mes),
        "saldoCaja": float(saldo_caja_actual),
        "saldoConsolidado": float(saldo_banco_actual + saldo_caja_actual),
        
        # Legacy fields for movimientos.js
        "totalIngresos": float(total_ingresos_historico),
        "totalEgresos": float(total_egresos_historico),
        "balance": float(total_ingresos_historico - total_egresos_historico),
        "totalMovimientos": total_movimientos
    })
"""
routes_content = re.sub(r"@main_bp\.route\('/api/saldos', methods=\['GET'\]\).*?(?=# -+)", saldos_full, routes_content, flags=re.DOTALL)

# 2. Fix /api/reportes app.config
routes_content = routes_content.replace('madres_file = app.config["USUARIOS_FILE"]', 'madres_file = current_app.config["EXCEL_FILE"]')
# Wait, users file might be current_app.config["USUARIOS_FILE"]. Let's use current_app.config
routes_content = routes_content.replace('app.config["USUARIOS_FILE"]', 'current_app.config.get("USUARIOS_FILE", "data/usuarios.xlsx")')
# Wait, "EXCEL_FILE" is what has the mothers? No, maybe it's in EXCEL_FILE? The code had app.config["USUARIOS_FILE"] before.
# I'll just change app.config to current_app.config
routes_content = routes_content.replace('app.config', 'current_app.config')

with open(routes_path, "w", encoding="utf-8") as f:
    f.write(routes_content)

print("Bugs fixed in routes.py")
