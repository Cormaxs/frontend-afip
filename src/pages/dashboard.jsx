import React, { useState, useEffect } from "react";

export function GetDashboardData() {
  const [hasCompany, setHasCompany] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [hasPointsOfSale, setHasPointsOfSale] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);

  useEffect(() => {
    // Comprobar si hay datos de empresa en localStorage
    const checkCompanyData = () => {
      try {
        const dataEmpresaString = localStorage.getItem("dataEmpresa");
        setHasCompany(!!dataEmpresaString); // Convertir a booleano, true si existe la cadena
      } catch (e) {
        console.error("Error al leer dataEmpresa de localStorage:", e);
        setHasCompany(false);
      }
    };

    // Comprobar si hay datos de usuario (indicando un registro)
    const checkUserData = () => {
      try {
        const userDataString = localStorage.getItem("userData");
        setHasUser(!!userDataString); // True si existe la cadena
      } catch (e) {
        console.error("Error al leer userData de localStorage:", e);
        setHasUser(false);
      }
    };

    // Estos dos requieren una llamada a la API (o simulación si la API es pesada)
    // Para simplificar, asumiremos que si la empresa existe, estos pasos
    // podrían ser marcados como pendientes hasta que tengas las páginas reales para ello.
    // O, idealmente, harían una llamada a getPointsByCompany y getProductsCompany
    // para verificar si hay datos en el backend.
    // Por ahora, solo se marcarán como pendientes si la empresa existe pero no hay otros datos específicos
    // en localStorage (lo que sería menos preciso).
    // Para una implementación completa, necesitarías funciones que hagan un fetch ligero de conteos.

    // Implementación simplificada: asume que si el usuario existe, tiene potencial para Puntos/Productos.
    // Idealmente: Aquí harías llamadas a tu API (ej: `getPointsByCompany(companyId)`)
    // para verificar la existencia real de puntos de venta y productos.
    // Dado que no tenemos esa lógica directamente aquí (solo el contexto),
    // esta verificación es un placeholder.
    // Si tu `apiContext` tiene funciones para obtener _todos_ los puntos de venta/productos,
    // podrías importarlos y usarlos aquí para una verificación más precisa.
    // Por ejemplo:
    // const { getPointsByCompany, getProductsEmpresa } = useContext(apiContext);
    // const companyId = JSON.parse(localStorage.getItem("userData"))?.empresa;
    // if (companyId) {
    //   getPointsByCompany(companyId).then(data => setHasPointsOfSale(data && data.length > 0));
    //   getProductsEmpresa(companyId).then(data => setHasProducts(data && data.length > 0));
    // }


    // Ejecutar las comprobaciones al cargar el componente
    checkCompanyData();
    checkUserData();

    // Nota: Para "hasPointsOfSale" y "hasProducts", la implementación ideal requeriría
    // que la API tenga endpoints ligeros para verificar la existencia, o que los datos
    // se almacenen en localStorage de manera que permitan una comprobación simple aquí.
    // Por ahora, se asumen como pendientes si el usuario está logueado pero no se ha hecho la acción.
    // Para ser preciso, necesitarías llamar a getPointsByCompany y getProductsCompany aquí
    // y verificar si devuelven un array no vacío.
    // Para este ejemplo, lo haré de forma básica si la empresa está creada.
    const interval = setInterval(() => {
      const companyId = JSON.parse(localStorage.getItem("userData"))?.empresa;
      if (companyId) {
        // En un escenario real, harías una llamada real a tu API para verificar si hay puntos/productos
        // Por ejemplo:
        // getPointsByCompany(companyId).then(data => setHasPointsOfSale(data && data.length > 0));
        // getProductsEmpresa(companyId).then(data => setHasProducts(data && data.length > 0));
        // Para este ejemplo, solo simulamos que existen si el usuario está logueado y la empresa existe.
        // Esto NO es una verificación real de la base de datos.
        const simulatedPoints = localStorage.getItem('simulatedPoints'); // Un flag simple
        setHasPointsOfSale(!!simulatedPoints);

        const simulatedProducts = localStorage.getItem('simulatedProducts'); // Otro flag simple
        setHasProducts(!!simulatedProducts);

      }
    }, 1000); // Comprobar cada segundo, ajustar según sea necesario

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar
  }, []);


  // --- Helper para renderizar el estado del paso ---
  const renderStepStatus = (isCompleted) => {
    return isCompleted ? (
      <span className="text-green-600 font-semibold flex items-center">
        <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
        </svg>
        Completado
      </span>
    ) : (
      <span className="text-yellow-600 font-semibold flex items-center">
        <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.54 2.714-1.54 3.479 0l.654 1.312a2 2 0 001.815 1.092l1.458.21c1.6.232 2.228 2.112 1.094 3.238l-1.05 1.023a2 2 0 00-.57 1.767l.25 1.583c.25 1.6-1.414 2.854-2.857 2.1l-1.306-.687a2 2 0 00-1.848 0l-1.306.687c-1.443.754-3.107-.5-2.857-2.1l.25-1.583a2 2 0 00-.57-1.767L3.02 8.95c-1.134-1.126-.506-3.006 1.094-3.238l1.458-.21a2 2 0 001.815-1.092l.654-1.312zM10 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd"></path>
        </svg>
        Pendiente
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            Panel de Configuración
          </h1>
          <p className="text-blue-100 mt-2">
            Sigue estos pasos para configurar tu cuenta.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              Progreso de Configuración
            </h2>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-gray-700">
                <span className="font-medium">1. Crear la Empresa:</span>
                {renderStepStatus(hasCompany)}
              </li>
              <li className="flex justify-between items-center text-gray-700">
                <span className="font-medium">2. Registrar un Usuario:</span>
                {renderStepStatus(hasUser)}
              </li>
              <li className="flex justify-between items-center text-gray-700">
                <span className="font-medium">3. Crear Puntos de Venta:</span>
                {renderStepStatus(hasPointsOfSale)}
              </li>
              <li className="flex justify-between items-center text-gray-700">
                <span className="font-medium">4. Crear Productos:</span>
                {renderStepStatus(hasProducts)}
              </li>
            </ul>
          </div>

          <div className="mt-6 text-gray-700">
            <p className="mb-4">
              Para empezar a usar todas las funcionalidades, completa los siguientes pasos en orden:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li className={`${hasCompany ? 'text-gray-400 line-through' : 'text-blue-700 font-medium'}`}>
                Crea tu **Empresa** (si aún no lo has hecho).
              </li>
              <li className={`${hasUser ? 'text-gray-400 line-through' : 'text-blue-700 font-medium'}`}>
                Registra al menos un **Usuario** para tu empresa.
              </li>
              <li className={`${hasPointsOfSale ? 'text-gray-400 line-through' : 'text-blue-700 font-medium'}`}>
                Define tus **Puntos de Venta**.
              </li>
              <li className={`${hasProducts ? 'text-gray-400 line-through' : 'text-blue-700 font-medium'}`}>
                Agrega tus **Productos**.
              </li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              Una vez completados, podrás gestionar tu inventario, ventas y equipo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}