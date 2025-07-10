import React, { useContext, useState, useEffect, useMemo, useRef } from "react";
import { apiContext } from "../../context/api_context"; // Asegúrate de que esta ruta sea correcta
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function CreateTikets() {
  const { createTiketContext, getPointsByCompany, getProductCodBarra, getTiketsPdf , userData , companyData } = useContext(apiContext);

  // --- Estados del Componente ---
  const [empresaId, setEmpresaId] = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [userId, setUserId] = useState(null);

  // Estados para Puntos de Venta con paginación
  const [puntosDeVenta, setPuntosDeVenta] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState('');
  const [puntosDeVentaLoading, setPuntosDeVentaLoading] = useState(true);

  const [codBarra, setCodBarra] = useState('');
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorConfig, setErrorConfig] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Invoice form details
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

  // --- Efecto: Inicialización de datos al cargar el componente ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      setErrorConfig(false);
      try {
   

        if (!companyData?._id) {
          setErrorConfig(true);
          Swal.fire({ icon: 'error', title: 'Error de Configuración', text: 'ID de empresa no encontrado en localStorage. Asegúrate de iniciar sesión.' });
          setLoading(false);
          return;
        }
        setEmpresaId(companyData._id);
        setEmpresaNombre(companyData.nombreEmpresa || companyData.nombre || 'Nombre de Empresa Desconocido');

        if (!userData?._id) {
          setErrorConfig(true);
          Swal.fire({ icon: 'error', title: 'Error de Configuración', text: 'ID de usuario no encontrado en localStorage. Asegúrate de iniciar sesión.' });
          setLoading(false);
          return;
        }
        setUserId(userData._id);

        // --- MANEJO DE PAGINACIÓN PARA PUNTOS DE VENTA ---
        setPuntosDeVentaLoading(true);
        let allPoints = [];
        let currentPage = 1;
        let totalPages = 1;

        // Bucle para obtener todas las páginas de puntos de venta
        do {
          const response = await getPointsByCompany(companyData._id, currentPage, 100); // Asumimos un límite de 10 por página
          if (response && response.puntosDeVenta) {
            allPoints = [...allPoints, ...response.puntosDeVenta];
            totalPages = response.totalPages;
            currentPage++;
          } else {
            // Si la respuesta no tiene el formato esperado, rompemos el bucle
            break;
          }
        } while (currentPage <= totalPages);

        if (allPoints.length > 0) {
          setPuntosDeVenta(allPoints);
          setPuntoSeleccionado(allPoints[0]._id); // Selecciona el primer punto de venta por defecto
          inputRef.current?.focus();
        } else {
          Swal.fire({ icon: 'info', title: 'Sin Puntos de Venta', text: 'No se encontraron puntos de venta asociados a tu empresa. Configura al menos uno.' });
          setPuntosDeVenta([]);
          setPuntoSeleccionado('');
        }
        setPuntosDeVentaLoading(false);
        // --- FIN MANEJO PAGINACIÓN ---

        const now = new Date();
        setInvoiceDateTime(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

      } catch (error) {
        console.error('Error al iniciar la configuración:', error);
        setErrorConfig(true);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo al cargar los datos iniciales de configuración. Intenta nuevamente.' });
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [getPointsByCompany]); // La dependencia se mantiene igual

  // --- El resto del código permanece igual ---

  // --- Calculated Totals ---
  const { subtotal, totalPagar, cambio } = useMemo(() => {
    const calculatedSubtotal = items.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
    const calculatedTotalPagar = calculatedSubtotal;
    const calculatedCambio = invoiceDetails.metodoPago === 'Efectivo' && invoiceDetails.montoRecibido > calculatedTotalPagar
      ? invoiceDetails.montoRecibido - calculatedTotalPagar
      : 0;
    return { subtotal: calculatedSubtotal, totalPagar: calculatedTotalPagar, cambio: calculatedCambio };
  }, [items, invoiceDetails.montoRecibido, invoiceDetails.metodoPago]);

  // --- Handlers ---

  // Handles changes for invoice details (excluding puntoDeVenta which is separate)
  const handleInvoiceDetailsChange = e => {
    const { name, value } = e.target;
    setInvoiceDetails(prevDetails => ({
      ...prevDetails,
      [name]: name === "montoRecibido" ? parseFloat(value) || 0 : value
    }));
  };

  // Handler to search and add product by barcode
  const handleSearchAndAddItem = async () => {
    if (loading || errorConfig || !empresaId || !puntoSeleccionado || !codBarra.trim()) {
      Swal.fire('Atención', 'Asegura que la empresa, el punto de venta y el código de barras estén completos.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const productResponse = await getProductCodBarra(empresaId, puntoSeleccionado, codBarra.trim());

      const product = productResponse?.data || productResponse;

      if (product && product._id && product.producto && product.precioLista !== undefined) {
        const existingItemIndex = items.findIndex(item => item._id === product._id);

        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].cantidad += 1;
          setItems(updatedItems);
        } else {
          setItems(prevItems => [...prevItems, {
            _id: product._id,
            idProduct: product._id,
            producto: product.producto,
            precio: parseFloat(product.precioLista),
            cantidad: 1,
            categoria: product.categoria || 'N/A',
            codigoBarra: product.codigoBarra || 'N/A',
            marca: product.marca || 'N/A'
          }]);
        }
      } else {
        Swal.fire('Info', 'Producto no encontrado o datos incompletos. Revisa la consola para más detalles.', 'info');
        console.warn('Invalid product received or missing properties (_id, producto, precioLista expected):', product);
      }
    } catch (error) {
      console.error('Error searching or adding product:', error);
      Swal.fire('Error', `Fallo al buscar producto: ${error.message || 'Error desconocido'}`, 'error');
    } finally {
      setLoading(false);
      setCodBarra('');
      inputRef.current?.focus();
    }
  };

  // Handle quantity change for an item in the invoice list
  const handleQuantityChange = (index, value) => {
    let newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
      Swal.fire('Atención', 'La cantidad mínima es 1.', 'warning');
    }

    setItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, cantidad: newQuantity } : item
      )
    );
  };

  // Handle removing an item from the invoice list
  const handleRemoveItem = (index) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡Estás a punto de quitar este producto de la factura!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        Swal.fire('Eliminado!', 'El producto ha sido quitado de la factura.', 'success');
      }
    });
  };

  // Handle Enter key press on barcode input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchAndAddItem();
    }
  };

  // Handle ticket submission
  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');

    if (!empresaId) { setErrorMessage("Error: ID empresa no disponible."); return; }
    if (!userId) { setErrorMessage("Error: ID usuario no disponible."); return; }
    if (!items.length) { Swal.fire('Atención', "Error: Agrega al menos un ítem a la factura.", 'warning'); return; }
    if (!puntoSeleccionado) { setErrorMessage("Error: Selecciona un punto de venta."); return; }
    if (invoiceDetails.metodoPago === 'Efectivo' && invoiceDetails.montoRecibido < totalPagar) {
      Swal.fire('Error', `El monto recibido ($${invoiceDetails.montoRecibido.toFixed(2)}) es menor al total a pagar ($${totalPagar.toFixed(2)}).`, 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar Venta?',
      text: `Estás a punto de generar una factura por $${totalPagar.toFixed(2)}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, generar venta',
      cancelButtonText: 'No, cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const salesDate = new Date(invoiceDateTime);
          const formattedSalesDate = salesDate.toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

          const salesId = `VK${salesDate.getFullYear().toString().slice(-2)}${(salesDate.getMonth() + 1).toString().padStart(2, '0')}${salesDate.getDate().toString().padStart(2, '0')}-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(-8) : Math.floor(Math.random() * 100000000).toString().padStart(8, '0'))}`;
          const invoiceNumber = `0001-${Math.floor(Math.random() * 9000) + 1000}`;

          const ticketData = {
            ventaId: salesId,
            fechaHora: formattedSalesDate,
            puntoDeVenta: puntosDeVenta.find(p => p._id === puntoSeleccionado)?.nombre || puntoSeleccionado,
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
            totales: {
              subtotal: subtotal,
              descuento: 0.00,
              totalPagar: totalPagar
            },
            pago: {
              metodo: invoiceDetails.metodoPago,
              montoRecibido: invoiceDetails.montoRecibido,
              cambio: cambio
            },
            cliente: (invoiceDetails.nombreCliente || invoiceDetails.dniCuitCliente) ? {
              nombre: invoiceDetails.nombreCliente,
              dniCuit: invoiceDetails.dniCuitCliente,
              condicionIVA: invoiceDetails.condicionIVACliente
            } : undefined,
            observaciones: invoiceDetails.observaciones,
            cajero: userData.username,
            sucursal: puntosDeVenta.find(p => p._id === puntoSeleccionado)?.nombre || puntoSeleccionado,
            idUsuario: userId,
            idEmpresa: empresaId
          };

          const response = await createTiketContext(ticketData);
          Swal.fire('Venta Registrada!', `Ticket creado. ID: ${response.databaseRecordId}, Venta: ${response.ventaId}`, 'success');

          // --- Generar y mostrar PDF del ticket ---
          if (response.ventaId && userId) {
            try {
              const pdfBlob = await getTiketsPdf(userId, response.ventaId);

            } catch (pdfError) {
              console.error('Error al generar el PDF del ticket (frontend):', pdfError);
              Swal.fire('Error PDF', `Fallo al generar el PDF: ${pdfError.message || 'Error desconocido'}`, 'error');
            }
          } else {
            console.warn('No se puede generar el PDF: falta ventaId o userId de la respuesta/estado.');
          }
          // --- FIN GENERACION PDF ---

          // Reiniciar el formulario después de la venta exitosa
          setItems([]);
          setCodBarra('');
          setInvoiceDetails({ ...invoiceDetails, montoRecibido: 0.00, nombreCliente: "", dniCuitCliente: "", condicionIVACliente: "Consumidor Final", observaciones: "" });
          const newNow = new Date();
          setInvoiceDateTime(`${newNow.getFullYear()}-${(newNow.getMonth() + 1).toString().padStart(2, '0')}-${newNow.getDate().toString().padStart(2, '0')}T${newNow.getHours().toString().padStart(2, '0')}:${newNow.getMinutes().toString().padStart(2, '0')}`);
          inputRef.current?.focus();
        } catch (error) {
          console.error('Error al crear ticket (backend):', error);
          Swal.fire('Error', `Fallo al crear ticket: ${error.message || 'Error desconocido'}.`, 'error');
          setErrorMessage(`Error al crear ticket: ${error.message || 'Error desconocido'}.`);
        }
      }
    });
  };

  // --- Renderizado Condicional ---
  if (loading && (!empresaId || puntosDeVenta.length === 0) && !errorConfig) {
    return <div className="text-center text-lg text-gray-600 mt-10">Cargando configuración inicial...</div>;
  }
  if (errorConfig) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md mx-auto my-10 text-center">
        <h3 className="font-bold text-xl mb-2">Error de Configuración Esencial</h3>
        <p className="mb-4">No se pudo cargar la información de la empresa o usuario. Verifica que el `localStorage` contenga `dataEmpresa` y `userData` con IDs válidos y que tu API esté funcionando.</p>
        <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200">Recargar Página</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Generar Facturas/Tickets</h2>
      <hr className="my-6 border-t border-gray-300" />

      {/* Información de la Empresa y Usuario */}
      <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-700 rounded">
        <p className="text-sm"><strong>Empresa:</strong> {empresaNombre || 'Cargando...'}</p>
        <p className="text-sm"><strong>ID Empresa:</strong> {empresaId || 'Cargando...'}</p>
        <p className="text-sm"><strong>ID Usuario:</strong> {userId || 'Cargando...'}</p>
      </div>

      {/* Mensajes de feedback */}
      {message && (<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert"><strong className="font-bold">¡Éxito! </strong><span>{message}</span></div>)}
      {errorMessage && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert"><strong className="font-bold">¡Error! </strong><span>{errorMessage}</span></div>)}

      <form onSubmit={handleSubmit}>
        {/* Selector de Punto de Venta */}
        <div className="mb-5">
          <label htmlFor="puntoVentaSelect" className="block text-gray-700 text-sm font-bold mb-2">Punto de Venta:</label>
          <select
            id="puntoVentaSelect"
            value={puntoSeleccionado}
            onChange={(e) => setPuntoSeleccionado(e.target.value)}
            disabled={puntosDeVentaLoading || puntosDeVenta.length === 0}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {puntosDeVentaLoading ? (
              <option value="">Cargando puntos de venta...</option>
            ) : puntosDeVenta.length > 0 ? (
              <>
                <option value="">-- Selecciona un punto --</option>
                {puntosDeVenta.map((p) => (
                  <option key={p._id} value={p._id}>{p.nombre || `Punto ID: ${p._id}`}</option>
                ))}
              </>
            ) : (
              <option value="">No hay puntos de venta disponibles</option>
            )}
          </select>
          {puntosDeVenta.length === 0 && !puntosDeVentaLoading && <p className="text-sm text-yellow-600 mt-1">No hay puntos de venta disponibles. Configura uno en tu panel.</p>}
        </div>

        {/* ... El resto del JSX permanece igual ... */}


        {/* Input de Código de Barras y Botón */}
        <div className="mb-6">
          <label htmlFor="codBarraInput" className="block text-gray-700 text-sm font-bold mb-2">Código de Barras:</label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              id="codBarraInput"
              value={codBarra}
              onChange={(e) => setCodBarra(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escanea o ingresa el código"
              disabled={loading || !puntoSeleccionado}
              className="flex-grow shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSearchAndAddItem}
              disabled={loading || !puntoSeleccionado || !codBarra.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 whitespace-nowrap"
            >
              {loading && codBarra.trim() ? 'Buscando...' : 'Agregar Producto'}
            </button>
          </div>
        </div>

        {/* Listado de Productos en la Factura */}
        <div className="mt-6 border-t pt-5">
          <h3 className="text-2xl font-semibold mb-4 text-blue-700">Productos en Factura ({items.length})</h3>
          {items.length === 0 ? (
            <p className="text-center text-gray-600 py-5 bg-gray-50 rounded-lg">Aún no hay productos en la factura. ¡Empieza a escanear!</p>
          ) : (
            <ul className="space-y-4 mb-6">
              {items.map((item, index) => (
                <li key={item._id + '-' + index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg shadow-sm bg-gray-50">
                  <div className="flex-grow mb-2 sm:mb-0">
                    <p className="text-lg font-medium text-gray-800">
                      <strong>{item.producto}</strong>
                    </p>
                    <p className="text-gray-600 text-sm">
                      Categoría: {item.categoria} | Código: {item.codigoBarra} | Marca: {item.marca}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-20 p-2 border rounded-md text-center text-gray-700"
                    />
                    <span className="font-bold text-lg text-blue-700">${(item.precio * item.cantidad).toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveItem(index)} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm transition duration-200">
                      X
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="text-right p-4 bg-gray-100 rounded-b-lg mt-4">
            <p className="text-xl font-bold text-blue-800">Total: ${totalPagar.toFixed(2)}</p>
          </div>
        </div>

        <hr className="my-6 border-t border-gray-300" />

        {/* Detalles Generales y Pago */}
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Detalles de Venta y Pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="tipoComprobante" className="block text-gray-700 text-sm font-bold mb-2">Tipo Comprobante:</label>
            <input type="text" id="tipoComprobante" name="tipoComprobante" value={invoiceDetails.tipoComprobante} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="invoiceDateTime" className="block text-gray-700 text-sm font-bold mb-2">Fecha y Hora:</label>
            <input type="datetime-local" id="invoiceDateTime" name="invoiceDateTime" value={invoiceDateTime} onChange={e => setInvoiceDateTime(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div>
            <label htmlFor="metodoPago" className="block text-gray-700 text-sm font-bold mb-2">Método Pago:</label>
            <select id="metodoPago" name="metodoPago" value={invoiceDetails.metodoPago} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3 text-gray-700">
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta Débito">Débito</option>
              <option value="Tarjeta Crédito">Crédito</option>
              <option value="Mercado Pago">Mercado Pago</option>
            </select>
          </div>
          {invoiceDetails.metodoPago === "Efectivo" && (
            <div>
              <label htmlFor="montoRecibido" className="block text-gray-700 text-sm font-bold mb-2">Monto Recibido:</label>
              <input type="number" id="montoRecibido" name="montoRecibido" value={invoiceDetails.montoRecibido} onChange={handleInvoiceDetailsChange} min="0" step="0.01" className="shadow border rounded w-full py-2 px-3 text-gray-700" />
            </div>
          )}
        </div>
        <p className="text-lg text-gray-700 mb-6">Cambio: <strong className="text-blue-700">${cambio.toFixed(2)}</strong></p>
        <hr className="my-6 border-t border-gray-300" />

        {/* Cliente (Opcional) */}
        <h3 className="text-2xl font-semibold mb-4 text-blue-700">Cliente (Opcional):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="nombreCliente" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
            <input type="text" id="nombreCliente" name="nombreCliente" value={invoiceDetails.nombreCliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3 text-gray-700" />
          </div>
          <div>
            <label htmlFor="dniCuitCliente" className="block text-gray-700 text-sm font-bold mb-2">DNI/CUIT:</label>
            <input type="text" id="dniCuitCliente" name="dniCuitCliente" value={invoiceDetails.dniCuitCliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3 text-gray-700" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="condicionIVACliente" className="block text-gray-700 text-sm font-bold mb-2">Condición IVA:</label>
            <select id="condicionIVACliente" name="condicionIVACliente" value={invoiceDetails.condicionIVACliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3 text-gray-700">
              <option value="Consumidor Final">Final</option>
              <option value="Responsable Inscripto">Inscripto</option>
              <option value="Monotributista">Monotributista</option>
              <option value="Exento">Exento</option>
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <label htmlFor="observaciones" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label>
          <textarea id="observaciones" name="observaciones" value={invoiceDetails.observaciones} onChange={handleInvoiceDetailsChange} rows="3" className="shadow border rounded w-full py-2 px-3 text-gray-700 resize-y" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={!empresaId || !userId || items.length === 0 || !puntoSeleccionado || loading}
            className={`py-3 px-6 rounded-lg text-white text-lg font-bold transition duration-300 ease-in-out ${(!empresaId || !userId || items.length === 0 || !puntoSeleccionado || loading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            Generar Factura / Ticket
          </button>
          <button
            type="button"
            onClick={() => {
              Swal.fire({
                title: '¿Limpiar Factura?',
                text: "Estás a punto de borrar todos los productos agregados. Esta acción no se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, limpiar',
                cancelButtonText: 'No, cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  setItems([]);
                  Swal.fire('Factura Vaciada!', 'Todos los productos han sido removidos.', 'success');
                  setCodBarra('');
                  inputRef.current?.focus();
                }
              });
            }}
            disabled={items.length === 0 || loading}
            className={`py-3 px-6 rounded-lg text-white text-lg font-bold transition duration-300 ease-in-out ${items.length === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
          >
            Limpiar Factura
          </button>
        </div>
      </form>
    </div>
  );
}