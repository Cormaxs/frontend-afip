// App.jsx (Your current optimized version, which is correct for this setup)
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SidePanel } from './components/menu.jsx';
import { LoadRoutes } from './routes/routes';

import { apiContext } from './context/api_context.jsx';
import { LoginPage } from './pages/propietario/login';
import { RegisterPage } from './pages/propietario/register';
import { GetDashboardData } from './pages/dashboard';
import { PrivateRoute } from './pages/pasos-crear-cuenta/1-bloqueante.jsx'; // This is correct
import {EmpresaRegister} from "./pages/empresa/empresa-register.jsx"

// Componente que contiene la lógica condicional de la aplicación
function AppContent() {
  const { isAuthenticated } = useContext(apiContext);
  return (
    <div className="flex h-screen">
      {isAuthenticated && <SidePanel />}
      <main className="flex-1 overflow-auto p-4">
        <Routes>
          {/*protege las rutas*/}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path='/empresa-register' element={<EmpresaRegister/>}/>
          {/* Add any other public routes here */}

          <Route
            path="/dashboard"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <GetDashboardData />
              </PrivateRoute>
            }
          />
          <Route path="/*" element={<LoadRoutes />} />
        </Routes>
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