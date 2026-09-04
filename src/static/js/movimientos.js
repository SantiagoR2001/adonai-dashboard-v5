// ============================
//  movimientos.js (con export avanzado por filtros + responsable automático)
// ============================

console.log("movimientos.js v=20251001-6 CARGADO");

// Elementos del DOM
const modalMovimiento = document.getElementById("formModal");
const nuevoMovimientoBtn = document.getElementById("nuevoMovimientoBtn");
const cancelBtnMov = document.getElementById("cancelBtn");
const movimientoForm = document.getElementById("movimientoForm");
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const searchMovInput = document.getElementById("searchInput");
const tipoSelect = document.getElementById("tipo");
const categoriaSelect = document.getElementById("categoria");
const subcategoriaSelect = document.getElementById("subcategoria");
const exportBtn = document.getElementById("exportBtn");

// 👇 Campo que usamos como RESPONSABLE (igual que en Madres)
const procesaInput = document.getElementById("procesa");

// Modal exportar
const exportModal = document.getElementById("exportModal");
const closeExportModal = document.getElementById("closeExportModal");
const cancelExportBtn = document.getElementById("cancelExport");
const exportForm = document.getElementById("exportForm");
const exportTipo = document.getElementById("exportTipo");
const exportMedio = document.getElementById("exportMedio");
const exportCategoria = document.getElementById("exportCategoria");
const exportSubcategoria = document.getElementById("exportSubcategoria");
const exportMadre = document.getElementById("exportMadre");
const exportFechaDesde = document.getElementById("exportFechaDesde");
const exportFechaHasta = document.getElementById("exportFechaHasta");

// ============================
//  Categorías y Subcategorías
// ============================
let categoriasPorTipo = {
  ingreso: {},
  egreso: {},
  ingresos: {},
  egresos: {}
};

async function cargarCategoriasDesdeAPI() {
  try {
    const res = await fetch("/api/categorias?incluir_inactivas=false");
    if (!res.ok) throw new Error("Error cargando categorías");
    const data = await res.json();

    const ingresoCats = {};
    const egresoCats = {};

    data.forEach(cat => {
      const catName = cat.nombre;
      const subList = (cat.subcategorias || []).map(s => s.nombre);
      if (cat.tipo === "ingreso") {
        ingresoCats[catName] = subList;
      } else {
        egresoCats[catName] = subList;
      }
    });

    categoriasPorTipo = {
      ingreso: ingresoCats,
      egreso: egresoCats,
      ingresos: ingresoCats,
      egresos: egresoCats
    };
  } catch (err) {
    console.error("Error al cargar categorías desde API:", err);
  }
}

function asegurarOpcionEnSelect(selectEl, valor, labelExtra = " (inactiva)") {
  if (!selectEl || !valor) return;
  const exists = Array.from(selectEl.options).some(o => o.value.trim().toLowerCase() === valor.trim().toLowerCase());
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = valor;
    opt.textContent = valor + labelExtra;
    selectEl.appendChild(opt);
  }
}

// Helpers para selects
function fillSelect(el, arr, placeholder = "Todas") {
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  (arr || []).forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    el.appendChild(o);
  });
}

// Llenar categorías del modal de movimiento (según tipo)
function cargarCategorias(tipo) {
  categoriaSelect.innerHTML = '<option value="">Seleccione categoría</option>';
  subcategoriaSelect.innerHTML = '<option value="">Seleccione subcategoría</option>';
  if (tipo && categoriasPorTipo[tipo]) {
    Object.keys(categoriasPorTipo[tipo]).forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });
  }
}

// Actualizar subcategorías al cambiar categoría (modal movimiento)
categoriaSelect?.addEventListener("change", () => {
  const tipo = tipoSelect.value;
  const cat = categoriaSelect.value;
  subcategoriaSelect.innerHTML = '<option value="">Seleccione subcategoría</option>';
  if (tipo && categoriasPorTipo[tipo] && categoriasPorTipo[tipo][cat]) {
    categoriasPorTipo[tipo][cat].forEach(sub => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      subcategoriaSelect.appendChild(option);
    });
  }
});

