import re

# 1. Fix src/static/js/reportes.js
with open('src/static/js/reportes.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace: const anio = yearSelect  ? yearSelect.value  : defaultYear;
# With: const anio = yearSelect  ? yearSelect.value  : "";
js_content = js_content.replace('const anio         = yearSelect  ? yearSelect.value  : defaultYear;', 'const anio         = yearSelect  ? yearSelect.value  : "";')

with open('src/static/js/reportes.js', 'w', encoding='utf-8') as f:
    f.write(js_content)


# 2. Fix src/routes.py (Add DELETE for madres)
with open('src/routes.py', 'r', encoding='utf-8') as f:
    py_content = f.read()

new_route = """
@main_bp.route('/api/madres/<int:row_id>', methods=["DELETE"])
def api_delete_madre(row_id):
    if "usuario" not in session:
        return jsonify({"error": "No autenticado"}), 401

    if session.get("rol") not in ("admin", "secretaria"):
        return jsonify({"error": "No autorizado"}), 403

    wb = get_workbook()
    sheet = wb["Registro Madres"]

    if row_id < 2 or row_id > sheet.max_row:
        return jsonify({"error": "Madre no encontrada"}), 404

    sheet.delete_rows(row_id, 1)
    save_workbook(wb)
    return jsonify({"message": "Madre eliminada"})

# -------------------------
"""

py_content = py_content.replace("# -------------------------", new_route, 1)

with open('src/routes.py', 'w', encoding='utf-8') as f:
    f.write(py_content)

print("Fix applied successfully")
