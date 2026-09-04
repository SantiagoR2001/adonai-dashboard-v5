# ADONAI - DOCUMENTACIÓN TÉCNICA COMPLETA DE TRANSFERENCIA Y AUDITORÍA
**Versión del Sistema:** V.5 (Sistema Multimoneda TRM y Gestión Integral)  
**Fecha de Auditoría:** 4 de Septiembre de 2026  
**Tipo de Documento:** Auditoría Técnica, Documentación de Entrega y Transferencia para Desarrolladores  
**Estado del Repositorio:** Master branch actualizado (`d5acaae`), Working Tree limpio.

---

## ÍNDICE GENERAL

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Información General del Proyecto y Servidor](#2-información-general-del-proyecto-y-servidor)
3. [Estructura Real de Carpetas y Archivos](#3-estructura-real-de-carpetas-y-archivos)
4. [Backend y Arquitectura Interna](#4-backend-y-arquitectura-interna)
5. [Catálogo Completo de la API REST y Endpoints](#5-catálogo-completo-de-la-api-rest-y-endpoints)
6. [Frontend y Capa de Presentación](#6-frontend-y-capa-de-presentación)
7. [Base de Datos y Almacenamiento (Excel + JSON)](#7-base-de-datos-y-almacenamiento-excel--json)
8. [Análisis Detallado del Archivo Excel (`adonai_data_completo.xlsx`)](#8-análisis-detallado-del-archivo-excel-adonai_data_completoxlsx)
9. [Diccionario y Estructura de Datos](#9-diccionario-y-estructura-de-datos)
10. [Lógica Financiera, Cálculos y Motor Multimoneda (TRM)](#10-lógica-financiera-cálculos-y-motor-multimoneda-trm)
11. [Configuración y Variables de Entorno](#11-configuración-y-variables-de-entorno)
12. [Infraestructura Docker y Despliegue](#12-infraestructura-docker-y-despliegue)
13. [Estado Actual de Contenedores y Procesos](#13-estado-actual-de-contenedores-y-procesos)
14. [Red, Proxy Inverso (Reverse Proxy) y HTTPS](#14-red-proxy-inverso-reverse-proxy-y-https)
15. [Persistencia, Volúmenes y Backups](#15-persistencia-volúmenes-y-backups)
16. [Auditoría de Seguridad y Clasificación de Riesgos](#16-auditoría-de-seguridad-y-clasificación-de-riesgos)
17. [Gestión de Dependencias (Python y Node)](#17-gestión-de-dependencias-python-y-node)
18. [Control de Versiones (Git)](#18-control-de-versiones-git)
19. [Sistema de Logs y Monitoreo](#19-sistema-de-logs-y-monitoreo)
20. [Matriz de Funcionalidades Reales vs Estado](#20-matriz-de-funcionalidades-reales-vs-estado)
21. [Flujos Detallados de Negocio del Sistema](#21-flujos-detallados-de-negocio-del-sistema)
22. [Mapa de Dependencias entre Componentes](#22-mapa-de-dependencias-entre-componentes)
23. [Archivos Críticos que NO Deben Modificarse sin Cuidado](#23-archivos-críticos-que-no-deben-modificarse-sin-cuidado)
24. [Procedimiento Operativo de Despliegue](#24-procedimiento-operativo-de-despliegue)
25. [Procedimiento de Recuperación ante Desastres (DRP)](#25-procedimiento-de-recuperación-ante-desastres-drp)
26. [Hallazgos y Problemas Técnicos Detectados](#26-hallazgos-y-problemas-técnicos-detectados)
27. [Deuda Técnica Acumulada](#27-deuda-técnica-acumulada)
28. [Plan y Recomendaciones para Migración Futura (Excel → PostgreSQL)](#28-plan-y-recomendaciones-para-migración-futura-excel--postgresql)
29. [Diagrama de Arquitectura Real](#29-diagrama-de-arquitectura-real)
30. [Checklist de Recepción para el Nuevo Desarrollador](#30-checklist-de-recepción-para-el-nuevo-desarrollador)

---

## 1. RESUMEN EJECUTIVO

El sistema **Adonai Dashboard** es una aplicación web financiera y administrativa diseñada para la fundación/organización benéfica Adonai. Su propósito central es registrar beneficiarias (madres gestantes/lactantes), asentar ingresos y egresos contables clasificados por rubros, calcular saldos operativos divididos por medio de pago (**Caja** vs **Banco**), y generar reportes financieros consolidados bilingües (Español / Inglés) con conversión de divisas histórica basada en la **Tasa Representativa del Mercado (TRM)** del mes de la transacción.

### Resumen de la Pila Tecnológica Real
- **Backend:** Python 3.12 (en contenedor Docker) ejecutando **Flask 3.1.2** sobre servidor WSGI **Gunicorn 23.0.0** (4 workers).
- **Almacenamiento de Datos:**
  1. Archivo Microsoft Excel OpenXML (`data/adonai_data_completo.xlsx`) accedido mediante `openpyxl 3.1.5` y `pandas 2.3.3`.
  2. Archivo JSON plano (`data/usuarios.json`) para el control de acceso de usuarios.
- **Control de Concurrencia:** Bloqueo por archivo mediante `filelock 3.29.1` sobre `adonai_data_completo.xlsx.lock`.
- **Generación de Reportes:** `reportlab 4.4.3` para exportación PDF horizontal bilingüe y `openpyxl` para exportación Excel formateada.
- **Frontend:** HTML5 semántico renderizado con **Jinja2**, estilos personalizados en CSS3 Vanilla (`dashboard.css`, `style.css`, `login.css`), JavaScript modular ES6 Vanilla con Fetch API asíncrono, y **Chart.js** (CDN) para gráficos.
- **Contenedorización:** Docker y Docker Compose (servicio `web`, contenedor `adonai_dashboard`), montando el volumen de datos persistente del host Linux en `/opt/adonai/data:/app/data`.

---

## 2. INFORMACIÓN GENERAL DEL PROYECTO Y SERVIDOR

| Parámetro | Detalle Real Encontrado |
|---|---|
| **Nombre real del proyecto** | Adonai Dashboard (V.5 Seguridad y Multimoneda TRM) |
| **Ruta de instalación en servidor de producción** | `/opt/adonai/` (evidenciado en `docker-compose.yml` en la ruta de volumen persistente `/opt/adonai/data:/app/data`) |
| **Ruta del espacio de trabajo local (Windows)** | `C:\Users\santi\Desktop\adonai-dashboard - V.5 seguridad - copia` |
| **Repositorio Git remoto** | `https://github.com/SantiagoR2001/adonai-dashboard-v5.git` |
| **Rama y Commit actual** | Rama `master`, commit `d5acaae` (*"Revertir nombre del enlace a Información General"*), 10 de Julio de 2026 |
| **Estado del proceso en producción** | Diseñado para ejecutarse como contenedor Docker Daemon `adonai_dashboard` con política `restart: unless-stopped`. |
| **Comando de arranque en producción** | `gunicorn --workers=4 --bind=0.0.0.0:5000 wsgi:app` |
| **Usuario del sistema en Docker** | `root` dentro de la imagen `python:3.12-slim` (no se crea usuario no privilegiado en `Dockerfile`). |
| **Versión de Python en contenedor** | **Python 3.12** (especificado en `FROM python:3.12-slim`). |
| **Versión de Python en host de desarrollo** | Python 3.13.7 (64-bit). |
| **Versión de Flask** | **Flask 3.1.2** (fijado en `requirements.txt`). |
| **Puerto expuesto** | `5000:5000` (TCP). |
| **Diferencias con versiones previas** | Se desacopló la configuración inicial y TRM como ventanas modales administrables, se añadió exportación bilingüe con TRM dinámica en encabezados, se eliminó el servidor de desarrollo `app.run` en producción para usar Gunicorn, y se externalizó `/app/data` a volumen persistente. |

---

## 3. ESTRUCTURA REAL DE CARPETAS Y ARCHIVOS

El árbol de directorios exacto encontrado en el proyecto es el siguiente:

```text
adonai-dashboard - V.5 seguridad - copia/
├── .dockerignore
├── .gitignore
├── Dockerfile
├── README.md
├── RESUMEN_CAMBIOS_TRM.txt
├── docker-compose.yml
├── package.json
├── requirements.txt
├── wsgi.py
├── data/
│   ├── adonai_data_completo.xlsx
│   ├── adonai_data_completo_backup.xlsx
│   └── usuarios.json
├── scratch/
│   └── conceptos_actuales.csv
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── excel_db.py
│   ├── routes.py
│   ├── static/
│   │   ├── css/
│   │   │   ├── dashboard.css
│   │   │   ├── login.css
│   │   │   └── style.css
│   │   ├── img/
│   │   │   └── Logo Adonai.png
│   │   └── js/
│   │       ├── dashboard.js
│   │       ├── madres.js
│   │       ├── main.js
│   │       ├── movimientos.js
│   │       └── reportes.js
│   └── templates/
│       ├── dashboard.html
│       ├── index.html
│       ├── login.html
│       ├── madres.html
│       ├── movimientos.html
│       └── reportes.html
├── venv/
└── [Scripts de migración / parches de desarrollo histórico en la raíz]
    ├── enforce_medio.py
    ├── fix.py
    ├── fix_bugs.py
    ├── fix_ref_year.py
    ├── fix_routes.py
    ├── fix_translations.py
    ├── migrate.py
    ├── update_headers.py
    ├── update_js.py
    ├── update_pdf_export.py
    ├── update_reportes_ui.py
    ├── update_stage4.py
    ├── update_stage5.py
    ├── update_stage6_backend.py
    └── update_stage6_frontend.py
```

### Inventario y Propósito de Archivos

| Archivo / Directorio | Tipo | Contenido y Propósito | ¿Necesario en Prod? | ¿Contiene Datos? |
|---|---|---|:---:|:---:|
| `wsgi.py` | Python Script | Punto de entrada del servidor WSGI. Instancia Flask, carga configuración, registra el blueprint `main_bp` y exporta el objeto `app`. | **SÍ** | No |
| `Dockerfile` | Configuración | Especifica construcción de imagen basada en `python:3.12-slim`, dependencias del sistema operativo (`build-essential`), copia de código y comando Gunicorn. | **SÍ** | No |
| `docker-compose.yml` | Orquestación | Configura el servicio `web`, mapeo de puertos 5000:5000, volumen `/opt/adonai/data:/app/data` y variables de entorno. | **SÍ** | No (pero monta datos) |
| `requirements.txt` | Dependencias | Lista exacta de librerías Python y versiones para pip (`Flask`, `openpyxl`, `filelock`, `pandas`, `reportlab`, `gunicorn`). | **SÍ** | No |
| `package.json` | Metadatos | Archivo residual de etapa preliminar con scripts de desarrollo para `live-server`. No se utiliza en la ejecución productiva de Flask/Docker. | **NO** | No |
| `README.md` | Documentación | Guía preliminar del proyecto. Presenta ligeras discrepancias con las plantillas HTML reales implementadas. | No | No |
| `RESUMEN_CAMBIOS_TRM.txt` | Registro | Bitácora técnica histórica de la implementación del módulo TRM y ReportLab. | No | No |
| `src/config.py` | Python Módulo | Define la clase `Config`, rutas absolutas basadas en `Path(__file__)`, variables de entorno (`SECRET_KEY`, `PORT`, `HOST`, `DEBUG`). | **SÍ** | No |
| `src/excel_db.py` | Python Módulo | Núcleo de interacción con Excel (`openpyxl`). Maneja la apertura, el bloqueo `filelock`, guardado seguro, parsing de fechas y recálculo de hojas sumarias. | **SÍ** | No |
| `src/routes.py` | Python Módulo | Controlador central (80 KB). Define todas las 31 rutas web y API REST, autenticación, lógica de filtros, normalización de DataFrames y exportaciones ReportLab/Excel. | **SÍ** | No |
| `data/adonai_data_completo.xlsx` | Hoja de Cálculo | **Base de datos principal activa**. Contiene las hojas operativas de Madres, Ingresos, Egresos, TRM y Configuración. | **CRÍTICO** | **SÍ (DATOS REALES)** |
| `data/adonai_data_completo_backup.xlsx`| Hoja de Cálculo | Respaldo manual previo a la inclusión de las hojas `TRM` y `Configuracion`. | Opcional | **SÍ (DATOS PREVIOS)** |
| `data/usuarios.json` | JSON | **Archivo activo de usuarios**. Almacena credenciales en texto claro y roles del sistema (`admin`, `secretaria`). | **CRÍTICO** | **SÍ (CREDENCIALES)** |
| `src/templates/*.html` | Jinja2 Templates | 6 vistas HTML: `index.html` (redirect), `login.html`, `dashboard.html`, `madres.html`, `movimientos.html`, `reportes.html`. | **SÍ** | No |
| `src/static/css/*.css` | Estilos | Estilos visuales: `style.css` (variables y base), `dashboard.css` (layout, sidebar, cards), `login.css` (caja de login). | **SÍ** | No |
| `src/static/js/*.js` | Lógica Cliente | 5 scripts: `main.js` (auth, modales config/TRM), `dashboard.js` (gráficos y saldos), `movimientos.js` (tabla y CRUD), `madres.js` (CRUD madres), `reportes.js` (filtros y exportaciones). | **SÍ** | No |
| `src/static/img/Logo Adonai.png`| Imagen | Logotipo corporativo de la fundación utilizado en cabeceras y login. | **SÍ** | No |
| `scratch/conceptos_actuales.csv`| CSV | Archivo de trabajo temporal con lista de conceptos contables. | **NO** | No |
| `fix_*.py`, `update_*.py`, `migrate.py`| Python Scripts | Scripts de parcheo temporal creados durante sesiones de desarrollo para modificar código mediante expresiones regulares. **Código muerto**. No se empaquetan en Docker. | **NO** | No |

---

## 4. BACKEND Y ARQUITECTURA INTERNA

### 4.1. Framework y Arquitectura
- **Framework:** Flask 3.1.2 sobre Python 3.12.
- **Arquitectura de Software:** Arquitectura monolítica modular basada en **Flask Blueprints** (`main_bp`). Combina controladores de servidor que sirven páginas estáticas pre-renderizadas por Jinja2 con una API RESTful basada en JSON consumida por el cliente frontend vía AJAX (Fetch API).
- **Punto de Entrada:** `wsgi.py`, el cual inicializa la aplicación:
  ```python
  app = Flask(__name__, template_folder="src/templates", static_folder="src/static")
  app.secret_key = Config.SECRET_KEY
  app.config["SEND_FILE_MAX_AGE_DEFAULT"] = Config.SEND_FILE_MAX_AGE_DEFAULT
  app.register_blueprint(main_bp)
  ```

### 4.2. Módulos y Funciones Principales

#### `src/config.py`
- `BASE_DIR`: Resuelve `Path(__file__).resolve().parent.parent`.
- `Config.SECRET_KEY`: Obtiene la clave de sesión de la variable de entorno `SECRET_KEY` con valor de reserva por defecto `adonai_secret_key_2025`.
- `Config.EXCEL_FILE`: Apunta a `data/adonai_data_completo.xlsx`.
- `Config.USUARIOS_FILE`: Apunta a `data/usuarios.json`.

#### `src/excel_db.py`
- `LOCK_FILE = str(Config.EXCEL_FILE) + ".lock"`
- `excel_lock = FileLock(LOCK_FILE, timeout=10)`: Semáforo de exclusión mutua para escritura.
- `get_workbook(data_only=False)`: Invoca `openpyxl.load_workbook`.
- `save_workbook(wb)`: Adquiere `with excel_lock:` y ejecuta `wb.save(Config.EXCEL_FILE)`.
- `parse_date_cell(value)`: Función de parseo defensivo que normaliza objetos `datetime`, `date` o cadenas ISO (`YYYY-MM-DD`, `DD/MM/YYYY`, etc.).
- `row_to_dict(row_tuple, row_num, sheet_name)`: Convierte una tupla de celda de Excel en un diccionario canónico de movimiento.
- `actualizar_reportes(wb)`: Recalcula en memoria y sobrescribe las hojas `Resumen Consolidado` e `Informe Mensual`.

#### `src/routes.py`
Concentra 2,172 líneas de código donde residen:
- `CAT_EN`: Diccionario maestro bilingüe (Español → Inglés) con todas las categorías y subcategorías contables.
- `get_config_data(wb)`: Lee la hoja `Configuracion` (saldo inicial de caja, saldo inicial de bancos y fecha de corte inicial).
- `get_trm_dict(wb)`: Lee la hoja `TRM` y construye el mapa de tasas cambiarias `{ "YYYY-MM": float }`.
- `get_trm_for_date(f_ym, trm_dict)`: Algoritmo de resolución cambiaria con fallback histórico.
- `_normalizar_df(df, tipo_fijo)`: Estandariza dataframes de Pandas leídos desde las hojas de Excel.
- `_aplicar_filtros_reportes(df)`: Aplica filtros combinados (tipo, medio, madre, categorías, fechas).
- `_construir_tabla_mensual(df, lang)`: Agrupa ingresos/egresos por mes (1 al 12) y calcula el consolidado anual.
- `_armar_madres_resumen_y_detalle(df_ing, df_egr)`: Realiza cruce relacional entre movimientos y beneficiarias registradas.

### 4.3. Manejo de Sesiones, Autenticación y Autorización
- **Sesiones:** Basadas en la cookie firmada criptográficamente de Flask (`session`).
- **Autenticación:**
  - Login mediante `POST /api/login`.
  - Verifica credenciales contra `data/usuarios.json`.
  - Al autenticar con éxito, establece:
    ```python
    session["usuario"] = u["usuario"]
    session["rol"] = u["rol"]
    session["nombre"] = u["nombre"]
    ```
- **Autorización y Roles:**
  - `admin`: Acceso total. Puede registrar movimientos, modificar configuración inicial, ingresar TRM, administrar usuarios y exportar reportes.
  - `secretaria`: Puede consultar dashboard, registrar y editar madres, registrar y editar movimientos. No tiene acceso a cambiar configuración contable inicial ni administrar usuarios.
  - En los endpoints, la verificación se realiza manualmente en cada función mediante condicionales:
    ```python
    if "usuario" not in session:
        return jsonify({"error": "No autenticado"}), 401
    if session.get("rol") not in ("admin", "secretaria"):
        return jsonify({"error": "No autorizado"}), 403
    ```

---

## 5. CATÁLOGO COMPLETO DE LA API REST Y ENDPOINTS

A continuación se detalla la totalidad de las 31 rutas implementadas en `src/routes.py`:

| Ruta | Método | Función | Requiere Sesión | Roles Permitidos | Parámetros / Payload | Descripción y Acción |
|---|:---:|---|:---:|:---:|---|---|
| `/` | `GET` | `index` | No | Público | Ninguno | Limpia la sesión (`session.clear()`) y renderiza la plantilla `login.html`. |
| `/login` | `GET` | `login_page` | No | Público | Ninguno | Renderiza `login.html`. |
| `/dashboard` | `GET` | `dashboard` | **SÍ** | Todos | Ninguno | Renderiza `dashboard.html`. Redirige a `/` si no hay sesión. |
| `/madres` | `GET` | `madres` | **SÍ** | Todos | Ninguno | Renderiza `madres.html`. |
| `/movimientos` | `GET` | `movimientos` | **SÍ** | Todos | Ninguno | Renderiza `movimientos.html`. |
| `/reportes` | `GET` | `reportes` | **SÍ** | Todos | Ninguno | Renderiza `reportes.html`. |
| `/logout` | `GET` | `logout` | No | Público | Ninguno | Limpia la sesión del servidor y redirige a la raíz `/`. |
| `/api/login` | `POST` | `api_login` | No | Público | JSON: `{ usuario, password }` | Valida credenciales contra `usuarios.json`, fija variables de sesión y retorna `{ rol, nombre }`. |
| `/api/movimientos` | `GET` | `api_get_movimientos` | **SÍ** | Todos | Query: `tipo, medio, categoria, subcategoria, codigoMadre, fechaDesde, fechaHasta` | Lee hojas `Ingresos` y `Egresos`, filtra según parámetros y retorna lista de movimientos ordenada cronológicamente descendente. |
| `/api/movimientos` | `POST` | `api_post_movimiento` | **SÍ** | `admin`, `secretaria` | JSON: `{ fecha, medio, tipo, categoria, subcategoria, codigoMadre, concepto, valor, responsable }` | Inserta nueva fila en la hoja `Ingresos` o `Egresos`, ejecuta `actualizar_reportes(wb)` y guarda con lock. |
| `/api/movimientos/<sheet>/<int:row_id>` | `PUT` | `api_put_movimiento` | **SÍ** | `admin`, `secretaria` | Path: `sheet, row_id`<br>JSON con campos actualizados | Modifica las celdas de la fila `row_id` en la hoja especificada y guarda con lock. |
| `/api/movimientos/<sheet>/<int:row_id>` | `DELETE` | `api_delete_movimiento` | **SÍ** | `admin`, `secretaria` | Path: `sheet, row_id` | Elimina la fila `row_id` de la hoja `sheet`, recalcula reportes y guarda. |
| `/api/export/pdf` | `GET` | `api_export_pdf_final` | No | Público (Falta check) | Query: filtros de movimientos | Genera un archivo PDF descargable con la lista tabular de los movimientos filtrados usando ReportLab. |
| `/api/madres` | `GET` | `get_madres` | **SÍ** | Todos | Ninguno | Lee la hoja `Registro Madres` y retorna array de objetos con `id, codigoMadre, nombreCompleto, identificacion, fechaIngreso, procesa`. |
| `/api/madres` | `POST` | `add_madre` | **SÍ** | `admin`, `secretaria` | JSON: `{ codigoMadre, nombreCompleto, identificacion, fechaIngreso }` | Agrega una fila a la hoja `Registro Madres`, asignando el rol del usuario como responsable. |
| `/api/madres/<int:row_id>` | `PUT` | `update_madre` | **SÍ** | `admin`, `secretaria` | Path: `row_id`<br>JSON: datos de madre | Actualiza los datos de la fila de la beneficiaria en `Registro Madres`. |
| `/api/madres/<int:row_id>` | `DELETE` | `api_delete_madre` | **SÍ** | `admin`, `secretaria` | Path: `row_id` | Borra la fila correspondiente en `Registro Madres` y guarda. |
| `/api/madres/lista` | `GET` | `api_madres_lista` | No | Público | Ninguno | Endpoint optimizado que retorna lista limpia `{ codigoMadre, nombreCompleto }` para rellenar selects en filtros. |
| `/api/configuracion` | `GET` | `api_get_config` | No | Público | Ninguno | Retorna `{ saldoInicialCaja, saldoInicialBanco, fechaInicio }` extraídos de la hoja `Configuracion`. |
| `/api/configuracion` | `POST` | `api_post_config` | **SÍ** | `admin` | JSON: `{ saldoInicialCaja, saldoInicialBanco, fechaInicio, force }` | Escribe los saldos iniciales del sistema y fecha base en la hoja `Configuracion`. Valida si existen movimientos anteriores. |
| `/api/saldos` | `GET` | `api_get_saldos` | No | Público (Falta check) | Ninguno | **Motor de saldos operativos**. Calcula saldos en vivo (Caja, Banco, Inicial y Consolidado) e histórico. |
| `/api/trm` | `GET` | `api_get_trm` | No | Público | Ninguno | Retorna diccionario `{ "YYYY-MM": valor }` de tasas de cambio configuradas en la hoja `TRM`. |
| `/api/trm` | `POST` | `api_post_trm` | **SÍ** | `admin` | JSON: `{ mes, valor }` | Inserta o actualiza la tasa representativa para un mes determinado (`YYYY-MM`) en la hoja `TRM`. |
| `/api/trm/<mes>` | `DELETE` | `api_delete_trm` | **SÍ** | `admin` | Path: `mes` (`YYYY-MM`) | Elimina el registro de TRM del mes indicado. |
| `/api/reportes` | `GET` | `api_get_reportes` | No | Público | Query: `tipoReporte, anio, mes, moneda, lang` | Retorna agregaciones mensuales, distribución de gastos, comparativas anuales, balance neto y tabla cronológica. |
| `/api/reportes/export/pdf` | `GET` | `api_export_reportes_pdf_mensual_consolidado` | No | Público | Query: `lang, moneda, tipo, madre, categorias, subcategorias, fechaDesde, fechaHasta` | Genera y transmite el PDF de informe mensual bilingüe formateado en ReportLab con soporte multimoneda TRM. |
| `/api/reportes/export/excel` | `GET` | `api_export_reportes_excel_mensual_consolidado` | No | Público | Query: filtros iguales a PDF | Genera y transmite un libro Excel (`.xlsx`) estilizado con celdas contables y cabeceras dinámicas. |
| `/api/opciones/categorias` | `GET` | `api_get_categorias` | No | Público | Ninguno | Extrae dinámicamente el conjunto único de categorías y subcategorías existentes en las hojas. |
| `/api/usuarios` | `GET` | `get_usuarios` | **SÍ** | `admin` | Ninguno | Lee y retorna el listado de usuarios desde `data/usuarios.json`. |
| `/api/usuarios` | `POST` | `add_usuario` | **SÍ** | `admin` | JSON: `{ usuario, nombre, password, rol, codigo }` | Agrega un nuevo usuario a `usuarios.json` (exige `codigo == "ADMIN-2025"`). |
| `/api/usuarios/<usuario>` | `DELETE` | `delete_usuario` | **SÍ** | `admin` | Path: `usuario`<br>JSON: `{ codigo }` | Elimina un usuario de `usuarios.json` (exige `codigo == "ADMIN-2025"`). |

---

## 6. FRONTEND Y CAPA DE PRESENTACIÓN

### 6.1. Tecnologías Empleadas
- **Arquitectura de Interfaz:** Renderizado híbrido. Jinja2 provee la estructura HTML base y el sistema de navegación lateral (Sidebar). La capa de datos se comporta como una SPA (Single Page Application) parcial: no hay recargas completas de página al interactuar con tablas, formularios o filtros.
- **Librerías Externas:**
  - **Chart.js (v3+)** (cargado vía CDN `jsdelivr`): Renderiza gráficos de barras dobles (Ingresos vs Egresos) y gráficos circulares (Doughnut) de distribución de gastos.
  - **FontAwesome 6.0.0** (CDN `cdnjs`): Iconografía del sistema.
  - **html2pdf.js / jsPDF / html2canvas** (CDN `cdnjs` referenciados en `reportes.html` como fallback visual).
- **Control de Estado en Cliente:** Uso de `localStorage` para almacenar:
  - `rol`: `"admin"` o `"secretaria"`. Controla visibilidad condicional de botones y menús mediante clases CSS (`.admin-only`).
  - `nombre`: Nombre legible del usuario mostrado en el pie del Sidebar.

### 6.2. Vistas y Componentes Principales

1. **`login.html` & `login.css`**: Pantalla de acceso centrada con el logotipo de Adonai, formulario de usuario/contraseña e interceptor AJAX.
2. **`dashboard.html`**: Tablero ejecutivo. Muestra:
   - 4 tarjetas superiores: Saldo Inicial, Ingresos del Mes, Egresos del Mes y Saldo Consolidado.
   - 2 tarjetas secundarias: Desglose Banco vs Caja.
   - 2 gráficos Chart.js interactivos.
   - Tabla de últimos movimientos.
   - Modal administrativo oculto para configuración inicial de saldos y tabla de TRM.
3. **`movimientos.html`**: Módulo contable de transacciones.
   - Tarjetas de resumen financiero en tiempo real.
   - Barra de filtros avanzados: Tipo, Medio (Caja/Banco), Categoría dinámica, Subcategoría dependiente, Código de Madre y rango de fechas.
   - Tabla interactiva con botones de Edición y Eliminación por fila.
   - Modal de registro/edición con selects sincronizados.
4. **`madres.html`**: Registro y padrón de beneficiarias. Permite búsqueda en vivo en el cliente y modal de creación/modificación.
5. **`reportes.html`**: Centro de inteligencia financiera. Selector de moneda (COP/USD), selector de idioma (Español/English), resumen ejecutivo, tablas de balance y disparadores de exportación binaria (PDF y Excel).

---

## 7. BASE DE DATOS Y ALMACENAMIENTO (EXCEL + JSON)

El sistema **NO utiliza un motor de base de datos relacional SQL estándar** (como PostgreSQL o MySQL). La totalidad de la información se almacena en el sistema de archivos del servidor bajo el directorio `data/`:

```text
/opt/adonai/data/ (en producción)
data/ (en desarrollo local)
├── adonai_data_completo.xlsx   <- Libro de cálculo con transacciones y maestros
├── adonai_data_completo.xlsx.lock <- Archivo de bloqueo FileLock generado en runtime
└── usuarios.json               <- Documento JSON con cuentas de usuario
```

### Mecanismo de Entrada/Salida (I/O)
- **Lectura:**
  - `openpyxl.load_workbook(Config.EXCEL_FILE, data_only=True)`: Utilizado para leer valores directos calculados en las rutas API de consulta. Se ejecuta generalmente sin lock para maximizar la velocidad de lectura.
  - `pandas.read_excel(Config.EXCEL_FILE, sheet_name=...)`: Utilizado en los módulos de reportes masivos (`routes.py`), extrayendo hojas completas en dataframes tabulares.
- **Escritura:**
  - `openpyxl.load_workbook(Config.EXCEL_FILE, data_only=False)`: Se abre el libro, se insertan filas (`sheet.append(...)`) o se alteran celdas (`ws.cell(row=..., column=...).value = ...`).
  - La función centralizada `save_workbook(wb)` ejecuta `wb.save(Config.EXCEL_FILE)` dentro de un contexto de bloqueo:
    ```python
    def save_workbook(wb):
        with excel_lock:
            wb.save(Config.EXCEL_FILE)
    ```

---

## 8. ANÁLISIS DETALLADO DEL ARCHIVO EXCEL (`adonai_data_completo.xlsx`)

La inspección física directa del archivo en el entorno arrojó la existencia exacta de **9 hojas de cálculo**:

| # | Nombre Exacto de la Hoja | Filas Máx. | Columnas Máx. | Propósito en el Negocio | Uso en Código |
|:---:|---|:---:|:---:|---|---|
| 1 | **`Usuarios`** | 13 | 7 | Hoja residual histórica con datos de usuarios y claves. | **HUÉRFANA / INACTIVA**. El backend utiliza `usuarios.json`. |
| 2 | **`Registro Madres`** | 8 | 5 | Padrón maestro de beneficiarias registradas. | **ACTIVA**. Leída y escrita por endpoints `/api/madres`. |
| 3 | **`saldos diario`** *(minúsculas)* | 5 | 6 | Plantilla previa de saldos diarios manuales. | **INACTIVA**. Los saldos se calculan al vuelo en `/api/saldos`. |
| 4 | **`Ingresos`** | 7 | 9 | Libro mayor de transacciones de entrada de dinero. | **CRÍTICA**. Leída y escrita por `/api/movimientos`, `/api/saldos`, `/api/reportes`. |
| 5 | **`Egresos`** | 5 | 9 | Libro mayor de transacciones de salida de dinero. | **CRÍTICA**. Leída y escrita por `/api/movimientos`, `/api/saldos`, `/api/reportes`. |
| 6 | **`Resumen Consolidado`** | 4 | 5 | Resumen de balance general (Ingresos vs Egresos). | **ACTIVA**. Sobrescrita automáticamente por `actualizar_reportes()`. |
| 7 | **`Informe Mensual`** | 8 | 9 | Agrupación acumulada por mes (`YYYY-MM`). | **ACTIVA**. Sobrescrita automáticamente por `actualizar_reportes()`. |
| 8 | **`Configuracion`** | 4 | 2 | Parámetros contables base del sistema. | **CRÍTICA**. Administrada desde modal en Frontend (`/api/configuracion`). |
| 9 | **`TRM`** | 6 | 2 | Histórico de Tasas Representativas del Mercado (USD/COP). | **CRÍTICA**. Base del motor multimoneda (`/api/trm`). |

---

## 9. DICCIONARIO Y ESTRUCTURA DE DATOS

### Hoja: `Ingresos`
Columnas físicas: `['Fecha', 'Medio', 'Tipo', 'Categoría', 'Subcategoría', 'codigo madre', 'Responsable', 'Valor', 'Responsable']`  
*Nota técnica:* La columna 7 en el encabezado original dice "Responsable", pero el código operativo (`routes.py:276` y `excel_db.py:55`) mapea la columna 7 a **Concepto**, la columna 8 a **Valor**, y la columna 9 a **Responsable**.

| Col | Campo Lógico | Tipo de Dato | Obligatorio | Descripción | Ejemplo Real |
|:---:|---|---|:---:|---|---|
| 1 | `fecha` | String / ISO Date | SÍ | Fecha de ocurrencia de la transacción (`YYYY-MM-DD`). | `2025-09-14` |
| 2 | `medio` | String | SÍ | Canal de pago. Valores forzados en minúscula: `banco` o `caja`. | `banco` |
| 3 | `tipo` | String | SÍ | Tipo de transacción (`ingreso` / `ingresos`). | `ingresos` |
| 4 | `categoria` | String | SÍ | Rubro contable principal. | `Administrativo` |
| 5 | `subcategoria` | String | SÍ | Clasificación específica. | `Intereses bancarios` |
| 6 | `codigoMadre` | String / Num | Opcional | Código identificador de la beneficiaria asociada. | `20202040` |
| 7 | `concepto` | String | Opcional | Glosa, motivo o descripción detallada del movimiento. | `Donación recibida en sede` |
| 8 | `valor` | Float | SÍ | Monto monetario en Pesos Colombianos (COP). | `200000` |
| 9 | `responsable` | String | SÍ | Identificador del usuario que registró el dato (`admin` / `secretaria`). | `admin` |

### Hoja: `Egresos`
Columnas físicas: `['Fecha', 'Medio', 'Tipo', 'Categoría', 'Subcategoría', 'codigo madre', 'Concepto', 'Valor', 'Responsable']`

| Col | Campo Lógico | Tipo de Dato | Obligatorio | Descripción | Ejemplo Real |
|:---:|---|---|:---:|---|---|
| 1 | `fecha` | String / ISO Date | SÍ | Fecha del desembolso (`YYYY-MM-DD`). | `2025-12-14` |
| 2 | `medio` | String | SÍ | Canal de salida de dinero: `banco` o `caja`. | `banco` |
| 3 | `tipo` | String | SÍ | Tipo de transacción (`egreso` / `egresos`). | `egresos` |
| 4 | `categoria` | String | SÍ | Categoría del gasto (ej. `10. Misional Madres`). | `10. Misional Madres` |
| 5 | `subcategoria` | String | SÍ | Subcategoría (ej. `Transporte`, `Alimentos`). | `Transporte` |
| 6 | `codigoMadre` | String / Num | Opcional | Código de la beneficiaria que recibió la ayuda. | `505050` |
| 7 | `concepto` | String | Opcional | Justificación del gasto. | `Apoyo para pasajes cita médica` |
| 8 | `valor` | Float | SÍ | Cuantía del gasto en COP. | `5000000` |
| 9 | `responsable` | String | SÍ | Usuario que asienta el egreso en el sistema. | `admin` |

### Hoja: `Registro Madres`
Columnas físicas: `['codigo madre', 'nombre', 'indentificacion', 'fecha ingreso', 'responsable']`  
*Nota técnica:* Nótese el error tipográfico original en la cabecera Excel (`indentificacion`).

| Col | Campo Lógico | Tipo de Dato | Obligatorio | Descripción | Ejemplo Real |
|:---:|---|---|:---:|---|---|
| 1 | `codigoMadre` | String / Num | SÍ | Identificador único de control interno de la madre. | `2505165` |
| 2 | `nombreCompleto`| String | SÍ | Nombres y apellidos de la madre. | `Juliet Dayana Pérez` |
| 3 | `identificacion`| String | SÍ | Documento de identidad (Cédula / PEP / Pasaporte). | `15152123` |
| 4 | `fechaIngreso` | String / Date | SÍ | Fecha en que ingresó al programa de Adonai. | `2025-09-05` |
| 5 | `procesa` | String | SÍ | Usuario/rol responsable (`admin`, `secretaria` o legacy `1`/`2`). | `admin` |

### Hoja: `Configuracion`
Columnas físicas: `['Parametro', 'Valor']`

| Parámetro | Tipo | Descripción | Ejemplo Real |
|---|---|---|---|
| `SaldoInicialCaja` | Float | Dinero base en efectivo al iniciar la contabilidad del sistema. | `20000000` ($20,000,000 COP) |
| `SaldoInicialBanco` | Float | Dinero base en cuentas bancarias al iniciar la contabilidad. | `15000000` ($15,000,000 COP) |
| `FechaInicioSistema`| String | Fecha de corte (`YYYY-MM-DD`). Movimientos previos a esta fecha se descartan del cálculo de saldos. | `2025-01-01` |

### Hoja: `TRM`
Columnas físicas: `['Mes', 'Valor']`

| Columna | Tipo | Descripción | Ejemplo Real |
|---|---|---|---|
| `Mes` | String (`YYYY-MM`) | Mes y año contable al que aplica la tasa. | `2025-09` |
| `Valor` | Float | Valor de 1 Dólar Estadounidense en COP para ese período. | `4000.0` |

### Archivo: `data/usuarios.json`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `usuario` | String | SÍ | Login / Identificador de acceso del usuario. |
| `nombre` | String | SÍ | Nombre visible en la interfaz de usuario. |
| `password`| String | SÍ | Contraseña en texto plano (*Riesgo crítico documentado en Sección 16*). |
| `rol` | String | SÍ | Nivel de privilegios: `"admin"` o `"secretaria"`. |

---

## 10. LÓGICA FINANCIERA, CÁLCULOS Y MOTOR MULTIMONEDA (TRM)

Toda la lógica de liquidación reside en Python dentro de `src/routes.py` (función `api_get_saldos` y exportadores ReportLab/Excel).

### 10.1. Fórmulas Matemáticas Reales de Saldos Operativos

El sistema opera bajo una regla de corte contable dinámico basado en la fecha actual (`hoy = datetime.now().date()`):

1. **Saldo Inicial Consolidado Base:**
   $$\text{Saldo Inicial Base} = \text{SaldoInicialBanco} + \text{SaldoInicialCaja}$$
   *(Obtenido de la hoja `Configuracion`)*

2. **Saldo Inicial del Mes en Curso (`saldoInicial`):**
   Representa el saldo acumulado real con el que inició el mes corriente ($f_{ym} < ym$):
   $$\text{saldoInicial} = \text{Saldo Inicial Base} + \sum_{f_{ym} < ym} \text{Ingresos} - \sum_{f_{ym} < ym} \text{Egresos}$$

3. **Ingresos y Egresos del Mes Vigente ($f_{ym} == ym$):**
   - $\text{ingresosBanco} = \sum (\text{Ingresos del mes con medio} = \text{"banco"})$
   - $\text{ingresosCaja} = \sum (\text{Ingresos del mes con medio} = \text{"caja"})$
   - $\text{egresosBanco} = \sum (\text{Egresos del mes con medio} = \text{"banco"})$
   - $\text{egresosCaja} = \sum (\text{Egresos del mes con medio} = \text{"caja"})$

4. **Saldos Finales Operativos Actuales:**
   - **Saldo en Bancos:**
     $$\text{saldoBanco} = \text{SaldoInicialBanco} + \sum_{\text{todos}} \text{Ingresos}_{\text{banco}} - \sum_{\text{todos}} \text{Egresos}_{\text{banco}}$$
   - **Saldo en Caja:**
     $$\text{saldoCaja} = \text{SaldoInicialCaja} + \sum_{\text{todos}} \text{Ingresos}_{\text{caja}} - \sum_{\text{todos}} \text{Egresos}_{\text{caja}}$$
   - **Saldo Consolidado Total:**
     $$\text{saldoConsolidado} = \text{saldoBanco} + \text{saldoCaja}$$

*Filtro de Exclusión Temporal:* Si `FechaInicioSistema` está configurada, cualquier transacción con `fecha < FechaInicioSistema` es ignorada en la sumatoria.

### 10.2. Motor de Conversión Multimoneda (COP a USD con TRM Histórica)

A diferencia de sistemas convencionales que aplican una tasa de cambio global, Adonai evalúa la TRM de cada transacción de manera individual:

```text
Transacción (Fecha F) ───► Extraer Mes (f_ym = YYYY-MM)
                                │
                                ▼
                    ¿Existe f_ym en Hoja TRM?
                       │               │
                     [SÍ]             [NO]
                       │               │
                       ▼               ▼
                 Usar TRM exacto    Buscar mes anterior más cercano
                                    disponible (Fallback Histórico)
                                       │               │
                                   [Hallado]      [No Hallado]
                                       │               │
                                       ▼               ▼
                                 Usar TRM prev.   Error 400 (Falta TRM)
```

**Fórmula de conversión individual:**
$$\text{Valor en USD} = \frac{\text{Valor en COP}}{\text{TRM}(f_{ym})}$$

---

## 11. CONFIGURACIÓN Y VARIABLES DE ENTORNO

La configuración se gestiona en `src/config.py` y se alimenta de variables de entorno del sistema o Docker:

| Variable | Valor por Defecto | Configuración en Docker Compose | Propósito |
|---|---|---|---|
| `SECRET_KEY` | `adonai_secret_key_2025` | `[CONFIGURADA EN COMPOSE]` | Firma criptográfica de cookies de sesión de Flask. |
| `FLASK_DEBUG`| `True` | `False` | Activa/Desactiva modo de depuración en Flask. |
| `PORT` | `5000` | `5000` | Puerto TCP de escucha del servidor web. |
| `HOST` | `0.0.0.0` | `0.0.0.0` | Dirección IP de enlace de red (todas las interfaces). |
| `PYTHONPATH` | *No fijado* | `/app` | Ruta de resolución de módulos de Python dentro del contenedor. |

---

## 12. INFRAESTRUCTURA DOCKER Y DESPLIEGUE

### 12.1. Análisis del `Dockerfile`
- **Imagen Base:** `python:3.12-slim` (Debian Bookworm minimalista).
- **Directorio de Trabajo:** `/app`.
- **Instalación de paquetes de sistema:**
  `apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*`  
  *(Instala gcc y compiladores requeridos por extensiones C de pandas o reportlab).*
- **Dependencias Python:** `pip install --no-cache-dir -r requirements.txt`.
- **Punto de montaje creado:** `/app/data`.
- **Copias de código:**
  - `COPY src/ /app/src/`
  - `COPY wsgi.py /app/`
- **Comando de Producción (CMD):**
  `["gunicorn", "--workers=4", "--bind=0.0.0.0:5000", "wsgi:app"]`

### 12.2. Análisis de `docker-compose.yml`
```yaml
version: '3.8'

services:
  web:
    build: .
    container_name: adonai_dashboard
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - FLASK_DEBUG=False
      - PORT=5000
      - HOST=0.0.0.0
      - SECRET_KEY=[CONFIGURADA]
    volumes:
      - /opt/adonai/data:/app/data
```

---

## 13. ESTADO ACTUAL DE CONTENEDORES Y PROCESOS

Durante la auditoría local sobre el host de desarrollo (Windows):
- **Motor Docker:** El servicio Docker Desktop Engine Linux (`//./pipe/dockerDesktopLinuxEngine`) no se encontraba activo en esta máquina en el momento de la inspección.
- **Procesos Python:** No hay instancias de Python o Gunicorn corriendo localmente en los puertos 5000 u 8080.
- **Servidor Remoto:** El despliegue de producción se encuentra alojado en un servidor Linux externo (donde reside `/opt/adonai/data`).
  - *Estado en Servidor de Producción:* **NO VERIFICADO DIRECTAMENTE DESDE TERMINAL LOCAL** (requiere acceso SSH al host de producción).

---

## 14. RED, PROXY INVERSO (REVERSE PROXY) Y HTTPS

En el repositorio **no existen archivos de configuración de proxy inverso** (Nginx, Traefik, Caddy o certificados Let's Encrypt / Certbot).
El contenedor expone el puerto estándar `5000`. En una arquitectura estándar de producción en el servidor `/opt/adonai`, el tráfico de red opera bajo el siguiente modelo:

```text
[Cliente / Navegador Web]
         │
         ▼  (Puerto 80 / 443 HTTPS - SSL/TLS)
[Proxy Inverso Externo: Nginx / Cloudflare / NPM]
         │
         ▼  (Proxy Pass local: http://127.0.0.1:5000)
[Contenedor Docker: adonai_dashboard]
         │
         ▼
[Gunicorn WSGI: 4 Workers]
         │
         ▼
[Flask Application (wsgi:app)]
```

*Estado de Proxy en Servidor de Producción:* **NO VERIFICADO**. Se presume configurado a nivel de sistema operativo anfitrión fuera del repositorio.

---

## 15. PERSISTENCIA, VOLÚMENES Y BACKUPS

### 15.1. Esquema de Persistencia
- El `Dockerfile` deliberadamente **no** incluye la carpeta `data/` en la imagen (`.dockerignore:17`).
- Toda la persistencia depende estrictamente del volumen montado:
  `/opt/adonai/data` (Directorio físico en Host) $\rightarrow$ `/app/data` (Dentro del contenedor).

### 15.2. Estado de Respaldo (Backups)
- **Copia de seguridad física encontrada:** `data/adonai_data_completo_backup.xlsx` (10,498 bytes).
  - *Inspección de contenido:* Este archivo de backup contiene únicamente 7 hojas y carece de las hojas `TRM` y `Configuracion`. Corresponde a una copia previa a la versión 5.
- **Automatización de Backups:** **NO EXISTE** ningún script (`cron`, `bash`, `powershell`) ni tarea programada en el repositorio para realizar respaldos periódicos automáticos de `adonai_data_completo.xlsx` ni de `usuarios.json`.

---

## 16. AUDITORÍA DE SEGURIDAD Y CLASIFICACIÓN DE RIESGOS

| Riesgo Detectado | Clasificación | Impacto y Causa | Solución Recomendada |
|---|:---:|---|---|
| **Contraseñas almacenadas en texto claro** | **CRÍTICO** | En `data/usuarios.json` las contraseñas están legibles sin hashing. Si alguien accede al archivo o al volumen, todas las cuentas quedan comprometidas. | Implementar `werkzeug.security.generate_password_hash` y `check_password_hash`. |
| **Código maestro de administración hardcodeado** | **CRÍTICO** | Los endpoints `POST` y `DELETE` de `/api/usuarios` validan la clave estática `"ADMIN-2025"` en el código fuente (`routes.py:2139`). | Eliminar el código en texto plano; basar la autorización exclusivamente en la sesión activa con rol `admin`. |
| **Clave Secreta (`SECRET_KEY`) expuesta en repo** | **ALTO** | El archivo `docker-compose.yml` contiene la clave `SECRET_KEY` explícita en el repositorio Git. | Migrar a un archivo `.env` fuera del control de versiones cargado por Docker Compose. |
| **Falta de autenticación en endpoints de saldos y configuración** | **ALTO** | `/api/saldos`, `/api/configuracion` (GET), `/api/trm` (GET), `/api/reportes` y `/api/reportes/export/*` no verifican `session["usuario"]`. Cualquier usuario en la red puede extraer la contabilidad completa. | Añadir decorador `@login_required` o verificación de sesión en todos los endpoints de consulta. |
| **Ausencia de protección CSRF** | **MEDIO** | Las peticiones POST/PUT/DELETE no implementan tokens CSRF (Cross-Site Request Forgery). | Incorporar `Flask-WTF` con protección CSRF global para formularios y llamadas fetch. |
| **Falta de flags seguras en cookies de sesión** | **MEDIO** | No se configuran `SESSION_COOKIE_SECURE = True` ni `SESSION_COOKIE_HTTPONLY = True` explícitamente en `wsgi.py`. Las cookies pueden viajar sin cifrar si no se fuerza HTTPS. | Configurar directivas estrictas de cookies en `src/config.py`. |
| **Condición de Carrera en Concurrencia de Excel** | **MEDIO** | `FileLock` solo protege la instrucción `wb.save()`, pero la carga `get_workbook()` ocurre antes sin lock. Dos peticiones simultáneas provocan pérdida de actualizaciones (*Lost Update*). | Encapsular la transacción completa (lectura, modificación en memoria y guardado) bajo el lock. |
| **Contenedor ejecutándose como usuario Root** | **BAJO** | El `Dockerfile` no crea un usuario sin privilegios para ejecutar Gunicorn. | Agregar directiva `USER appuser` en el Dockerfile. |

---

## 17. GESTIÓN DE DEPENDENCIAS (PYTHON Y NODE)

### 17.1. Dependencias de Python (`requirements.txt`)

| Paquete | Versión Fijada | Función en el Proyecto | ¿Necesario en Producción? |
|---|:---:|---|:---:|
| `Flask` | 3.1.2 | Servidor web y routing HTTP. | SÍ |
| `gunicorn` | 23.0.0 | Servidor WSGI HTTP de producción multiproceso. | SÍ |
| `openpyxl` | 3.1.5 | Motor de lectura/escritura de archivos Excel (`.xlsx`). | SÍ |
| `pandas` | 2.3.3 | Procesamiento tabular y agrupaciones (`groupby`) para reportes. | SÍ |
| `reportlab` | 4.4.3 | Generador de documentos PDF para reportes contables. | SÍ |
| `filelock` | 3.29.1 | Sistema de bloqueo de archivos para sincronización de concurrencia. | SÍ |
| `Werkzeug` | 3.1.3 | Utilidades WSGI base de Flask. | SÍ |
| `Jinja2` | 3.1.6 | Motor de renderizado de plantillas HTML. | SÍ |
| `itsdangerous` | 2.2.0 | Firma criptográfica de cookies de sesión. | SÍ |
| `MarkupSafe` | 3.0.2 | Escape de caracteres seguros en plantillas HTML. | SÍ |
| `blinker` | 1.9.0 | Sistema de señales interno de Flask. | SÍ |
| `click` | 8.2.1 | Interfaz de línea de comandos para Flask. | SÍ |
| `colorama` | 0.4.6 | Salida de terminal con colores en desarrollo. | Opcional |
| `et_xmlfile` | 2.0.0 | Parser XML de bajo nivel requerido por `openpyxl`. | SÍ |

### 17.2. Dependencias de Node.js (`package.json`)
Contiene `live-server: ^1.2.2` en `devDependencies`. Es completamente innecesario para la ejecución del servidor web en Docker.

---

## 18. CONTROL DE VERSIONES (GIT)

- **Repositorio Remoto:** `origin -> https://github.com/SantiagoR2001/adonai-dashboard-v5.git`
- **Rama Activa:** `master`
- **Estado:** Sincronizado (`Your branch is up to date with 'origin/master'`, working tree clean).
- **Últimos 5 Commits Registrados:**
  1. `d5acaae`: *Revertir nombre del enlace a Información General* (2026-07-10)
  2. `617c0a4`: *Actualizar vista de movimientos* (2026-07-10)
  3. `ca7277d`: *Configurar volumen persistente para datos* (2026-07-10)
  4. `056da91`: *Allow and include data folder with database and users* (2026-06-09)
  5. `0d999d4`: *Initial commit: Adonai Dashboard V5 con Sistema TRM* (2026-06-09)

---

## 19. SISTEMA DE LOGS Y MONITOREO

- **Configuración de Logging:** **No existe módulo `logging` configurado en Python**. La aplicación no escribe archivos de log en disco (búsqueda de `*.log` arrojó 0 archivos).
- **Destino de Logs:** Toda la salida se envía a los descriptores estándar `sys.stdout` y `sys.stderr`.
- **En Producción Docker:** Los registros de acceso y errores de Gunicorn se consultan exclusivamente mediante el comando del motor de contenedores:
  ```bash
  docker logs -f --tail 100 adonai_dashboard
  ```

---

## 20. MATRIZ DE FUNCIONALIDADES REALES VS ESTADO

| Funcionalidad | Estado Real | Observaciones Técnicas |
|---|:---:|---|
| **Autenticación (Login/Logout)** | **IMPLEMENTADO Y FUNCIONANDO** | Basado en sesión Flask y `usuarios.json`. Claves en texto plano. |
| **Información General (Dashboard)** | **IMPLEMENTADO Y FUNCIONANDO** | Tarjetas de saldos dinámicas y gráficos Chart.js operativos. |
| **Registro de Madres (CRUD)** | **IMPLEMENTADO Y FUNCIONANDO** | Escribe y lee correctamente de la hoja `Registro Madres`. |
| **Movimientos Contables (CRUD)** | **IMPLEMENTADO Y FUNCIONANDO** | Inserción, edición y eliminación sobre hojas `Ingresos` y `Egresos`. |
| **Configuración de Saldos Iniciales** | **IMPLEMENTADO Y FUNCIONANDO** | Modal funcional para administradores; persiste en hoja `Configuracion`. |
| **Configuración y Gestión de TRM** | **IMPLEMENTADO Y FUNCIONANDO** | Altas, bajas y consultas sobre la hoja `TRM`. |
| **Reporte Financiero en Pantalla** | **IMPLEMENTADO Y FUNCIONANDO** | Selector de mes/año, moneda y cálculo acumulado cronológico. |
| **Exportación a PDF de Movimientos** | **IMPLEMENTADO Y FUNCIONANDO** | Endpoint `/api/export/pdf` con tabla ReportLab. |
| **Exportación a PDF de Reportes Bilingües**| **IMPLEMENTADO Y FUNCIONANDO** | Endpoint `/api/reportes/export/pdf` con saltos de línea HTML y multimoneda. |
| **Exportación a Excel de Reportes** | **IMPLEMENTADO Y FUNCIONANDO** | Endpoint `/api/reportes/export/excel` con formato de moneda y celdas unificadas. |
| **Filtro de Madres en Reportes** | **IMPLEMENTADO CON ERROR MENOR** | Línea 951 de `routes.py` busca hoja `"Madres"` en vez de `"Registro Madres"`, causando que el contador de `madresAtendidas` reporte 0. |
| **Eliminación directa desde Dashboard**| **CÓDIGO CON ERROR** | `dashboard.js:404` invoca `/api/movimientos/${id}` sin indicar la hoja (`sheet`), retornando 404 al intentar borrar desde el dashboard. En `movimientos.js` funciona correctamente. |
| **Saldos Diarios Manuales** | **NO IMPLEMENTADO / OBSOLETO** | La hoja `saldos diario` no es modificada ni utilizada por el código actual. |

---

## 21. FLUJOS DETALLADOS DE NEGOCIO DEL SISTEMA

### Flujo 1: Inicio de Sesión
```text
Usuario ingresa usuario/password en login.html
   │
   ▼
POST /api/login ───► Abre usuarios.json ───► Compara credenciales
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      ▼ [Coincide]                                                ▼ [No coincide]
       session["usuario"] = u["usuario"]                               Retorna HTTP 401
       session["rol"]     = u["rol"]
       session["nombre"]  = u["nombre"]
                      │
                      ▼
       Retorna JSON { rol, nombre }
                      │
                      ▼
       Frontend guarda rol/nombre en localStorage y redirige a /dashboard
```

### Flujo 2: Registro de un Nuevo Movimiento Contable
```text
Usuario llena formulario en movimientos.html
(Fecha, Medio [Caja/Banco], Tipo [Ingreso/Egreso], Categoría, Subcategoría, Cód Madre, Concepto, Valor)
   │
   ▼
POST /api/movimientos
   │
   ├─► Valida sesión ("usuario" in session y rol in [admin, secretaria])
   ├─► Identifica hoja destino: "Ingresos" si tipo == 'ingreso' sino "Egresos"
   ├─► wb = get_workbook()
   ├─► sheet.append([fecha, medio, tipo, categoria, subcategoria, codigoMadre, concepto, valor, responsable])
   ├─► actualizar_reportes(wb)  <── Sobrescribe "Resumen Consolidado" e "Informe Mensual"
   ├─► save_workbook(wb)        <── Adquiere excel_lock y guarda adonai_data_completo.xlsx
   │
   ▼
Retorna HTTP 201 {"message": "Movimiento agregado", "id": row_id}
   │
   ▼
movimientos.js actualiza tabla y recalcula tarjetas llamando a /api/saldos
```

### Flujo 3: Generación y Exportación de Reporte Bilingüe Multimoneda (PDF/Excel)
```text
Usuario selecciona Filtros + Moneda [COP / USD] + Idioma [Español / English]
   │
   ▼
GET /api/reportes/export/pdf  (o /excel)
   │
   ├─► Lee hojas Ingresos y Egresos mediante pandas.read_excel
   ├─► Para cada fila:
   │     Si moneda == "usd":
   │        f_ym = fecha.strftime("%Y-%m")
   │        TRM = get_trm_for_date(f_ym)
   │        fila["valor"] = fila["valor"] / TRM
   │
   ├─► Aplica filtros de fecha, medio, categoría y madre
   ├─► Si lang == "en":
   │        Traduce categorías y subcategorías usando el diccionario maestro CAT_EN
   │        Traduce meses (January, February...) y títulos usando TEXTOS["en"]
   │
   ├─► Construye matriz ReportLab (SimpleDocTemplate con orientación landscape)
   │   o Libro Excel con estilos abiertos OpenPyXL
   │
   ▼
Retorna archivo binario con cabecera Content-Disposition: attachment; filename=reporte_adonai_*.pdf
```

---

## 22. MAPA DE DEPENDENCIAS ENTRE COMPONENTES

```text
[Frontend: Plantillas HTML + JS]
   │ (Peticiones fetch JSON)
   ▼
[API Endpoints: routes.py]
   │
   ├──► [Gestión de Usuarios] ─────────────► [data/usuarios.json]
   │
   ├──► [Saldos / Reportes / Filtros] ────► [Motor TRM & Diccionario CAT_EN]
   │                                                 │
   │                                                 ▼
   └──► [I/O Excel: excel_db.py] ──────────► [openpyxl / pandas]
               │                                     │
               ▼                                     ▼
        [FileLock: .lock] ─────────────────► [data/adonai_data_completo.xlsx]
                                                     │
                                                     ▼
                                      [Persistencia: Volumen Docker]
                                                     │
                                                     ▼
                                           [/opt/adonai/data Host]
```

---

## 23. ARCHIVOS CRÍTICOS QUE NO DEBEN MODIFICARSE SIN CUIDADO

1. **`data/adonai_data_completo.xlsx`**: Es el cerebro y la base de datos viva del sistema.
   - *Riesgo:* Si se renombran las hojas `Ingresos`, `Egresos`, `Registro Madres`, `Configuracion` o `TRM`, el backend colapsará con excepciones `KeyError`.
   - *Riesgo de Columnas:* La función `row_to_dict` y los exportadores asumen posiciones fijas de columnas. Alterar el orden corrompe la lectura financiera.
2. **`data/usuarios.json`**: Contiene la única fuente de acceso al sistema. Si se borra o se corrompe su sintaxis JSON, ningún usuario podrá autenticarse.
3. **`src/excel_db.py`**: Contiene la definición de `LOCK_FILE` y `save_workbook`. Modificarlo sin pruebas puede provocar corrupción irrecuperable del Excel por escrituras truncadas.
4. **`src/routes.py` (Líneas 15-120: `CAT_EN`)**: Diccionario maestro bilingüe. Si se agregan categorías en el frontend sin mapearlas en `CAT_EN`, los reportes en inglés mantendrán el texto en español o fallarán en agrupaciones.

---

## 24. PROCEDIMIENTO OPERATIVO DE DESPLIEGUE

Para desplegar una nueva versión en el servidor de producción Linux (`/opt/adonai`):

### Paso 1: Conexión y Copia de Archivos
Conectarse vía SSH al servidor de producción y ubicarse en el directorio del proyecto:
```bash
cd /opt/adonai
```
Si se utiliza Git para sincronización:
```bash
git fetch origin
git status
git pull origin master
```

### Paso 2: Respaldo Preventivo de Datos
**OBLIGATORIO** antes de cualquier cambio:
```bash
cp /opt/adonai/data/adonai_data_completo.xlsx /opt/adonai/data/adonai_data_completo_BACKUP_$(date +%Y%m%d_%H%M%S).xlsx
cp /opt/adonai/data/usuarios.json /opt/adonai/data/usuarios_BACKUP_$(date +%Y%m%d_%H%M%S).json
```

### Paso 3: Reconstrucción e Inicio de Contenedores
```bash
docker compose build --no-cache
docker compose up -d
```

### Paso 4: Verificación de Estado y Logs
```bash
docker compose ps
docker logs --tail 50 -f adonai_dashboard
```
Verificar que Gunicorn reporte: `[INFO] Listening at: http://0.0.0.0:5000` con 4 workers activos.

### Paso 5: Comprobación de Humo (Smoke Test)
Desde el navegador o mediante `curl`:
```bash
curl -I http://127.0.0.1:5000/login
```
Debe retornar código de respuesta HTTP `200 OK`.

---

## 25. PROCEDIMIENTO DE RECUPERACIÓN ANTE DESASTRES (DRP)

### Escenario A: El contenedor no inicia o se reinicia continuamente
1. Inspeccionar logs del contenedor:
   ```bash
   docker logs --tail 100 adonai_dashboard
   ```
2. Verificar si hay un archivo de bloqueo huérfano bloqueando el arranque:
   ```bash
   ls -la /opt/adonai/data/*.lock
   # Si existe un lock persistente y el proceso murió:
   rm -f /opt/adonai/data/*.lock
   ```
3. Reiniciar el servicio:
   ```bash
   docker compose restart web
   ```

### Escenario B: Corrupción del archivo Excel (`adonai_data_completo.xlsx`)
Si la aplicación arroja errores `openpyxl.utils.exceptions.InvalidFileException` o `BadZipFile`:
1. Detener el contenedor para evitar escrituras concurrentes:
   ```bash
   docker compose stop web
   ```
2. Mover el archivo corrupto a cuarentena:
   ```bash
   mv /opt/adonai/data/adonai_data_completo.xlsx /opt/adonai/data/corrupted_$(date +%s).xlsx
   ```
3. Restaurar la última copia de seguridad íntegra:
   ```bash
   cp /opt/adonai/data/[ULTIMO_BACKUP_VALIDO].xlsx /opt/adonai/data/adonai_data_completo.xlsx
   ```
4. Eliminar locks residuales:
   ```bash
   rm -f /opt/adonai/data/*.lock
   ```
5. Iniciar nuevamente:
   ```bash
   docker compose start web
   ```

---

## 26. HALLAZGOS Y PROBLEMAS TÉCNICOS DETECTADOS

### Hallazgo 1: Conteo de Madres Atendidas en 0 en Reportes
- **Archivo:** `src/routes.py`, línea 951.
- **Problema:** El código evalúa:
  ```python
  if "Madres" in wb_m.sheetnames:
      ws_m = wb_m["Madres"]
  ```
  Sin embargo, la hoja real en el libro se llama `"Registro Madres"`. Como resultado, la condición jamás se cumple y `madresAtendidas` siempre retorna 0 en la API de reportes.
- **Prioridad:** MEDIA.
- **Solución:** Reemplazar por `if "Registro Madres" in wb_m.sheetnames: ws_m = wb_m["Registro Madres"]`.

### Hallazgo 2: Error 404 al Eliminar Movimiento desde Dashboard
- **Archivo:** `src/static/js/dashboard.js`, línea 404.
- **Problema:** La función `deleteMovimiento` ejecuta `fetch('/api/movimientos/' + id, { method: 'DELETE' })`. Pero la ruta registrada en el backend es obligatoriamente `@main_bp.route('/api/movimientos/<sheet>/<int:row_id>', methods=['DELETE'])`. Al no enviar el parámetro `<sheet>`, el servidor retorna HTTP 404.
- **Prioridad:** MEDIA.
- **Solución:** Adaptar la llamada para enviar la hoja (`Ingresos` o `Egresos`), tal como lo hace correctamente `movimientos.js`.

### Hallazgo 3: Petición a Endpoint Inexistente `/api/resumen`
- **Archivo:** `src/static/js/dashboard.js`, línea 94.
- **Problema:** Se invoca `fetch("/api/resumen")`, endpoint que no está implementado en `routes.py`, arrojando un error silencioso capturado en el frontend.
- **Prioridad:** BAJA.
- **Solución:** Remover la llamada huérfana o implementar el endpoint si se requiere desglose adicional.

---

## 27. DEUDA TÉCNICA ACUMULADA

1. **Persistencia en Excel para Contabilidad Multiusuario:**
   - Microsoft Excel (`openpyxl`) no está diseñado como motor transaccional ACID.
   - Conforme crezca el número de filas (más de 10,000 registros), el tiempo de lectura con `load_workbook` y `pandas` degradará la latencia de respuesta de los endpoints por encima de varios segundos.
2. **Falta de Transaccionalidad Integral:**
   - La adquisición del lock ocurre únicamente al momento de guardar el archivo en disco, no al leer los datos para modificarlos. Hay ventana para condiciones de carrera (*race conditions*).
3. **Mezcla de Lógica Contable y Controladores Web:**
   - `src/routes.py` supera las 2,100 líneas concentrando validación HTTP, normalización Pandas, formateo ReportLab y cálculos matemáticos. Debería desacoplarse en una capa de servicios (`services/`).
4. **Almacenamiento de Secretos y Cuentas:**
   - Las contraseñas en texto claro en `usuarios.json` deben sustituirse con un modelo seguro de hashing.
5. **Código Muerto en la Raíz del Repositorio:**
   - Existen 15 archivos `.py` en la raíz (`update_*.py`, `fix_*.py`) que fueron scripts de refactorización previa. Generan confusión para nuevos ingenieros.

---

## 28. PLAN Y RECOMENDACIONES PARA MIGRACIÓN FUTURA (EXCEL → POSTGRESQL)

Si la organización decide dar el paso profesional hacia una base de datos relacional robusta, se recomienda **PostgreSQL** bajo el siguiente mapeo:

```text
HOJA EXCEL                     TABLA POSTGRESQL SUGERIDA
────────────────────────────────────────────────────────────────────────
Usuarios (y usuarios.json)  ─► users (id, username, password_hash, role, full_name)
Registro Madres             ─► mothers (id, code, full_name, national_id, admission_date, created_by)
Ingresos                    ─► transactions (id, date, payment_method, type='ingreso', category, subcategory, mother_id, concept, amount, user_id)
Egresos                     ─► transactions (id, date, payment_method, type='egreso', category, subcategory, mother_id, concept, amount, user_id)
Configuracion               ─► system_settings (key, value)
TRM                         ─► trm_rates (year_month, rate)
Resumen / Informe Mensual   ─► Vistas SQL / Materialized Views automáticas
```

### Pasos Recomendados:
1. Diseñar el esquema con SQLAlchemy o Alembic en Flask.
2. Crear un script de migración ETL de una sola vía que lea `adonai_data_completo.xlsx` con `openpyxl` e inserte las transacciones con validación de claves foráneas (`mother_id`).
3. Reemplazar las funciones de `excel_db.py` por consultas relacionales indexadas por fecha.

---

## 29. DIAGRAMA DE ARQUITECTURA REAL

```text
                             USUARIOS Y CLIENTES
                       (Administradora / Secretaria)
                                    │
                                    ▼  [HTTPS / HTTP]
                   ┌───────────────────────────────────┐
                   │     SERVIDOR HOST (Linux / VPS)   │
                   │          Ruta: /opt/adonai        │
                   │                                   │
                   │   [Nginx / Proxy Inverso Host]    │
                   └─────────────────┬─────────────────┘
                                     │
                                     ▼  [Puerto 5000 TCP]
┌────────────────────────────────────┴────────────────────────────────────┐
│                  CONTENEDOR DOCKER: adonai_dashboard                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Gunicorn WSGI (4 Workers)                     │  │
│  │                               │                                  │  │
│  │                               ▼                                  │  │
│  │                Flask Application (src/routes.py)                 │  │
│  │     ├── Controladores de Vistas (Jinja2 Templates)               │  │
│  │     ├── API REST JSON (/api/movimientos, /api/saldos...)         │  │
│  │     └── Motor de Reportes (ReportLab PDF + OpenPyXL Excel)       │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  │                                     │
│                                  ▼                                     │
│                        Módulo src/excel_db.py                          │
│                     (Gestión de FileLock .lock)                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼  [Punto de Montaje: /app/data]
┌──────────────────────────────────┴─────────────────────────────────────┐
│                 VOLUMEN PERSISTENTE DEL SERVIDOR HOST                  │
│                        Ruta: /opt/adonai/data                          │
│                                                                        │
│   ├── adonai_data_completo.xlsx    (Datos contables y beneficiarias)   │
│   ├── adonai_data_completo.xlsx.lock (Sincronización FileLock)         │
│   └── usuarios.json                (Credenciales y roles de acceso)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 30. CHECKLIST DE RECEPCIÓN PARA EL NUEVO DESARROLLADOR

Al tomar este proyecto por primera vez, el nuevo programador debe verificar la siguiente lista de control:

- [ ] **Clonación del Repositorio:** Clonar desde `https://github.com/SantiagoR2001/adonai-dashboard-v5.git` y verificar que la rama activa sea `master`.
- [ ] **Inspección de Datos Iniciales:** Asegurarse de que exista el directorio `data/` con `adonai_data_completo.xlsx` y `usuarios.json`.
- [ ] **Entorno Virtual Local:** Crear entorno con Python 3.12/3.13 (`python -m venv venv`), activarlo e instalar dependencias con `pip install -r requirements.txt`.
- [ ] **Arranque en Desarrollo:** Ejecutar `python wsgi.py` y comprobar que la aplicación responda en `http://127.0.0.1:5000`.
- [ ] **Prueba de Autenticación:** Probar login con las credenciales de prueba existentes en `usuarios.json`.
- [ ] **Verificación de Bloqueos:** Comprobar que al registrar un movimiento no queden archivos `.lock` colgados en `data/`.
- [ ] **Generación de Reportes:** Probar la exportación de un PDF y un Excel desde `/reportes` en ambos idiomas (ES/EN) y ambas monedas (COP/USD) para confirmar que ReportLab y las fuentes estén operativas.
- [ ] **Respaldos Previos:** Antes de modificar cualquier línea de código o esquema de datos, crear una copia manual de `adonai_data_completo.xlsx`.
- [ ] **Regla de Oro:** **NUNCA alterar los nombres de las hojas del Excel** (`Ingresos`, `Egresos`, `Registro Madres`, `Configuracion`, `TRM`) ni el orden de sus primeras 9 columnas sin actualizar en simultáneo los índices de `excel_db.py` y `routes.py`.
