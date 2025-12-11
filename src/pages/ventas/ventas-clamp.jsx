import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiContext } from '../../context/api_context';
import Swal from 'sweetalert2';

// Componentes Modulares (Asumo que están optimizados)
import ProductSearchModal from './components/ProductSearchModal'; 
import ZocaloConfiguracion from './components/ZocaloConfiguracion';
import PanelPunto from './components/PanelPunto';
import PanelComprobante from './components/PanelComprobante';
import PanelPago from './components/PanelPago';
import PanelCliente from './components/PanelCliente';
import { Link } from 'react-router-dom';

// --- CONFIGURACIÓN CENTRAL DE PANELES ---
const CONFIG_PANELS = {
    punto: PanelPunto,
    comprobante: PanelComprobante,
    pago: PanelPago,
    cliente: PanelCliente,
};

export default function VentasClampCompact() {
    // --- CONTEXTO & ESTADOS ---
    const { 
        createTiketContext, getPointsByCompany, getProductCodBarra, getTiketsPdf,
        userData, companyData, 
        get_caja_company, abrirCaja, ingreso_egreso,
    } = useContext(apiContext);

    const [empresaId, setEmpresaId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [puntoSeleccionado, setPuntoSeleccionado] = useState('');
    const [cajasAbiertas, setCajasAbiertas] = useState([]);
    const [codBarra, setCodBarra] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorConfig, setErrorConfig] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const inputRef = useRef(null);
    const [activePanel, setActivePanel] = useState(null); 

    const [invoiceDetails, setInvoiceDetails] = useState(() => {
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return {
            tipoComprobante: "Ticket", metodoPago: "Efectivo", montoRecibido: 0.00,
            nombreCliente: "", dniCuitCliente: "", condicionIVACliente: "Consumidor Final",
            observaciones: "", invoiceDateTime: formattedDateTime,
        };
    });

    // --- CÁLCULOS DERIVADOS ---
    const { totalPagar, cambio } = useMemo(() => {
        const calculatedSubtotal = items.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
        const calculatedTotalPagar = calculatedSubtotal;
        
        const montoRecibido = parseFloat(invoiceDetails.montoRecibido) || 0;
        const calculatedCambio = invoiceDetails.metodoPago === 'Efectivo' 
            ? Math.max(0, montoRecibido - calculatedTotalPagar) 
            : 0;
            
        return { totalPagar: calculatedTotalPagar, cambio: calculatedCambio };
    }, [items, invoiceDetails.montoRecibido, invoiceDetails.metodoPago]);
    
    const getCajaActiva = useCallback(() => 
        cajasAbiertas.find(c => c.puntoDeVenta?._id === puntoSeleccionado || c.puntoDeVenta === puntoSeleccionado)?.nombreCaja || 'Caja Cerrada'
    , [cajasAbiertas, puntoSeleccionado]);
    
    const PuntoVentaActual = useMemo(() => 
        puntosDeVenta.find(p => p._id === puntoSeleccionado)?.nombre || 'Selecciona...'
    , [puntosDeVenta, puntoSeleccionado]);

    // --- MANEJADORES GLOBALES DE ESTADO ---
    const handleInvoiceDetailsChange = useCallback(e => {
        const { name, value } = e.target;
        setInvoiceDetails(prev => {
            const newValue = (name === "montoRecibido") ? parseFloat(value) || 0 : value;
            return { ...prev, [name]: newValue };
        });
    }, []);

    const addItem = useCallback((product) => {
        if (!product || !product._id || product.precioLista === undefined) {
             Swal.fire('Info', 'Producto no válido para el punto de venta seleccionado.', 'info');
             return;
        }

        setItems(currentItems => {
            const existingItemIndex = currentItems.findIndex(item => item._id === product._id);
            
            if (existingItemIndex > -1) {
                const updatedItems = [...currentItems];
                updatedItems[existingItemIndex].cantidad += 1;
                return updatedItems;
            } 
            
            return [...currentItems, {
                _id: product._id, idProduct: product._id, producto: product.producto,
                precio: parseFloat(product.precioLista), cantidad: 1, categoria: product.categoria || 'N/A',
                codigoBarra: product.codigoBarra || 'N/A', marca: product.marca || 'N/A'
            }];
        });
        
        inputRef.current?.focus();
    }, []);

    const handleProductSelectFromModal = useCallback((itemData) => {
        addItem(itemData);
        setIsModalOpen(false); 
        Swal.fire({ icon: 'success', title: 'Agregado', text: `${itemData.producto} agregado.`, timer: 1000, showConfirmButton: false });
    }, [addItem]);

    const handleSearchAndAddItem = useCallback(async () => {
        if (loading || !puntoSeleccionado || !codBarra.trim()) return;
        
        setLoading(true);
        try {
            const productResponse = await getProductCodBarra(empresaId, puntoSeleccionado, codBarra.trim());
            const product = productResponse?.data || productResponse;
            
            if (product && product._id) {
                addItem(product);
                setCodBarra(''); 
            } else {
                Swal.fire('Info', 'Producto no encontrado.', 'info');
            }
        } catch (error) {
            Swal.fire('Error', `Fallo al buscar producto: ${error.message || 'Error desconocido'}`, 'error');
        } finally {
            setLoading(false);
            setCodBarra(''); 
            inputRef.current?.focus();
        }
    }, [loading, puntoSeleccionado, codBarra, empresaId, getProductCodBarra, addItem]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchAndAddItem();
        }
    }, [handleSearchAndAddItem]);
    
    const handleQuantityChange = useCallback((index, value) => {
        let newQuantity = parseInt(value, 10);
        if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
        setItems(prev => prev.map((item, i) => i === index ? { ...item, cantidad: newQuantity } : item));
    }, []);
    
    const handleRemoveItem = useCallback((index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);
    
    // --- EFECTO DE INICIALIZACIÓN ---
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            setErrorConfig(false);
            try {
                if (!companyData?._id || !userData?._id) {
                    throw new Error('No se pudo encontrar la información de la empresa o del usuario.');
                }
                
                setEmpresaId(companyData._id);
                setUserId(userData._id);
                
                const [pointsResponse, cajasResponse] = await Promise.all([
                    getPointsByCompany(companyData._id, 1, 500),
                    get_caja_company(companyData._id, 1, { estado: 'Abierta', limit: 500 })
                ]);

                const allPoints = pointsResponse?.puntosDeVenta || [];
                setPuntosDeVenta(allPoints);
                setCajasAbiertas(cajasResponse?.cajas || []);
                
                if (allPoints.length > 0) {
                    setPuntoSeleccionado(allPoints[0]._id);
                    setActivePanel('punto'); 
                }

            } catch (error) {
                console.error("Error en initData:", error);
                setErrorConfig(true);
                Swal.fire({ icon: 'error', title: 'Error de Configuración', text: error.message });
            } finally {
                setLoading(false);
                // Pequeño retardo para asegurar que el DOM está listo para el foco
                setTimeout(() => inputRef.current?.focus(), 100); 
            }
        };
        
        if (companyData?._id && userData?._id) {
            initData();
        } else {
            setLoading(false);
        }
    }, [companyData, userData, getPointsByCompany, get_caja_company]);

    // --- MANEJADOR DE ENVÍO FINAL (Lógica de negocio pesada) ---
    const handleSubmit = async e => {
        e.preventDefault();
        
        if (!empresaId || !userId || !items.length || !puntoSeleccionado) {
             Swal.fire('Atención', "Configuración incompleta o no hay productos.", 'warning'); return; 
        }
        if (invoiceDetails.metodoPago === 'Efectivo' && invoiceDetails.montoRecibido < totalPagar) {
            Swal.fire('Error', `El monto recibido es menor al total a pagar.`, 'error');
            return;
        }
        
        setLoading(true);
        let idCajaParaLaVenta = null;

        try {
            // 1. Lógica de CAJA: Buscar o Abrir
            let cajaActiva = cajasAbiertas.find(
                caja => (caja.puntoDeVenta?._id === puntoSeleccionado || caja.puntoDeVenta === puntoSeleccionado) && caja.estado === 'Abierta'
            );

            if (cajaActiva) {
                idCajaParaLaVenta = cajaActiva._id;
            } else {
                const { value: formValues, isConfirmed } = await Swal.fire({
                    title: 'Abrir Nueva Caja',
                    html: `<p class="text-left text-sm mb-4">No hay una caja abierta. Completa los datos.</p>` +
                          `<input id="swal-input-nombre" class="swal2-input" placeholder="Nombre de la Caja (Ej: Caja Mañana)">` +
                          `<input id="swal-input-monto" class="swal2-input" type="number" placeholder="Monto Inicial" value="0.00" step="0.01">`,
                    focusConfirm: false, showCancelButton: true, confirmButtonText: 'Abrir Caja y Continuar',
                    cancelButtonText: 'Cancelar Venta', confirmButtonColor: '#28a745',
                    preConfirm: () => {
                        const nombreCaja = document.getElementById('swal-input-nombre').value;
                        const montoInicial = document.getElementById('swal-input-monto').value;
                        if (!nombreCaja.trim() || montoInicial === '' || parseFloat(montoInicial) < 0) {
                            Swal.showValidationMessage('Datos incompletos/inválidos.');
                            return false;
                        }
                        return { nombreCaja: nombreCaja.trim(), montoInicial: montoInicial };
                    }
                });

                if (!isConfirmed) { setLoading(false); return; }

                const payload = {
                    empresa: empresaId, puntoDeVenta: puntoSeleccionado, nombreCaja: formValues.nombreCaja,
                    vendedorAsignado: userId, montoInicial: parseFloat(formValues.montoInicial) || 0,
                    fechaApertura: new Date().toISOString(),
                };
                
                const nuevaCajaAbierta = await abrirCaja(payload);
                if (!nuevaCajaAbierta?._id) { throw new Error("La API no devolvió una caja válida al intentar abrirla."); }
                
                idCajaParaLaVenta = nuevaCajaAbierta._id;
                setCajasAbiertas(prevCajas => [...prevCajas, nuevaCajaAbierta]);
                await Swal.fire('¡Caja Abierta!', `La caja "${formValues.nombreCaja}" se ha abierto correctamente.`, 'success');
            }
            
            // 2. Construcción y Envío de Data (Ticket)
            const puntoVentaInfo = puntosDeVenta.find(p => p._id === puntoSeleccionado);
            const salesId = `VK${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const invoiceNumber = `000${puntoVentaInfo?.numero || '0'}`;
            
            const ticketData = {
                ventaId: salesId, fechaHora: new Date(invoiceDetails.invoiceDateTime).toLocaleString('es-AR', { hour12: false }), 
                puntoDeVenta: puntoVentaInfo?.nombre, tipoComprobante: invoiceDetails.tipoComprobante, numeroComprobante: invoiceNumber,
                items: items.map(item => ({
                    idProduct: item.idProduct, codigo: item.codigoBarra, descripcion: item.producto,
                    cantidad: item.cantidad, precioUnitario: item.precio, totalItem: (item.cantidad * item.precio)
                })),
                totales: { subtotal: totalPagar, totalPagar: totalPagar },
                pago: { metodo: invoiceDetails.metodoPago, montoRecibido: invoiceDetails.montoRecibido, cambio: cambio },
                cliente: (invoiceDetails.nombreCliente || invoiceDetails.dniCuitCliente) ? { nombre: invoiceDetails.nombreCliente, dniCuit: invoiceDetails.dniCuitCliente, condicionIVA: invoiceDetails.condicionIVACliente } : undefined,
                observaciones: invoiceDetails.observaciones, cajero: userData.username, sucursal: puntoVentaInfo?.nombre,
                idUsuario: userId, idEmpresa: empresaId, idCaja: idCajaParaLaVenta
            };

            const response = await createTiketContext(ticketData);

            // 3. Registro de Ingreso en Caja
            try {
                const payloadIngresoTotal = {
                    tipo: 'ingreso', monto: totalPagar, descripcion: `Venta Completa Ticket #${response.ventaId}`,
                    metodoPago: invoiceDetails.metodoPago, idTicket: response.ventaId
                };
                await ingreso_egreso(payloadIngresoTotal, idCajaParaLaVenta);
            } catch (ingresoError) {
                console.error("Error al registrar el ingreso total en la caja:", ingresoError);
            }

            Swal.fire('¡Venta Registrada!', `Ticket creado con éxito. ID: ${response.ventaId}`, 'success');

            // 4. Generación de PDF (asumiendo que es asíncrono y no bloquea)
            if (response.ventaId && userId) { await getTiketsPdf(userId, response.ventaId); }

            // 5. Limpieza de Estados
            setItems([]); setCodBarra('');
            setInvoiceDetails(prev => ({ 
                ...prev, montoRecibido: 0.00, nombreCliente: "", dniCuitCliente: "", condicionIVACliente: "Consumidor Final", observaciones: "" 
            })); 
            inputRef.current?.focus();

        } catch (error) {
            Swal.fire('Error en el Proceso', `Falló al procesar la venta: ${error.message || 'Error desconocido'}.`, 'error');
        } finally {
            setLoading(false);
        }
    };


    // --- RENDERIZADO DEL PANEL DINÁMICO ---
    const renderPanelContent = () => {
        if (!activePanel) {
             return (
                 <div className="p-5 text-center text-gray-500 border border-t-0 rounded-b-lg bg-gray-50 text-sm">
                     Haz clic en una tarjeta de configuración superior para desplegar sus opciones.
                 </div>
             );
        }
        
        const ActiveComponent = CONFIG_PANELS[activePanel];

        if (ActiveComponent) {
            // Mapeo de props por panel
            const panelProps = {
                puntoSeleccionado, setPuntoSeleccionado, puntosDeVenta, getCajaActiva, // PanelPunto
                invoiceDetails, handleInvoiceDetailsChange, // Compartidos: Comprobante, Pago, Cliente
            };
            
            return (
                <div className="p-4 bg-gray-50 border border-t-0 rounded-b-lg shadow-inner">
                    <ActiveComponent {...panelProps} />
                </div>
            );
        }
        return null;
    };


    // --- RENDERIZADO PRINCIPAL ---
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
            <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-3xl font-bold mb-4 text-center text-[var(--principal)]">Punto de Venta Modular</h2>
                
                {/* 1. ZÓCALOS/TARJETAS DE CONFIGURACIÓN */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <ZocaloConfiguracion
                        title="Sucursal/Caja" subtitle={`${PuntoVentaActual} / ${getCajaActiva()}`}
                        panelName="punto" activePanel={activePanel} setActivePanel={setActivePanel}
                    />
                    <ZocaloConfiguracion
                        title="Comprobante" subtitle={invoiceDetails.tipoComprobante}
                        panelName="comprobante" activePanel={activePanel} setActivePanel={setActivePanel}
                    />
                    <ZocaloConfiguracion
                        title="Pago" subtitle={invoiceDetails.metodoPago}
                        panelName="pago" activePanel={activePanel} setActivePanel={setActivePanel}
                    />
                    <ZocaloConfiguracion
                        title="Cliente" subtitle={invoiceDetails.nombreCliente || 'Consumidor Final'}
                        panelName="cliente" activePanel={activePanel} setActivePanel={setActivePanel}
                    />
                    <Link to ="/get-puntoVenta" className='p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 text-center border bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'>Puntos de venta</Link>
                    <Link to ="/tiket/get" className='p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 text-center border bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'>Historial de tickets</Link>
                    <Link to ="/ver-facturas" className='p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 text-center border bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'>Historial de facturas</Link>
                </div>

                {/* 2. PANEL DESPLEGADO DINÁMICO */}
                <div className="mb-4 border rounded-lg shadow-md">
                    {renderPanelContent()}
                </div>
                
                <hr className="my-5 border-t border-gray-300" />
                
                <form onSubmit={handleSubmit}>
                    
                    {/* 3. Sección Agregar Producto */}
                    <div className="mb-5">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Agregar Producto</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input ref={inputRef} type="text" value={codBarra} onChange={(e) => setCodBarra(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escanear o ingresar código de barras" disabled={!puntoSeleccionado} className="flex-grow shadow border rounded w-full py-2 px-3 focus:ring-[var(--principal)] focus:border-[var(--principal)]" autoFocus />
                            <div className="flex gap-3">
                                <button type="button" onClick={handleSearchAndAddItem} disabled={!puntoSeleccionado || !codBarra.trim() || loading} className="w-full sm:w-auto bg-[var(--principal)] hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded whitespace-nowrap disabled:bg-gray-400">
                                    {loading && codBarra.trim() ? 'Buscando...' : 'Agregar'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(true)} disabled={!puntoSeleccionado || loading} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap disabled:bg-gray-400">
                                    Buscar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. Sección Productos en Factura */}
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-3 text-[var(--principal)]">Productos en Factura ({items.length})</h3>
                        {items.length === 0 ? (
                            <p className="text-center text-gray-600 py-5 bg-gray-50 rounded-lg">Aún no hay productos.</p>
                        ) : (
                            <div className="max-h-64 overflow-y-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/2">Producto</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-1/6">Cant</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/6">Precio U.</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/6">Total</th>
                                            <th className="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {items.map((item, index) => (
                                            <tr key={item._id + '-' + index} className="hover:bg-yellow-50/50">
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate">{item.producto}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                    <input type="number" min="1" value={item.cantidad} onChange={(e) => handleQuantityChange(index, e.target.value)} className="w-12 p-1 border rounded-md text-center text-sm" />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-600">${item.precio.toFixed(2)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-bold text-[var(--principal)]">${(item.precio * item.cantidad).toFixed(2)}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-[var(--rojo-cerrar)] text-lg transition-colors leading-none">
                                                        &times;
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    {/* 5. Sección Total y Cambio */}
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-lg font-semibold text-gray-700">TOTAL A PAGAR:</p>
                            <p className="text-3xl font-extrabold text-[var(--principal-shadow)]">${totalPagar.toFixed(2)}</p>
                        </div>
                        {invoiceDetails.metodoPago === "Efectivo" && (
                            <div className="flex justify-between items-center border-t pt-2 mt-2">
                                <p className="text-base font-semibold text-gray-700">CAMBIO / DEVOLUCIÓN:</p>
                                <p className={`text-2xl font-extrabold ${cambio > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                    ${cambio.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 6. Botones de Acción */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => { 
                                Swal.fire({ title: '¿Limpiar Factura?', text: "Se borrarán todos los productos.", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, limpiar' })
                                    .then((result) => { if (result.isConfirmed) { setItems([]); setCodBarra(''); inputRef.current?.focus(); } });
                            }}
                            disabled={items.length === 0 || loading}
                            className={`py-3 px-5 rounded-lg text-white text-md font-bold transition duration-300 ${items.length === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-[var(--rojo-cerrar)]'}`}
                        >
                            Limpiar
                        </button>
                        <button type="submit" disabled={!puntoSeleccionado || items.length === 0 || loading} className={`py-3 px-5 rounded-lg text-white text-lg font-bold transition duration-300 ${(!puntoSeleccionado || items.length === 0 || loading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                            {loading ? 'Procesando...' : 'Generar Venta'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Renderizado Condicional del Modal de Búsqueda */}
            {isModalOpen && puntoSeleccionado && empresaId && (
                <ProductSearchModal
                    onProductSelect={handleProductSelectFromModal}
                    onClose={() => setIsModalOpen(false)}
                    puntoVentaId={puntoSeleccionado} 
                    empresaId={empresaId} 
                />
            )}
        </>
    );
}