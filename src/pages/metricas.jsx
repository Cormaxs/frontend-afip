import React, { useContext, useEffect, useState } from "react";
import { apiContext } from "../context/api_context.jsx";

// --- Iconos SVG Minimalistas ---
// Cada icono es un componente para mantener el código limpio.
const TicketIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
);
const StoreIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
);
const ProductIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
);

// --- Componente Reutilizable para cada Tarjeta de Métrica ---
const MetricCard = ({ icon, title, value, isLoading }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition hover:shadow-md">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      {isLoading ? (
        // Estado de Carga (Esqueleto)
        <div className="h-8 w-3/5 bg-gray-200 rounded-md animate-pulse"></div>
      ) : (
        // Valor final
        <p className="text-3xl font-bold text-gray-800">
          {value ?? '0'}
        </p>
      )}
    </div>
  </div>
);

// --- Componente Principal ---
export default function MetricasNegocio() {
  const { userData, getTiketsContext, getPointsByCompany, getProductsEmpresa } = useContext(apiContext);
  
  const [tikets, setTikets] = useState(null);
  const [points, setPoints] = useState(null);
  const [products, setProducts] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Usamos una variable para evitar actualizaciones si el componente ya se desmontó
    let isMounted = true; 

    const fetchAllData = async () => {
      if (!userData?.empresa) {
        setLoading(false);
        return;
      }

      try {
        const [
          datosDeTikets, 
          datosDePoints, 
          datosDeProducts
        ] = await Promise.all([
          getTiketsContext(userData.empresa),
          getPointsByCompany(userData.empresa),
          getProductsEmpresa(userData.empresa)
        ]);

        if (isMounted) {
          setTikets(datosDeTikets);
          setPoints(datosDePoints);
          setProducts(datosDeProducts);
        }

      } catch (err) {
        console.error("Error al obtener los datos de las métricas:", err);
        if (isMounted) {
          setError("No se pudieron cargar las métricas. Intente de nuevo más tarde.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    // Función de limpieza para evitar memory leaks
    return () => {
      isMounted = false;
    };

  }, [userData?.empresa, getTiketsContext, getPointsByCompany, getProductsEmpresa]);

  // Creamos un array con la configuración de las métricas para renderizarlo dinámicamente
  const metricsData = [
    {
      title: "Total de Tickets",
      value: tikets?.pagination?.totalTickets,
      icon: <TicketIcon />
    },
    {
      title: "Puntos de Venta Activos",
      value: points?.pagination?.totalPuntosDeVenta,
      icon: <StoreIcon />
    },
    {
      title: "Productos Registrados",
      value: products?.pagination?.totalProducts,
      icon: <ProductIcon />
    }
  ];

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-xl mt-10">
        <p className="text-center font-bold">¡Ha ocurrido un error!</p>
        <p className="text-center mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-md text-gray-600">
            Bienvenido, {userData?.nombre}. Aquí tienes un resumen de la actividad de tu negocio.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricsData.map((metric) => (
            <MetricCard 
              key={metric.title}
              icon={metric.icon}
              title={metric.title}
              value={metric.value}
              isLoading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}