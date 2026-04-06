// =============================================
// Theme Initialization
// =============================================
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    
    Chart.defaults.color = savedTheme === 'dark' ? '#e9ecef' : '#666';
    if(Chart.defaults.scale) {
        Chart.defaults.scale.grid.color = savedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    }

    updateThemeButton(savedTheme);
};

const updateThemeButton = (theme) => {
    const btn = document.getElementById('btn-theme-toggle');
    const btnMobile = document.getElementById('btn-theme-toggle-mobile');
    
    if(theme === 'dark') {
        const darkHtml = '<i class="bi bi-sun-fill me-1 text-warning"></i> Modo Claro';
        const darkHtmlMobile = '<i class="bi bi-sun-fill fs-5 d-block mb-1 text-warning"></i><small style="font-size: 0.65rem;">Claro</small>';
        if(btn) btn.innerHTML = darkHtml;
        if(btnMobile) btnMobile.innerHTML = darkHtmlMobile;
    } else {
        const lightHtml = '<i class="bi bi-moon-stars-fill me-1"></i> Modo Noche';
        const lightHtmlMobile = '<i class="bi bi-moon-stars-fill fs-5 d-block mb-1"></i><small style="font-size: 0.65rem;">Noche</small>';
        if(btn) btn.innerHTML = lightHtml;
        if(btnMobile) btnMobile.innerHTML = lightHtmlMobile;
    }
};

const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    Chart.defaults.color = newTheme === 'dark' ? '#e9ecef' : '#666';
    if(Chart.defaults.scale) {
        Chart.defaults.scale.grid.color = newTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    }

    updateThemeButton(newTheme);
    
    // Rerender charts
    if(document.getElementById('estadisticas-view').style.display !== 'none') {
        renderEstadisticas();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnTheme = document.getElementById('btn-theme-toggle');
    const btnThemeMobile = document.getElementById('btn-theme-toggle-mobile');
    if(btnTheme) btnTheme.addEventListener('click', toggleTheme);
    if(btnThemeMobile) btnThemeMobile.addEventListener('click', toggleTheme);
});

initTheme();