// ============================
//  Modal Nuevo/Editar
// ============================
nuevoMovimientoBtn?.addEventListener("click", () => {
  modalMovimiento.style.display = "block";
  document.getElementById("tipo").disabled = false;
  cargarCategorias((tipoSelect.value || "ingresos"));
  movimientoForm.removeAttribute("data-edit-id");
  movimientoForm.removeAttribute("data-edit-sheet");
  document.getElementById("modalTitle").textContent = "Registrar Nuevo Movimiento";

  // ✅ Responsable = rol actual
  const rol = localStorage.getItem("rol");
  if (procesaInput && rol) {
    procesaInput.value = rol;
  }
});

document.querySelector("#formModal .close")?.addEventListener("click", () => {
  modalMovimiento.style.display = "none";
  document.getElementById("tipo").disabled = false;
});

cancelBtnMov?.addEventListener("click", () => {
  modalMovimiento.style.display = "none";
  movimientoForm.reset();
  document.getElementById("tipo").disabled = false;
  movimientoForm.removeAttribute("data-edit-id");
  movimientoForm.removeAttribute("data-edit-sheet");

  const rol = localStorage.getItem("rol");
  if (procesaInput && rol) {
    procesaInput.value = rol;
  }
});

// Cerrar modal al hacer clic fuera
window.addEventListener("click", (event) => {
  if (event.target === modalMovimiento) {
    modalMovimiento.style.display = "none";
    movimientoForm.reset();
    document.getElementById("tipo").disabled = false;
    movimientoForm.removeAttribute("data-edit-id");
    movimientoForm.removeAttribute("data-edit-sheet");

    const rol = localStorage.getItem("rol");
    if (procesaInput && rol) {
      procesaInput.value = rol;
    }
  }
});

