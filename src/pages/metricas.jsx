import React, { useContext, useEffect, useState, useCallback } from "react";
import { apiContext } from "../context/api_context.jsx";

// --- Helper para leer datos de localStorage de forma segura ---
// Reutilizamos la misma función auxiliar para consistencia
const getLocalStorageItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error al leer ${key} de localStorage:`, e);
        return null;
    }
};

export function MetricasNegocio() {
    const { getProductsEmpresa, getTiketsContext } = useContext(apiContext);

    const [productos, setProductos] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Obtenemos los IDs de empresa y usuario directamente en el cuerpo del componente
    // Estos valores se mantendrán estables durante el ciclo de vida del componente
    const empresa = getLocalStorageItem("dataEmpresa");
    const usuario = getLocalStorageItem("userData");
    const idEmpresa = empresa?._id;
    const idUsuario = usuario?._id;

    // Utilizamos useCallback para memorizar la función fetchData y evitar re-renderizados innecesarios
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!idEmpresa) {
            setError("ID de empresa no encontrado. Por favor, asegúrate de que la sesión esté iniciada correctamente.");
            setLoading(false);
            return;
        }

        try {
            // Usamos Promise.allSettled para ejecutar ambas llamadas API en paralelo
            // y manejar los posibles errores de cada una de forma independiente sin detener la otra.
            const [productsResult, ticketsResult] = await Promise.allSettled([
                getProductsEmpresa(idEmpresa),
                getTiketsContext(idEmpresa, idUsuario), // Asumiendo que getTiketsContext puede usar idUsuario
            ]);

            if (productsResult.status === 'fulfilled') {
                setProductos(productsResult.value || []);
            } else {
                console.error("Error al obtener productos:", productsResult.reason);
                // No establecemos error global si solo falla una llamada, pero lo logueamos
            }

            if (ticketsResult.status === 'fulfilled') {
                setTickets(ticketsResult.value || []);
            } else {
                console.error("Error al obtener tickets:", ticketsResult.reason);
                // No establecemos error global si solo falla una llamada, pero lo logueamos
            }

            // Si ambas fallan, o si quieres un mensaje más genérico:
            if (productsResult.status === 'rejected' && ticketsResult.status === 'rejected') {
                 setError("Hubo un error al cargar todos los datos. Intenta de nuevo más tarde.");
            } else if (productsResult.status === 'rejected' || ticketsResult.status === 'rejected') {
                 // Si al menos una falló pero no ambas
                 setError("Algunos datos no pudieron cargarse. Revisa tu conexión o intenta más tarde.");
            }


        } catch (err) {
            // Este catch es para errores fuera de las promesas, aunque Promise.allSettled maneja la mayoría
            console.error("Error general en fetchData:", err);
            setError("Hubo un error inesperado al cargar los datos. Intenta de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, [idEmpresa, idUsuario, getProductsEmpresa, getTiketsContext]); // Dependencias para useCallback

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Dependencia del useEffect

    // --- Lógica de cálculo de métricas ---
    // Estas se recalcularán cada vez que 'productos' o 'tickets' cambien
    const totalProductosEnStock = productos.reduce((sum, product) => sum + (product.stock || 0), 0);
    const totalMontoTickets = tickets.reduce((sum, ticket) => sum + (ticket.total || 0), 0);
    const cantidadTicketsEmitidos = tickets.length;

    // --- Renderizado Condicional ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f9fafb] flex justify-center items-center">
                <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
                    <svg className="animate-spin h-10 w-10 text-[#3f64ec] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-gray-600">Cargando métricas de negocio...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f9fafb] flex justify-center items-center">
                <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md text-center">
                    <p className="text-xl font-bold mb-2">¡Error al cargar!</p>
                    <p className="text-lg">{error}</p>
                    <p className="text-sm mt-2">Por favor, verifica tu conexión o intenta de nuevo más tarde.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f9fafb] py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center leading-tight">
                Dashboard de Métricas de Negocio
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Tarjeta de Productos en Stock */}
                <MetricCard
                    title="Productos en Inventario"
                    value={totalProductosEnStock}
                    description="Unidades disponibles en tu inventario."
                    icon={<svg className="w-10 h-10 text-[#3f64ec]" fill="currentColor" viewBox="0 0 24 24"><path d="M7 3H4a1 1 0 00-1 1v4a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1zm0 8H4a1 1 0 00-1 1v4a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 00-1-1zm0 8H4a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1zM11 3h3a1 1 0 001-1V.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5V2a1 1 0 001 1zm0 8h3a1 1 0 001-1v-1a1 1 0 00-1-1h-3a1 1 0 00-1 1v1a1 1 0 001 1zm0 8h3a1 1 0 001-1v-1a1 1 0 00-1-1h-3a1 1 0 00-1 1v1a1 1 0 001 1zM18 3h3a1 1 0 001-1V.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5V2a1 1 0 001 1zm0 8h3a1 1 0 001-1v-1a1 1 0 00-1-1h-3a1 1 0 00-1 1v1a1 1 0 001 1zm0 8h3a1 1 0 001-1v-1a1 1 0 00-1-1h-3a1 1 0 00-1 1v1a1 1 0 001 1z" clipRule="evenodd"></path></svg>}
                    borderColor="border-[#3f64ec]"
                />

                {/* Tarjeta de Tickets Emitidos (Cantidad) */}
                <MetricCard
                    title="Tickets Emitidos"
                    value={cantidadTicketsEmitidos}
                    description="Total de transacciones de ventas registradas."
                    icon={<svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 012.293 13H3a1 1 0 001 1h12a1 1 0 001-1h.707l-.707-.707V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>}
                    borderColor="border-green-600"
                />

                {/* Tarjeta de Total de Ventas (Monto de Tickets) */}
                <MetricCard
                    title="Ventas Totales"
                    value={`$${totalMontoTickets.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    description="Monto acumulado de todas las ventas."
                    icon={<svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>}
                    borderColor="border-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sección de Últimos Productos */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">Últimos Productos</h2>
                    {productos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Precio
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {productos.slice(0, 5).map(product => (
                                        <tr key={product._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock < (product.minStockAlert || 5) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${product.precio?.toFixed(2) || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No hay productos registrados para mostrar.</p>
                    )}
                </div>

                {/* Sección de Últimos Tickets */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">Últimos Tickets Emitidos</h2>
                    {tickets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nro. Ticket
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tickets.slice(0, 5).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(ticket => ( // Ordenar por fecha descendente
                                        <tr key={ticket._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{ticket.numero}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(ticket.fecha).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${ticket.total?.toFixed(2) || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No hay tickets emitidos para mostrar.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Componente auxiliar para las tarjetas de métricas ---
// Esto mejora la legibilidad y reusabilidad del código JSX
const MetricCard = ({ title, value, description, icon, borderColor }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300 ease-in-out border-l-4 ${borderColor}`}>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
            {icon}
        </div>
        <p className="text-5xl font-bold text-gray-900 mb-2">{value}</p>
        <p className="text-gray-500">{description}</p>
    </div>
);