// =============================================
// Firebase Firestore Setup
// =============================================
const firebaseConfig = {
    apiKey: "AIzaSyDYXs-KElPPutHBvbHAJNNysOSqINvmB-A",
    authDomain: "imprenta-fr-app.firebaseapp.com",
    projectId: "imprenta-fr-app",
    storageBucket: "imprenta-fr-app.firebasestorage.app",
    messagingSenderId: "992037062023",
    appId: "1:992037062023:web:b362d185d1d4a7a3f5bf22",
    measurementId: "G-0DGE9LXFQY"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

async function dbObtenerTodos() {
    const snapshot = await db.collection('pedidos').get();
    let pedidos = [];
    snapshot.forEach(doc => {
        let p = doc.data();
        p.id = p.id || doc.id; // Compatibility fallback
        pedidos.push(p);
    });
    return pedidos;
}

async function dbAgregar(pedido) {
    try {
        const todos = await dbObtenerTodos();
        const maxId = todos.length > 0 ? Math.max(...todos.map(p => Number(p.id) || 0)) : 0;
        pedido.id = maxId + 1;
        await db.collection('pedidos').doc(String(pedido.id)).set(pedido);
        return pedido.id;
    } catch (e) {
        console.error("Error al agregar:", e);
    }
}

async function dbActualizar(pedido) {
    try {
        await db.collection('pedidos').doc(String(pedido.id)).update(pedido);
    } catch (e) {
        // If it doesn't exist, we might need to set it instead of update.
        await db.collection('pedidos').doc(String(pedido.id)).set(pedido, { merge: true });
    }
}

async function dbEliminar(id) {
    await db.collection('pedidos').doc(String(id)).delete();
}

// =============================================
// Categorías (LocalStorage)
// =============================================
let categorias = JSON.parse(localStorage.getItem('imprenta_categorias')) || [
    'Tarjetas', 'Volantes', 'Gigantografías', 'Afiches', 
    'Folletos', 'Talonarios', 'Sellos', 'Otros'
];

function guardarCategorias() {
    localStorage.setItem('imprenta_categorias', JSON.stringify(categorias));
    renderCategoriasOptions();
}

function renderCategoriasOptions() {
    const formCat = document.getElementById('form-categoria');
    const editCat = document.getElementById('edit-categoria');
    
    const currentFormVal = formCat.value;
    const currentEditVal = editCat.value;

    let optionsHtml = '';
    categorias.forEach(c => {
        optionsHtml += `<option value="${c}">${c}</option>`;
    });

    formCat.innerHTML = `<option value="" disabled selected>Seleccionar...</option>` + optionsHtml;
    editCat.innerHTML = optionsHtml;

    if (currentFormVal && categorias.includes(currentFormVal)) formCat.value = currentFormVal;
    if (currentEditVal && categorias.includes(currentEditVal)) editCat.value = currentEditVal;
}

window.agregarCategoria = () => {
    const nueva = prompt("Introduce el nombre de la nueva categoría:");
    if (nueva && nueva.trim() !== '') {
        const catLimpia = nueva.trim();
        // Capitalize standard formatting
        const catFormat = catLimpia.charAt(0).toUpperCase() + catLimpia.slice(1);
        
        if (!categorias.includes(catFormat)) {
            categorias.push(catFormat);
            guardarCategorias();
            // Auto Select
            document.getElementById('form-categoria').value = catFormat;
            document.getElementById('edit-categoria').value = catFormat;
        } else {
            alert('Esta categoría ya existe.');
        }
    }
};

// =============================================
// Elements
// =============================================
const navLinks = document.querySelectorAll('.nav-option');
const views = document.querySelectorAll('.view-section');
const formAgregar = document.getElementById('form-agregar');
const tablaPedidos = document.getElementById('tabla-pedidos');

const modalEditar = new bootstrap.Modal(document.getElementById('modal-editar'));
const formEditar = document.getElementById('form-editar');
const editId = document.getElementById('edit-id');
const editCliente = document.getElementById('edit-cliente');
const editFecha = document.getElementById('edit-fecha');
const editCategoria = document.getElementById('edit-categoria');
const editDetalle = document.getElementById('edit-detalle');
const editCantidad = document.getElementById('edit-cantidad');
const editPrecio = document.getElementById('edit-precio');
const editEstado = document.getElementById('edit-estado');

// Set today's date as default
document.getElementById('form-fecha').valueAsDate = new Date();

// =============================================
// Chart instances (to destroy before re-creating)
// =============================================
let chartCategorias = null;
let chartPrecios = null;
let chartDias = null;
let chartTipos = null;
let chartTimeline = null;

// =============================================
// Filters Event Listeners
// =============================================
const filtroFecha = document.getElementById('filtro-fecha');
const filtroDesde = document.getElementById('filtro-desde');
const filtroHasta = document.getElementById('filtro-hasta');

if (filtroFecha) {
    filtroFecha.addEventListener('change', async (e) => {
        if (e.target.value === 'libre') {
            filtroDesde.classList.remove('d-none');
            filtroHasta.classList.remove('d-none');
        } else {
            filtroDesde.classList.add('d-none');
            filtroHasta.classList.add('d-none');
            filtroDesde.value = '';
            filtroHasta.value = '';
            await renderEstadisticas();
        }
    });

    filtroDesde.addEventListener('change', renderEstadisticas);
    filtroHasta.addEventListener('change', renderEstadisticas);
}

const btnExportarPdf = document.getElementById('btn-exportar-pdf');
if (btnExportarPdf) {
    btnExportarPdf.addEventListener('click', async () => {
        const btnOriginalText = btnExportarPdf.innerHTML;
        btnExportarPdf.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generando...';
        btnExportarPdf.disabled = true;

        try {
            const vista = document.getElementById('estadisticas-view');
            btnExportarPdf.style.display = 'none'; // ocultar botón de la captura

            // Foto de los graficos
            const canvas = await html2canvas(vista, { scale: 2, backgroundColor: '#f8f9fa' });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            btnExportarPdf.style.display = '';

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();

            // Cargar Logo
            const imgLogo = new Image();
            imgLogo.src = 'images/logo.png';
            
            await new Promise((resolve) => {
                imgLogo.onload = resolve;
                imgLogo.onerror = resolve; 
            });

            // Encabezado del PDF
            if(imgLogo.width > 0) {
                pdf.addImage(imgLogo, 'PNG', 15, 10, 22, 22);
            }
            
            pdf.setFontSize(22);
            pdf.text("Reporte de Rendimiento", 42, 20);
            
            pdf.setFontSize(12);
            pdf.setTextColor(100);
            pdf.text("Imprenta FR", 42, 28);
            
            const dropdown = document.getElementById('filtro-fecha');
            const filtroTexto = dropdown.options[dropdown.selectedIndex].text;
            pdf.setFontSize(10);
            pdf.text("Período evaluado: " + filtroTexto, 42, 34);

            // Inyectar gráficos ajustando el alto proporcional al ancho de la pagina A4
            const startY = 42;
            const w = pageWidth;
            const h = (canvas.height * w) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, startY, w, h);
            
            pdf.save(`Reporte_Metricas_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error(error);
            alert("Error general al exportar PDF.");
        } finally {
            btnExportarPdf.innerHTML = btnOriginalText;
            btnExportarPdf.disabled = false;
        }
    });
}

// =============================================
// Excel Export Event Listener
// =============================================
const btnExportarExcel = document.getElementById('btn-exportar-excel');
if (btnExportarExcel) {
    btnExportarExcel.addEventListener('click', async () => {
        const btnOriginalText = btnExportarExcel.innerHTML;
        btnExportarExcel.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Exportando...';
        btnExportarExcel.disabled = true;

        try {
            let pedidos = await dbObtenerTodos();
            
            // Re-aplicar filtros
            const filtroVal = document.getElementById('filtro-fecha').value;
            const desdeVal = document.getElementById('filtro-desde').value;
            const hastaVal = document.getElementById('filtro-hasta').value;

            if (filtroVal !== 'todas') {
                let inicio = null; let fin = new Date(); fin.setHours(23, 59, 59, 999);
                const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

                if (filtroVal === 'semana') {
                    const day = hoy.getDay();
                    const diff = hoy.getDate() - day + (day === 0 ? -6 : 1);
                    inicio = new Date(hoy.setDate(diff));
                    inicio.setHours(0, 0, 0, 0);
                } else if (filtroVal === 'mes') {
                    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                } else if (filtroVal === 'trimestre') {
                    inicio = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1);
                } else if (filtroVal === 'semestre') {
                    inicio = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 6) * 6, 1);
                } else if (filtroVal === 'año') {
                    inicio = new Date(hoy.getFullYear(), 0, 1);
                } else if (filtroVal === 'libre') {
                    if (desdeVal) inicio = new Date(desdeVal + 'T00:00:00'); else inicio = null;
                    if (hastaVal) fin = new Date(hastaVal + 'T23:59:59'); else fin = null;
                }

                pedidos = pedidos.filter(p => {
                    if (!p.fecha) return false;
                    const fp = new Date(p.fecha + 'T12:00:00');
                    if (inicio && fp < inicio) return false;
                    if (fin && fp > fin) return false;
                    return true;
                });
            }
            
            // Preparar data para SheetJS
            const dataToExport = pedidos.map(p => ({
                "ID": p.id,
                "Cliente": p.cliente,
                "Fecha": p.fecha,
                "Categoría": p.categoria || 'Otros',
                "Detalle del Trabajo": p.detalle,
                "Estado": p.estado || 'Pendiente',
                "Cantidad": p.cantidad,
                "Precio Final ($)": p.precio || 0
            }));
            
            // Generar archivo
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
            
            // Auto-width columns
            const cols = [{wch:5}, {wch:25}, {wch:12}, {wch:15}, {wch:35}, {wch:15}, {wch:10}, {wch:15}];
            ws['!cols'] = cols;

            XLSX.writeFile(wb, `Reporte_Metricas_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error(error);
            alert("Error al intentar exportar el Excel.");
        } finally {
            btnExportarExcel.innerHTML = btnOriginalText;
            btnExportarExcel.disabled = false;
        }
    });
}

// =============================================
// Navigation
// =============================================
navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        navLinks.forEach(nav => nav.classList.remove('active-gold'));
        link.classList.add('active-gold');
        views.forEach(view => view.style.display = 'none');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).style.display = 'block';

        // Re-render charts when switching to stats view
        if (targetId === 'estadisticas-view') {
            await renderEstadisticas();
        }
    });
});

