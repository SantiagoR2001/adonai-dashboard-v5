// ============================
//  Manejo del dashboard principal
// ============================
class DashboardManager {
    constructor() {
        this.charts = {};
        this.data = {
            saldos: { banco: 0, caja: 0, ingresosMes: 0, egresosMes: 0 },
            movimientos: [],
            resumenMensual: {}
        };

        // Paleta (desde CSS variables)
        this.palette = this.getPaletteFromCSS();

        // Observador para que Chart.js se ajuste cuando cambie el layout
        this.resizeObserver = null;

        this.init();
    }

    async init() {
        await this.loadData();
        this.updateSummaryCards();

        // ✅ Crear charts cuando el layout ya está listo (evita deformaciones)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.initCharts();
                this.setupChartAutoResize();
                this.loadRecentMovements();
                this.setupEventListeners();
                this.forceResizeCharts();
            });
        });
    }

    // ================== PALETA DESDE CSS ==================
    getPaletteFromCSS() {
        const root = getComputedStyle(document.documentElement);

        const read = (name, fallback) => {
            const v = root.getPropertyValue(name).trim();
            return v || fallback;
        };

        return {
            blue: read("--adonai-blue", "#61BCDA"),
            green: read("--adonai-green", "#95C63B"),
            yellow: read("--adonai-yellow", "#E8D72A"),
            pink: read("--adonai-pink", "#FF0869"),
            border: read("--border-color", "#dfe5ec")
        };
    }

    // ================== CARGA DE DATOS DESDE FLASK ==================
    async loadData() {
        try {
            await this.loadSaldos();
            await this.loadMovimientos();
            await this.loadResumenMensual();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            if (window.NotificationSystem?.error) {
                NotificationSystem.error("Error al cargar los datos del dashboard");
            }
        }
    }

    async loadSaldos() {
        try {
            const res = await fetch("/api/saldos");
            if (!res.ok) throw new Error("Error en API /saldos");
            this.data.saldos = await res.json();
        } catch (error) {
            console.error(error);
            this.data.saldos = { saldoInicial:0, ingresosBanco:0, egresosBanco:0, saldoBanco:0, ingresosCaja:0, egresosCaja:0, saldoCaja:0, saldoConsolidado:0 };
        }
    }

    async loadMovimientos() {
        try {
            const res = await fetch("/api/movimientos");
            if (!res.ok) throw new Error("Error en API /movimientos");
            this.data.movimientos = await res.json();
        } catch (error) {
            console.error(error);
            this.data.movimientos = [];
        }
    }

    async loadResumenMensual() {
        try {
            const res = await fetch("/api/resumen");
            if (!res.ok) throw new Error("Error en API /resumen");
            this.data.resumenMensual = await res.json();
        } catch (error) {
            this.data.resumenMensual = {};
        }
    }

    // ================== TARJETAS DE RESUMEN ==================
    updateSummaryCards() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                el.dataset.value = Number(val) || 0;
                el.textContent = Utils.formatCurrency(el.dataset.value);
            }
        };

        const s = this.data.saldos;
        setVal("saldoInicial", s.saldoInicial);
        setVal("ingresosBanco", s.ingresosBanco);
        setVal("egresosBanco", s.egresosBanco);
        setVal("saldoBanco", s.saldoBanco);
        setVal("ingresosCaja", s.ingresosCaja);
        setVal("egresosCaja", s.egresosCaja);
        setVal("saldoCaja", s.saldoCaja);
        setVal("saldoConsolidado", s.saldoConsolidado);

        this.animateNumbers();
    }

    animateNumbers() {
        const cards = document.querySelectorAll(".amount");
        cards.forEach(card => {
            const target = Number(card.dataset.value || 0);
            this.animateValue(card, 0, target, 900);
        });
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const isNegative = end < 0;
        const absEnd = Math.abs(end);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (absEnd - start) * progress;
            const displayValue = isNegative ? -current : current;

            element.textContent = Utils.formatCurrency(displayValue);

            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    // ================== GRÁFICOS ==================
    initCharts() {
        // ✅ Si por alguna razón ya existen, los destruimos (evita bugs raros)
        this.destroyCharts();

        this.initIngresosEgresosChart();
        this.initCategoriaChart();
    }

    initIngresosEgresosChart() {
        const canvas = document.getElementById("ingresosEgresosChart");
        if (!canvas) return;

        const meses = Object.keys(this.data.resumenMensual || {});
        const labels = meses.map(m => m.charAt(0).toUpperCase() + m.slice(1));
        const ingresos = meses.map(m => this.data.resumenMensual[m]?.ingresos || 0);
        const egresos  = meses.map(m => Math.abs(this.data.resumenMensual[m]?.egresos || 0));

        this.charts.ingresosEgresos = new Chart(canvas, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Ingresos",
                        data: ingresos,
                        backgroundColor: this.palette.blue,
                        borderColor: this.palette.blue,
                        borderWidth: 1
                    },
                    {
                        label: "Egresos",
                        data: egresos,
                        backgroundColor: this.palette.yellow,
                        borderColor: this.palette.yellow,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        },
                        grid: { color: this.palette.border }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) =>
                                `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`
                        }
                    },
                    legend: { position: "bottom" }
                }
            }
        });
    }

    initCategoriaChart() {
        const canvas = document.getElementById("categoriaChart");
        if (!canvas) return;

        const categorias = {};
        (this.data.movimientos || []).forEach(mov => {
            if (mov.tipo === "egreso") {
                const cat = mov.categoria || "Sin categoría";
                categorias[cat] = (categorias[cat] || 0) + Math.abs(mov.valor || 0);
            }
        });

        const labels = Object.keys(categorias);
        const data = Object.values(categorias);

        const colors = [
            this.palette.pink,
            this.palette.blue,
            this.palette.green,
            this.palette.yellow
        ];

        // si hay más categorías, repetimos paleta
        const bg = labels.map((_, i) => colors[i % colors.length]);

        this.charts.categoria = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: bg,
                    borderColor: "#ffffff",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 20, usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total ? ((context.parsed / total) * 100).toFixed(1) : "0.0";
                                return `${context.label}: ${Utils.formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ✅ Ajuste automático de charts cuando cambie el layout (sidebar/resize)
    setupChartAutoResize() {
        const container = document.querySelector(".charts-container");
        if (!container) return;

        // ResizeObserver (si el navegador lo soporta)
        if ("ResizeObserver" in window) {
            this.resizeObserver = new ResizeObserver(() => {
                this.forceResizeCharts();
            });
            this.resizeObserver.observe(container);
        }

        // Fallback general
        window.addEventListener("resize", () => this.forceResizeCharts());
    }

    forceResizeCharts() {
        // Chart.js recalcula el canvas si llamas resize()
        Object.values(this.charts).forEach(ch => {
            if (ch && typeof ch.resize === "function") ch.resize();
        });
    }

    updateCharts() {
        // ✅ Update Ingresos/Egresos (labels + data)
        if (this.charts.ingresosEgresos) {
            const meses = Object.keys(this.data.resumenMensual || {});
            const labels = meses.map(m => m.charAt(0).toUpperCase() + m.slice(1));
            const ingresos = meses.map(m => this.data.resumenMensual[m]?.ingresos || 0);
            const egresos  = meses.map(m => Math.abs(this.data.resumenMensual[m]?.egresos || 0));

            this.charts.ingresosEgresos.data.labels = labels;
            this.charts.ingresosEgresos.data.datasets[0].data = ingresos;
            this.charts.ingresosEgresos.data.datasets[1].data = egresos;
            this.charts.ingresosEgresos.update();
        }

        // ✅ Update Categoría (labels + data + colores)
        if (this.charts.categoria) {
            const categorias = {};
            (this.data.movimientos || []).forEach(mov => {
                if (mov.tipo === "egreso") {
                    const cat = mov.categoria || "Sin categoría";
                    categorias[cat] = (categorias[cat] || 0) + Math.abs(mov.valor || 0);
                }
            });

            const labels = Object.keys(categorias);
            const values = Object.values(categorias);
            const colors = [this.palette.pink, this.palette.blue, this.palette.green, this.palette.yellow];
            const bg = labels.map((_, i) => colors[i % colors.length]);

            this.charts.categoria.data.labels = labels;
            this.charts.categoria.data.datasets[0].data = values;
            this.charts.categoria.data.datasets[0].backgroundColor = bg;
            this.charts.categoria.update();
        }

        // ✅ después de actualizar, fuerza resize por si cambió el layout
        this.forceResizeCharts();
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => chart && chart.destroy());
        this.charts = {};
    }

    destroy() {
        this.destroyCharts();
        if (this.resizeObserver) this.resizeObserver.disconnect();
    }

    // ================== TABLA DE MOVIMIENTOS ==================
    loadRecentMovements() {
        const tableBody = document.querySelector("#movimientosTable tbody");
        if (!tableBody) return;

        if (!this.data.movimientos || this.data.movimientos.length === 0) {
            Utils.showEmptyState(tableBody, "No hay movimientos recientes");
            return;
        }

        const recentMovements = this.data.movimientos.slice(0, 10);

        tableBody.innerHTML = recentMovements.map(mov => `
            <tr data-id="${mov.id}">
                <td>${Utils.formatDate(mov.fecha)}</td>
                <td>
                    <span class="badge ${mov.tipo === "ingreso" ? "badge-success" : "badge-warning"}">
                        ${mov.tipo?.charAt(0).toUpperCase() + mov.tipo?.slice(1)}
                    </span>
                </td>
                <td>${mov.categoria || ""}</td>
                <td>${mov.concepto || ""}</td>
                <td>
                    <span class="badge ${mov.medio === "banco" ? "badge-info" : "badge-success"}">
                        ${mov.medio?.charAt(0).toUpperCase() + mov.medio?.slice(1)}
                    </span>
                </td>
                <td class="${mov.valor < 0 ? "text-danger" : "text-success"}">
                    ${Utils.formatCurrency(mov.valor || 0)}
                </td>
                <td class="actions">
                    <i class="fas fa-edit edit-mov" title="Editar"></i>
                    <i class="fas fa-trash delete-mov" title="Eliminar"></i>
                </td>
            </tr>
        `).join("");

        tableBody.querySelectorAll(".edit-mov").forEach(btn => {
            btn.addEventListener("click", (e) => this.editMovimiento(e));
        });

        tableBody.querySelectorAll(".delete-mov").forEach(btn => {
            btn.addEventListener("click", (e) => this.deleteMovimiento(e));
        });
    }

    async deleteMovimiento(e) {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");
        if (!confirm("¿Seguro que deseas eliminar este movimiento?")) return;

        try {
            const res = await fetch(`/api/movimientos/${id}`, { method: "DELETE" });
            if (res.ok) {
                if (window.NotificationSystem?.success) NotificationSystem.success("Movimiento eliminado ✅");
                row.remove();
            } else {
                if (window.NotificationSystem?.error) NotificationSystem.error("Error al eliminar movimiento ❌");
            }
        } catch (error) {
            console.error(error);
            if (window.NotificationSystem?.error) NotificationSystem.error("Error al eliminar movimiento ❌");
        }
    }

    editMovimiento(e) {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");
        const movimiento = (this.data.movimientos || []).find(m => m.id == id);
        if (!movimiento) return;

        const modal = document.getElementById("formModal");
        if (!modal) return;

        modal.style.display = "block";

        const setVal = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value ?? "";
        };

        setVal("fecha", movimiento.fecha || "");
        setVal("medio", movimiento.medio || "");
        setVal("tipo", movimiento.tipo || "");
        setVal("categoria", movimiento.categoria || "");
        setVal("subcategoria", movimiento.subcategoria || "");
        setVal("codigoMadre", movimiento.codigoMadre || "");
        setVal("concepto", movimiento.concepto || "");
        setVal("valor", movimiento.valor ?? 0);
        setVal("procesa", movimiento.responsable || "");

        const form = document.getElementById("movimientoForm");
        if (form) form.setAttribute("data-edit-id", id);
    }

    // ================== EVENTOS Y REFRESCO ==================
    setupEventListeners() {
        setInterval(() => this.refreshData(), 5 * 60 * 1000);

        const refreshBtn = document.getElementById("refreshBtn");
        if (refreshBtn) refreshBtn.addEventListener("click", () => this.refreshData());
    }

    async refreshData() {
        try {
            await this.loadData();
            this.updateSummaryCards();
            this.updateCharts();
            this.loadRecentMovements();
            if (window.NotificationSystem?.success) NotificationSystem.success("Datos actualizados correctamente");
        } catch (error) {
            console.error("Error refreshing data:", error);
            if (window.NotificationSystem?.error) NotificationSystem.error("Error al actualizar los datos");
        }
    }
}

// ============================
//  Inicializar dashboard
// ============================
document.addEventListener("DOMContentLoaded", () => {
    new DashboardManager();

});
