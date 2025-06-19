import React, { useContext, useState, useEffect, useMemo } from "react";
import { apiContext } from "../../context/api_context";

export function CreateTikets() {
    const { createTiketContext } = useContext(apiContext);

    // --- State Management ---
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
        puntoDeVenta: "Kiosco Central",
        tipoComprobante: "Ticket",
        metodoPago: "Efectivo",
        montoRecibido: 0.00,
        nombreCliente: "",
        dniCuitCliente: "",
        condicionIVACliente: "Consumidor Final",
        observaciones: ""
    });

    // --- Effects ---
    useEffect(() => {
        const loadLocalStorageData = () => {
            let hasError = false;

            // Load Empresa ID
            const empresaDataString = localStorage.getItem("dataEmpresa");
            if (empresaDataString) {
                try {
                    const empresa = JSON.parse(empresaDataString);
                    if (empresa._id) {
                        setIdEmpresa(empresa._id);
                    } else {
                        console.error("No se encontró el _id de la empresa en localStorage.");
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

            // Load User ID
            const userDataString = localStorage.getItem("userData");
            if (userDataString) {
                try {
                    const user = JSON.parse(userDataString);
                    if (user._id) {
                        setIdUsuario(user._id);
                    } else {
                        console.error("No se encontró el _id del usuario en localStorage.");
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

            if (hasError) {
                setMessage(''); // Clear success message if there's an error
            }
        };

        loadLocalStorageData();
    }, []);

    // --- Computed Values (using useMemo for optimization) ---
    const { subtotal, totalPagar, cambio } = useMemo(() => {
        const currentSubtotal = items.reduce((sum, item) => sum + item.totalItem, 0);
        const currentTotalPagar = currentSubtotal; // Assuming no discounts for simplicity
        const currentCambio = formInput.montoRecibido > currentTotalPagar ? formInput.montoRecibido - currentTotalPagar : 0;
        return {
            subtotal: currentSubtotal,
            totalPagar: currentTotalPagar,
            cambio: currentCambio
        };
    }, [items, formInput.montoRecibido]); // Recalculate only if items or montoRecibido changes

    // --- Event Handlers ---
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
            [name]: name === "cantidad" || name === "precioUnitario" ? parseFloat(value) || 0 : value
        }));
    };

    const handleAddItem = () => {
        // Basic validation for new item
        if (!newItem.descripcion.trim() || newItem.cantidad <= 0 || newItem.precioUnitario <= 0) {
            alert("Por favor, complete todos los campos del ítem y asegúrese que la cantidad y el precio sean válidos.");
            return;
        }

        const totalItem = newItem.cantidad * newItem.precioUnitario;
        setItems(prev => [...prev, { ...newItem, totalItem }]);
        // Reset newItem for next entry
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

        const currentDateTime = new Date().toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Backend should ideally generate `ventaId` and `numeroComprobante`
        // For demonstration, we simulate them here.
        const simulatedVentaId = `VK${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const simulatedNumeroComprobante = `0001-${Math.floor(Math.random() * 9000) + 1000}`;

        const ticketDataToSend = {
            datos: {
                ventaId: simulatedVentaId,
                fechaHora: currentDateTime,
                puntoDeVenta: formInput.puntoDeVenta,
                tipoComprobante: formInput.tipoComprobante,
                numeroComprobante: simulatedNumeroComprobante,
                items: items,
                totales: {
                    subtotal: subtotal,
                    descuento: 0.00, // Fixed for simplicity
                    totalPagar: totalPagar
                },
                pago: {
                    metodo: formInput.metodoPago,
                    montoRecibido: formInput.montoRecibido,
                    cambio: cambio
                },
                cliente: {
                    nombre: formInput.nombreCliente,
                    dniCuit: formInput.dniCuitCliente,
                    condicionIVA: formInput.condicionIVACliente
                },
                observaciones: formInput.observaciones,
                idUsuario: idUsuario
            },
            idEmpresa: idEmpresa
        };

        console.log("Datos a enviar para crear ticket:", ticketDataToSend);

        try {
            const response = await createTiketContext(ticketDataToSend);
            setMessage(`Ticket creado exitosamente. ID de DB: ${response.databaseRecordId}, Venta ID: ${response.ventaId}`);
            console.log("Respuesta del ticket creado:", response);
            // Reset form fields after successful submission
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
        } catch (err) {
            console.error("Error al crear el ticket:", err);
            setError(`Error al crear el ticket: ${err.message || 'Error desconocido'}. Consulte la consola para más detalles.`);
        }
    };

    // --- Render ---
    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}>
            <h2>Crear Nuevo Ticket</h2>

            {/* Display IDs from Local Storage */}
            <p>ID de Empresa Activa: <strong>{idEmpresa || 'Cargando...'}</strong></p>
            <p>ID de Usuario Activo: <strong>{idUsuario || 'Cargando...'}</strong></p>

            {/* Messages and Errors */}
            {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                {/* Ticket Details */}
                <hr />
                <h3>Detalles del Ticket</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Punto de Venta:</label>
                    <input
                        type="text"
                        name="puntoDeVenta"
                        value={formInput.puntoDeVenta}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Tipo de Comprobante:</label>
                    <input
                        type="text"
                        name="tipoComprobante"
                        value={formInput.tipoComprobante}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>

                {/* Add Item Section */}
                <hr />
                <h3>Agregar Ítem al Ticket</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.5fr 0.7fr auto', gap: '10px', marginBottom: '15px', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Código:</label>
                        <input
                            type="text"
                            name="codigo"
                            value={newItem.codigo}
                            onChange={handleNewItemChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Descripción:</label>
                        <input
                            type="text"
                            name="descripcion"
                            value={newItem.descripcion}
                            onChange={handleNewItemChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Cantidad:</label>
                        <input
                            type="number"
                            name="cantidad"
                            value={newItem.cantidad}
                            onChange={handleNewItemChange}
                            min="1"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Precio Unitario:</label>
                        <input
                            type="number"
                            name="precioUnitario"
                            value={newItem.precioUnitario}
                            onChange={handleNewItemChange}
                            min="0.01"
                            step="0.01"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            alignSelf: 'flex-end'
                        }}
                    >
                        Agregar
                    </button>
                </div>

                {/* Items List */}
                <h3>Ítems del Ticket:</h3>
                {items.length === 0 ? (
                    <p>No hay ítems agregados. Agregue productos arriba.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {items.map((item, index) => (
                            <li key={index} style={{ border: '1px dashed #eee', padding: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p><strong>{item.descripcion}</strong> ({item.codigo})</p>
                                    <p>Cantidad: {item.cantidad} x ${item.precioUnitario.toFixed(2)} = <strong>${item.totalItem.toFixed(2)}</strong></p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <hr />

                {/* Totals Section */}
                <h3>Totales:</h3>
                <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
                <p>Descuento: ${0.00.toFixed(2)}</p> {/* Placeholder for future discount logic */}
                <p>Total a Pagar: <strong>${totalPagar.toFixed(2)}</strong></p>
                <hr />

                {/* Payment Section */}
                <h3>Pago:</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Método de Pago:</label>
                    <select
                        name="metodoPago"
                        value={formInput.metodoPago}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta Débito">Tarjeta Débito</option>
                        <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                        <option value="Mercado Pago">Mercado Pago</option>
                    </select>
                </div>
                {formInput.metodoPago === "Efectivo" && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Monto Recibido:</label>
                        <input
                            type="number"
                            name="montoRecibido"
                            value={formInput.montoRecibido}
                            onChange={handleFormInputChange}
                            min="0"
                            step="0.01"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>
                )}
                <p>Cambio: <strong>${cambio.toFixed(2)}</strong></p>
                <hr />

                {/* Client Section (Optional) */}
                <h3>Cliente (Opcional):</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
                    <input
                        type="text"
                        name="nombreCliente"
                        value={formInput.nombreCliente}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>DNI/CUIT:</label>
                    <input
                        type="text"
                        name="dniCuitCliente"
                        value={formInput.dniCuitCliente}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Condición IVA:</label>
                    <select
                        name="condicionIVACliente"
                        value={formInput.condicionIVACliente}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                        <option value="Consumidor Final">Consumidor Final</option>
                        <option value="Responsable Inscripto">Responsable Inscripto</option>
                        <option value="Monotributista">Monotributista</option>
                        <option value="Exento">Exento</option>
                    </select>
                </div>

                {/* Observations */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Observaciones:</label>
                    <textarea
                        name="observaciones"
                        value={formInput.observaciones}
                        onChange={handleFormInputChange}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!idEmpresa || !idUsuario || items.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        opacity: (idEmpresa && idUsuario && items.length > 0) ? 1 : 0.6
                    }}
                >
                    Crear Ticket
                </button>
            </form>
        </div>
    );
}