// =============================================
// Add Order
// =============================================
formAgregar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pedido = {
        cliente: document.getElementById('form-cliente').value,
        fecha: document.getElementById('form-fecha').value,
        categoria: document.getElementById('form-categoria').value,
        detalle: document.getElementById('form-detalle').value,
        cantidad: parseInt(document.getElementById('form-cantidad').value),
        precio: parseFloat(document.getElementById('form-precio').value),
        estado: 'Pendiente'
    };
    await dbAgregar(pedido);
    await renderTabla();
    await renderUltimosPedidos();
    formAgregar.reset();
    document.getElementById('form-fecha').valueAsDate = new Date();
    if(typeof resetTicketPreview === 'function') resetTicketPreview();
    document.querySelector('[data-target="ver-view"]').click();
});

// =============================================
// Edit Order
// =============================================
window.editarPedido = async (id) => {
    const pedidos = await dbObtenerTodos();
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    editId.value = pedido.id;
    editCliente.value = pedido.cliente;
    editFecha.value = pedido.fecha;
    editCategoria.value = pedido.categoria || 'Otros';
    editDetalle.value = pedido.detalle;
    editCantidad.value = pedido.cantidad;
    editPrecio.value = pedido.precio;
    editEstado.value = pedido.estado || 'Pendiente';
    modalEditar.show();
};

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pedido = {
        id: parseInt(editId.value),
        cliente: editCliente.value,
        fecha: editFecha.value,
        categoria: editCategoria.value,
        detalle: editDetalle.value,
        cantidad: parseInt(editCantidad.value),
        precio: parseFloat(editPrecio.value),
        estado: editEstado.value
    };
    await dbActualizar(pedido);
    await renderTabla();
    modalEditar.hide();
});

