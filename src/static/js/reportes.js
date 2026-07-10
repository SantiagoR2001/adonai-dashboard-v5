// ============================
//  reportes.js (con categorías fijas + export con idioma ES/EN)
// ============================

const btnGenerarReporte = document.getElementById("generateReportBtn");
const btnExportarPDF   = document.getElementById("exportReportBtn");
const btnExportarExcel = document.getElementById("exportExcelBtn");

const ingresosTotalesEl  = document.getElementById("reportIngresos");
const egresosTotalesEl   = document.getElementById("reportEgresos");
const balanceNetoEl      = document.getElementById("reportBalance");
const madresAtendidasEl  = document.getElementById("reportMadres");

let chartEvolucion, chartGastos, chartComparativo, chartIndicadores;

function fmtMoney(n, moneda) {
  const v = Number(n || 0);
  const prefix = moneda === 'usd' ? 'USD $' : '$';
  return `${prefix}${v.toLocaleString(undefined, {minimumFractionDigits: moneda==='usd'?2:0, maximumFractionDigits: moneda==='usd'?2:0})}`;
}

// ============================
//  MISMOS tipos / categorías que en movimientos.js
// ============================
const categoriasPorTipo = {
  ingresos: {
    "Administrativo": ["Sostenimiento SRL", "Inversiones"],
    "Misión Institucional": ["Donaciones locales", "Donaciones específicas locales", "Donaciones USA", "Donaciones específicas USA"],
    "Unidad de Negocio": ["Donaciones ropa caja", "Jabón"],
    "Otros ingresos": ["Otros ingresos"]
  },
  egresos: {
    "1. Nómina": ["Secretaria", "Dirección General", "Seguridad Social", "Prestaciones Sociales", "Dotación", "Prestamos"],
    "2. Colaboradoras Internas": ["Colaboradoras"],
    "3. Proveedores": ["Dirección Misional", "Administradora de redes sociales", "Servicios", "Honorarios", "Cuentas de cobro"],
    "4. Operacionales": [
      "Renta", "Servicios públicos", "Internet", "Celular", "Compras insumos", "Compras equipos de tecnología",
      "Compras licencias", "Compras inmuebles", "Obligaciones legales", "Insumos cafetería", "Insumos de aseo",
      "Insumos papelería", "Transporte urbano", "Transporte colaboradores", "Parqueaderos",
      "Gasolina", "Reparaciones", "Mantenimientos", "Reunión Junta", "Refrigerios colaboradores"
    ],
    "5. Redes Sociales": ["Facebook", "Instagram", "TikTok", "Página Web"],
    "6. Material Publicitario": [
      "Impresos", "Botones", "Brochure", "Pendones", "Alcancias", "Tarjetas de presentación",
      "Cartas / Sobres con membrete", "Audiovisuales"
    ],
    "7. Trabajo de Campo": ["Reuniones externas", "Eventos locales", "Entrega publicidad", "Eventos fuera de medellín"],
    "8. Otros Gastos": ["Gastos bancarios", "Operacionales"],
    "9. Misional Bebés": [
      "Kit para el parto", "Medicamentos", "Alimentos", "Elementos básicos", "Cumpleaños", "Jardín de la vida", "Hospitalizaciones"
    ],
    "10. Misional Madres": [
      "Kit para madres", "Transporte", "Alimentos", "Habitabilidad", "Ayuda Humanitaria",
      "Emprendimiento", "Obsequios", "Subsidio aliados", "Alianzas"
    ],
    "11. Otros": ["Otros", "Alianzas", "Apoyo Institucional", "Donaciones"]
  }
};

// Helpers para llenar selects de export
function llenarCategoriasExport(tipo) {
  const catSelect    = document.getElementById("exportCategoria");
  const subcatSelect = document.getElementById("exportSubcategoria");

  if (!catSelect || !subcatSelect) return;

  catSelect.innerHTML    = '<option value="">Todas</option>';
  subcatSelect.innerHTML = '<option value="">Todas</option>';

  if (!tipo || !categoriasPorTipo[tipo]) return;

  Object.keys(categoriasPorTipo[tipo]).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });
}

