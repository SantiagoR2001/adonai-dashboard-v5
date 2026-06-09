# Sistema de Gestión Adonai (Adonai Dashboard)

El **Adonai Dashboard** es un sistema web integral de gestión financiera y administrativa diseñado específicamente para la organización Adonai. Permite registrar información de beneficiarios (madres), llevar un control exhaustivo de movimientos financieros (ingresos y egresos), generar reportes consolidados bilingües y administrar usuarios de forma centralizada y segura.

---

## 🎯 Propósito del Proyecto
El objetivo principal es proporcionar a la organización una herramienta robusta que centralice su contabilidad y operatividad. El sistema está diseñado para:
1. **Rastrear las finanzas**: Saber exactamente cuánto dinero entra (donaciones locales, donaciones USA, intereses) y cuánto sale (nómina, ayudas humanitarias, transporte).
2. **Manejar Inteligencia Financiera Multimoneda**: Convertir históricamente Pesos Colombianos (COP) a Dólares (USD) aplicando la Tasa Representativa del Mercado (TRM) exacta del mes en que ocurrió la transacción.
3. **Generar Reportes Auditables**: Exportar informes detallados y consolidados en PDF y Excel, adaptables en Español e Inglés, listos para auditorías o presentaciones internacionales.

---

## ⚙️ Arquitectura Técnica

El sistema ha sido refactorizado de una antigua aplicación de escritorio monolítica a una **Aplicación Web Servidor (Backend)** limpia, estructurada y lista para despliegues en contenedores (Docker/Proxmox).

### Tecnologías Core
- **Backend Framework**: Python 3.x con **Flask**.
- **Motor de Base de Datos**: Archivos Excel (`openpyxl` y `pandas` para análisis de datos) y archivos JSON para usuarios.
- **Protección de Concurrencia**: `filelock` (Asegura que múltiples usuarios o hilos puedan escribir/leer en el Excel al mismo tiempo sin corromper el archivo).
- **Generación de Reportes**: `ReportLab` para PDF y `openpyxl` para Excel nativo.
- **Frontend**: HTML5, Vanilla CSS3 (Custom CSS), JavaScript (Vanilla ES6) y `Chart.js` para los gráficos analíticos.

---

## 📁 Estructura del Proyecto

```text
adonai-dashboard/
│
├── data/                             # 💾 Volúmenes de Datos (Persistencia)
│   ├── adonai_data_completo.xlsx     # Base de datos central (Ingresos, Egresos, Madres, TRM)
│   └── usuarios.json                 # Almacén seguro de usuarios y contraseñas
│
├── src/                              # 💻 Código Fuente de la Aplicación
│   ├── static/                       # Activos públicos
│   │   ├── css/                      # Estilos (dashboard.css, login.css, themes)
│   │   ├── js/                       # Lógica de interfaz (dashboard.js, reportes.js, configuracion.js)
│   │   └── img/                      # Logos e íconos de la aplicación
│   │
│   ├── templates/                    # Plantillas HTML renderizadas por Jinja2
│   │   ├── base.html                 # Layout maestro (menú lateral, notificaciones)
│   │   ├── dashboard.html            # Pantalla principal con gráficos
│   │   ├── ingresos.html / egresos.html / madres.html
│   │   ├── reportes.html             # Interfaz de generación de PDFs y Excels
│   │   └── configuracion.html        # Administrador de TRM
│   │
│   ├── config.py                     # Variables de entorno y configuración de Flask
│   ├── excel_db.py                   # Lógica Core de I/O de Excel (Lectura, Escritura, Locks)
│   └── routes.py                     # API REST, controladores y lógica de exportación
│
├── venv/                             # Entorno virtual de Python
├── wsgi.py                           # 🚀 Entry Point (Punto de Entrada) del servidor web
└── requirements.txt                  # Dependencias del proyecto
```

---

## 🧠 Lógica de Negocio y Flujos (Cómo funciona por dentro)

Para cualquier programador o Inteligencia Artificial que tome este proyecto, aquí están los componentes clave de la lógica:

