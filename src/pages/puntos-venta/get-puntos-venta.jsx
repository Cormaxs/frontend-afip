import React, { useState, useEffect, useContext } from "react";
import { apiContext } from "../../context/api_context"; // Asegúrate de que el path sea correcto

export function GetPointsSales() {
  const { getPointsByCompany } = useContext(apiContext);

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const fetchPoints = async () => {
      setLoading(true);
      setError(null);

      try {
        const userDataString = localStorage.getItem("userData");
        const dataEmpresaString = localStorage.getItem("dataEmpresa");
        let companyId = "";
        let currentCompanyName = "";

        if (userDataString) {
          const userData = JSON.parse(userDataString);
          companyId = userData.empresa || "";
        }

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

        const data = await getPointsByCompany(companyId);

        if (Array.isArray(data)) {
          setPoints(data);
        } else {
          throw new Error(
            "La respuesta de la API no es un array de puntos de venta."
          );
        }
      } catch (err) {
        console.error("Error al cargar puntos de venta:", err);
        setError(
          err.message ||
            "No se pudieron cargar los puntos de venta. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [getPointsByCompany]); // Asegúrate de que getPointsByCompany sea una dependencia estable

  // Función auxiliar para formatear fechas
  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      console.error("Error al formatear fecha:", isoString, e);
      return "Fecha inválida";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 rounded-lg shadow-md bg-white">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mb-3"
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
          <p className="text-gray-700">Cargando puntos de venta...</p>
        </div>
      </div>
    );
  }

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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-teal-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            Puntos de Venta de {companyName}
          </h1>
        </div>

        <div className="p-6">
          {points.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No hay puntos de venta registrados para esta empresa.
            </p>
          ) : (
            <ul className="space-y-4">
              {points.map((point) => (
                <li
                  key={point._id} // Siempre usa un ID único y estable para la key
                  className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    {point.nombre} (Punto #{point.numero})
                  </h2>
                  <p className="text-gray-600">
                    <span className="font-medium">Estado:</span>{" "}
                    {point.activo ? "Activo" : "Inactivo"}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Dirección:</span>{" "}
                    {point.direccion}, {point.ciudad}, {point.provincia} (CP:{" "}
                    {point.codigoPostal})
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Teléfono:</span>{" "}
                    {point.telefono}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Último Cbte. Autorizado:</span>{" "}
                    {point.ultimoCbteAutorizado}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Fecha Último Cbte.:</span>{" "}
                    {formatDateTime(point.fechaUltimoCbte)}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    <span className="font-medium">Creado:</span>{" "}
                    {formatDateTime(point.createdAt)}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Última Actualización:</span>{" "}
                    {formatDateTime(point.updatedAt)}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    <span className="font-medium">ID:</span> {point._id}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}