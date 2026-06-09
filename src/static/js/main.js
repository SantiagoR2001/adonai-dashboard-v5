// Configuración global
const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:5000', // Flask corre en 5000 por defecto
    ENDPOINTS: {
        MADRES: '/madres',
        MOVIMIENTOS: '/movimientos',
        REPORTES: '/reportes'
    }
};

// Clase para manejo de API
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    getHeaders() {
        return { 'Content-Type': 'application/json' };
    }

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, { headers: this.getHeaders() });
        return response.json();
    }

    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async put(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return response.json();
    }
}

const apiService = new ApiService();

// === Utils ===
class Utils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    static formatDate(date, format = 'dd/mm/yyyy') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        switch (format) {
            case 'dd/mm/yyyy': return `${day}/${month}/${year}`;
            case 'yyyy-mm-dd': return `${year}-${month}-${day}`;
            case 'long': return d.toLocaleDateString('es-CO', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            default: return `${day}/${month}/${year}`;
        }
    }

    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateId(id) {
        return /^\d{6,12}$/.test(id);
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    static showLoading(element) {
        element.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Cargando...
            </div>
        `;
    }

    static showEmptyState(element, message = 'No hay datos disponibles', icon = 'fas fa-inbox') {
        element.innerHTML = `
            <div class="empty-state">
                <i class="${icon}"></i>
                <h3>${message}</h3>
                <p>No se encontraron registros para mostrar</p>
            </div>
        `;
    }
}

// === Notifications ===
class NotificationSystem {
    static show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;">&times;</button>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    }

    static success(msg) { this.show(msg, 'success'); }
    static error(msg) { this.show(msg, 'error'); }
    static warning(msg) { this.show(msg, 'warning'); }
    static info(msg) { this.show(msg, 'info'); }
}

// === Modal Manager ===
class ModalManager {
    static open(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    static close(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    static init() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.close(e.target.id);
            if (e.target.classList.contains('close')) this.close(e.target.closest('.modal').id);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="flex"]');
                if (openModal) this.close(openModal.id);
            }
        });
    }
}

// === Form Manager ===
class FormManager {
    static serialize(form) {
        return Object.fromEntries(new FormData(form));
    }
    static reset(form) {
        form.reset();
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
    static validate(form, rules) {
        let isValid = true;
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;
            const value = field.value.trim();
            const rule = rules[fieldName];
            if (rule.required && !value) {
                this.showFieldError(field, 'Este campo es requerido');
                isValid = false;
            } else if (rule.minLength && value.length < rule.minLength) {
                this.showFieldError(field, `Mínimo ${rule.minLength} caracteres`);
                isValid = false;
            } else if (rule.email && !Utils.validateEmail(value)) {
                this.showFieldError(field, 'Email inválido');
                isValid = false;
            } else if (rule.custom) {
                const result = rule.custom(value);
                if (result !== true) {
                    this.showFieldError(field, result);
                    isValid = false;
                }
            }
        });
        return isValid;
    }
    static showFieldError(field, msg) {
        field.classList.add('error');
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = msg;
        div.style.color = 'var(--error-color)';
        div.style.fontSize = 'var(--font-size-small)';
        field.parentNode.appendChild(div);
    }
}

// === Table Manager ===
class TableManager {
    constructor(id, options = {}) {
        this.table = document.getElementById(id);
        this.tbody = this.table.querySelector('tbody');
        this.options = { searchable: true, sortable: true, ...options };
        this.data = [];
        this.filteredData = [];
        this.currentSort = { column: null, direction: 'asc' };
        this.init();
    }
    init() {
        if (this.options.searchable) this.initSearch();
        if (this.options.sortable) this.initSort();
    }
    initSearch() {
        const searchInput = document.querySelector(`#${this.table.id.replace('Table', '')}Search, #searchInput`);
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => this.search(e.target.value), 300));
        }
    }
    initSort() {
        this.table.querySelectorAll('th[data-sort]').forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => this.sort(header.dataset.sort));
        });
    }
    setData(data) {
        this.data = data;
        this.filteredData = [...data];
        this.render();
    }
    search(query) {
        this.filteredData = !query ? [...this.data] : this.data.filter(row =>
            Object.values(row).some(v => String(v).toLowerCase().includes(query.toLowerCase()))
        );
        this.render();
    }
    sort(column) {
        const dir = this.currentSort.column === column && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        this.filteredData.sort((a, b) =>
            dir === 'asc'
                ? (a[column] > b[column] ? 1 : -1)
                : (a[column] < b[column] ? 1 : -1)
        );
        this.currentSort = { column, direction: dir };
        this.render();
    }
    render() {
        if (this.filteredData.length === 0) {
            return Utils.showEmptyState(this.tbody, 'No se encontraron registros');
        }
        this.tbody.innerHTML = this.filteredData.map(row => this.renderRow(row)).join('');
    }
    renderRow() { return '<tr><td>Implementar renderRow</td></tr>'; }
}

