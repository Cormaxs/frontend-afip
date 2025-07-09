// App.jsx
import React, { useContext, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// CONTEXTO Y COMPONENTES ESENCIALES (import estático)
import { apiContext } from './context/api_context.jsx';
import { PrivateRoute } from './pages/pasos-crear-cuenta/1-bloqueante.jsx';

// ---- COMPONENTES CARGADOS CON LAZY ----

// Fallback visual mientras se cargan los componentes
const LoadingFallback = () => (
    <div className="flex h-full w-full items-center justify-center">
        <p className="text-lg font-semibold text-gray-500">Cargando...</p>
    </div>
);

// Componentes de página y menú
const SidePanel = lazy(() => import('./components/menu.jsx'));
const LoadRoutes = lazy(() => import('./routes/routes.jsx'));
const LoginPage = lazy(() => import('./pages/propietario/login.jsx'));
const RegisterPage = lazy(() => import('./pages/propietario/register.jsx'));
const GetDashboardData = lazy(() => import('./pages/dashboard.jsx'));
const EmpresaRegister = lazy(() => import('./pages/empresa/empresa-register.jsx'));
const Elegir = lazy(() => import('./pages/pasos-crear-cuenta/0-elegir.jsx'));


// Componente que contiene la lógica condicional de la aplicación
function AppContent() {
  const { isAuthenticated } = useContext(apiContext);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Suspense para el SidePanel que se carga de forma diferida */}
      <Suspense fallback={null}>
        {isAuthenticated && <SidePanel />}
      </Suspense>

      <main className="flex-1 overflow-y-auto">
        {/* Suspense principal para todas las rutas de páginas */}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Ruta raíz que redirige según el estado de autenticación */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/elegir" replace />
                )
              }
            />

            {/* Rutas Públicas */}
            <Route path='/elegir' element={<Elegir />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path='/empresa-register' element={<EmpresaRegister />} />
            
            {/* Rutas Privadas */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <GetDashboardData />
                </PrivateRoute>
              }
            />
            {/* El resto de las rutas privadas también se cargan con lazy dentro de LoadRoutes */}
            <Route 
              path="/*" 
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <LoadRoutes />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// Componente principal de la aplicación
function App() {
  return (
    <AppContent />
  );
}

export default App;