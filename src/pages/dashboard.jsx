import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiContext } from "../context/api_context.jsx";

// --- Helper para leer datos de localStorage de forma segura ---
const getLocalStorageItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error al leer ${key} de localStorage:`, e);
        return null;
    }
};

// --- Subcomponente para cada ítem de progreso ---
const ProgressItem = ({ label, isCompleted }) => (
    <li className="flex justify-between items-center text-gray-800 py-2 border-b border-gray-200 last:border-b-0">
        <span className="text-base font-medium">{label}</span>
        <span className={`font-semibold flex items-center text-sm ${isCompleted ? 'text-green-900' : 'text-[#3f64ec]'}`}>
            {/* Icono de estado */}
            <svg className={`h-5 w-5 mr-2 ${isCompleted ? 'text-green-700' : 'text-[#4c67f1]'}`} fill="currentColor" viewBox="0 0 20 20">
                {isCompleted ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                )}
            </svg>
            {isCompleted ? 'Completado' : 'Pendiente'}
        </span>
    </li>
);

export function GetDashboardData() {
    const [setupProgress, setSetupProgress] = useState({
        hasCompany: false,
        hasUser: false,
        hasPointsOfSale: false,
        hasProducts: false,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { getPointsByCompany, getProductsEmpresa } = useContext(apiContext);

    // Lista de pasos de configuración para renderizado dinámico y legibilidad
    const configSteps = [
        { label: "1. Crear la Empresa:", key: "hasCompany", path: "/empresa-register" },
        { label: "2. Registrar un Usuario:", key: "hasUser", path: "/register" },
        { label: "3. Crear Puntos de Venta:", key: "hasPointsOfSale", path: "/add-puntoVenta" },
        { label: "4. Cargar Productos:", key: "hasProducts", path: "/add-product" },
    ];

    /**
     * @function fetchProgress
     * @description Carga el estado de progreso de la configuración desde localStorage y la API.
     */
    const fetchProgress = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const companyData = getLocalStorageItem("dataEmpresa");
            const userData = getLocalStorageItem("userData");

            const companyId = companyData?._id;
            const userId = userData?._id;

            const newProgress = {
                hasCompany: !!companyData,
                hasUser: !!userData,
                hasPointsOfSale: false,
                hasProducts: false,
            };

            if (companyId && userId) {
                const [pointsResult, productsResult] = await Promise.allSettled([
                    getPointsByCompany(companyId),
                    getProductsEmpresa(companyId),
                ]);

                newProgress.hasPointsOfSale = pointsResult.status === 'fulfilled' && pointsResult.value && pointsResult.value.length > 0;
                newProgress.hasProducts = productsResult.status === 'fulfilled' && productsResult.value && productsResult.value.length > 0;

                if (pointsResult.status === 'rejected') {
                    console.error("Error al obtener puntos de venta:", pointsResult.reason);
                }
                if (productsResult.status === 'rejected') {
                    console.error("Error al obtener productos:", productsResult.reason);
                }
            }

            setSetupProgress(newProgress);
        } catch (e) {
            console.error("Error general al verificar el progreso:", e);
            setError("Hubo un problema al cargar el estado de tu configuración. Por favor, intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }, [getPointsByCompany, getProductsEmpresa]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const { hasCompany, hasUser, hasPointsOfSale, hasProducts } = setupProgress;

    /**
     * @function getNextStepPath
     * @description Determina la ruta del siguiente paso pendiente.
     * @returns {string} La ruta URL del siguiente paso o el dashboard principal si todo está completo.
     */
    const getNextStepPath = () => {
        for (const step of configSteps) {
            if (!setupProgress[step.key]) {
                return step.path;
            }
        }
        return "/"; // Si todos los pasos están completos
    };

    const nextStepPath = getNextStepPath();
    const allStepsCompleted = hasCompany && hasUser && hasPointsOfSale && hasProducts;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9fafb] font-sans text-gray-900">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                {/* Encabezado */}
                <div className="bg-[#3f64ec] p-6"> {/* Color azul principal del header */}
                    <h1 className="text-2xl font-bold text-white mb-1">
                        Configuración Inicial
                    </h1>
                    <p className="text-[#f9fafb] text-base"> {/* Tono muy claro del azul para el texto */}
                        Prepara tu negocio para operar en FacStock.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Estado de Carga */}
                    {loading && (
                        <div className="text-center py-8">
                            <svg className="animate-spin h-8 w-8 text-[#4c67f1] mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-lg text-gray-600">Cargando estado...</p>
                        </div>
                    )}

                    {/* Estado de Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-md">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                                <div>
                                    <h3 className="font-semibold">¡Error!</h3>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contenido Principal */}
                    {!loading && !error && (
                        <>
                            {/* Sección de Progreso de Configuración */}
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                                    Progreso de Configuración
                                </h2>
                                <ul className="space-y-1">
                                    {configSteps.map((step, index) => (
                                        <ProgressItem
                                            key={index}
                                            label={step.label}
                                            isCompleted={setupProgress[step.key]}
                                        />
                                    ))}
                                </ul>
                            </div>

                            {/* Sección de Pasos Recomendados */}
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                                    Pasos Recomendados
                                </h2>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700 text-base">
                                    <li className={`${hasCompany ? 'text-gray-400 line-through' : 'font-medium text-[#3f64ec]'}`}>
                                        Registra tu <strong className="font-semibold">Empresa</strong> para comenzar a operar.
                                    </li>
                                    <li className={`${hasUser ? 'text-gray-400 line-through' : 'font-medium text-[#3f64ec]'}`}>
                                        Añade al menos un <strong className="font-semibold">Usuario</strong> que pueda gestionar tu empresa.
                                    </li>
                                    <li className={`${hasPointsOfSale ? 'text-gray-400 line-through' : 'font-medium text-[#3f64ec]'}`}>
                                        Configura tus <strong className="font-semibold">Puntos de Venta</strong> físicos o virtuales.
                                    </li>
                                    <li className={`${hasProducts ? 'text-gray-400 line-through' : 'font-medium text-[#3f64ec]'}`}>
                                        Carga tu <strong className="font-semibold">Catálogo de Productos</strong> para empezar a vender.
                                    </li>
                                </ol>
                                <p className="mt-5 text-sm text-gray-500 italic">
                                    Una vez completados todos los pasos, podrás acceder a todas las funcionalidades, como facturación, control de inventario y seguimiento de ventas.
                                </p>
                            </div>

                            {/* Botón de Acción */}
                            <div className="mt-6 text-center">
                                <Link
                                    to={nextStepPath}
                                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#3f64ec] hover:bg-[#4c67f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3f64ec] transition-colors duration-200"
                                >
                                    {allStepsCompleted ? "Ir al Dashboard Principal" : "Continuar Configuración"}
                                    <svg className="ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}