function llenarSubcategoriasExport() {
  const tipo         = document.getElementById("exportTipo")?.value || "";
  const categoria    = document.getElementById("exportCategoria")?.value || "";
  const subcatSelect = document.getElementById("exportSubcategoria");

  if (!subcatSelect) return;

  subcatSelect.innerHTML = '<option value="">Todas</option>';

  if (!tipo || !categoria) return;
  if (!categoriasPorTipo[tipo] || !categoriasPorTipo[tipo][categoria]) return;

  categoriasPorTipo[tipo][categoria].forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subcatSelect.appendChild(opt);
  });
}

// ============================
//  Cargar datos principales (gráficas, resumen)
// ============================
async function cargarReportes() {
  const tipoSelect  = document.getElementById("reportType");
  const yearSelect  = document.getElementById("reportYear");
  const monthSelect = document.getElementById("reportMonth");

  const hoy          = new Date();
  const defaultYear  = String(hoy.getFullYear());

  const tipoReporte  = tipoSelect  ? tipoSelect.value  : "mensual";
  const anio         = yearSelect  ? yearSelect.value  : "";
  const mesSel       = monthSelect ? monthSelect.value : "";
  const mes          = mesSel === "" ? "all" : mesSel;
  const moneda       = document.getElementById("monedaSelect")?.value || "cop";
  const lang         = document.getElementById("idiomaSelect")?.value || "es";

  try {
    const url  = `/api/reportes?tipoReporte=${tipoReporte}&anio=${anio}&mes=${mes}&moneda=${moneda}&lang=${lang}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Error ${resp.status}`);
    const data = await resp.json();

    if (data.error && data.need_trm) {
        if (window.NotificationSystem?.error) NotificationSystem.error(data.error);
        return;
    }
    

    
    if (data.trmWarnings && data.trmWarnings.length > 0) {
      if (window.NotificationSystem?.warning) {
        NotificationSystem.warning("Aviso: Se usó TRM de meses anteriores para: " + data.trmWarnings.join(", "));
      }
    }
    
  if (ingresosTotalesEl) ingresosTotalesEl.textContent  = fmtMoney(data.ingresosTotales, moneda);
    if (egresosTotalesEl)  egresosTotalesEl.textContent   = fmtMoney(data.egresosTotales, moneda);
    if (balanceNetoEl)     balanceNetoEl.textContent      = fmtMoney(data.balanceNeto, moneda);
    if (madresAtendidasEl) madresAtendidasEl.textContent  = data.madresAtendidas || 0;

    const evol        = data.evolucionMensual || {};
    const labelsMeses = Object.keys(evol).sort();
    const ingresosMes = labelsMeses.map(m => Number(evol[m]?.ingresos || 0));
    const egresosMes  = labelsMeses.map(m => Number(evol[m]?.egresos  || 0));

    if (chartEvolucion) chartEvolucion.destroy();
    chartEvolucion = new Chart(document.getElementById("evolucionChart"), {
      type: "line",
      data: {
        labels: labelsMeses,
        datasets: [
          { label: "Ingresos", data: ingresosMes, borderColor: "green", fill: false },
          { label: "Egresos",  data: egresosMes,  borderColor: "red",   fill: false }
        ]
      }
    });

    const dist = data.distribucionGastos || {};
    if (chartGastos) chartGastos.destroy();
    chartGastos = new Chart(document.getElementById("gastosChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(dist),
        datasets: [{ data: Object.values(dist) }]
      }
    });

    const comp = data.comparativoAnual || {};
    if (chartComparativo) chartComparativo.destroy();
    chartComparativo = new Chart(document.getElementById("comparativoChart"), {
      type: "bar",
      data: {
        labels: Object.keys(comp),
        datasets: [
          { label: "Ingresos", data: Object.values(comp).map(c => c.ingresos), backgroundColor: "green" },
          { label: "Egresos",  data: Object.values(comp).map(c => c.egresos),  backgroundColor: "red" }
        ]
      }
    });

    // Tabla resumen con la nueva estructura
    const tbody = document.querySelector("#resumenTable tbody");
    if (tbody) {
      tbody.innerHTML = "";
      const tabla = data.tablaMensual || [];
      tabla.forEach(r => {
        tbody.insertAdjacentHTML("beforeend", `
          <tr>
            <td>${r.mes}</td>
            <td>${fmtMoney(r.saldoInicial, moneda)}</td>
            <td class="text-success">${fmtMoney(r.ingresosBancos, moneda)}</td>
            <td class="text-danger">${fmtMoney(r.egresosBancos, moneda)}</td>
            <td>${fmtMoney(r.saldoBancos, moneda)}</td>
            <td class="text-success">${fmtMoney(r.ingresosCaja, moneda)}</td>
            <td class="text-danger">${fmtMoney(r.egresosCaja, moneda)}</td>
            <td>${fmtMoney(r.saldoCaja, moneda)}</td>
            <td style="font-weight:bold;">${fmtMoney(r.saldoFinal, moneda)}</td>
          </tr>
        `);
      });
    }

  } catch (err) {
    console.error("Error cargando reportes:", err);
  }
}

