import { apiContext } from "../../context/api_context";
import { useContext, useEffect, useState } from "react";

export function VerTiketsCompany() {
    const { getTiketsContext } = useContext(apiContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            setError(null);
            try {
                const dataEmpresaString = localStorage.getItem("dataEmpresa");
                let companyId = null;

                if (dataEmpresaString) {
                    const dataEmpresa = JSON.parse(dataEmpresaString);
                    // Ensure that dataEmpresa and its _id property exist
                    if (dataEmpresa && dataEmpresa._id) {
                        companyId = dataEmpresa._id;
                    } else {
                        console.error("dataEmpresa found in localStorage but missing _id or is invalid:", dataEmpresa);
                        setError("No se pudo obtener el ID de la empresa desde el almacenamiento local. Asegúrese de que 'dataEmpresa' esté correctamente guardado.");
                        setLoading(false); // Stop loading if companyId is not found
                        return; // Exit early if no valid companyId
                    }
                } else {
                    setError("No se encontró información de la empresa en el almacenamiento local. Inicie sesión para ver los tickets.");
                    setLoading(false); // Stop loading if no company data
                    return; // Exit early if no company data
                }

                if (companyId) {
                    console.log("Fetching tickets for company ID:", companyId);
                    const fetchedTickets = await getTiketsContext(companyId);
                    setTickets(fetchedTickets);
                }
            } catch (err) {
                console.error("Error al cargar los tickets:", err);
                setError(`Error al cargar los tickets: ${err.message || 'Error desconocido'}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [getTiketsContext]); // This dependency is generally stable for context functions.

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-gray-700">Cargando tickets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-xl mt-10">
                <p className="text-center font-bold">¡Error!</p>
                <p className="text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-ui">Tickets de la Empresa</h2>

            {tickets.length > 0 ? (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div key={ticket._id || ticket.ventaId} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 mb-3">
                                <p><strong>ID Venta:</strong> {ticket.ventaId || 'N/A'}</p>
                                <p><strong>Fecha y Hora:</strong> {new Date(ticket.fechaHora).toLocaleString('es-AR') || 'N/A'}</p>
                                <p><strong>Punto de Venta:</strong> {ticket.puntoDeVenta || 'N/A'}</p>
                                <p><strong>Cajero:</strong> {ticket.cajero || 'N/A'}</p>
                                <p><strong>Tipo de Comprobante:</strong> {ticket.tipoComprobante || 'N/A'}</p>
                                <p><strong>Nro. Comprobante:</strong> {ticket.numeroComprobante || 'N/A'}</p>
                            </div>

                            <h4 className="font-semibold text-lg mb-2 text-blue-ui-dark">Detalle de Ítems:</h4>
                            {ticket.items && ticket.items.length > 0 ? (
                                <ul className="list-disc list-inside mb-3 text-gray-600">
                                    {ticket.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="mb-1">
                                            {item.descripcion} ({item.cantidad} x ${item.precioUnitario.toFixed(2)}) = <strong>${item.totalItem.toFixed(2)}</strong>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600 mb-3">No hay ítems registrados para este ticket.</p>
                            )}

                            <div className="text-right text-lg mt-4 border-t pt-3">
                                <p className="font-bold text-gray-800">Total a Pagar: <span className="text-green-700">${ticket.totales?.totalPagar?.toFixed(2) || '0.00'}</span></p>
                                <p className="text-gray-600">Método de Pago: {ticket.pago?.metodo || 'N/A'}</p>
                                {ticket.pago?.metodo === 'Efectivo' && (
                                    <>
                                        <p className="text-gray-600">Monto Recibido: ${ticket.pago?.montoRecibido?.toFixed(2) || '0.00'}</p>
                                        <p className="text-gray-600">Cambio: ${ticket.pago?.cambio?.toFixed(2) || '0.00'}</p>
                                    </>
                                )}
                            </div>
                            {ticket.cliente && (ticket.cliente.nombre || ticket.cliente.dniCuit) && (
                                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                                    <h4 className="font-semibold text-md text-blue-ui-dark">Datos del Cliente:</h4>
                                    <p className="text-sm text-gray-700">Nombre: {ticket.cliente.nombre || 'N/A'}</p>
                                    <p className="text-sm text-gray-700">DNI/CUIT: {ticket.cliente.dniCuit || 'N/A'}</p>
                                    <p className="text-sm text-gray-700">Condición IVA: {ticket.cliente.condicionIVA || 'N/A'}</p>
                                </div>
                            )}
                            {ticket.observaciones && (
                                <div className="mt-3 p-2 bg-gray-100 rounded-md">
                                    <h4 className="font-semibold text-md text-gray-700">Observaciones:</h4>
                                    <p className="text-sm text-gray-600">{ticket.observaciones}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-600">No se encontraron tickets para esta empresa.</p>
            )}
        </div>
    );
}