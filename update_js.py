import re

new_dict = """const categoriasPorTipo = {
  ingresos: {
    "Administrativo": ["Donaciones SRL", "Inversiones"],
    "Misión Institucional": ["Donaciones locales", "Donaciones específicas locales", "Donaciones USA", "Donaciones específicas USA"],
    "Unidad de Negocio": ["Donaciones ropa", "Jabón"],
    "Otros ingresos": ["Otros ingresos"]
  },
  egresos: {
    "1. Nómina": ["Secretaria", "Dirección General", "Seguridad Social", "Prestaciones Sociales", "Dotación"],
    "2. Colaboradoras Internas": ["Colaboradoras"],
    "3. Proveedores": ["Dirección Misional", "Administradora de redes sociales"],
    "4. Operacionales": [
      "Renta", "Servicios públicos", "Internet", "Celular", "Compras insumos", "Compras equipos de tecnología",
      "Compras licencias", "Compras inmuebles", "Obligaciones legales", "Insumos cafetería", "Insumos de aseo",
      "Insumos papelería", "Transporte urbano", "Transporte colaboradores", "Transporte Parqueaderos",
      "Transporte gasolina", "Reparaciones", "Mantenimientos", "Reunión Junta", "Refrigerios colaboradores"
    ],
    "5. Redes Sociales": ["Facebook", "Instagram", "Página Web"],
    "6. Material Publicitario": [
      "Volantes", "Botones", "Brochure", "Pendones / Letrero", "Tarjetas de presentación",
      "Cartas / Sobres con membrete", "Audiovisuales"
    ],
    "7. Trabajo de Campo": ["Reuniones externas", "Eventos generales", "Entrega publicidad", "Eventos provida"],
    "8. Otros Gastos": ["Gastos bancarios"],
    "9. Misional Bebés": [
      "Kit para el parto", "Medicamentos", "Alimentos", "Elementos básicos", "Cumpleaños", "Jardín de la vida"
    ],
    "10. Misional Madres": [
      "Kit para madres", "Transporte", "Alimentos", "Habitabilidad", "Ayuda Humanitaria",
      "Emprendimiento", "Obsequios", "Eventos", "Alianzas"
    ],
    "11. Otros": ["Otros"]
  }
};"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches 'const categoriasPorTipo = { ... };' over multiple lines
    # using re.DOTALL so .* matches newlines
    pattern = re.compile(r'const categoriasPorTipo = \{.*?\};', re.DOTALL)
    
    new_content = pattern.sub(new_dict, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

update_file('src/static/js/movimientos.js')
update_file('src/static/js/reportes.js')
print("Archivos JS actualizados.")