// ============================
//  Modal Exportación (PDF/Excel)
// ============================
const exportModal       = document.getElementById("exportModal");
const closeExportModal  = document.getElementById("closeExportModal");
const confirmExportBtn  = document.getElementById("confirmExportBtn");
const exportTipoSelect  = document.getElementById("exportTipo");
const exportCatSelect   = document.getElementById("exportCategoria");
const cancelExportBtn   = document.getElementById("cancelExport");

// ✅ Cargar madres para datalist (usa /api/madres/lista, fallback /api/madres)
async function cargarMadresParaDatalist() {
  const madresList = document.getElementById("madresList");
  if (!madresList) return;

  madresList.innerHTML = "";

  // 1) intento recomendado
  try {
    const resp = await fetch("/api/madres/lista");
    if (resp.ok) {
      const data = await resp.json();
      (data || []).forEach(m => {
        const codigo = m.codigoMadre || "";
        const nombre = m.nombreCompleto || "";
        madresList.insertAdjacentHTML(
          "beforeend",
          `<option value="${codigo}">${codigo}${nombre ? " — " + nombre : ""}</option>`
        );
      });
      return;
    }
  } catch (_) {}

  // 2) fallback
  try {
    const resp2 = await fetch("/api/madres");
    if (!resp2.ok) throw new Error("Error al cargar madres");
    const data2 = await resp2.json();
    (data2 || []).forEach(m => {
      const codigo = m.codigoMadre || "";
      const nombre = m.nombreCompleto || "";
      madresList.insertAdjacentHTML(
        "beforeend",
        `<option value="${codigo}">${codigo}${nombre ? " — " + nombre : ""}</option>`
      );
    });
  } catch (err) {
    console.error("Error cargando madres:", err);
  }
}

// Abrir modal desde botones PDF / Excel
if (btnExportarPDF || btnExportarExcel) {
  [btnExportarPDF, btnExportarExcel].forEach(btn => {
    if (!btn) return;

    btn.addEventListener("click", async e => {
      const formato = e.currentTarget.id.includes("Excel") ? "excel" : "pdf";
      if (confirmExportBtn) confirmExportBtn.dataset.formato = formato;

      try {
        await cargarMadresParaDatalist();

        // Reset selects de categorías/subcategorías según el tipo actual
        llenarCategoriasExport(exportTipoSelect?.value || "");
        llenarSubcategoriasExport();

        if (exportModal) exportModal.style.display = "block";
      } catch (err) {
        console.error("Error cargando filtros:", err);
        alert("No se pudieron cargar los filtros.");
      }
    });
  });
}

