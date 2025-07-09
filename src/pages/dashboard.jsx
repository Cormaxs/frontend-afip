import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiContext } from "../context/api_context.jsx";

// ... (El helper getLocalStorageItem y el subcomponente StepItem no cambian)

const getLocalStorageItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error al leer ${key} de localStorage:`, e);
        return null;
    }
};

const StepItem = React.memo(({ label, isCompleted, path, isDisabled }) => (
    <Link 
        to={path} 
        className={`block p-4 rounded-lg transition-all duration-300 ${
            isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white hover:bg-[var(--color-fondo-util)] hover:shadow-md'
        }`}
        onClick={(e) => { if (isDisabled) e.preventDefault(); }}
    >
        <div className="flex justify-between items-center">
            <span className={`text-base font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-[var(--principal)]'}`}>
                {label}
            </span>
            <span className={`font-semibold flex items-center text-sm ${isCompleted ? 'text-green-600' : 'text-[var(--principal)]'}`}>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    {isCompleted ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    ) : (
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v5a1 1 0 102 0V7zM9 14a1 1 0 112 0 1 1 0 01-2 0z"></path>
                    )}
                </svg>
                {isCompleted ? 'Completado' : 'Pendiente'}
            </span>
        </div>
    </Link>
));


export default function GetDashboardData() {
    const [setupProgress, setSetupProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getPointsByCompany, getProductsEmpresa } = useContext(apiContext);
    const navigate = useNavigate();

    const configSteps = useMemo(() => [
        { label: "Crear la Empresa", key: "hasCompany", path: "/empresa-register" },
        { label: "Registrar un Usuario", key: "hasUser", path: "/register" },
        { label: "Crear Puntos de Venta", key: "hasPointsOfSale", path: "/add-puntoVenta" },
        { label: "Cargar Productos", key: "hasProducts", path: "/add-product" },
    ], []);

    // --- ÚNICA SECCIÓN MODIFICADA ---
    const fetchProgress = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const companyData = getLocalStorageItem("dataEmpresa");
            const userData = getLocalStorageItem("userData");
            const companyId = companyData?._id;

            const newProgress = {
                hasCompany: !!companyData,
                hasUser: !!userData,
                hasPointsOfSale: false, // Inician en falso
                hasProducts: false,     // Inician en falso
            };

            if (companyId) {
                const [pointsResult, productsResult] = await Promise.allSettled([
                    getPointsByCompany(companyId, 1),
                    getProductsEmpresa(companyId, 1, 1),
                ]);

                // ✨ CAMBIO AQUÍ: Leer el total desde la paginación en lugar de .length
                if (pointsResult.status === 'fulfilled' && pointsResult.value) {
                    newProgress.hasPointsOfSale = pointsResult.value.pagination?.totalPuntosDeVenta > 0;
                }

                // ✨ CAMBIO AQUÍ: Leer el total desde la paginación en lugar de .length
                if (productsResult.status === 'fulfilled' && productsResult.value) {
                    newProgress.hasProducts = productsResult.value.pagination?.totalProducts > 0;
                }
            }
            setSetupProgress(newProgress);
        } catch (e) {
            console.error("Error al verificar el progreso:", e);
            setError("No se pudo cargar el estado de la configuración.");
        } finally {
            setLoading(false);
        }
    }, [getPointsByCompany, getProductsEmpresa]);

    // El resto del componente no necesita cambios...
    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const { nextStep, completedCount, allStepsCompleted } = useMemo(() => {
        let firstPendingStep = null;
        const count = configSteps.reduce((acc, step) => {
            if (setupProgress[step.key]) return acc + 1;
            if (!firstPendingStep) firstPendingStep = step;
            return acc;
        }, 0);
        return {
            nextStep: firstPendingStep,
            completedCount: count,
            allStepsCompleted: count === configSteps.length,
        };
    }, [setupProgress, configSteps]);

    const completionPercentage = useMemo(() => 
        (completedCount / configSteps.length) * 100
    , [completedCount, configSteps.length]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Cargando estado...</p></div>;
    }
    if (error) {
        return <div className="flex h-screen w-full items-center justify-center"><p className="text-red-500">{error}</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 bg-[var(--principal)] text-white">
                    <h1 className="text-2xl font-bold">
                        {allStepsCompleted ? "¡Configuración Completa!" : "Configuración Inicial"}
                    </h1>
                    <p className="text-gray-300 mt-1">
                        {allStepsCompleted ? "Tu negocio está listo para operar." : "Sigue los pasos para preparar tu cuenta."}
                    </p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-700">Progreso</h2>
                            <span className="text-sm font-bold text-[var(--principal)]">{completedCount} de {configSteps.length} pasos</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-[var(--principal)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {configSteps.map((step) => (
                            <StepItem
                                key={step.key}
                                label={step.label}
                                isCompleted={setupProgress[step.key]}
                                path={step.path}
                                isDisabled={!allStepsCompleted && nextStep && step.key !== nextStep.key && !setupProgress[step.key]}
                            />
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={() => navigate(allStepsCompleted ? "/" : nextStep.path)}
                            className="cursor-pointer w-full bg-[var(--principal)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--color-fondo-util)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal)] transition-all duration-300 shadow-md"
                        >
                            {allStepsCompleted ? "Ir al Dashboard Principal" : `Continuar: ${nextStep?.label || ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}