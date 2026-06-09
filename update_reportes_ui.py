import re

# 1. Move JS logic to main.js
js_logic = """
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
                        if (confirm(data.message + "\\n\\n¿Deseas continuar y guardar de todas formas?")) {
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
"""

main_js_path = "src/static/js/main.js"
with open(main_js_path, "a", encoding="utf-8") as f:
    f.write(js_logic)

# 2. Extract HTML from dashboard.html
with open("src/templates/dashboard.html", "r", encoding="utf-8") as f:
    dashboard_html = f.read()

modal_match = re.search(r'(<!-- Modal de Configuración Inicial \(Admin\) -->.*?)(?=<!--|$)', dashboard_html, flags=re.DOTALL)
if modal_match:
    config_modal_html = modal_match.group(1)
    
    with open("src/templates/reportes.html", "r", encoding="utf-8") as f:
        reportes_html = f.read()
        
    if "id=\"configModal\"" not in reportes_html:
        reportes_html = reportes_html.replace("</form>\n      </div>\n    </div>", "</form>\n      </div>\n    </div>\n\n" + config_modal_html)
        
    sidebar_li = """
            <style>
                .admin-only { display: none; }
                body.rol-admin .admin-only { display: block; }
            </style>
            <li class="admin-only">
                <a href="#" id="openConfigBtn">
                    <i class="fas fa-cog"></i>
                    Configuración Inicial
                </a>
            </li>
"""
    if "openConfigBtn" not in reportes_html:
        reportes_html = reportes_html.replace('<li class="active"><a href="{{ url_for(\'main.reportes\') }}"><i class="fas fa-chart-bar"></i> Reportes</a></li>\n            </ul>', '<li class="active"><a href="{{ url_for(\'main.reportes\') }}"><i class="fas fa-chart-bar"></i> Reportes</a></li>' + sidebar_li + '\n            </ul>')

    with open("src/templates/reportes.html", "w", encoding="utf-8") as f:
        f.write(reportes_html)

print("done")
