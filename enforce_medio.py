import re

routes_path = "src/routes.py"
with open(routes_path, "r", encoding="utf-8") as f:
    routes_content = f.read()

# Buscamos la línea "tipo = data.get('tipo', '').strip()" en el POST
# Y añadimos la validación del medio

pattern_post = r"(def api_movimientos_post\(\):\s*data = request\.get_json\(\)\s*if not data:.*?)tipo = data\.get\('tipo', ''\)\.strip\(\)"
replacement_post = r"\1tipo = data.get('tipo', '').strip()\n    medio = data.get('medio', '').strip()\n    if not medio:\n        return jsonify({'error': 'El medio de pago (caja o banco) es obligatorio'}), 400\n"

routes_content = re.sub(pattern_post, replacement_post, routes_content, flags=re.DOTALL)

# Lo mismo para el PUT
pattern_put = r"(def api_movimiento_put\(sheet, mov_id\):\s*data = request\.get_json\(\)\s*if not data:.*?)tipo = data\.get\('tipo', ''\)\.strip\(\)"
replacement_put = r"\1tipo = data.get('tipo', '').strip()\n    medio = data.get('medio', '').strip()\n    if not medio:\n        return jsonify({'error': 'El medio de pago (caja o banco) es obligatorio'}), 400\n"

routes_content = re.sub(pattern_put, replacement_put, routes_content, flags=re.DOTALL)

with open(routes_path, "w", encoding="utf-8") as f:
    f.write(routes_content)

print("Validación de medio añadida en backend")
