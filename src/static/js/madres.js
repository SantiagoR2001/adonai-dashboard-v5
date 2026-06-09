// ============================
//  madres.js
// ============================

// Elementos del DOM
const modal = document.getElementById("formModal");
const nuevaMadreBtn = document.getElementById("nuevaMadreBtn");
const closeBtn = document.querySelector(".close");
const cancelBtn = document.getElementById("cancelBtn");
const madreForm = document.getElementById("madreForm");
const madresTableBody = document.querySelector("#madresTable tbody");
const searchInput = document.getElementById("searchInput");

// Campo que usamos como RESPONSABLE (columna PROCESA en Excel)
const procesaInput = document.getElementById("procesa");

let editMode = false;
let currentMadreId = null;

// ============================
//  Inicialización (rol y usuario)
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const rol = localStorage.getItem("rol");       // "admin" o "secretaria"
    const nombre = localStorage.getItem("nombre"); // nombre del usuario

    // Poner el rol en el campo procesa (responsable)
    if (procesaInput && rol) {
        procesaInput.value = rol;
    }

    // Mostrar el nombre del usuario en el sidebar
    const currentUserSpan = document.getElementById("currentUser");
    if (currentUserSpan && nombre) {
        currentUserSpan.textContent = nombre;
    }

    cargarMadres();
});

// ============================
//  Abrir y cerrar modal
// ============================
nuevaMadreBtn.addEventListener("click", () => {
    editMode = false;
    currentMadreId = null;
    document.getElementById("modalTitle").textContent = "Registrar Nueva Madre";
    madreForm.reset();

    const rol = localStorage.getItem("rol");
    if (procesaInput && rol) {
        procesaInput.value = rol;
    }

    modal.style.display = "block";
});

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
    madreForm.reset();

    const rol = localStorage.getItem("rol");
    if (procesaInput && rol) {
        procesaInput.value = rol;
    }
});

// Cerrar modal al hacer clic fuera
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        madreForm.reset();

        const rol = localStorage.getItem("rol");
        if (procesaInput && rol) {
            procesaInput.value = rol;
        }
    }
});

// ============================
//  Cargar madres desde la API
// ============================
async function cargarMadres() {
    try {
        const response = await fetch("/api/madres");
        const data = await response.json();

        madresTableBody.innerHTML = "";

        data.forEach((madre) => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", madre.id); // fila real en Excel

            // Mostrar bonito: si en Excel hay 1/2, convertir a texto
            let responsable = madre.procesa;
            if (responsable === 1 || responsable === "1") {
                responsable = "admin";
            } else if (responsable === 2 || responsable === "2") {
                responsable = "secretaria";
            }

            row.innerHTML = `
                <td>${madre.codigoMadre}</td>
                <td>${madre.nombreCompleto}</td>
                <td>${madre.identificacion}</td>
                <td>${madre.fechaIngreso}</td>
                <td>${responsable}</td>
                <td class="action-buttons">
                    <button class="btn-sm btn-edit" onclick="editarMadre(${madre.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="eliminarMadre(${madre.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            madresTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar madres:", error);
    }
}

// ============================
//  Guardar nueva o editar madre
// ============================
madreForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rol = localStorage.getItem("rol") || "";
    if (procesaInput) {
        procesaInput.value = rol;
    }

    const madreData = {
        codigoMadre: document.getElementById("codigoMadre").value,
        nombreCompleto: document.getElementById("nombreCompleto").value,
        identificacion: document.getElementById("identificacion").value,
        fechaIngreso: document.getElementById("fechaIngreso").value,
        procesa: document.getElementById("procesa").value, // admin / secretaria
    };

    try {
        let response;
        if (editMode && currentMadreId) {
            response = await fetch(`/api/madres/${currentMadreId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(madreData),
            });
        } else {
            response = await fetch("/api/madres", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(madreData),
            });
        }

        if (response.ok) {
            alert(editMode ? "Madre actualizada con éxito ✅" : "Madre registrada con éxito ✅");
            madreForm.reset();

            const rolAgain = localStorage.getItem("rol");
            if (procesaInput && rolAgain) {
                procesaInput.value = rolAgain;
            }

            modal.style.display = "none";
            cargarMadres();
        } else {
            alert("Error al guardar madre ❌");
        }
    } catch (error) {
        console.error("Error al enviar datos:", error);
        alert("Error al guardar madre ❌");
    }
});

// ============================
//  Editar madre
// ============================
async function editarMadre(id) {
    try {
        const response = await fetch("/api/madres");
        const data = await response.json();
        const madre = data.find(m => m.id === id);

        if (!madre) {
            alert("Madre no encontrada ❌");
            return;
        }

        document.getElementById("codigoMadre").value = madre.codigoMadre;
        document.getElementById("nombreCompleto").value = madre.nombreCompleto;
        document.getElementById("identificacion").value = madre.identificacion;
        document.getElementById("fechaIngreso").value = madre.fechaIngreso;

        // Para el campo responsable, mostramos lo que tenga el registro
        let responsable = madre.procesa;
        if (responsable === 1 || responsable === "1") {
            responsable = "admin";
        } else if (responsable === 2 || responsable === "2") {
            responsable = "secretaria";
        }
        if (procesaInput) {
            procesaInput.value = responsable;
        }

        editMode = true;
        currentMadreId = madre.id;
        document.getElementById("modalTitle").textContent = "Editar Madre";
        modal.style.display = "block";
    } catch (error) {
        console.error("Error al editar madre:", error);
    }
}

// ============================
//  Eliminar madre
// ============================
async function eliminarMadre(id) {
    if (!confirm("¿Seguro que quieres eliminar esta madre?")) return;

    try {
        const res = await fetch(`/api/madres/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Madre eliminada con éxito ✅");
            cargarMadres();
        } else {
            alert("Error al eliminar madre ❌");
        }
    } catch (error) {
        console.error("Error al eliminar madre:", error);
    }
}

// ============================
//  Buscador en la tabla
// ============================
searchInput.addEventListener("keyup", () => {
    const filter = searchInput.value.toLowerCase();
    const rows = madresTableBody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        let rowText = rows[i].textContent.toLowerCase();
        rows[i].style.display = rowText.includes(filter) ? "" : "none";
    }
});
