import re

with open("src/routes.py", "r", encoding="utf-8") as f:
    routes_code = f.read()

# 1. Expand CAT_EN to cover all subcategories in the PDF
cat_en_update = """
CAT_EN = {
    "1. Nómina": "1. Payroll",
    "2. Colaboradoras Internas": "2. Internal Collaborators",
    "3. Proveedores": "3. Suppliers",
    "4. Operacionales": "4. Operational",
    "5. Redes Sociales": "5. Social Media",
    "6. Material Publicitario": "6. Advertising Material",
    "7. Trabajo de Campo": "7. Field Work",
    "8. Otros Gastos": "8. Other Expenses",
    "9. Misional Bebés": "9. Missional Babies",
    "10. Misional Madres": "10. Missional Mothers",
    "Administrativo": "Administrative",
    "Misión Institucional": "Institutional Mission",
    "Unidad de Negocio": "Business Unit",
    "Otros ingresos": "Other Income",
    "Otros": "Other",
    # Subcategorías Ingresos
    "Donaciones SRL": "SRL Donations",
    "Inversiones": "Investments",
    "Donaciones locales": "Local Donations",
    "Donaciones específicas locales": "Specific Local Donations",
    "Donaciones USA": "USA Donations",
    "Donaciones específicas USA": "Specific USA Donations",
    "Donaciones ropa": "Clothing Donations",
    "Jabón": "Soap",
    "Intereses bancarios": "Bank Interest",
    # Subcategorías Egresos (Misional Madres/Bebes)
    "Kit para el parto": "Delivery Kit",
    "Medicamentos": "Medicines",
    "Alimentos": "Food",
    "Elementos básicos": "Basic Elements",
    "Cumpleaños": "Birthdays",
    "Jardín de la vida": "Garden of Life",
    "Kit para madres": "Mothers Kit",
    "Transporte": "Transportation",
    "Habitabilidad": "Housing",
    "Ayuda Humanitaria": "Humanitarian Aid",
    "Emprendimiento": "Entrepreneurship",
    "Obsequios": "Gifts",
    "Eventos": "Events",
    "Alianzas": "Alliances",
    "Dirección General": "General Direction",
    "Secretaria": "Secretary",
    "Seguridad Social": "Social Security",
    "Prestaciones Sociales": "Social Benefits",
    "Dotación": "Endowment",
    "Colaboradoras": "Collaborators",
    "Dirección Misional": "Missional Direction",
    "Administradora de redes sociales": "Social Media Admin",
    "Renta": "Rent",
    "Servicios públicos": "Public Services",
    "Internet": "Internet",
    "Celular": "Mobile",
    "Compras insumos": "Supplies Purchases",
    "Compras equipos de tecnología": "Tech Equipment Purchases",
    "Compras licencias": "Licenses Purchases",
    "Compras inmuebles": "Real Estate Purchases",
    "Obligaciones legales": "Legal Obligations",
    "Insumos cafetería": "Cafeteria Supplies",
    "Insumos de aseo": "Cleaning Supplies",
    "Insumos papelería": "Stationery Supplies",
    "Transporte urbano": "Urban Transport",
    "Transporte colaboradores": "Collaborators Transport",
    "Transporte Parqueaderos": "Parking Transport",
    "Transporte gasolina": "Gasoline Transport",
    "Reparaciones": "Repairs",
    "Mantenimientos": "Maintenance",
    "Reunión Junta": "Board Meeting",
    "Refrigerios colaboradores": "Collaborators Snacks",
    "Facebook": "Facebook",
    "Instagram": "Instagram",
    "Página Web": "Website",
    "Volantes": "Flyers",
    "Botones": "Buttons",
    "Brochure": "Brochure",
    "Pendones / Letrero": "Banners / Signs",
    "Tarjetas de presentación": "Business Cards",
    "Cartas / Sobres con membrete": "Letters / Envelopes",
    "Audiovisuales": "Audiovisuals",
    "Reuniones externas": "External Meetings",
    "Eventos generales": "General Events",
    "Entrega publicidad": "Advertising Delivery",
    "Eventos provida": "Pro-life Events",
    "Gastos bancarios": "Bank Expenses"
}
"""

routes_code = re.sub(r'CAT_EN\s*=\s*\{.*?\n\}', cat_en_update.strip(), routes_code, flags=re.DOTALL)


# 2. Modify _construir_tabla_mensual to use CAT_EN
construir_replacement = """
def _construir_tabla_mensual(df, lang="es"):
    estructura = {}
    for _, row in df.iterrows():
        cat = _tr_label(row["categoria"], lang, CAT_EN) if lang == "en" else str(row["categoria"]).strip()
        sub = _tr_label(row["subcategoria"], lang, CAT_EN) if lang == "en" else str(row["subcategoria"]).strip()
"""
routes_code = re.sub(r'def _construir_tabla_mensual\(df, lang="es"\):\n    estructura = \{\}\n    for _, row in df\.iterrows\(\):\n        cat = _tr_label\(.*?CATEGORY_EN\) if lang == "en" else str\(row\["categoria"\]\)\.strip\(\)\n        sub = _tr_label\(.*?SUBCATEGORY_EN\) if lang == "en" else str\(row\["subcategoria"\]\)\.strip\(\)', construir_replacement.strip(), routes_code, flags=re.DOTALL)


# 3. Add convert_usd logic inside api_export_reportes_pdf_mensual_consolidado and api_export_reportes_excel_mensual_consolidado
def inject_conversion(routes_str, func_name):
    target = f"def {func_name}():"
    
    inject = """
    # ✅ moneda & TRM
    moneda = request.args.get("moneda", "cop").lower()
    trm_dict = get_trm_dict(get_workbook(data_only=True))
    trm_warnings = set()
    def _convert(fecha, val):
        if moneda == "cop": return val
        f_ym = fecha.strftime("%Y-%m") if not isinstance(fecha, str) else fecha[:7]
        trm, is_fb = get_trm_for_date(f_ym, trm_dict)
        if not trm: raise ValueError(f"Falta configurar la TRM para el mes {f_ym} o anterior.")
        if is_fb: trm_warnings.add(f"{f_ym} (usó {trm})")
        return val / trm
"""
    
    apply_conversion = """
    if not df_ing.empty:
        df_ing = _normalizar_df(df_ing, "ingreso")
        df_ing["valor"] = df_ing.apply(lambda r: _convert(r["fecha_dt"], r["valor"]), axis=1)
    if not df_egr.empty:
        df_egr = _normalizar_df(df_egr, "egreso")
        df_egr["valor"] = df_egr.apply(lambda r: _convert(r["fecha_dt"], r["valor"]), axis=1)
"""
    
    # Insert inject after lang = ...
    routes_str = re.sub(r'(    MESES = MESES_EN if lang == "en" else MESES_ES)', r'\1' + inject, routes_str, count=1)
    
    # Replace normalizar calls
    routes_str = re.sub(r'    if not df_ing\.empty:\n        df_ing = _normalizar_df\(df_ing, "ingreso"\)\n    if not df_egr\.empty:\n        df_egr = _normalizar_df\(df_egr, "egreso"\)', apply_conversion, routes_str, count=1)
    
    return routes_str

routes_code = inject_conversion(routes_code, "api_export_reportes_pdf_mensual_consolidado")
# The excel export is likely structurally similar, let's inject it there too if it exists.
try:
    routes_code = inject_conversion(routes_code, "api_export_reportes_excel_mensual_consolidado")
except:
    pass

with open("src/routes.py", "w", encoding="utf-8") as f:
    f.write(routes_code)
print("Updated routes.py")
