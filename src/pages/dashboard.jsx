import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiContext } from "../context/api_context.jsx";

// --- Componente de Ícono Reutilizable ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// --- Helper para leer de Local Storage ---
const getLocalStorageItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error al leer ${key} de localStorage:`, e);
        return null;
    }
};

// --- Subcomponente de Paso (Rediseñado) ---
const StepItem = React.memo(({ step, isCompleted, isActive, isDisabled }) => {
    const statusClasses = {
        bg: isCompleted ? 'bg-green-500' : isActive ? 'bg-[var(--principal)]' : 'bg-gray-400',
        ring: isCompleted ? 'ring-green-100' : isActive ? 'ring-[var(--color-fondo-util)]' : 'ring-gray-100',
        text: isDisabled ? 'text-gray-400' : 'text-gray-800',
        badge: isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
    };

    return (
        <li className="mb-10 ms-6">
            <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -start-4 ring-8 ${statusClasses.ring} ${statusClasses.bg}`}>
                <Icon path={step.icon} className="w-5 h-5 text-white" />
            </span>
            <div className={`p-4 rounded-lg border ml-4 transition-all ${isDisabled ? 'bg-gray-50' : 'bg-white shadow-sm hover:border-[var(--principal)]'}`}>
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${statusClasses.text}`}>{step.label}</h3>
                    {isCompleted && (
                         <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-full ${statusClasses.badge}`}>Completado</span>
                    )}
                </div>
                <p className="mb-4 text-sm font-normal text-gray-500">{step.description}</p>
                <Link
                    to={step.path}
                    onClick={(e) => { if (isDisabled) e.preventDefault(); }}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none transition-colors duration-200 ${
                        isDisabled ? 'bg-gray-300 cursor-not-allowed' : `bg-[var(--principal)] hover:bg-[var(--color-fondo-util)]`
                    }`}
                >
                    {isCompleted ? 'Ver / Modificar' : 'Comenzar Ahora'}
                    {!isDisabled && <Icon path="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" className="w-3 h-3 ms-2 rtl:rotate-180" />}
                    {isDisabled && <Icon path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" className="w-3 h-3 ms-2"/>}
                </Link>
            </div>
        </li>
    );
});


// --- Componente Principal ---
export default function GetDashboardData() {
    const [setupProgress, setSetupProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getPointsByCompany, getProductsEmpresa } = useContext(apiContext);
    const navigate = useNavigate();
    const userData = useMemo(() => getLocalStorageItem("userData"), []);

    // ✨ SEPARACIÓN DE PASOS: Requeridos vs Opcionales
    const requiredSteps = useMemo(() => [
        { label: "1. Crear tu Empresa", key: "hasCompany", path: "/empresa-register", icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375M9 12h6.375m-6.375 5.25h6.375M5.25 6h.008v.008H5.25V6Zm.75 5.25h.008v.008H6v-.008Zm0 5.25h.008v.008H6v-.008Zm.75-10.5h.008v.008H6.75V6Zm0 5.25h.008v.008H6.75v-.008Zm0 5.25h.008v.008H6.75v-.008Zm.75-10.5h.008v.008H7.5V6Zm0 5.25h.008v.008H7.5v-.008Zm0 5.25h.008v.008H7.5v-.008Zm6-10.5h.008v.008h-.008V6Zm0 5.25h.008v.008h-.008v-.008Zm0 5.25h.008v.008h-.008v-.008Zm.75-10.5h.008v.008h-.008V6Zm0 5.25h.008v.008h-.008v-.008Zm0 5.25h.008v.008h-.008v-.008Zm.75-10.5h.008v.008h-.008V6Zm0 5.25h.008v.008h-.008v-.008Zm0 5.25h.008v.008h-.008v-.008Z", description: "Registra los datos fiscales y comerciales de tu negocio."},
        { label: "2. Registrar tu Usuario", key: "hasUser", path: "/register", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", description: "Crea tu cuenta de administrador para gestionar todo el sistema."},
        { label: "3. Crear Puntos de Venta", key: "hasPointsOfSale", path: "/get-puntoVenta", icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.64m-13.5 0L12 14.25m-2.64 6.75L12 14.25", description: "Define las sucursales o cajas desde donde realizarás ventas."},
        { label: "4. Cargar Productos", key: "hasProducts", path: "/productos", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962.328 1.102.817l1.5 4.5H4.5", description: "Añade tu inventario de productos o servicios para empezar a vender."},
    ], []);
    
    const optionalSteps = useMemo(() => [
        { label: "Generar Clave Digital (.key)", key: "hasCSR", path: "/generate-key-crs", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.97l-8.375 8.375a3.75 3.75 0 01-5.304-5.304l8.375-8.375a6 6 0 015.97-7.029z", description: "Genera el archivo de requisitoria para el certificado digital de AFIP."},
        { label: "Cargar Certificado Digital (.crt)", key: "hasCRT", path: "/generate-crt", icon: "M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z", description: "Sube el certificado emitido por AFIP para habilitar la facturación."},
    ], []);


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
                hasCSR: !!companyData?.keyDigital,
                hasCRT: !!companyData?.certificadoDigital,
                hasPointsOfSale: false,
                hasProducts: false,
            };

            if (companyId) {
                const [pointsResult, productsResult] = await Promise.allSettled([
                    getPointsByCompany(companyId, 1, 1),
                    getProductsEmpresa(companyId, { page: 1, limit: 1 }),
                ]);

                if (pointsResult.status === 'fulfilled' && pointsResult.value) {
                    newProgress.hasPointsOfSale = pointsResult.value.pagination?.totalPuntosDeVenta > 0;
                }
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

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    // ✨ LÓGICA DE PROGRESO: Ahora basada solo en los pasos requeridos
    const { nextStep, completedCount, allStepsCompleted } = useMemo(() => {
        let firstPendingStep = null;
        const count = requiredSteps.reduce((acc, step) => {
            if (setupProgress[step.key]) return acc + 1;
            if (!firstPendingStep) firstPendingStep = step;
            return acc;
        }, 0);
        return {
            nextStep: firstPendingStep,
            completedCount: count,
            allStepsCompleted: count === requiredSteps.length,
        };
    }, [setupProgress, requiredSteps]);

    const completionPercentage = useMemo(() => 
        (completedCount / requiredSteps.length) * 100
    , [completedCount, requiredSteps.length]);


    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Verificando configuración...</p></div>;
    }
    if (error) {
        return <div className="flex h-screen w-full items-center justify-center"><p className="text-red-500">{error}</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800">
                           ¡Bienvenido, {userData?.username || 'Usuario'}!
                        </h1>
                        <p className="text-gray-500 mt-2 text-md">
                           {allStepsCompleted ? "¡Configuración esencial completa! Ya puedes operar." : "Completemos los siguientes pasos para dejar todo listo."}
                        </p>
                    </div>

                    <div className="mt-8">
                        {/* --- SECCIÓN DE PASOS REQUERIDOS --- */}
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-700">Primeros Pasos</h2>
                            <span className="text-sm font-bold text-[var(--principal)]">{completedCount} de {requiredSteps.length} pasos</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                            <div className="bg-[var(--principal)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                        </div>

                        <ol className="relative border-s border-gray-200">                  
                            {requiredSteps.map((step) => {
                                const isCompleted = setupProgress[step.key];
                                const isActive = !isCompleted && step.key === nextStep?.key;
                                return (
                                    <StepItem
                                        key={step.key}
                                        step={step}
                                        isCompleted={isCompleted}
                                        isActive={isActive}
                                        isDisabled={!isCompleted && !isActive}
                                    />
                                );
                            })}
                        </ol>
                        
                        {/* --- SECCIÓN DE PASOS OPCIONALES --- */}
                        <div className="mt-12 pt-6 border-t">
                             <h2 className="text-lg font-semibold text-gray-700 mb-8 text-center">Configuración Opcional: Facturación AFIP</h2>
                             <ol className="relative border-s border-gray-200">                  
                                {optionalSteps.map((step) => {
                                    const isCompleted = setupProgress[step.key];
                                    // Los pasos opcionales solo se habilitan si la empresa ya fue creada
                                    const isDisabled = !setupProgress.hasCompany; 
                                    return (
                                        <StepItem
                                            key={step.key}
                                            step={step}
                                            isCompleted={isCompleted}
                                            isActive={!isCompleted && !isDisabled} // Es activo si no está completo ni deshabilitado
                                            isDisabled={isDisabled}
                                        />
                                    );
                                })}
                            </ol>
                        </div>
                    </div>

                    {/* --- BOTÓN PRINCIPAL DE ACCIÓN --- */}
                    {allStepsCompleted && (
                        <div className="pt-6 mt-4">
                            <button
                                onClick={() => navigate("/metricas")}
                                className="w-full bg-[var(--verdes-shadow)] text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 shadow-lg text-lg"
                            >
                                ¡Todo listo! Ir al Panel Principal
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}