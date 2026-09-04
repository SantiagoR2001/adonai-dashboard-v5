// ==========================================
//  categorias.js - Gestión de Categorías y Subcategorías
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    let currentTipo = "ingreso";
    let allCategorias = [];
    let expandedCategoryIds = new Set();

    // DOM Elements
    const container = document.getElementById("categoriasContainer");
    const tabIngresos = document.getElementById("tabIngresos");
    const tabEgresos = document.getElementById("tabEgresos");
    const countIngresos = document.getElementById("countIngresos");
    const countEgresos = document.getElementById("countEgresos");
    const nuevaCategoriaBtn = document.getElementById("nuevaCategoriaBtn");

    // Modal Categoria
    const catModal = document.getElementById("categoriaModal");
    const catModalTitle = document.getElementById("catModalTitle");
    const catForm = document.getElementById("categoriaForm");
    const catIdInput = document.getElementById("catId");
    const catTipoSelect = document.getElementById("catTipo");
    const catNombreInput = document.getElementById("catNombre");
    const catNombreENInput = document.getElementById("catNombreEN");
    const catActivoCheckbox = document.getElementById("catActivo");
    const closeCatModal = document.getElementById("closeCatModal");
    const cancelCatBtn = document.getElementById("cancelCatBtn");

    // Modal Subcategoria
    const subModal = document.getElementById("subcategoriaModal");
    const subModalTitle = document.getElementById("subModalTitle");
    const subForm = document.getElementById("subcategoriaForm");
    const subIdInput = document.getElementById("subId");
    const subCategoriaIdInput = document.getElementById("subCategoriaId");
    const subParentNombreSpan = document.getElementById("subParentNombre");
    const subNombreInput = document.getElementById("subNombre");
    const subNombreENInput = document.getElementById("subNombreEN");
    const subActivoCheckbox = document.getElementById("subActivo");
    const closeSubModal = document.getElementById("closeSubModal");
    const cancelSubBtn = document.getElementById("cancelSubBtn");

    // Modal Confirm Delete
    const confirmDeleteModal = document.getElementById("confirmDeleteModal");
    const confirmDeleteMessage = document.getElementById("confirmDeleteMessage");
    const cancelDeleteModalBtn = document.getElementById("cancelDeleteModalBtn");
    const confirmDeleteModalBtn = document.getElementById("confirmDeleteModalBtn");
    let pendingDeleteAction = null;

    // ============================
    //  Cargar datos desde API
    // ============================
    async function cargarCategorias() {
        try {
            const res = await fetch("/api/categorias?incluir_inactivas=true");
            if (!res.ok) throw new Error("Error al obtener categorías");
            allCategorias = await res.json();
            actualizarConteos();
            renderCategorias();
        } catch (err) {
            console.error(err);
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#e74c3c;">
                    <i class="fas fa-exclamation-circle" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Error al cargar las categorías. Por favor recarga la página.</p>
                </div>
            `;
        }
    }

    function actualizarConteos() {
        const ingresos = allCategorias.filter(c => c.tipo === "ingreso");
        const egresos = allCategorias.filter(c => c.tipo === "egreso");
        countIngresos.textContent = ingresos.length;
        countEgresos.textContent = egresos.length;
    }

    // ============================
    //  Renderizar categorías
    // ============================
    function renderCategorias() {
        const cats = allCategorias.filter(c => c.tipo === currentTipo);

        if (cats.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:50px; background:#fff; border-radius:10px; border:1px dashed #cbd5e1; color:#64748b;">
                    <i class="fas fa-folder-open" style="font-size:2.5rem; margin-bottom:12px; color:#94a3b8;"></i>
                    <h3 style="font-size:1.1rem; color:#334155; margin-bottom:6px;">No hay categorías de ${currentTipo}s</h3>
                    <p style="font-size:0.9rem;">Haz clic en "Nueva Categoría" para comenzar a registrar.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = cats.map(cat => {
            const isExpanded = expandedCategoryIds.has(cat.id);
            const subcats = cat.subcategorias || [];
            const subcatCount = subcats.length;

            return `
                <div class="category-card ${!cat.activo ? 'inactive' : ''}" data-cat-id="${cat.id}">
                    <div class="category-header">
                        <div class="category-info">
                            <button class="btn-expand ${isExpanded ? 'expanded' : ''}" title="Ver subcategorías">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span class="cat-title">${escapeHtml(cat.nombre)}</span>
                                    <span class="badge ${cat.activo ? 'badge-success' : 'badge-inactive'}">
                                        ${cat.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                                <div class="cat-subtitle">
                                    <span>EN: ${escapeHtml(cat.nombreEN || cat.nombre)}</span>
                                    <span style="margin: 0 6px;">•</span>
                                    <span>${subcatCount} subcategoría(s)</span>
                                </div>
                            </div>
                        </div>

                        <div class="category-actions" onclick="event.stopPropagation();">
                            <button class="btn-icon btn-add-sub" title="Agregar subcategoría" data-cat-id="${cat.id}" data-cat-name="${escapeHtml(cat.nombre)}">
                                <i class="fas fa-plus"></i> Subcategoría
                            </button>
                            <button class="btn-icon btn-edit-cat" title="Editar categoría" data-cat-id="${cat.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon ${cat.activo ? '' : 'success'} btn-toggle-cat" title="${cat.activo ? 'Desactivar' : 'Activar'}" data-cat-id="${cat.id}" data-activo="${cat.activo}">
                                <i class="fas ${cat.activo ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                                ${cat.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button class="btn-icon danger btn-delete-cat" title="Eliminar categoría" data-cat-id="${cat.id}" data-cat-name="${escapeHtml(cat.nombre)}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="subcategories-panel ${isExpanded ? 'show' : ''}">
                        ${subcats.length === 0 ? `
                            <div class="sub-empty">
                                No hay subcategorías registradas en esta categoría.
                                <a href="#" class="add-first-sub" data-cat-id="${cat.id}" data-cat-name="${escapeHtml(cat.nombre)}" style="color:var(--primary-color); margin-left:6px; font-weight:600;">
                                    + Agregar la primera
                                </a>
                            </div>
                        ` : `
                            <table class="subcategories-table">
                                <thead>
                                    <tr>
                                        <th>Subcategoría</th>
                                        <th>Nombre en Inglés</th>
                                        <th>Estado</th>
                                        <th style="text-align:right;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subcats.map(sub => `
                                        <tr class="${!sub.activo ? 'inactive' : ''}">
                                            <td style="font-weight:600;">${escapeHtml(sub.nombre)}</td>
                                            <td style="color:#64748b;">${escapeHtml(sub.nombreEN || sub.nombre)}</td>
                                            <td>
                                                <span class="badge ${sub.activo ? 'badge-success' : 'badge-inactive'}">
                                                    ${sub.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td style="text-align:right;">
                                                <div style="display:inline-flex; gap:6px;">
                                                    <button class="btn-icon btn-edit-sub" title="Editar subcategoría" data-sub-id="${sub.id}" data-cat-id="${cat.id}">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn-icon ${sub.activo ? '' : 'success'} btn-toggle-sub" title="${sub.activo ? 'Desactivar' : 'Activar'}" data-sub-id="${sub.id}" data-activo="${sub.activo}">
                                                        <i class="fas ${sub.activo ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                                                    </button>
                                                    <button class="btn-icon danger btn-delete-sub" title="Eliminar subcategoría" data-sub-id="${sub.id}" data-sub-name="${escapeHtml(sub.nombre)}">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        `}
                    </div>
                </div>
            `;
        }).join("");
    }

    // ============================
    //  Tabs
    // ============================
    tabIngresos.addEventListener("click", () => {
        currentTipo = "ingreso";
        tabIngresos.classList.add("active");
        tabEgresos.classList.remove("active");
        renderCategorias();
    });

    tabEgresos.addEventListener("click", () => {
        currentTipo = "egreso";
        tabEgresos.classList.add("active");
        tabIngresos.classList.remove("active");
        renderCategorias();
    });

    // ============================
    //  Delegación de Eventos en Container
    // ============================
    container.addEventListener("click", async (e) => {
        // Expandir / Colapsar
        const header = e.target.closest(".category-header");
        if (header && !e.target.closest(".category-actions")) {
            const card = header.closest(".category-card");
            const catId = parseInt(card.getAttribute("data-cat-id"));
            if (expandedCategoryIds.has(catId)) {
                expandedCategoryIds.delete(catId);
            } else {
                expandedCategoryIds.add(catId);
            }
            renderCategorias();
            return;
        }

        // Agregar subcategoría
        const addSubBtn = e.target.closest(".btn-add-sub, .add-first-sub");
        if (addSubBtn) {
            const catId = parseInt(addSubBtn.getAttribute("data-cat-id"));
            const catName = addSubBtn.getAttribute("data-cat-name");
            openNewSubModal(catId, catName);
            return;
        }

        // Editar Categoría
        const editCatBtn = e.target.closest(".btn-edit-cat");
        if (editCatBtn) {
            const catId = parseInt(editCatBtn.getAttribute("data-cat-id"));
            openEditCatModal(catId);
            return;
        }

        // Toggle Activo Categoría
        const toggleCatBtn = e.target.closest(".btn-toggle-cat");
        if (toggleCatBtn) {
            const catId = parseInt(toggleCatBtn.getAttribute("data-cat-id"));
            const currentActivo = toggleCatBtn.getAttribute("data-activo") === "true";
            await toggleCategoriaActivo(catId, !currentActivo);
            return;
        }

        // Eliminar Categoría
        const deleteCatBtn = e.target.closest(".btn-delete-cat");
        if (deleteCatBtn) {
            const catId = parseInt(deleteCatBtn.getAttribute("data-cat-id"));
            const catName = deleteCatBtn.getAttribute("data-cat-name");
            await intentarEliminarCategoria(catId, catName);
            return;
        }

        // Editar Subcategoría
        const editSubBtn = e.target.closest(".btn-edit-sub");
        if (editSubBtn) {
            const subId = parseInt(editSubBtn.getAttribute("data-sub-id"));
            const catId = parseInt(editSubBtn.getAttribute("data-cat-id"));
            openEditSubModal(subId, catId);
            return;
        }

        // Toggle Activo Subcategoría
        const toggleSubBtn = e.target.closest(".btn-toggle-sub");
        if (toggleSubBtn) {
            const subId = parseInt(toggleSubBtn.getAttribute("data-sub-id"));
            const currentActivo = toggleSubBtn.getAttribute("data-activo") === "true";
            await toggleSubcategoriaActivo(subId, !currentActivo);
            return;
        }

        // Eliminar Subcategoría
        const deleteSubBtn = e.target.closest(".btn-delete-sub");
        if (deleteSubBtn) {
            const subId = parseInt(deleteSubBtn.getAttribute("data-sub-id"));
            const subName = deleteSubBtn.getAttribute("data-sub-name");
            await intentarEliminarSubcategoria(subId, subName);
            return;
        }
    });

    // ============================
    //  Modal Categoría Handlers
    // ============================
    nuevaCategoriaBtn.addEventListener("click", () => {
        catIdInput.value = "";
        catModalTitle.textContent = "Nueva Categoría";
        catTipoSelect.value = currentTipo;
        catTipoSelect.disabled = false;
        catNombreInput.value = "";
        catNombreENInput.value = "";
        catActivoCheckbox.checked = true;
        catModal.style.display = "block";
    });

    function openEditCatModal(catId) {
        const cat = allCategorias.find(c => c.id === catId);
        if (!cat) return;

        catIdInput.value = cat.id;
        catModalTitle.textContent = "Editar Categoría";
        catTipoSelect.value = cat.tipo;
        catTipoSelect.disabled = true; // Tipo no se cambia
        catNombreInput.value = cat.nombre;
        catNombreENInput.value = cat.nombreEN || cat.nombre;
        catActivoCheckbox.checked = cat.activo;
        catModal.style.display = "block";
    }

    function closeCatModalFn() {
        catModal.style.display = "none";
        catForm.reset();
    }
    closeCatModal.addEventListener("click", closeCatModalFn);
    cancelCatBtn.addEventListener("click", closeCatModalFn);

    catForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const catId = catIdInput.value;
        const nombre = catNombreInput.value.trim();
        const nombreEN = catNombreENInput.value.trim() || nombre;
        const activo = catActivoCheckbox.checked;

        if (!nombre) {
            alert("El nombre de la categoría es obligatorio.");
            return;
        }

        const submitBtn = document.getElementById("saveCatBtn");
        submitBtn.disabled = true;

        try {
            if (catId) {
                // PUT
                const res = await fetch(`/api/categorias/${catId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, nombreEN, activo })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al actualizar categoría");
            } else {
                // POST
                const tipo = catTipoSelect.value;
                const res = await fetch("/api/categorias", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tipo, nombre, nombreEN })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al crear categoría");
            }
            closeCatModalFn();
            await cargarCategorias();
        } catch (err) {
            console.error(err);
            alert(err.message || "No se pudo guardar la categoría.");
        } finally {
            submitBtn.disabled = false;
        }
    });

    async function toggleCategoriaActivo(catId, nuevoActivo) {
        try {
            const res = await fetch(`/api/categorias/${catId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activo: nuevoActivo })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al cambiar estado");
            }
            await cargarCategorias();
        } catch (err) {
            alert(err.message || "Error al actualizar estado");
        }
    }

    // ============================
    //  Modal Subcategoría Handlers
    // ============================
    function openNewSubModal(catId, catName) {
        subIdInput.value = "";
        subCategoriaIdInput.value = catId;
        subModalTitle.textContent = "Nueva Subcategoría";
        subParentNombreSpan.textContent = catName;
        subNombreInput.value = "";
        subNombreENInput.value = "";
        subActivoCheckbox.checked = true;
        subModal.style.display = "block";
    }

    function openEditSubModal(subId, catId) {
        const cat = allCategorias.find(c => c.id === catId);
        if (!cat) return;
        const sub = (cat.subcategorias || []).find(s => s.id === subId);
        if (!sub) return;

        subIdInput.value = sub.id;
        subCategoriaIdInput.value = catId;
        subModalTitle.textContent = "Editar Subcategoría";
        subParentNombreSpan.textContent = cat.nombre;
        subNombreInput.value = sub.nombre;
        subNombreENInput.value = sub.nombreEN || sub.nombre;
        subActivoCheckbox.checked = sub.activo;
        subModal.style.display = "block";
    }

    function closeSubModalFn() {
        subModal.style.display = "none";
        subForm.reset();
    }
    closeSubModal.addEventListener("click", closeSubModalFn);
    cancelSubBtn.addEventListener("click", closeSubModalFn);

    subForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const subId = subIdInput.value;
        const categoriaId = parseInt(subCategoriaIdInput.value);
        const nombre = subNombreInput.value.trim();
        const nombreEN = subNombreENInput.value.trim() || nombre;
        const activo = subActivoCheckbox.checked;

        if (!nombre) {
            alert("El nombre de la subcategoría es obligatorio.");
            return;
        }

        const submitBtn = document.getElementById("saveSubBtn");
        submitBtn.disabled = true;

        try {
            if (subId) {
                // PUT
                const res = await fetch(`/api/subcategorias/${subId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, nombreEN, activo })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al actualizar subcategoría");
            } else {
                // POST
                const res = await fetch("/api/subcategorias", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ categoriaId, nombre, nombreEN })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al crear subcategoría");
            }
            // Auto-expandir la categoría padre para ver la subcategoría
            expandedCategoryIds.add(categoriaId);
            closeSubModalFn();
            await cargarCategorias();
        } catch (err) {
            console.error(err);
            alert(err.message || "No se pudo guardar la subcategoría.");
        } finally {
            submitBtn.disabled = false;
        }
    });

    async function toggleSubcategoriaActivo(subId, nuevoActivo) {
        try {
            const res = await fetch(`/api/subcategorias/${subId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activo: nuevoActivo })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al cambiar estado");
            }
            await cargarCategorias();
        } catch (err) {
            alert(err.message || "Error al actualizar estado");
        }
    }

    // ============================
    //  Eliminación de Categorías y Subcategorías
    // ============================
    async function intentarEliminarCategoria(catId, catName) {
        if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${catName}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/categorias/${catId}`, { method: "DELETE" });
            if (res.status === 409) {
                const data = await res.json();
                mostrarModalConfirmacion(
                    `Eliminar Categoría: ${catName}`,
                    data.mensaje,
                    async () => {
                        const resConf = await fetch(`/api/categorias/${catId}?confirmar=true`, { method: "DELETE" });
                        const resData = await resConf.json();
                        if (!resConf.ok) throw new Error(resData.error || "Error al eliminar");
                        alert(`Categoría eliminada. ${resData.movimientosRecategorizados || 0} movimiento(s) recategorizado(s).`);
                        expandedCategoryIds.delete(catId);
                        await cargarCategorias();
                    }
                );
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al eliminar categoría");
            }

            expandedCategoryIds.delete(catId);
            await cargarCategorias();
        } catch (err) {
            console.error(err);
            alert(err.message || "Error al eliminar la categoría.");
        }
    }

    async function intentarEliminarSubcategoria(subId, subName) {
        if (!confirm(`¿Estás seguro de que deseas eliminar la subcategoría "${subName}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/subcategorias/${subId}`, { method: "DELETE" });
            if (res.status === 409) {
                const data = await res.json();
                mostrarModalConfirmacion(
                    `Eliminar Subcategoría: ${subName}`,
                    data.mensaje,
                    async () => {
                        const resConf = await fetch(`/api/subcategorias/${subId}?confirmar=true`, { method: "DELETE" });
                        const resData = await resConf.json();
                        if (!resConf.ok) throw new Error(resData.error || "Error al eliminar");
                        alert(`Subcategoría eliminada. ${resData.movimientosRecategorizados || 0} movimiento(s) recategorizado(s).`);
                        await cargarCategorias();
                    }
                );
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al eliminar subcategoría");
            }

            await cargarCategorias();
        } catch (err) {
            console.error(err);
            alert(err.message || "Error al eliminar la subcategoría.");
        }
    }

    function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
        document.getElementById("confirmDeleteTitle").textContent = titulo;
        confirmDeleteMessage.textContent = mensaje;
        pendingDeleteAction = onConfirm;
        confirmDeleteModal.style.display = "block";
    }

    confirmDeleteModalBtn.addEventListener("click", async () => {
        if (pendingDeleteAction) {
            try {
                confirmDeleteModalBtn.disabled = true;
                await pendingDeleteAction();
            } catch (err) {
                alert(err.message || "Error al completar la eliminación");
            } finally {
                confirmDeleteModalBtn.disabled = false;
                confirmDeleteModal.style.display = "none";
                pendingDeleteAction = null;
            }
        }
    });

    cancelDeleteModalBtn.addEventListener("click", () => {
        confirmDeleteModal.style.display = "none";
        pendingDeleteAction = null;
    });

    // Cerrar modales con clic fuera
    window.addEventListener("click", (e) => {
        if (e.target === catModal) closeCatModalFn();
        if (e.target === subModal) closeSubModalFn();
        if (e.target === confirmDeleteModal) {
            confirmDeleteModal.style.display = "none";
            pendingDeleteAction = null;
        }
    });

    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Inicializar
    cargarCategorias();
});