// Cerrar modal
if (closeExportModal) {
  closeExportModal.addEventListener("click", () => {
    if (exportModal) exportModal.style.display = "none";
  });
}
if (cancelExportBtn) {
  cancelExportBtn.addEventListener("click", () => {
    if (exportModal) exportModal.style.display = "none";
  });
}

// Cerrar modal al dar click afuera
if (exportModal) {
  exportModal.addEventListener("click", (e) => {
    if (e.target === exportModal) exportModal.style.display = "none";
  });
}

// Cambios en Tipo / Categoría dentro del modal
exportTipoSelect?.addEventListener("change", () => {
  const tipo = exportTipoSelect.value;
  llenarCategoriasExport(tipo);
  llenarSubcategoriasExport();
});

exportCatSelect?.addEventListener("change", () => {
  llenarSubcategoriasExport();
});

// Confirmar exportación (PDF o Excel)
if (confirmExportBtn) {
  confirmExportBtn.addEventListener("click", async () => {
    try {
      const tipo       = document.getElementById("exportTipo")?.value || "";       // ingresos / egresos / ""
      const madre      = document.getElementById("exportMadre")?.value || "";
      const fechaDesde = document.getElementById("exportFechaDesde")?.value || "";
      const fechaHasta = document.getElementById("exportFechaHasta")?.value || "";

      const categoriaSelect    = document.getElementById("exportCategoria");
      const subcategoriaSelect = document.getElementById("exportSubcategoria");

      // Tus selects NO son multi actualmente, pero esto sigue funcionando
      const categorias = Array.from(categoriaSelect?.selectedOptions || [])
        .map(opt => opt.value)
        .filter(v => v);

      const subcategorias = Array.from(subcategoriaSelect?.selectedOptions || [])
        .map(opt => opt.value)
        .filter(v => v);

      const formato = confirmExportBtn.dataset.formato || "pdf";
      const lang = document.getElementById("idiomaSelect")?.value || "es";
      const moneda = document.getElementById("monedaSelect")?.value || "cop";

      const params = new URLSearchParams({
        tipo,
        madre,
        fechaDesde,
        fechaHasta,
        lang,
        moneda
      });

      if (categorias.length > 0)    params.append("categorias", categorias.join(","));
      if (subcategorias.length > 0) params.append("subcategorias", subcategorias.join(","));

      const url = `/api/reportes/export/${formato}?${params.toString()}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        if (errData && errData.error) {
            alert(errData.error);
            if (window.NotificationSystem?.error) NotificationSystem.error(errData.error);
        } else {
            throw new Error(`Error exportando ${formato.toUpperCase()}`);
        }
        return;
      }

      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);

      // ✅ nombre de archivo según idioma
      const suf = lang === "en" ? "_EN" : "_ES";
      link.download = `reporte_adonai${suf}.${formato === "pdf" ? "pdf" : "xlsx"}`;

      link.click();

      if (exportModal) exportModal.style.display = "none";
    } catch (err) {
      console.error("Error exportando archivo:", err);
      if (window.NotificationSystem?.error) NotificationSystem.error("No se pudo generar el archivo.");
      else alert("No se pudo generar el archivo.");
    }
  });
}

// ============================
//  Inicialización
// ============================
document.addEventListener("DOMContentLoaded", () => {
  cargarReportes();

  if (btnGenerarReporte) {
    btnGenerarReporte.addEventListener("click", cargarReportes);
  }
  
  const monedaSelect = document.getElementById("monedaSelect");
  const idiomaSelect = document.getElementById("idiomaSelect");
  if (monedaSelect) monedaSelect.addEventListener("change", cargarReportes);
  if (idiomaSelect) idiomaSelect.addEventListener("change", cargarReportes);
});