### 1. Motor Base de Datos (Excel Persistente)
A diferencia de SQL, este sistema utiliza un archivo Excel (`adonai_data_completo.xlsx`) que actúa como base de datos relacional. 
- **Módulo `excel_db.py`**: Maneja la apertura y guardado del archivo. Implementa un sistema de semáforos (`FileLock`) sobre `data/excel_lock.lock`. Cada vez que un endpoint (ej. POST `/api/ingresos`) intenta guardar un dato, adquiere el lock, carga el libro (`openpyxl.load_workbook`), inserta la fila y guarda, liberando el lock inmediatamente para evitar corrupción de datos por concurrencia.

### 2. Sistema Multimoneda y TRM Histórica
Uno de los motores más complejos del proyecto reside en `routes.py` (Líneas 1400+ y 1600+).
- **Hoja TRM**: En el Excel existe una hoja dedicada a la Tasa Representativa del Mercado.
- **Función `get_trm_for_date()`**: Cuando el usuario pide un reporte en dólares (`USD`), el sistema no divide por una tasa global. Analiza la **fecha de cada fila individual**, extrae el formato `YYYY-MM` y busca la TRM exacta registrada para ese mes. Si no existe, realiza un "fallback" buscando hacia atrás en el historial hasta hallar la TRM más cercana.
- **Encabezados Dinámicos**: En los reportes, el backend calcula automáticamente el año máximo presente en la consulta (`max_y`) e inyecta la etiqueta correspondiente (Ej: `(TRM 4500)`) directamente en el título de la columna.

### 3. Sistema de Traducción Integral (Bilingüe)
El sistema soporta Español nativo e Inglés para reportes internacionales.
- En `routes.py`, existe un único Diccionario Maestro Python (`CAT_EN`) que mapea todas las categorías (ej: `"1. Nómina": "1. Payroll"`), subcategorías y tipos.
- La función `_tr_label()` intercepta los datos antes de inyectarlos en Pandas o ReportLab, garantizando que el PDF/Excel resultante se genere en perfecto inglés si el usuario tiene ese idioma seleccionado en la interfaz del frontend.

### 4. Generador de Reportes (PDF y Excel)
Se activan en los endpoints `/api/reportes/export/pdf` y `/api/reportes/export/excel`.
- Utilizan `pandas` para agrupar (`groupby`) todos los ingresos y egresos por categoría, subcategoría y mes.
- Construyen una matriz bidimensional (Categorías vs Meses + Consolidado).
- **PDF**: Usa `ReportLab`. Las celdas de encabezado están envueltas en objetos `Paragraph` para soportar saltos de línea HTML (`<br/>`), evitando que el texto largo estire las columnas y saque la tabla fuera del margen del papel horizontal (Landscape).
- **Excel**: Se formatea inyectando estilos de fuente (`Font`) y fondos (`PatternFill`), alineando numéricamente a la derecha y con formato de moneda.

### 5. Frontend y UX (Javascript y CSS)
- **Carga asíncrona (Fetch API)**: Toda la aplicación funciona como una SPA parcial (Single Page Application). Los formularios no recargan la página; interceptan el `submit` en JavaScript y envían la data vía JSON al backend.
- **Notificaciones (`NotificationSystem`)**: Un gestor global (`window.NotificationSystem.success()` / `error()`) inyecta tarjetas dinámicas (Toasts) en la pantalla (`position: fixed; bottom: 20px;`) para informar al usuario sobre el resultado de sus acciones sin alertas invasivas.

---

## 💻 Instrucciones de Uso (Desarrollo Local)

Para ejecutar la aplicación en entorno de desarrollo (Windows):

1. **Abre una terminal PowerShell** en la carpeta principal del proyecto.
2. **Activa el entorno virtual** (donde están instaladas las dependencias):
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
3. **Inicia el servidor web**:
   ```powershell
   python wsgi.py
   ```
4. **Accede a la aplicación**:
   Abre tu navegador web e ingresa a `http://localhost:5000` o `http://127.0.0.1:5000`.

---

## 🚀 Despliegues Futuros (Roadmap)
- **Contenedores Docker**: El código ya está diseñado para separar el código (efímero) de los datos persistentes (`/data`). Se provee un `Dockerfile` base.
- **Gunicorn/Waitress**: Reemplazar el servidor de desarrollo de Flask (`app.run()`) por un servidor WSGI de producción.