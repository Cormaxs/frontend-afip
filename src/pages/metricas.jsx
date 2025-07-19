import React, { useContext, useEffect, useState, useCallback } from "react";
import { apiContext } from "../context/api_context.jsx";

// --- Iconos y Componentes Reutilizables (Sin cambios) ---
const TicketIcon = ({ className = "w-7 h-7" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg> );
const StoreIcon = ({ className = "w-7 h-7" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> );
const ProductIcon = ({ className = "w-7 h-7" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> );
const AlertIcon = ({ className = "w-7 h-7" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> );
const InStockIcon = ({ className = "w-7 h-7" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> );
const DollarIcon = ({ className = "w-7 h-7" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m6-6H6"></path></svg> );
const CheckCircleIcon = ({ className = "w-16 h-16" }) => ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> );
const MetricCard = ({ icon, title, value, isLoading }) => (<div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm transition hover:shadow-lg hover:-translate-y-1"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><div className="p-2 bg-slate-100 rounded-lg text-slate-600">{icon}</div></div><div className="mt-4">{isLoading ? <div className="h-8 w-3/5 bg-slate-200 rounded-md animate-pulse"></div> : <p className="text-3xl font-bold text-slate-800">{value ?? '0'}</p>}</div></div>);
const ProductsTable = ({ products }) => (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th></tr></thead><tbody className="bg-white divide-y divide-slate-200">{products.map((p) => (<tr key={p._id} className="hover:bg-slate-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{p.producto}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500">{p.stock_disponible}</td></tr>))}</tbody></table></div>);
const PaginationControls = ({ pagination, onPageChange }) => { if (!pagination || pagination.totalPages <= 1) return null; return (<div className="flex items-center justify-between mt-4 px-4 py-3 sm:px-6"><p className="text-sm text-slate-700">Página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.totalPages}</span></p><div className="flex-1 flex justify-end gap-2"><button onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrevPage} className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">Anterior</button><button onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNextPage} className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">Siguiente</button></div></div>); };
const EmptyState = () => (<div className="text-center py-12 px-4"><CheckCircleIcon className="mx-auto text-green-400" /><h3 className="mt-2 text-lg font-medium text-slate-900">¡Todo en orden!</h3><p className="mt-1 text-sm text-slate-500">No se encontraron productos agotados.</p></div>);
const TableSkeleton = () => (<div className="p-6 space-y-4"><div className="h-8 bg-slate-200 rounded-md w-full animate-pulse"></div><div className="h-8 bg-slate-200 rounded-md w-full animate-pulse"></div><div className="h-8 bg-slate-200 rounded-md w-full animate-pulse"></div></div>);
const formatCurrency = (value) => { if (typeof value !== 'number') return '$ 0,00'; return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value); };

// --- Componente Principal ---
export default function MetricasNegocio() {
  const { userData, getTiketsContext, getPointsByCompany, getProductsEmpresa, get_products_agotados, get_price_inventario } = useContext(apiContext);
  
  const [metrics, setMetrics] = useState({
    valorInventario: null,
    totalTickets: null,
    totalPoints: null,
    totalProducts: null,
    totalAgotados: null,
  });
  const [agotadosTable, setAgotadosTable] = useState({ docs: [], totalPages: 0 });
  const [pointsOfSale, setPointsOfSale] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState('all');
  const [selectedPointNombre, setSelectedPointNombre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. useEffect para obtener los puntos de venta (para el filtro <select>)
  useEffect(() => {
    const fetchAllPointsForFilter = async () => {
      if (!userData?.empresa) return;
      try {
        const response = await getPointsByCompany(userData.empresa, 1, 999, {}); 
        if (response?.puntosDeVenta) {
          const pointsList = response.puntosDeVenta;
          setPointsOfSale(pointsList);
          // ⭐️ CORRECCIÓN: Actualizamos el total de puntos de venta aquí.
          setMetrics(prev => ({ ...prev, totalPoints: pointsList.length }));
        }
      } catch (err) {
        console.error("Error cargando puntos de venta para el filtro:", err);
      }
    };
    fetchAllPointsForFilter();
  }, [userData?.empresa, getPointsByCompany]);

  // ✅ 2. useCallback para obtener las métricas filtradas.
  const fetchData = useCallback(async () => {
    if (!userData?.empresa) {
        setLoading(false);
        return;
    };

    setLoading(true);
    setError(null);
    
    // ⭐️ LÓGICA CLAVE: Se decide qué ID pasarle a la API.
    const puntoDeVentaParam = selectedPoint === 'all' ? null : selectedPoint;
    const puntoDeVentaNombre = selectedPoint === 'all' ? null : selectedPoint;
    try {
      const [
        ticketsData, 
        productsData, 
        priceData,
        agotadosData,
      ] = await Promise.all([
        getTiketsContext(userData.empresa, {puntoVenta: puntoDeVentaNombre}),
        getProductsEmpresa(userData.empresa, {puntoVenta: puntoDeVentaParam} ),
        get_price_inventario(userData.empresa, puntoDeVentaParam),
        get_products_agotados(userData.empresa, puntoDeVentaParam, { page: currentPage, limit: 5 }),
      ]);
      
      // Actualizamos solo las métricas que vienen de estas llamadas.
      // `totalPoints` ya fue establecido en el otro useEffect.
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        valorInventario: priceData?.valorTotalInventario,
        totalTickets: ticketsData?.pagination?.totalTickets,
        totalProducts: productsData?.pagination?.totalProducts,
        totalAgotados: agotadosData?.totalDocs,
      }));

      setAgotadosTable(agotadosData);

    } catch (err) {
      console.error("Error al obtener las métricas:", err);
      setError("No se pudieron cargar los datos. Intente de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [userData?.empresa, selectedPoint, currentPage, getTiketsContext, getProductsEmpresa, get_price_inventario, get_products_agotados]);

  // ✅ 3. useEffect que ejecuta fetchData cuando cambian los filtros.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers y Lógica de UI ---
  const handlePointChange = (e) => {
    setSelectedPoint(e.target.value);
    setSelectedPointNombre(e.target);
    setCurrentPage(1); // Resetear paginación al cambiar de filtro.
  };
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= agotadosTable.totalPages) {
        setCurrentPage(newPage);
    }
  };

  const enStockValue = (typeof metrics.totalProducts === 'number' && typeof metrics.totalAgotados === 'number')
    ? metrics.totalProducts - metrics.totalAgotados
    : null;

  const metricsCards = [
    { title: "Valor del Inventario", value: formatCurrency(metrics.valorInventario), icon: <DollarIcon className="text-blue-500" /> },
    { title: "Total de Tickets", value: metrics.totalTickets, icon: <TicketIcon /> },
    { title: "Puntos de Venta en total", value: metrics.totalPoints, icon: <StoreIcon /> },
    { title: "Productos Registrados", value: metrics.totalProducts, icon: <ProductIcon /> },
    { title: "Productos en Stock", value: enStockValue, icon: <InStockIcon className="text-green-500" /> },
    { title: "Productos Agotados", value: metrics.totalAgotados, icon: <AlertIcon className="text-orange-500" /> },
  ];

  if (error && !loading) {
    return (<div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-lg mt-10 text-center"><p className="font-bold">¡Ha ocurrido un error!</p><p className="mt-2">{error}</p></div>);
  }

  // --- Renderizado del Componente ---
  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="mt-1 text-md text-slate-600">Bienvenido, {userData?.nombre}.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <label htmlFor="point-selector" className="block text-sm font-medium text-slate-700">Ver métricas de:</label>
                    <select 
                      id="point-selector" 
                      value={selectedPoint} 
                      onChange={handlePointChange} 
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="all">Todos los locales</option>
                        {pointsOfSale.map(point => (
                            <option key={point._id} value={point._id}>{point.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>
        </header>
        
        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {metricsCards.map((metric) => (<MetricCard key={metric.title} icon={metric.icon} title={metric.title} value={metric.value} isLoading={loading} />))}
          </div>

          <div className="mt-10 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-800">Inventario Crítico</h2>
                  <p className="mt-1 text-sm text-slate-500">Listado de productos con stock agotado.</p>
              </div>
              {loading ? <TableSkeleton /> : (agotadosTable?.docs?.length > 0 ? (<><ProductsTable products={agotadosTable.docs} /><PaginationControls pagination={agotadosTable} onPageChange={handlePageChange} /></>) : <EmptyState />)}
          </div>
        </main>
      </div>
    </div>
  );
}