// =============================================
// Delete Order
// =============================================
window.eliminarPedido = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
        await dbEliminar(id);
        await renderTabla();
    }
};

window.verFacturaModal = async (id) => {
    const pedidos = await dbObtenerTodos();
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    
    document.getElementById('factura-id').textContent = `#${pedido.id}`;
    document.getElementById('factura-fecha').textContent = formatFecha(pedido.fecha);
    document.getElementById('factura-cliente').textContent = pedido.cliente || '---';
    document.getElementById('factura-categoria').textContent = pedido.categoria || '---';
    document.getElementById('factura-detalle').textContent = pedido.detalle || '---';
    document.getElementById('factura-cantidad').textContent = pedido.cantidad || '-';
    document.getElementById('factura-precio').textContent = `$${(pedido.precio || 0).toFixed(2)}`;
    
    const badge = document.getElementById('factura-estado-badge');
    badge.textContent = pedido.estado || 'Pendiente';
    badge.className = `badge text-uppercase ${pedido.estado === 'Realizado' ? 'bg-success' : pedido.estado === 'En proceso' ? 'bg-primary' : 'bg-warning text-dark'}`;
    
    new bootstrap.Modal(document.getElementById('modal-factura')).show();
};

window.imprimirFactura = () => {
    window.print();
};

window.cambiarEstado = async (id, nuevoEstado) => {
    const pedidos = await dbObtenerTodos();
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    
    pedido.estado = nuevoEstado;
    await dbActualizar(pedido);
    await renderTabla();
};

// =============================================
// Helpers
// =============================================
function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const [y, m, d] = fechaStr.split('-');
    return `${d}/${m}/${y}`;
}

// =============================================
// Live Ticket & Recent Orders
// =============================================
document.getElementById('form-cliente')?.addEventListener('input', e => {
    document.getElementById('ticket-cliente').textContent = e.target.value || '---';
});
document.getElementById('form-fecha')?.addEventListener('change', e => {
    document.getElementById('ticket-fecha').textContent = formatFecha(e.target.value) || '--/--/----';
});
document.getElementById('form-categoria')?.addEventListener('change', e => {
    document.getElementById('ticket-categoria').textContent = e.target.value || '---';
});
document.getElementById('form-detalle')?.addEventListener('input', e => {
    document.getElementById('ticket-detalle').textContent = e.target.value || '---';
});
document.getElementById('form-cantidad')?.addEventListener('input', e => {
    document.getElementById('ticket-cantidad').textContent = e.target.value || '-';
});
document.getElementById('form-precio')?.addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    document.getElementById('ticket-precio').textContent = isNaN(val) ? '$0.00' : `$${val.toFixed(2)}`;
});

