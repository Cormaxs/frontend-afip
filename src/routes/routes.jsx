import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Componente de carga que se mostrará mientras se baja el código de la página
const LoadingFallback = () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-lg font-medium text-gray-600">Cargando página...</div>
    </div>
);

// --- 1. Conversión de todos los imports a lazy ---
const GetDashboardData = lazy(() => import("../pages/dashboard.jsx"));
const MetricasNegocio = lazy(() => import("../pages/metricas.jsx"));
const LoginPage = lazy(() => import("../pages/propietario/login.jsx"));
const RegisterPage = lazy(() => import("../pages/propietario/register.jsx"));
const EmpresaRegister = lazy(() => import("../pages/empresa/empresa-register.jsx"));
const GenerarCertificadoDigital = lazy(() => import("../pages/credenciales/key-csr.jsx"));
const CertificateUploader = lazy(() => import("../pages/credenciales/create-crt.jsx"));
const AgregarProducto = lazy(() => import("../pages/productos/productos.jsx"));
const GetProductsCompany = lazy(() => import("../pages/productos/list_products.jsx"));
const CagargaMasiva_products = lazy(() => import("../pages/productos/carga-masiva.jsx"));
const AgregarPuntoVenta = lazy(() => import("../pages/puntos-venta/create-punto-venta.jsx"));
const GetPointsSales = lazy(() => import("../pages/puntos-venta/get-puntos-venta.jsx"));
const GenerarVentas = lazy(() => import("../pages/ventas/generar-venta.jsx"));
const AddVendedores = lazy(() => import("../pages/vendedores/create-vendedor.jsx"));
const AbrirCaja = lazy(() => import("../pages/caja/abrir-caja.jsx"));
const CerrarCaja = lazy(() => import("../pages/caja/cerrar-caja.jsx"));
const IngresoEgreso = lazy(() => import("../pages/caja/ingreso-egreso-caja.jsx"));
const HistorialCajas = lazy(() => import("../pages/caja/get-cajas-company.jsx"));
const CreateTikets = lazy(() => import("../pages/tikets/create-tiket.jsx"));
const VerTiketsCompany = lazy(() => import("../pages/tikets/get-tikets.jsx"));
const CrearFactura = lazy(() => import("../pages/facturas/create-factura.jsx"));


export default function LoadRoutes() {
    return (
        // --- 2. Envolver las rutas en Suspense ---
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Ruta principal */}
                <Route path="/dashboard" element={<GetDashboardData />} />
                <Route path="/metricas" element={<MetricasNegocio />} />
                
                {/* Autenticación */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Configuración inicial */}
                <Route path="/empresa-register" element={<EmpresaRegister />} />
                <Route path="/generate-key-crs" element={<GenerarCertificadoDigital />} />
                <Route path="/generate-crt" element={<CertificateUploader />} />
                
                {/* Gestión de Catálogo */}
                <Route path="/add-product" element={<AgregarProducto />} />
                <Route path="/productos" element={<GetProductsCompany />} />
                <Route path="/carga-masiva-productos" element={<CagargaMasiva_products />} />
                
                {/* Puntos de Venta */}
                <Route path="/add-puntoVenta" element={<AgregarPuntoVenta />} />
                <Route path="/get-puntoVenta" element={<GetPointsSales />} />
                <Route path="/ventas" element={<GenerarVentas />} />
                
                {/* Personal */}
                <Route path="/add-vendedor" element={<AddVendedores />} />
                <Route path="/usuarios" element={<div>Próximamente...</div>} /> {/* Ejemplo de ruta simple */}

                {/* Caja */}
                <Route path="/abrir-caja" element={<AbrirCaja />} />
                <Route path="/cerrar-caja" element={<CerrarCaja />} />
                <Route path="/ingreso-egreso-caja" element={<IngresoEgreso />} />
                <Route path="/get-caja-id" element={<AbrirCaja />} />
                <Route path="/get-cajas-empresa" element={<HistorialCajas />} />

                {/* Tikets */}
                <Route path="/tiket/create" element={<CreateTikets />} />
                <Route path="/tiket/get" element={<VerTiketsCompany />} />

                {/* Operaciones */}
                <Route path="/create-factura" element={<CrearFactura />} />
            </Routes>
        </Suspense>
    );
}