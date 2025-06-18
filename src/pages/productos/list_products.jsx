import React, { useState, useEffect, useContext } from "react";
import { apiContext } from "../../context/api_context"; // Asegúrate de que la ruta sea correcta

export function GetProductsCompany() {
  // Asegúrate de usar 'apiContext' aquí, no 'ApiProvider'
  const { getProductsEmpresa } = useContext(apiContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const userDataString = localStorage.getItem("userData");
        const dataEmpresaString = localStorage.getItem("dataEmpresa");
        let companyId = "";
        let currentCompanyName = "";

        // Obtener ID de la empresa del localStorage
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          companyId = userData.empresa || "";
        }

        // Obtener nombre de la empresa del localStorage
        if (dataEmpresaString) {
          const dataEmpresa = JSON.parse(dataEmpresaString);
          currentCompanyName = dataEmpresa.nombreEmpresa || "Tu Empresa";
        }
        setCompanyName(currentCompanyName);

        if (!companyId) {
          throw new Error(
            "No se encontró el ID de la empresa en localStorage. Asegúrate de iniciar sesión."
          );
        }

        // Llamar a la función del contexto para obtener los productos
        const data = await getProductsEmpresa(companyId);

        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          throw new Error(
            "La respuesta de la API no es un array de productos."
          );
        }
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError(
          err.message ||
            "No se pudieron cargar los productos. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [getProductsEmpresa]); // La función del contexto es una dependencia estable

  // Componente de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 rounded-lg shadow-md bg-white">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mb-3" // Color azul
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-700">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // Componente de error
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="p-6 rounded-lg shadow-md bg-red-100 text-red-700">
          <p className="font-semibold mb-2">Error al cargar datos:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            Productos de {companyName}
          </h1>
        </div>

        <div className="p-6">
          {products.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No hay productos registrados para esta empresa.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id} // Usa el _id del producto como key
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {product.producto}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">
                      Código Interno:{" "}
                      <span className="font-semibold text-gray-700">
                        {product.codigoInterno}
                      </span>
                    </p>
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Descripción:</span>{" "}
                      {product.descripcion}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Marca:</span>{" "}
                      {product.marca}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Categoría:</span>{" "}
                      {product.categoria}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Stock Disponible:</span>{" "}
                      <span className="font-semibold">
                        {product.stock_disponible}
                      </span>{" "}
                      unidades
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-lg font-bold text-gray-800">
                      Precio Lista:{" "}
                      <span className="text-blue-600">
                        ${product.precioLista.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-gray-600 text-sm">
                      Precio Costo: ${product.precioCosto.toFixed(2)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      IVA: {product.alic_IVA}%
                    </p>
                    <p className="text-gray-600 text-sm">
                      Markup: {product.markupPorcentaje}%
                    </p>
                    <p
                      className={`text-sm font-semibold mt-2 ${
                        product.activo ? "text-blue-500" : "text-red-500" // Mantener verde/rojo para activo/inactivo
                      }`}
                    >
                      Estado: {product.activo ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}