function resetTicketPreview() {
    const dt = document.getElementById('form-fecha')?.value;
    document.getElementById('ticket-cliente').textContent = '---';
    document.getElementById('ticket-fecha').textContent = dt ? formatFecha(dt) : '--/--/----';
    document.getElementById('ticket-categoria').textContent = '---';
    document.getElementById('ticket-detalle').textContent = '---';
    document.getElementById('ticket-cantidad').textContent = '-';
    document.getElementById('ticket-precio').textContent = '$0.00';
}

async function renderUltimosPedidos() {
    const pedidos = await dbObtenerTodos();
    const lista = document.getElementById('lista-recientes');
    if (!lista) return;

    const recientes = pedidos.sort((a,b) => b.id - a.id).slice(0, 4);
    
    if (recientes.length === 0) {
        lista.innerHTML = `
            <div class="list-group-item text-center text-muted p-4 border-0" style="font-size: 0.9rem;">
                Aún no hay pedidos registrados.
            </div>`;
        return;
    }

    lista.innerHTML = '';
    recientes.forEach(p => {
        lista.innerHTML += `
            <div class="list-group-item px-3 py-2 d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0 fw-bold" style="font-size: 0.9rem;">${p.cliente}</h6>
                    <small class="text-muted" style="font-size: 0.75rem;">${p.categoria || 'Otros'} • ${formatFecha(p.fecha)}</small>
                </div>
                <span class="badge bg-success bg-opacity-75 rounded-pill">$${(p.precio || 0).toFixed(2)}</span>
            </div>
        `;
    });
}