// ============================
//  Cargar movimientos
// ============================
async function cargarMovimientos() {
  try {
    const response = await fetch("/api/movimientos");
    if (!response.ok) throw new Error("Error al obtener movimientos");
    const data = await response.json();

    movimientosTableBody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      movimientosTableBody.innerHTML = "<tr><td colspan='10' class='empty-state'>No hay movimientos</td></tr>";
      actualizarTotales();
      return;
    }

    data.forEach((mov) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-id", mov.id);
      tr.setAttribute("data-sheet", mov.sheet);

      // ✅ Mostrar bonito el responsable (1/2 -> admin/secretaria)
      let responsable = mov.responsable || "";
      if (responsable === 1 || responsable === "1") {
        responsable = "admin";
      } else if (responsable === 2 || responsable === "2") {
        responsable = "secretaria";
      }

      tr.innerHTML = `
        <td>${mov.fecha || ""}</td>
        <td>${mov.tipo || ""}</td>
        <td>${mov.medio || ""}</td>
        <td>${mov.categoria || ""}</td>
        <td>${mov.subcategoria || ""}</td>
        <td>${mov.codigoMadre || ""}</td>
        <td>${mov.concepto || ""}</td>
        <td>${mov.valor ?? ""}</td>
        <td>${responsable}</td>
        <td class="actions">
          <i class="fas fa-edit edit-mov" title="Editar" style="cursor:pointer;margin-right:8px;"></i>
          <i class="fas fa-trash delete-mov" title="Eliminar" style="cursor:pointer;color:#d32f2f;"></i>
        </td>
      `;
      movimientosTableBody.appendChild(tr);
    });

    // Eliminar
    movimientosTableBody.querySelectorAll(".delete-mov").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");
        const sheet = row.getAttribute("data-sheet");
        if (!confirm("¿Seguro que deseas eliminar este movimiento?")) return;
        const res = await fetch(`/api/movimientos/${sheet}/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Movimiento eliminado ✅");
          cargarMovimientos();
          actualizarTotales();
        } else {
          alert("Error al eliminar");
        }
      });
    });

    // Editar
    movimientosTableBody.querySelectorAll(".edit-mov").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");
        const sheet = row.getAttribute("data-sheet");
        const cells = row.querySelectorAll("td");

        modalMovimiento.style.display = "block";
        document.getElementById("fecha").value = cells[0].textContent || "";
        document.getElementById("tipo").value = (cells[1].textContent || "");
        document.getElementById("tipo").disabled = true;
        document.getElementById("medio").value = cells[2].textContent || "";

        const tipoVal = (document.getElementById("tipo").value || "").toLowerCase();
        cargarCategorias(tipoVal);

        const catValue = (cells[3].textContent || "").trim();
        asegurarOpcionEnSelect(categoriaSelect, catValue);
        categoriaSelect.value = catValue;

        subcategoriaSelect.innerHTML = '<option value="">Seleccione subcategoría</option>';
        const subList = (tipoVal && categoriasPorTipo[tipoVal] && categoriasPorTipo[tipoVal][catValue]) ? categoriasPorTipo[tipoVal][catValue] : [];
        subList.forEach(sub => {
          const o = document.createElement("option");
          o.value = sub; o.textContent = sub;
          subcategoriaSelect.appendChild(o);
        });

        const subValue = (cells[4].textContent || "").trim();
        asegurarOpcionEnSelect(subcategoriaSelect, subValue);
        subcategoriaSelect.value = subValue;
        document.getElementById("codigoMadre").value = cells[5].textContent || "";
        document.getElementById("concepto").value = cells[6].textContent || "";
        document.getElementById("valor").value = cells[7].textContent || "";

        // Responsable tal como está en la fila (ya viene admin/secretaria)
        if (procesaInput) {
          procesaInput.value = cells[8].textContent || "";
        }

        movimientoForm.setAttribute("data-edit-id", id);
        movimientoForm.setAttribute("data-edit-sheet", sheet);
        document.getElementById("modalTitle").textContent = "Editar Movimiento";
      });
    });

    actualizarTotales();

    // Auto-abrir modal de edición si viene con query params desde el Dashboard
    const urlParams = new URLSearchParams(window.location.search);
    const editSheet = urlParams.get("editSheet");
    const editId = urlParams.get("editId");
    if (editSheet && editId) {
      const targetRow = movimientosTableBody.querySelector(`tr[data-id="${editId}"][data-sheet="${editSheet}"]`);
      if (targetRow) {
        const editBtn = targetRow.querySelector(".edit-mov");
        if (editBtn) {
          editBtn.click();
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar movimientos:", error);
    alert("Error al cargar movimientos");
  }
}

// ============================
//  Guardar / Editar
// ============================
movimientoForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = movimientoForm.querySelector('button[type="submit"]');
  if (submitBtn?.disabled) return; // Guardia extra por si el evento se dispara dos veces
  if (submitBtn) submitBtn.disabled = true;

  try {
    // ✅ Aseguramos que el responsable sea el rol actual
    const rol = localStorage.getItem("rol") || "";
    if (procesaInput) {
      procesaInput.value = rol;
    }

    const nuevoMovimiento = {
      fecha: document.getElementById("fecha").value,
      medio: document.getElementById("medio").value,
      tipo: tipoSelect.value,
      categoria: categoriaSelect.value,
      subcategoria: subcategoriaSelect.value,
      codigoMadre: document.getElementById("codigoMadre").value,
      concepto: document.getElementById("concepto").value,
      valor: parseFloat(document.getElementById("valor").value) || 0,
      responsable: document.getElementById("procesa").value
    };

    if (!nuevoMovimiento.tipo || !nuevoMovimiento.categoria || !nuevoMovimiento.subcategoria) {
      alert("Completa tipo, categoría y subcategoría.");
      return;
    }

    const editId = movimientoForm.getAttribute("data-edit-id");
    const editSheet = movimientoForm.getAttribute("data-edit-sheet");

    if (editId && editSheet) {
      const res = await fetch(`/api/movimientos/${editSheet}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoMovimiento)
      });
      if (!res.ok) throw new Error();
      alert("Movimiento actualizado ✅");
    } else {
      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoMovimiento)
      });
      if (!res.ok) throw new Error();
      alert("Movimiento agregado ✅");
    }

    movimientoForm.reset();
    document.getElementById("tipo").disabled = false;
    modalMovimiento.style.display = "none";
    cargarMovimientos();
    actualizarTotales();
  } catch (err) {
    console.error("Error al guardar/actualizar movimiento:", err);
    alert("No se pudo guardar el movimiento.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// ============================
//  Totales (usa /api/saldos)
// ============================
async function actualizarTotales() {
  try {
    const res = await fetch('/api/saldos');
    if (!res.ok) throw new Error('error saldos');
    const s = await res.json();

    document.getElementById("totalIngresos").textContent = `$${(s.totalIngresos || 0).toLocaleString()}`;
    document.getElementById("totalEgresos").textContent = `$${(s.totalEgresos || 0).toLocaleString()}`;
    document.getElementById("balance").textContent = `$${(s.balance || 0).toLocaleString()}`;
    document.getElementById("totalMovimientos").textContent = s.totalMovimientos || 0;
  } catch (err) {
    console.error(err);
  }
}

// ============================
//  Modal Exportar PDF (con filtros avanzados)
// ============================
exportBtn?.addEventListener("click", () => {
  exportModal.style.display = "block";
  cargarExportCategorias(exportTipo.value || "");
  cargarExportMadres();
});

closeExportModal?.addEventListener("click", () => {
  exportModal.style.display = "none";
});
cancelExportBtn?.addEventListener("click", () => {
  exportModal.style.display = "none";
});

function cargarExportCategorias(tipo) {
  if (!tipo || !categoriasPorTipo[tipo]) {
    fillSelect(exportCategoria, [], "Todas");
    fillSelect(exportSubcategoria, [], "Todas");
    return;
  }
  const cats = Object.keys(categoriasPorTipo[tipo]);
  fillSelect(exportCategoria, cats, "Todas");
  fillSelect(exportSubcategoria, [], "Todas");
}

exportTipo?.addEventListener("change", () => {
  cargarExportCategorias(exportTipo.value || "");
});

exportCategoria?.addEventListener("change", () => {
  const t = exportTipo.value || "";
  const c = exportCategoria.value || "";
  const subs = (t && c && categoriasPorTipo[t] && categoriasPorTipo[t][c]) ? categoriasPorTipo[t][c] : [];
  fillSelect(exportSubcategoria, subs, "Todas");
});

async function cargarExportMadres() {
  try {
    const res = await fetch("/api/madres");
    if (!res.ok) throw new Error("madres");
    const list = await res.json();
    list.sort((a, b) => (String(a.codigoMadre || "")).localeCompare(String(b.codigoMadre || "")));
    exportMadre.innerHTML = `<option value="">Todas</option>`;
    list.forEach(m => {
      const val = m.codigoMadre || "";
      const text = val ? `${val} — ${m.nombreCompleto || ""}` : (m.nombreCompleto || "");
      const o = document.createElement("option");
      o.value = val;
      o.textContent = text;
      exportMadre.appendChild(o);
    });
  } catch (e) {
    console.warn("No se pudieron cargar madres para export:", e);
  }
}

exportForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const params = new URLSearchParams();
  const tipo = exportTipo.value;
  const medio = exportMedio.value;
  const codigoMadre = exportMadre.value;
  const fechaDesde = exportFechaDesde.value;
  const fechaHasta = exportFechaHasta.value;

  const categorias = Array.from(exportCategoria.selectedOptions).map(opt => opt.value);
  const subcategorias = Array.from(exportSubcategoria.selectedOptions).map(opt => opt.value);

  if (tipo) params.append("tipo", tipo);
  if (medio) params.append("medio", medio);
  if (categorias.length > 0) params.append("categorias", categorias.join(","));
  if (subcategorias.length > 0) params.append("subcategorias", subcategorias.join(","));
  if (codigoMadre) params.append("codigoMadre", codigoMadre);
  if (fechaDesde) params.append("fechaDesde", fechaDesde);
  if (fechaHasta) params.append("fechaHasta", fechaHasta);

  window.location = `/api/export/pdf?${params.toString()}`;
  exportModal.style.display = "none";
});

// ============================
//  Buscador simple en la tabla
// ============================
searchMovInput?.addEventListener("keyup", () => {
  const filter = searchMovInput.value.toLowerCase();
  const rows = movimientosTableBody.getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    let rowText = rows[i].textContent.toLowerCase();
    rows[i].style.display = rowText.includes(filter) ? "" : "none";
  }
});

// ============================
//  Inicialización
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Setear responsable y nombre de usuario en el sidebar (igual que en Madres)
  const rol = localStorage.getItem("rol");
  const nombre = localStorage.getItem("nombre");

  if (procesaInput && rol) {
    procesaInput.value = rol;
  }

  const currentUserSpan = document.getElementById("currentUser");
  if (currentUserSpan && nombre) {
    currentUserSpan.textContent = nombre;
  }

  await cargarCategoriasDesdeAPI();
  cargarMovimientos();
  actualizarTotales();

  tipoSelect?.addEventListener("change", () => {
    const t = (tipoSelect.value || "ingresos");
    cargarCategorias(t);
  });
});