// === Init global ===
document.addEventListener('DOMContentLoaded', () => {
    ModalManager.init();

    // Fecha actual en elementos (#currentDate o .current-date)
    document.querySelectorAll('#currentDate,.current-date').forEach(el => {
        el.textContent = Utils.formatDate(new Date(), 'long');
    });

    // 🔹 Leer nombre y rol desde localStorage
    const nombre = localStorage.getItem('nombre') || 'Usuario';
    const rol = localStorage.getItem('rol'); // "admin" | "secretaria"

    // 🔹 Poner el nombre en TODOS los #currentUser
    document.querySelectorAll('#currentUser').forEach(el => {
        el.textContent = nombre;
    });

    // 🔹 Clase en body según rol (por si quieres estilos personalizados)
    if (rol) {
        document.body.classList.add(`rol-${rol}`); // ej: rol-admin, rol-secretaria
    }

    // 🔹 Botones de salir (navbar, sidebar, etc.)
    document.querySelectorAll('#logoutBtn,.logout-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await fetch('/logout'); // limpia sesión en Flask
            } catch (e) {
                console.warn('Error llamando /logout:', e);
            }
            localStorage.clear();      // limpia datos del navegador
            window.location.href = '/'; // vuelve al login
        });
    });
});

// Export globals
window.Utils = Utils;
window.NotificationSystem = NotificationSystem;
window.ModalManager = ModalManager;
window.FormManager = FormManager;
window.TableManager = TableManager;
window.apiService = apiService;

// ============================
//  Manejo de Configuración Inicial (Admins)
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const openConfigBtn = document.getElementById("openConfigBtn");
    const configModal = document.getElementById("configModal");
    const closeConfigModal = document.getElementById("closeConfigModal");
    const cancelConfigBtn = document.getElementById("cancelConfigBtn");
    const configForm = document.getElementById("configForm");

    if (openConfigBtn && configModal) {
        openConfigBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            configModal.style.display = "block";
            
            try {
                const res = await fetch("/api/configuracion");
                if (res.ok) {
                    const data = await res.json();
                    if(document.getElementById("configFechaInicio")) document.getElementById("configFechaInicio").value = data.fechaInicio || "";
                    if(document.getElementById("configSaldoCaja")) document.getElementById("configSaldoCaja").value = data.saldoInicialCaja || 0;
                    if(document.getElementById("configSaldoBanco")) document.getElementById("configSaldoBanco").value = data.saldoInicialBanco || 0;
                }
            } catch (error) {
                console.error("Error loading config:", error);
            }
        });
    }

    if (closeConfigModal && configModal) {
        closeConfigModal.addEventListener("click", () => configModal.style.display = "none");
    }
    
    if (cancelConfigBtn && configModal) {
        cancelConfigBtn.addEventListener("click", () => configModal.style.display = "none");
    }

    if (configForm) {
        configForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const payload = {
                fechaInicio: document.getElementById("configFechaInicio").value,
                saldoInicialCaja: parseFloat(document.getElementById("configSaldoCaja").value) || 0,
                saldoInicialBanco: parseFloat(document.getElementById("configSaldoBanco").value) || 0,
                force: false
            };
            
            const sendConfig = async (force) => {
                payload.force = force;
                try {
                    const res = await fetch("/api/configuracion", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    
                    if (data.warning) {
                        if (confirm(data.message + "\n\n¿Deseas continuar y guardar de todas formas?")) {
                            await sendConfig(true);
                        }
                        return;
                    }
                    
                    if (data.success) {
                        if (window.NotificationSystem?.success) NotificationSystem.success("Configuración guardada exitosamente");
                        configModal.style.display = "none";
                        setTimeout(() => location.reload(), 1000);
                    } else if (data.error) {
                        if (window.NotificationSystem?.error) NotificationSystem.error(data.error);
                    }
                } catch (error) {
                    console.error("Error saving config:", error);
                    if (window.NotificationSystem?.error) NotificationSystem.error("Error al guardar la configuración");
                }
            };
            
            await sendConfig(false);
        });
    }

    // ============================
    //  Manejo de TRM Mensual (Etapa 6)
    // ============================
    const trmForm = document.getElementById("trmForm");
    const trmTableBody = document.getElementById("trmTableBody");

    const loadTRMs = async () => {
        if (!trmTableBody) return;
        try {
            const res = await fetch("/api/trm");
            if (res.ok) {
                const data = await res.json();
                trmTableBody.innerHTML = "";
                const meses = Object.keys(data).sort().reverse();
                if (meses.length === 0) {
                    trmTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">No hay TRMs registradas</td></tr>`;
                    return;
                }
                meses.forEach(mes => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${mes}</td>
                        <td>$${parseFloat(data[mes]).toLocaleString()}</td>
                        <td>
                            <button onclick="window.deleteTRM('${mes}')" style="background: none; border: none; color: #dc3545; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    trmTableBody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error("Error loading TRM:", error);
        }
    };

    if (openConfigBtn) {
        openConfigBtn.addEventListener("click", loadTRMs);
    }

    if (trmForm) {
        trmForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const mes = document.getElementById("trmMes").value;
            const valor = document.getElementById("trmValor").value;
            try {
                const res = await fetch("/api/trm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mes, valor })
                });
                if (res.ok) {
                    if (window.NotificationSystem?.success) NotificationSystem.success(`TRM para ${mes} guardada`);
                    document.getElementById("trmValor").value = "";
                    loadTRMs();
                } else {
                    const err = await res.json();
                    if (window.NotificationSystem?.error) NotificationSystem.error(err.error || "Error al guardar TRM");
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    window.deleteTRM = async (mes) => {
        if (!confirm(`¿Eliminar TRM de ${mes}?`)) return;
        try {
            const res = await fetch(`/api/trm/${mes}`, { method: "DELETE" });
            if (res.ok) {
                if (window.NotificationSystem?.success) NotificationSystem.success("TRM eliminada");
                loadTRMs();
            }
        } catch (error) {
            console.error(error);
        }
    };
});