// =============================================
// Render Table
// =============================================
async function renderTabla() {
    const pedidos = await dbObtenerTodos();
    tablaPedidos.innerHTML = '';
    const mobileContainer = document.getElementById('pedidos-cards-mobile');
    if (mobileContainer) mobileContainer.innerHTML = '';

    if (pedidos.length === 0) {
        tablaPedidos.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    No hay pedidos registrados.
                </td>
            </tr>`;
        if (mobileContainer) {
            mobileContainer.innerHTML = `<div class="text-center text-muted py-5"><i class="bi bi-inbox fs-1 d-block mb-2"></i>No hay pedidos registrados.</div>`;
        }
        return;
    }

    pedidos.forEach(pedido => {
        // --- Desktop row ---
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${pedido.id}</td>
            <td class="fw-medium">${pedido.cliente}</td>
            <td>${formatFecha(pedido.fecha)}</td>
            <td><span class="badge bg-secondary bg-opacity-75">${pedido.categoria || '—'}</span></td>
            <td>${pedido.detalle}</td>
            <td>${pedido.cantidad}</td>
            <td class="fw-bold text-success">$${pedido.precio.toFixed(2)}</td>
            <td>
                <select class="form-select border-0 bg-transparent fw-bold ${pedido.estado === 'Realizado' ? 'text-success' : pedido.estado === 'En proceso' ? 'text-primary' : 'text-danger'}" onchange="cambiarEstado(${pedido.id}, this.value)" style="cursor:pointer; padding:0; padding-right:15px; outline:none; box-shadow:none; font-size:0.9rem;">
                    <option value="Pendiente" class="text-dark" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En proceso" class="text-dark" ${pedido.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="Realizado" class="text-dark" ${pedido.estado === 'Realizado' ? 'selected' : ''}>Realizado</option>
                </select>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-info me-1" onclick="verFacturaModal(${pedido.id})" title="Ver Factura">
                    <i class="bi bi-receipt"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editarPedido(${pedido.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedido(${pedido.id})" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>`;
        tablaPedidos.appendChild(tr);

        // --- Mobile card ---
        if (mobileContainer) {
            const estadoColor = pedido.estado === 'Realizado' ? 'bg-success' : pedido.estado === 'En proceso' ? 'bg-primary' : 'bg-warning text-dark';
            const card = document.createElement('div');
            card.className = 'card border-0 shadow-sm';
            card.style.borderRadius = '14px';
            card.innerHTML = `
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="fw-bold" style="font-size:1.05rem;">${pedido.cliente}</span>
                            <span class="text-muted ms-2" style="font-size:0.8rem;">#${pedido.id}</span>
                        </div>
                        <span class="badge ${estadoColor}" style="font-size:0.7rem;">${pedido.estado || 'Pendiente'}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        <span class="badge bg-secondary bg-opacity-50" style="font-size:0.75rem;"><i class="bi bi-tag me-1"></i>${pedido.categoria || '—'}</span>
                        <span class="text-muted" style="font-size:0.8rem;"><i class="bi bi-calendar3 me-1"></i>${formatFecha(pedido.fecha)}</span>
                        <span class="text-muted" style="font-size:0.8rem;"><i class="bi bi-boxes me-1"></i>${pedido.cantidad}</span>
                    </div>
                    <p class="text-muted mb-2" style="font-size:0.85rem; line-height:1.4;">${pedido.detalle}</p>
                    <div class="d-flex justify-content-between align-items-center pt-2" style="border-top: 1px solid rgba(150,150,150,0.1);">
                        <span class="fw-bold text-success" style="font-size:1.15rem;">$${pedido.precio.toFixed(2)}</span>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-info" onclick="verFacturaModal(${pedido.id})" style="border-radius:8px;">
                                <i class="bi bi-receipt"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="editarPedido(${pedido.id})" style="border-radius:8px;">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedido(${pedido.id})" style="border-radius:8px;">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
            mobileContainer.appendChild(card);
        }
    });
}

// =============================================
// Chart color palette
// =============================================
const CHART_COLORS = [
    'rgba(99, 102, 241, 0.8)',   // indigo
    'rgba(244, 63, 94, 0.8)',    // rose
    'rgba(34, 197, 94, 0.8)',    // green
    'rgba(251, 191, 36, 0.8)',   // amber
    'rgba(14, 165, 233, 0.8)',   // sky
    'rgba(168, 85, 247, 0.8)',   // purple
    'rgba(249, 115, 22, 0.8)',   // orange
    'rgba(107, 114, 128, 0.8)'   // gray
];

const CHART_BORDERS = CHART_COLORS.map(c => c.replace('0.8', '1'));

// =============================================
// Render Statistics
// =============================================
async function renderEstadisticas() {
    let pedidosDB = await dbObtenerTodos();

    // Filtros por fecha
    const filtroVal = document.getElementById('filtro-fecha').value;
    const desdeVal = document.getElementById('filtro-desde').value;
    const hastaVal = document.getElementById('filtro-hasta').value;

    let pedidos = pedidosDB;

    if (filtroVal !== 'todas') {
        let inicio = null;
        let fin = new Date();
        fin.setHours(23, 59, 59, 999);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (filtroVal === 'semana') {
            const day = hoy.getDay();
            const diff = hoy.getDate() - day + (day === 0 ? -6 : 1);
            inicio = new Date(hoy.setDate(diff));
            inicio.setHours(0, 0, 0, 0);
        } else if (filtroVal === 'mes') {
            inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        } else if (filtroVal === 'trimestre') {
            inicio = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1);
        } else if (filtroVal === 'semestre') {
            inicio = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 6) * 6, 1);
        } else if (filtroVal === 'año') {
            inicio = new Date(hoy.getFullYear(), 0, 1);
        } else if (filtroVal === 'libre') {
            if (desdeVal) inicio = new Date(desdeVal + 'T00:00:00');
            else inicio = null;
            if (hastaVal) fin = new Date(hastaVal + 'T23:59:59');
            else fin = null;
        }

        pedidos = pedidosDB.filter(p => {
            if (!p.fecha) return false;
            const fp = new Date(p.fecha + 'T12:00:00');
            if (inicio && fp < inicio) return false;
            if (fin && fp > fin) return false;
            return true;
        });
    }

    // ---------- KPI Cards ----------
    const totalPedidos = pedidos.length;
    const totalIngresos = pedidos.reduce((s, p) => s + (p.precio || 0), 0);
    const promedio = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

    document.getElementById('kpi-total').textContent = totalPedidos;
    document.getElementById('kpi-ingresos').textContent = `$${totalIngresos.toFixed(2)}`;
    document.getElementById('kpi-promedio').textContent = `$${promedio.toFixed(2)}`;

    // Find top category
    const catCount = {};
    pedidos.forEach(p => {
        const cat = p.categoria || 'Otros';
        catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('kpi-top').textContent = topCat ? topCat[0] : '—';

    // ---------- 1) Bar Chart — Pedidos por Categoría ----------
    const catLabels = Object.keys(catCount);
    const catData = catLabels.map(k => catCount[k]);

    if (chartCategorias) chartCategorias.destroy();
    chartCategorias = new Chart(document.getElementById('chart-categorias'), {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [{
                label: 'Pedidos',
                data: catData,
                backgroundColor: CHART_COLORS.slice(0, catLabels.length),
                borderColor: CHART_BORDERS.slice(0, catLabels.length),
                borderWidth: 2,
                borderRadius: 6,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'Inter' },
                    bodyFont: { family: 'Inter' },
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { family: 'Inter', size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: { font: { family: 'Inter', size: 12 } },
                    grid: { display: false }
                }
            }
        }
    });

    // ---------- 2) Histogram — Distribución de Precios ----------
    const precios = pedidos.map(p => p.precio || 0).filter(p => p > 0);
    let bins, binLabels, binCounts;

    if (precios.length > 0) {
        const maxP = Math.max(...precios);
        
        let binWidth = 10;
        if (maxP > 100) binWidth = 50;
        if (maxP > 500) binWidth = 100;
        if (maxP > 2000) binWidth = 500;
        if (maxP > 10000) binWidth = 1000;

        const maxBin = Math.ceil(maxP / binWidth) * binWidth;
        const numBins = Math.max(1, maxBin / binWidth);

        bins = [];
        binLabels = [];
        binCounts = new Array(numBins).fill(0);

        for (let i = 0; i < numBins; i++) {
            const lo = i * binWidth;
            const hi = lo + binWidth;
            bins.push([lo, hi]);
            binLabels.push(`$${lo} - $${hi}`);
        }

        precios.forEach(p => {
            let index = Math.floor(p / binWidth);
            // Handle edge case where price is exactly the maxBin
            if (index >= numBins) index = numBins - 1;
            binCounts[index]++;
        });
    } else {
        binLabels = ['Sin datos'];
        binCounts = [0];
    }

    if (chartPrecios) chartPrecios.destroy();
    chartPrecios = new Chart(document.getElementById('chart-precios'), {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Frecuencia',
                data: binCounts,
                backgroundColor: 'rgba(251,191,36,0.6)',
                borderColor: 'rgba(251,191,36,1)',
                borderWidth: 2,
                borderRadius: {topLeft: 4, topRight: 4},
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { family: 'Inter', size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: { font: { family: 'Inter', size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });

    // ---------- 3) Line/Bar — Pedidos por Día de la Semana ----------
    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasConteo = [0, 0, 0, 0, 0, 0, 0];

    pedidos.forEach(p => {
        if (p.fecha) {
            const date = new Date(p.fecha + 'T12:00:00'); // avoid timezone shift
            diasConteo[date.getDay()]++;
        }
    });

    if (chartDias) chartDias.destroy();
    chartDias = new Chart(document.getElementById('chart-dias'), {
        type: 'bar',
        data: {
            labels: diasNombres,
            datasets: [{
                label: 'Pedidos',
                data: diasConteo,
                backgroundColor: 'rgba(14,165,233,0.5)',
                borderColor: 'rgba(14,165,233,1)',
                borderWidth: 2,
                borderRadius: 6,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { family: 'Inter', size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: { font: { family: 'Inter', size: 12 } },
                    grid: { display: false }
                }
            }
        }
    });

    // ---------- 4) Doughnut — Tipos de Pedidos (Por Precio) ----------
    let countEco = 0;
    let countStd = 0;
    let countPrm = 0;

    pedidos.forEach(p => {
        const precio = p.precio || 0;
        if (precio <= 50) countEco++;
        else if (precio <= 200) countStd++;
        else countPrm++;
    });

    if (chartTipos) chartTipos.destroy();
    chartTipos = new Chart(document.getElementById('chart-tipos'), {
        type: 'doughnut',
        data: {
            labels: ['Económico ($0 - $50)', 'Estándar ($51 - $200)', 'Premium (+$200)'],
            datasets: [{
                data: [countEco, countStd, countPrm],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // green
                    'rgba(251, 191, 36, 0.8)',  // yellow
                    'rgba(99, 102, 241, 0.8)'   // indigo
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(99, 102, 241, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 12 }, padding: 20 }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    cornerRadius: 8
                }
            },
            cutout: '65%' // makes it a nice modern doughnut
        }
    });

    // ---------- 5) Timeline — Evolución de Ventas por Día ----------
    const ventasPorDia = {};
    pedidos.forEach(p => {
        if (!p.fecha) return;
        if (!ventasPorDia[p.fecha]) {
            ventasPorDia[p.fecha] = { ingresos: 0, cantidad: 0 };
        }
        ventasPorDia[p.fecha].ingresos += (p.precio || 0);
        ventasPorDia[p.fecha].cantidad += 1;
    });

    const fechasOrdenadas = Object.keys(ventasPorDia).sort((a, b) => new Date(a) - new Date(b));
    
    // Preparar datasets para gráfica combinada
    const tlLabels = fechasOrdenadas.map(f => formatFecha(f));
    const tlIngresos = fechasOrdenadas.map(f => ventasPorDia[f].ingresos);
    const tlCantidad = fechasOrdenadas.map(f => ventasPorDia[f].cantidad);

    if (chartTimeline) chartTimeline.destroy();
    
    // Solo dibujarlo si hay canvas
    const ctxTimeline = document.getElementById('chart-timeline');
    if(ctxTimeline) {
        const pluginValores = {
            id: 'pluginValores',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    if (!meta.hidden) {
                        meta.data.forEach((element, index) => {
                            const val = dataset.data[index] ?? 0;
                            if (val === 0) return; // Omitir 0s para que no se llene de números el fondo
                            
                            const isBar = meta.type === 'bar';
                            // Formato simple si es cantidad, con $ y 2 dec si es moneda y tiene decimales
                            let dataStr = val.toString();
                            if (!isBar) {
                                dataStr = val % 1 !== 0 ? '$' + val.toFixed(2) : '$' + val;
                            }
                            
                            ctx.fillStyle = isBar ? '#4b5563' : '#e11d48'; // gris ocuro para bars, rosa fuerte para puntos
                            ctx.font = 'bold 12px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            
                            const yOffset = isBar ? 4 : 12; // Qué tanto subirlo sobre el punto/barra
                            ctx.fillText(dataStr, element.x, element.y - yOffset);
                        });
                    }
                });
            }
        };

        chartTimeline = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: tlLabels,
                datasets: [
                    {
                        label: 'Ingresos Totales ($)',
                        type: 'line',
                        data: tlIngresos,
                        showLine: true, // Conecta los puntos con una línea
                        borderWidth: 3,
                        tension: 0.3, // Suaviza la línea
                        borderColor: 'rgba(244, 63, 94, 1)', 
                        backgroundColor: 'rgba(244, 63, 94, 0.1)', // Fondo tenue 
                        fill: true,
                        pointRadius: 6,
                        pointHoverRadius: 9,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Cant. Pedidos',
                        type: 'bar',
                        data: tlCantidad,
                        backgroundColor: 'rgba(107, 114, 128, 0.15)', // gris tenue
                        borderColor: 'rgba(107, 114, 128, 0.4)',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            plugins: [pluginValores],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } },
                    tooltip: { backgroundColor: '#1e293b', cornerRadius: 8 }
                },
                scales: {
                    x: { ticks: { font: { family: 'Inter', size: 11 } }, grid: { display: false } },
                    y: {
                        type: 'linear', display: true, position: 'left',
                        title: { display: true, text: 'Monto ($)', font: { family: 'Inter' } },
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        title: { display: true, text: 'Pedidos (\u0023)', font: { family: 'Inter' } },
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
}

// =============================================
// Init
// =============================================
renderCategoriasOptions();
renderTabla();
if(typeof resetTicketPreview === 'function') resetTicketPreview();
if(typeof renderUltimosPedidos === 'function') renderUltimosPedidos();
