import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { apiContext } from "../../context/api_context"; // Asegúrate de que esta ruta sea correcta
import Swal from 'sweetalert2'; // Importar SweetAlert2

//--- SUB-COMPONENTE: MODAL DE BÚSQUEDA DE PRODUCTOS ---
const ProductSearchModal = ({ onProductSelect, onClose, puntoVentaId }) => {
    const { getProductsEmpresa, getCategoryEmpresa, getMarcaEmpresa, userData } = useContext(apiContext);
    const [productsData, setProductsData] = useState({ products: [], pagination: {} });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedMarca, setSelectedMarca] = useState("");
    const [activeFilters, setActiveFilters] = useState({ product: "", category: "", marca: "" });
    const [categories, setCategories] = useState([]);
    const [marcas, setMarcas] = useState([]);

    useEffect(() => {
        const loadOptions = async () => {
            if (userData?.empresa && puntoVentaId) {
                try {
                    const [cats, marcs] = await Promise.all([
                        getCategoryEmpresa(userData.empresa, puntoVentaId),
                        getMarcaEmpresa(userData.empresa, puntoVentaId)
                    ]);
                    setCategories(cats || []);
                    setMarcas(marcs || []);
                } catch (e) { console.error("Error cargando opciones de filtro del modal:", e); }
            }
        };
        loadOptions();
    }, [userData?.empresa, puntoVentaId, getCategoryEmpresa, getMarcaEmpresa]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!userData?.empresa || !puntoVentaId) return;
            setIsLoading(true);
            try {
                const response = await getProductsEmpresa(
                    userData.empresa,
                    {
                        page: currentPage,
                        limit: 10,
                        category: activeFilters.category,
                        product: activeFilters.product,
                        marca: activeFilters.marca,
                        puntoVenta: puntoVentaId
                    }
                );
                setProductsData(response || { products: [], pagination: {} });
            } catch (error) {
                console.error("Error buscando productos en el modal:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [userData?.empresa, currentPage, activeFilters, getProductsEmpresa, puntoVentaId]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveFilters({ product: searchTerm, category: selectedCategory, marca: selectedMarca });
    };

    const handleSelectProduct = (product) => {
        onProductSelect(product);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-3xl max-h-[90vh] p-6 bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Buscar Producto</h3>
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-end">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nombre producto..." className="sm:col-span-3 border rounded-md p-2 shadow-sm" />
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded-md p-2 bg-white shadow-sm"><option value="">Todas las Categorías</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select value={selectedMarca} onChange={e => setSelectedMarca(e.target.value)} className="border rounded-md p-2 bg-white shadow-sm"><option value="">Todas las Marcas</option>{marcas.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <button type="submit" className="bg-[var(--principal)] text-white rounded-md p-2 font-semibold hover:bg-[var(--principal)] shadow-sm">Buscar</button>
                </form>
                <div className="overflow-y-auto flex-grow space-y-2 border-t pt-4">
                    {isLoading ? <p className="text-center text-gray-500">Cargando...</p> :
                        productsData.products.length === 0 ? <p className="text-center text-gray-500">No se encontraron productos.</p> :
                        productsData.products.map(p => (
                            <div key={p._id} onClick={() => handleSelectProduct(p)} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">
                                <div>
                                    <p className="font-bold text-gray-900">{p.producto}</p>
                                    <p className="text-sm text-gray-500">{p.marca}</p>
                                </div>
                                <p className="font-bold text-lg text-[var(--principal)]">${p.precioLista.toFixed(2)}</p>
                            </div>
                        ))}
                </div>
                <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={!productsData.pagination.hasPrevPage || isLoading} className="py-2 px-4 border rounded-md disabled:opacity-50 font-semibold">Anterior</button>
                    <span>Página {productsData.pagination.currentPage || '-'} de {productsData.pagination.totalPages || '-'}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={!productsData.pagination.hasNextPage || isLoading} className="py-2 px-4 border rounded-md disabled:opacity-50 font-semibold">Siguiente</button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (INTEGRADO) ---
export default function CreateTikets() {
    // --- CONTEXTO ---
    const {
        createTiketContext, getPointsByCompany, getProductCodBarra, getTiketsPdf,
        userData, companyData, getProductsEmpresa, getCategoryEmpresa, getMarcaEmpresa,
        get_caja_company,
        abrirCaja,
        ingreso_egreso
    } = useContext(apiContext);

    // --- ESTADOS ---
    const [empresaId, setEmpresaId] = useState(null);
    const [empresaNombre, setEmpresaNombre] = useState('');
    const [userId, setUserId] = useState(null);
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [puntoSeleccionado, setPuntoSeleccionado] = useState('');
    const [cajasAbiertas, setCajasAbiertas] = useState([]);
    const [codBarra, setCodBarra] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorConfig, setErrorConfig] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [invoiceDetails, setInvoiceDetails] = useState({
        tipoComprobante: "Ticket",
        metodoPago: "Efectivo",
        montoRecibido: 0.00,
        nombreCliente: "",
        dniCuitCliente: "",
        condicionIVACliente: "Consumidor Final",
        observaciones: ""
    });
    const [invoiceDateTime, setInvoiceDateTime] = useState('');
    const inputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- EFECTO DE INICIALIZACIÓN Y CARGA DE DATOS ---
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            setErrorConfig(false);
            try {
                if (!companyData?._id || !userData?._id) {
                    throw new Error('No se pudo encontrar la información de la empresa o del usuario.');
                }
                
                setEmpresaId(companyData._id);
                setEmpresaNombre(companyData.nombreEmpresa || companyData.nombre || 'N/A');
                setUserId(userData._id);
                
                const [pointsResponse, cajasResponse] = await Promise.all([
                    getPointsByCompany(companyData._id, 1, 500),
                    get_caja_company(companyData._id, 1, { estado: 'abierta', limit: 500 })
                ]);

                const allPoints = pointsResponse?.puntosDeVenta || [];
                setPuntosDeVenta(allPoints);
                setCajasAbiertas(cajasResponse?.cajas || []);

            } catch (error) {
                setErrorConfig(true);
                Swal.fire({ icon: 'error', title: 'Error de Configuración', text: error.message });
            } finally {
                setLoading(false);
            }
        };
        
        if (companyData?._id && userData?._id) {
            initData();
        } else {
            setLoading(false);
        }

        const now = new Date();
        setInvoiceDateTime(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

    }, [companyData, userData, getPointsByCompany, get_caja_company]);

    // --- LÓGICA DE ITEMS Y HANDLERS ---
    const addItem = useCallback((product) => {
        if (!product || !product._id || product.precioLista === undefined) {
            Swal.fire('Info', 'Producto no válido en este punto de venta.', 'info');
            return;
        }
        setItems(currentItems => {
            const existingItemIndex = currentItems.findIndex(item => item._id === product._id);
            if (existingItemIndex > -1) {
                const updatedItems = [...currentItems];
                updatedItems[existingItemIndex].cantidad += 1;
                return updatedItems;
            } else {
                return [...currentItems, {
                    _id: product._id, idProduct: product._id, producto: product.producto,
                    precio: parseFloat(product.precioLista), cantidad: 1, categoria: product.categoria || 'N/A',
                    codigoBarra: product.codigoBarra || 'N/A', marca: product.marca || 'N/A'
                }];
            }
        });
    }, []);

    const handleInvoiceDetailsChange = e => {
        const { name, value } = e.target;
        setInvoiceDetails(prev => ({ ...prev, [name]: name === "montoRecibido" ? parseFloat(value) || 0 : value }));
    };

    const handleSearchAndAddItem = async () => {
        if (loading || !puntoSeleccionado || !codBarra.trim()) return;
        setLoading(true);
        try {
            const productResponse = await getProductCodBarra(empresaId, puntoSeleccionado, codBarra.trim());
            addItem(productResponse?.data || productResponse);
        } catch (error) {
            Swal.fire('Error', `Fallo al buscar producto: ${error.message || 'Error desconocido'}`, 'error');
        } finally {
            setLoading(false);
            setCodBarra('');
            inputRef.current?.focus();
        }
    };
    
    const handleProductSelectFromModal = (product) => {
        addItem(product);
        inputRef.current?.focus();
    };

    const handleQuantityChange = (index, value) => {
        let newQuantity = parseInt(value, 10);
        if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
        setItems(prev => prev.map((item, i) => i === index ? { ...item, cantidad: newQuantity } : item));
    };

    const handleRemoveItem = (index) => {
        Swal.fire({
            title: '¿Estás seguro?', text: "Quitarás este producto de la factura.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar'
        }).then((result) => { if (result.isConfirmed) setItems(items.filter((_, i) => i !== index)); });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchAndAddItem();
        }
    };
    
    const { subtotal, totalPagar, cambio } = useMemo(() => {
        const calculatedSubtotal = items.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
        const calculatedTotalPagar = calculatedSubtotal;
        const calculatedCambio = invoiceDetails.metodoPago === 'Efectivo' && invoiceDetails.montoRecibido > calculatedTotalPagar
            ? invoiceDetails.montoRecibido - calculatedTotalPagar : 0;
        return { subtotal: calculatedSubtotal, totalPagar: calculatedTotalPagar, cambio: calculatedCambio };
    }, [items, invoiceDetails.montoRecibido, invoiceDetails.metodoPago]);


    // --- MANEJADOR DE ENVÍO FINAL ---
    const handleSubmit = async e => {
        e.preventDefault();
        setMessage(''); setErrorMessage('');

        if (!empresaId || !userId) { setErrorMessage("Error: ID de empresa/usuario no disponible."); return; }
        if (!items.length) { Swal.fire('Atención', "Agrega al menos un ítem a la factura.", 'warning'); return; }
        if (!puntoSeleccionado) { Swal.fire('Atención', "Selecciona un punto de venta.", 'warning'); return; }
        if (invoiceDetails.metodoPago === 'Efectivo' && invoiceDetails.montoRecibido < totalPagar) {
            Swal.fire('Error', `El monto recibido es menor al total a pagar.`, 'error');
            return;
        }
        
        setLoading(true);
        let idCajaParaLaVenta;

        try {
            const cajaActiva = cajasAbiertas.find(
                caja => (caja.puntoDeVenta?._id === puntoSeleccionado || caja.puntoDeVenta === puntoSeleccionado) && caja.estado === 'Abierta'
            );

            if (cajaActiva) {
                idCajaParaLaVenta = cajaActiva._id;
            } else {
                const { value: formValues } = await Swal.fire({
                    title: 'Abrir Nueva Caja',
                    html:
                        `<p class="text-left text-sm mb-4">No hay una caja abierta para este punto de venta. Completa los datos para continuar.</p>` +
                        `<input id="swal-input-nombre" class="swal2-input" placeholder="Nombre de la Caja (Ej: Caja Mañana)">` +
                        `<input id="swal-input-monto" class="swal2-input" type="number" placeholder="Monto Inicial" value="0.00" step="0.01">`,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Abrir Caja y Continuar',
                    cancelButtonText: 'Cancelar Venta',
                    confirmButtonColor: '#28a745',
                    preConfirm: () => {
                        const nombreCaja = document.getElementById('swal-input-nombre').value;
                        const montoInicial = document.getElementById('swal-input-monto').value;
                        if (!nombreCaja.trim()) {
                            Swal.showValidationMessage('Por favor, ingresa un nombre para la caja');
                            return false;
                        }
                        if (montoInicial === '' || parseFloat(montoInicial) < 0) {
                            Swal.showValidationMessage('Necesitas ingresar un monto inicial válido');
                            return false;
                        }
                        return { nombreCaja: nombreCaja.trim(), montoInicial: montoInicial };
                    }
                });
                
                if (!formValues) {
                    setLoading(false);
                    return; 
                }
                
                const payload = {
                    empresa: empresaId,
                    puntoDeVenta: puntoSeleccionado,
                    nombreCaja: formValues.nombreCaja,
                    vendedorAsignado: userId,
                    montoInicial: parseFloat(formValues.montoInicial) || 0,
                    fechaApertura: new Date().toISOString(),
                };
                
                const nuevaCajaAbierta = await abrirCaja(payload);
                if (!nuevaCajaAbierta?._id) {
                    throw new Error("La API no devolvió una caja válida al intentar abrirla.");
                }
                idCajaParaLaVenta = nuevaCajaAbierta._id;
                
                setCajasAbiertas(prevCajas => [...prevCajas, nuevaCajaAbierta]);
                
                await Swal.fire('¡Caja Abierta!', `La caja "${formValues.nombreCaja}" se ha abierto correctamente.`, 'success');
            }

            const salesDate = new Date(invoiceDateTime);
            const formattedSalesDate = salesDate.toLocaleString('es-AR', { hour12: false });
            const salesId = `VK${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const puntoVentaInfo = puntosDeVenta.find(p => p._id === puntoSeleccionado);
            const invoiceNumber = `000${puntoVentaInfo?.numero || '0'}`;

            const ticketData = {
                ventaId: salesId,
                fechaHora: formattedSalesDate,
                puntoDeVenta: puntoVentaInfo?.nombre,
                tipoComprobante: invoiceDetails.tipoComprobante,
                numeroComprobante: invoiceNumber,
                items: items.map(item => ({
                    idProduct: item.idProduct,
                    codigo: item.codigoBarra,
                    descripcion: item.producto,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio,
                    totalItem: (item.cantidad * item.precio)
                })),
                totales: { subtotal, totalPagar },
                pago: { metodo: invoiceDetails.metodoPago, montoRecibido: invoiceDetails.montoRecibido, cambio },
                cliente: (invoiceDetails.nombreCliente || invoiceDetails.dniCuitCliente) ? { nombre: invoiceDetails.nombreCliente, dniCuit: invoiceDetails.dniCuitCliente, condicionIVA: invoiceDetails.condicionIVACliente } : undefined,
                observaciones: invoiceDetails.observaciones,
                cajero: userData.username,
                sucursal: puntoVentaInfo?.nombre,
                idUsuario: userId,
                idEmpresa: empresaId,
                idCaja: idCajaParaLaVenta
            };

            const response = await createTiketContext(ticketData);

            try {
                for (const item of items) {
                    const payloadIngreso = {
                        tipo: 'ingreso',
                        monto: item.precio * item.cantidad,
                        descripcion: `Venta: ${item.cantidad} x ${item.producto}`,
                        metodoPago: invoiceDetails.metodoPago,
                        idTicket: response.ventaId
                    };
                    await ingreso_egreso(payloadIngreso, idCajaParaLaVenta);
                }
            } catch (ingresoError) {
                console.error("No se pudo registrar uno o más ingresos de la venta en la caja:", ingresoError);
                Swal.fire('Advertencia', 'La venta se registró, pero hubo un error al actualizar el balance detallado de la caja.', 'warning');
            }

            Swal.fire('¡Venta Registrada!', `Ticket creado con éxito. ID: ${response.ventaId}`, 'success');

            if (response.ventaId && userId) {
                try {
                    await getTiketsPdf(userId, response.ventaId);
                } catch (pdfError) {
                    Swal.fire('Error PDF', `No se pudo generar el PDF: ${pdfError.message || 'Error desconocido'}`, 'error');
                }
            }

            setItems([]);
            setCodBarra('');
            setInvoiceDetails({ ...invoiceDetails, montoRecibido: 0.00, nombreCliente: "", dniCuitCliente: "", condicionIVACliente: "Consumidor Final", observaciones: "" });
            inputRef.current?.focus();

        } catch (error) {
            Swal.fire('Error en el Proceso', `Falló al procesar la venta: ${error.message || 'Error desconocido'}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERIZADO ---
    if (loading) {
        return <div className="text-center text-lg text-gray-600 mt-10">Cargando configuración inicial...</div>;
    }
    if (errorConfig) {
        return (
            <div className="bg-red-100 border border-[var(--rojo-cerrar)] text-[var(--rojo-cerrar-hover)] px-4 py-3 rounded max-w-md mx-auto my-10 text-center">
                <h3 className="font-bold text-xl mb-2">Error de Configuración</h3>
                <p>No se pudo cargar la información de la empresa o usuario.</p>
                <button onClick={() => window.location.reload()} className="bg-[var(--rojo-cerrar)] hover:bg-[var(--rojo-cerrar-hover)] text-white font-bold py-2 px-4 rounded mt-4">Recargar</button>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-3xl font-bold mb-6 text-center text-[var(--principal)]">Generar Facturas/Tickets</h2>
                <hr className="my-6 border-t border-gray-300" />
                
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-700 rounded">
                    <p className="text-sm"><strong>Empresa:</strong> {empresaNombre || 'Cargando...'}</p>
                    <p className="text-sm"><strong>Usuario:</strong> {userData?.username || 'Cargando...'}</p>
                </div>

                {message && (<div className="bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded mb-4"><strong>¡Éxito! </strong><span>{message}</span></div>)}
                {errorMessage && (<div className="bg-red-100 border-[var(--rojo-cerrar)] text-[var(--rojo-cerrar-hover)] px-4 py-3 rounded mb-4"><strong>¡Error! </strong><span>{errorMessage}</span></div>)}

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="puntoVentaSelect" className="block text-gray-700 text-sm font-bold mb-2">Punto de Venta:</label>
                        <select 
                            id="puntoVentaSelect" 
                            value={puntoSeleccionado} 
                            onChange={(e) => setPuntoSeleccionado(e.target.value)} 
                            disabled={puntosDeVenta.length === 0} 
                            className="shadow border rounded w-full py-2 px-3 text-gray-700"
                        >
                            {puntosDeVenta.length > 0 ? (
                                <>
                                    <option value="">-- Selecciona un punto --</option>
                                    {puntosDeVenta.map((p) => <option key={p._id} value={p._id}>{p.nombre || `Punto ID: ${p._id}`}</option>)}
                                </>
                            ) : (
                                <option value="">No hay puntos de venta disponibles</option>
                            )}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Agregar Producto</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input ref={inputRef} type="text" value={codBarra} onChange={(e) => setCodBarra(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escanear o ingresar código de barras" disabled={!puntoSeleccionado} className="flex-grow shadow border rounded w-full py-2 px-3" autoFocus />
                            <div className="flex gap-3">
                                <button type="button" onClick={handleSearchAndAddItem} disabled={!puntoSeleccionado || !codBarra.trim()} className="w-full sm:w-auto bg-[var(--principal)] hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded whitespace-nowrap disabled:bg-gray-400">Agregar</button>
                                <button type="button" onClick={() => setIsModalOpen(true)} disabled={!puntoSeleccionado} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap disabled:bg-gray-400">Buscar</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-5">
                        <h3 className="text-2xl font-semibold mb-4 text-[var(--principal)]">Productos en Factura ({items.length})</h3>
                        {items.length === 0 ? (
                            <p className="text-center text-gray-600 py-5 bg-gray-50 rounded-lg">Aún no hay productos en la factura.</p>
                        ) : (
                            <ul className="space-y-4 mb-6">
                                {items.map((item, index) => (
                                    <li key={item._id + '-' + index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg shadow-sm bg-gray-50">
                                        <div className="flex-grow mb-2 sm:mb-0">
                                            <p className="text-lg font-medium text-gray-800"><strong>{item.producto}</strong></p>
                                            <p className="text-gray-600 text-sm">Categoría: {item.categoria} | Código: {item.codigoBarra} | Marca: {item.marca}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="number" min="1" value={item.cantidad} onChange={(e) => handleQuantityChange(index, e.target.value)} className="w-20 p-2 border rounded-md text-center" />
                                            <span className="font-bold text-lg text-[var(--principal)]">${(item.precio * item.cantidad).toFixed(2)}</span>
                                            <button type="button" onClick={() => handleRemoveItem(index)} className="bg-red-500 hover:bg-[var(--rojo-cerrar)] text-white font-bold rounded-full w-7 h-7 flex items-center justify-center">X</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="text-right p-4 bg-gray-100 rounded-b-lg mt-4">
                            <p className="text-xl font-bold text-[var(--principal-shadow)]">Total: ${totalPagar.toFixed(2)}</p>
                        </div>
                    </div>

                    <hr className="my-6 border-t border-gray-300" />
                    
                    <h3 className="text-2xl font-semibold mb-4 text-[var(--principal)]">Detalles de Venta y Pago</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="tipoComprobante" className="block text-gray-700 text-sm font-bold mb-2">Tipo Comprobante:</label>
                            <input type="text" id="tipoComprobante" name="tipoComprobante" value={invoiceDetails.tipoComprobante} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="invoiceDateTime" className="block text-gray-700 text-sm font-bold mb-2">Fecha y Hora:</label>
                            <input type="datetime-local" id="invoiceDateTime" value={invoiceDateTime} onChange={e => setInvoiceDateTime(e.target.value)} className="shadow border rounded w-full py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="metodoPago" className="block text-gray-700 text-sm font-bold mb-2">Método Pago:</label>
                            <select id="metodoPago" name="metodoPago" value={invoiceDetails.metodoPago} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta Débito">Débito</option>
                                <option value="Tarjeta Crédito">Crédito</option>
                                <option value="Mercado Pago">Mercado Pago</option>
                            </select>
                        </div>
                        {invoiceDetails.metodoPago === "Efectivo" && (
                            <div>
                                <label htmlFor="montoRecibido" className="block text-gray-700 text-sm font-bold mb-2">Monto Recibido:</label>
                                <input type="number" id="montoRecibido" name="montoRecibido" value={invoiceDetails.montoRecibido} onChange={handleInvoiceDetailsChange} min="0" step="0.01" className="shadow border rounded w-full py-2 px-3" />
                            </div>
                        )}
                    </div>
                    <p className="text-lg text-gray-700 mb-6">Cambio: <strong className="text-[var(--principal)]">${cambio.toFixed(2)}</strong></p>

                    <hr className="my-6 border-t border-gray-300" />
                    
                    <h3 className="text-2xl font-semibold mb-4 text-[var(--principal)]">Cliente (Opcional):</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="nombreCliente" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
                            <input type="text" id="nombreCliente" name="nombreCliente" value={invoiceDetails.nombreCliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="dniCuitCliente" className="block text-gray-700 text-sm font-bold mb-2">DNI/CUIT:</label>
                            <input type="text" id="dniCuitCliente" name="dniCuitCliente" value={invoiceDetails.dniCuitCliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="condicionIVACliente" className="block text-gray-700 text-sm font-bold mb-2">Condición IVA:</label>
                            <select id="condicionIVACliente" name="condicionIVACliente" value={invoiceDetails.condicionIVACliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3">
                                <option value="Consumidor Final">Final</option>
                                <option value="Responsable Inscripto">Inscripto</option>
                                <option value="Monotributista">Monotributista</option>
                                <option value="Exento">Exento</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="observaciones" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label>
                        <textarea id="observaciones" name="observaciones" value={invoiceDetails.observaciones} onChange={handleInvoiceDetailsChange} rows="3" className="shadow border rounded w-full py-2 px-3 resize-y" />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="submit" disabled={!puntoSeleccionado || items.length === 0 || loading} className={`py-3 px-6 rounded-lg text-white text-lg font-bold transition duration-300 ${(!puntoSeleccionado || items.length === 0 || loading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                            {loading ? 'Procesando...' : 'Generar Factura / Ticket'}
                        </button>
                        <button type="button" onClick={() => {
                                Swal.fire({ title: '¿Limpiar Factura?', text: "Se borrarán todos los productos.", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, limpiar' })
                                    .then((result) => { if (result.isConfirmed) { setItems([]); setCodBarra(''); inputRef.current?.focus(); } });
                                }}
                                disabled={items.length === 0 || loading}
                                className={`py-3 px-6 rounded-lg text-white text-lg font-bold transition duration-300 ${items.length === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-[var(--rojo-cerrar)]'}`}
                        >
                            Limpiar Factura
                        </button>
                    </div>
                </form>
            </div>

            {isModalOpen && (
                <ProductSearchModal
                    onProductSelect={handleProductSelectFromModal}
                    onClose={() => setIsModalOpen(false)}
                    puntoVentaId={puntoSeleccionado} 
                />
            )}
        </>
    );
}