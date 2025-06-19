import React, { useContext, useState, useEffect, useMemo } from "react";
import { apiContext } from "../../context/api_context"; // Asegúrate de que esta ruta sea correcta

export function CreateTikets() {
    const { createTiketContext, getPointsByCompany } = useContext(apiContext);

    const [idEmpresa, setIdEmpresa] = useState(null);
    const [idUsuario, setIdUsuario] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({
        codigo: "",
        descripcion: "",
        cantidad: 1,
        precioUnitario: 0.00
    });
    const [formInput, setFormInput] = useState({
        puntoDeVenta: "",
        tipoComprobante: "Ticket",
        metodoPago: "Efectivo",
        montoRecibido: 0.00,
        nombreCliente: "",
        dniCuitCliente: "",
        condicionIVACliente: "Consumidor Final",
        observaciones: ""
    });
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [fechaHoraTicket, setFechaHoraTicket] = useState(''); // Nuevo estado para fecha y hora

    useEffect(() => {
        const loadLocalStorageDataAndFetchPoints = async () => {
            let hasError = false;

            const empresaDataString = localStorage.getItem("dataEmpresa");
            if (empresaDataString) {
                try {
                    const empresa = JSON.parse(empresaDataString);
                    if (empresa && empresa._id) {
                        setIdEmpresa(empresa._id);
                    } else {
                        console.error("No se encontró el _id de la empresa o dataEmpresa es inválido en localStorage.");
                        setError("No se pudo obtener el ID de la empresa desde el almacenamiento local.");
                        hasError = true;
                    }
                } catch (e) {
                    console.error("Error al parsear dataEmpresa de localStorage:", e);
                    setError("Error al procesar los datos de la empresa desde el almacenamiento local.");
                    hasError = true;
                }
            } else {
                console.warn("No se encontró 'dataEmpresa' en localStorage.");
                setError("Para crear un ticket, se necesita la información de la empresa.");
                hasError = true;
            }

            const userDataString = localStorage.getItem("userData");
            if (userDataString) {
                try {
                    const user = JSON.parse(userDataString);
                    if (user && user._id) {
                        setIdUsuario(user._id);
                    } else {
                        console.error("No se encontró el _id del usuario o userData es inválido en localStorage.");
                        setError(prevError => prevError ? `${prevError} | ID de usuario no disponible.` : "ID de usuario no disponible.");
                        hasError = true;
                    }
                } catch (e) {
                    console.error("Error al parsear userData de localStorage:", e);
                    setError(prevError => prevError ? `${prevError} | Error al procesar los datos del usuario.` : "Error al procesar los datos del usuario.");
                    hasError = true;
                }
            } else {
                console.warn("No se encontró 'userData' en localStorage.");
                setError(prevError => prevError ? `${prevError} | Para crear un ticket, se necesita la información del usuario.` : "Para crear un ticket, se necesita la información del usuario.");
                hasError = true;
            }

            // Inicializar la fecha y hora actual
            const now = new Date();
            // Formatear para input type="datetime-local" (YYYY-MM-DDTHH:mm)
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            setFechaHoraTicket(`${year}-${month}-${day}T${hours}:${minutes}`);

            // Si no hay errores y tenemos el idEmpresa, intentamos cargar los puntos de venta
            if (!hasError && idEmpresa) {
                try {
                    console.log("Intentando obtener puntos de venta para empresa:", idEmpresa);
                    const points = await getPointsByCompany(idEmpresa);
                    if (points && points.length > 0) {
                        setPuntosDeVenta(points);
                        setFormInput(prev => ({
                            ...prev,
                            puntoDeVenta: points[0].nombre
                        }));
                    } else {
                        setPuntosDeVenta([]);
                        setFormInput(prev => ({ ...prev, puntoDeVenta: "" }));
                        setError(prevError => prevError ? `${prevError} | No se encontraron puntos de venta para la empresa.` : "No se encontraron puntos de venta para la empresa.");
                    }
                } catch (e) {
                    console.error("Error al obtener puntos de venta:", e);
                    setError(prevError => prevError ? `${prevError} | Error al cargar los puntos de venta.` : "Error al cargar los puntos de venta.");
                    setPuntosDeVenta([]);
                    setFormInput(prev => ({ ...prev, puntoDeVenta: "" }));
                }
            }

            if (hasError) {
                setMessage('');
            }
        };

        // Call the async function
        // This useEffect runs once on component mount, and then again if idEmpresa or getPointsByCompany changes.
        // It's structured to fetch points only if idEmpresa is available.
        loadLocalStorageDataAndFetchPoints();
    }, [idEmpresa, getPointsByCompany]); // Agregamos getPointsByCompany a las dependencias

    const { subtotal, totalPagar, cambio } = useMemo(() => {
        const currentSubtotal = items.reduce((sum, item) => sum + item.totalItem, 0);
        const currentTotalPagar = currentSubtotal;
        const currentCambio = formInput.metodoPago === 'Efectivo' && formInput.montoRecibido > currentTotalPagar
            ? formInput.montoRecibido - currentTotalPagar
            : 0;

        return {
            subtotal: currentSubtotal,
            totalPagar: currentTotalPagar,
            cambio: currentCambio
        };
    }, [items, formInput.montoRecibido, formInput.metodoPago]);

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormInput(prev => ({
            ...prev,
            [name]: name === "montoRecibido" ? parseFloat(value) || 0 : value
        }));
    };

    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: (name === "cantidad" || name === "precioUnitario") ? parseFloat(value) || 0 : value
        }));
    };

    const handleAddItem = () => {
        if (!newItem.descripcion.trim() || newItem.cantidad <= 0) {
            alert("Por favor, complete la Descripción del ítem y asegúrese que la Cantidad sea mayor que cero.");
            return;
        }

        const totalItem = newItem.cantidad * newItem.precioUnitario;
        setItems(prev => [...prev, { ...newItem, totalItem }]);
        setNewItem({
            codigo: "",
            descripcion: "",
            cantidad: 1,
            precioUnitario: 0.00
        });
    };

    const handleRemoveItem = (indexToRemove) => {
        setItems(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        if (!idEmpresa) {
            setError("Error: ID de empresa no disponible. Intente recargar o asegúrese de haber iniciado sesión.");
            return;
        }
        if (!idUsuario) {
            setError("Error: ID de usuario no disponible. Por favor, inicie sesión nuevamente.");
            return;
        }
        if (items.length === 0) {
            setError("Error: Debe agregar al menos un ítem al ticket para poder crearlo.");
            return;
        }
        if (!formInput.puntoDeVenta) {
            setError("Error: Por favor, seleccione un punto de venta.");
            return;
        }
        if (formInput.metodoPago === 'Efectivo' && formInput.montoRecibido < totalPagar) {
            setError(`Error: El monto recibido ($${formInput.montoRecibido.toFixed(2)}) es menor que el total a pagar ($${totalPagar.toFixed(2)}).`);
            return;
        }

        // Usamos la fecha y hora del estado, que puede ser la actual o la modificada por el usuario
        const selectedDateTime = new Date(fechaHoraTicket).toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Generar un ID de venta simulado y un número de comprobante
        const simulatedVentaId = `VK${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${(crypto.randomUUID ? crypto.randomUUID().slice(-8) : Math.floor(Math.random() * 100000000).toString().padStart(8, '0'))}`;
        const simulatedNumeroComprobante = `0001-${Math.floor(Math.random() * 9000) + 1000}`; // Ejemplo simple

        const ticketDataForBackend = {
            ventaId: simulatedVentaId,
            fechaHora: selectedDateTime, // Usamos la fecha y hora seleccionada
            puntoDeVenta: formInput.puntoDeVenta,
            tipoComprobante: formInput.tipoComprobante,
            numeroComprobante: simulatedNumeroComprobante,
            items: items,
            totales: {
                subtotal: subtotal,
                descuento: 0.00,
                totalPagar: totalPagar
            },
            pago: {
                metodo: formInput.metodoPago,
                montoRecibido: formInput.montoRecibido,
                cambio: cambio
            },
            cliente: (formInput.nombreCliente || formInput.dniCuitCliente) ? {
                nombre: formInput.nombreCliente,
                dniCuit: formInput.dniCuitCliente,
                condicionIVA: formInput.condicionIVACliente
            } : undefined,
            observaciones: formInput.observaciones,
            cajero: "Cajero Test",
            sucursal: "Sucursal Principal",
            idUsuario: idUsuario,
            idEmpresa: idEmpresa
        };

        console.log("Datos del ticket a enviar al backend (estructura simplificada):", ticketDataForBackend);

        try {
            const response = await createTiketContext(ticketDataForBackend);

            setMessage(`Ticket creado exitosamente. ID de DB: ${response.databaseRecordId}, Venta ID: ${response.ventaId}`);
            console.log("Respuesta del ticket creado:", response);

            // Limpiar el formulario y los ítems
            setItems([]);
            setNewItem({ codigo: "", descripcion: "", cantidad: 1, precioUnitario: 0.00 });
            setFormInput(prev => ({
                ...prev,
                montoRecibido: 0.00,
                nombreCliente: "",
                dniCuitCliente: "",
                condicionIVACliente: "Consumidor Final",
                observaciones: ""
            }));
            // Reinicializar la fecha y hora a la actual después de un envío exitoso
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            setFechaHoraTicket(`${year}-${month}-${day}T${hours}:${minutes}`);
        } catch (err) {
            console.error("Error al crear el ticket:", err);
            setError(`Error al crear el ticket: ${err.message || 'Error desconocido'}. Consulte la consola para más detalles.`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-ui">Crear Nuevo Ticket</h2>

            <div className="mb-4 text-center text-lg">
                <p className="text-gray-700">ID de Empresa Activa: <strong className="text-blue-ui-dark">{idEmpresa || 'Cargando...'}</strong></p>
                <p className="text-gray-700">ID de Usuario Activo: <strong className="text-blue-ui-dark">{idUsuario || 'Cargando...'}</strong></p>
            </div>

            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">¡Éxito! </strong>
                    <span className="block sm:inline">{message}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">¡Error! </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <hr className="my-6 border-t border-gray-300" />
                <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Detalles del Ticket</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="puntoDeVenta" className="block text-gray-700 text-sm font-bold mb-2">Punto de Venta:</label>
                        <select
                            id="puntoDeVenta"
                            name="puntoDeVenta"
                            value={formInput.puntoDeVenta}
                            onChange={handleFormInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                            disabled={puntosDeVenta.length === 0}
                        >
                            {puntosDeVenta.length === 0 ? (
                                <option value="">Cargando puntos de venta...</option>
                            ) : (
                                puntosDeVenta.map((point) => (
                                    <option key={point._id} value={point.nombre}>
                                        {point.nombre}
                                    </option>
                                ))
                            )}
                        </select>
                        {puntosDeVenta.length === 0 && !error && (
                            <p className="text-sm text-gray-500 mt-1">Asegúrese de que la empresa tenga puntos de venta configurados.</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="tipoComprobante" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Comprobante:</label>
                        <input
                            type="text"
                            id="tipoComprobante"
                            name="tipoComprobante"
                            value={formInput.tipoComprobante}
                            onChange={handleFormInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    {/* Nuevo campo para Fecha y Hora */}
                    <div>
                        <label htmlFor="fechaHoraTicket" className="block text-gray-700 text-sm font-bold mb-2">Fecha y Hora:</label>
                        <input
                            type="datetime-local"
                            id="fechaHoraTicket"
                            name="fechaHoraTicket"
                            value={fechaHoraTicket}
                            onChange={(e) => setFechaHoraTicket(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                </div>

                <hr className="my-6 border-t border-gray-300" />
                <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Agregar Ítem al Ticket</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
                    <div>
                        <label htmlFor="codigo" className="block text-gray-700 text-sm font-bold mb-2">Código:</label>
                        <input
                            type="text"
                            id="codigo"
                            name="codigo"
                            value={newItem.codigo}
                            onChange={handleNewItemChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-1">
                        <label htmlFor="descripcion" className="block text-gray-700 text-sm font-bold mb-2">Descripción:<span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="descripcion"
                            name="descripcion"
                            value={newItem.descripcion}
                            onChange={handleNewItemChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    <div>
                        <label htmlFor="cantidad" className="block text-gray-700 text-sm font-bold mb-2">Cantidad:<span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            id="cantidad"
                            name="cantidad"
                            value={newItem.cantidad}
                            onChange={handleNewItemChange}
                            min="1"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    <div>
                        <label htmlFor="precioUnitario" className="block text-gray-700 text-sm font-bold mb-2">Precio Unitario:</label>
                        <input
                            type="number"
                            id="precioUnitario"
                            name="precioUnitario"
                            value={newItem.precioUnitario}
                            onChange={handleNewItemChange}
                            min="0.00"
                            step="0.01"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    {/* Botón AGREGAR */}
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-blue-700 hover:bg-blue-700-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                    >
                        Agregar
                    </button>
                </div>

                <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Ítems del Ticket:</h3>
                {items.length === 0 ? (
                    <p className="text-center text-gray-600 mb-6">No hay ítems agregados. Agregue productos arriba.</p>
                ) : (
                    <ul className="space-y-4 mb-6">
                        {items.map((item, index) => (
                            <li key={index} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-lg bg-gray-500 shadow-sm">
                                <div className="mb-2 md:mb-0">
                                    <p className="text-lg font-medium text-gray-800">
                                        <strong>{item.descripcion || '[Sin Descripción]'}</strong> ({item.codigo || '[Sin Código]'})
                                    </p>
                                    <p className="text-gray-600">
                                        Cantidad: {item.cantidad} x ${item.precioUnitario.toFixed(2)} = <strong className="text-blue-ui">${item.totalItem.toFixed(2)}</strong>
                                    </p>
                                </div>
                                {/* Botón ELIMINAR */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline transition duration-200 text-sm"
                                >
                                    Eliminar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <hr className="my-6 border-t border-gray-300" />

                <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Totales:</h3>
                <div className="text-lg mb-6">
                    <p className="text-gray-700">Subtotal: <strong className="text-blue-ui">${subtotal.toFixed(2)}</strong></p>
                    <p className="text-gray-700">Descuento: <strong className="text-blue-ui">${0.00.toFixed(2)}</strong></p>
                    <p className="text-2xl font-bold text-blue-ui-dark mt-2">Total a Pagar: ${totalPagar.toFixed(2)}</p>
                </div>
                <hr className="my-6 border-t border-gray-300" />

                <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Pago:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="metodoPago" className="block text-gray-700 text-sm font-bold mb-2">Método de Pago:</label>
                        <select
                            id="metodoPago"
                            name="metodoPago"
                            value={formInput.metodoPago}
                            onChange={handleFormInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta Débito">Tarjeta Débito</option>
                            <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                            <option value="Mercado Pago">Mercado Pago</option>
                        </select>
                    </div>
                    {formInput.metodoPago === "Efectivo" && (
                        <div>
                            <label htmlFor="montoRecibido" className="block text-gray-700 text-sm font-bold mb-2">Monto Recibido:</label>
                            <input
                                type="number"
                                id="montoRecibido"
                                name="montoRecibido"
                                value={formInput.montoRecibido}
                                onChange={handleFormInputChange}
                                min="0"
                                step="0.01"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                            />
                        </div>
                    )}
                </div>
                <p className="text-lg text-gray-700 mb-6">Cambio: <strong className="text-blue-ui">${cambio.toFixed(2)}</strong></p>
                <hr className="my-6 border-t border-gray-300" />

                <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Cliente (Opcional):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="nombreCliente" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
                        <input
                            type="text"
                            id="nombreCliente"
                            name="nombreCliente"
                            value={formInput.nombreCliente}
                            onChange={handleFormInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    <div>
                        <label htmlFor="dniCuitCliente" className="block text-gray-700 text-sm font-bold mb-2">DNI/CUIT:</label>
                        <input
                            type="text"
                            id="dniCuitCliente"
                            name="dniCuitCliente"
                            value={formInput.dniCuitCliente}
                            onChange={handleFormInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="condicionIVACliente" className="block text-gray-700 text-sm font-bold mb-2">Condición IVA:</label>
                        <select
                            id="condicionIVACliente"
                            name="condicionIVACliente"
                            value={formInput.condicionIVACliente}
                            onChange={handleFormInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light"
                        >
                            <option value="Consumidor Final">Consumidor Final</option>
                            <option value="Responsable Inscripto">Responsable Inscripto</option>
                            <option value="Monotributista">Monotributista</option>
                            <option value="Exento">Exento</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="observaciones" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label>
                    <textarea
                        id="observaciones"
                        name="observaciones"
                        value={formInput.observaciones}
                        onChange={handleFormInputChange}
                        rows="3"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-ui-light resize-y"
                    />
                </div>

                {/* Botón CREAR TICKET */}
                <button
                    type="submit"
                    disabled={!idEmpresa || !idUsuario || items.length === 0 || puntosDeVenta.length === 0 || !formInput.puntoDeVenta}
                    className={`w-full py-3 px-6 rounded-lg text-white text-xl font-bold transition duration-300 ease-in-out
                        ${(!idEmpresa || !idUsuario || items.length === 0 || puntosDeVenta.length === 0 || !formInput.puntoDeVenta)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-700 hover:bg-blue-700-dark focus:outline-none focus:shadow-outline'
                        }`}
                >
                    Crear Ticket
                </button>
            </form>
        </div>
    );
}