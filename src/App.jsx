import { Route, Routes } from 'react-router'
import ProtectedRoute from './components/auth/ProtectedRoute';


//paginas login y register
import Door from './pages/auth/Entrada.jsx';
import LoginUsuarios from './pages/auth/Register/register-usuarios.jsx';
import RegisterEmpresa from './pages/auth/Register/Register-empresa.jsx';
import IniciarSesion from './pages/auth/Login/sign-in.jsx';

//paginas inventario
import BuscadorProductos from './pages/inventario/buscadorProductos.jsx';
import CategoriasYMarcas from './pages/inventario/CategoriasYMarcas.jsx';
import ImportacionMasiva from './pages/inventario/ImportacionMasiva.jsx';

//paginas cajas
import GestionCajas from './pages/cajas/GestionCajas.jsx';

//paginas vendedores
import GestionVendedores from './pages/vendedores/GestionVendedores.jsx';

//paginas reportes
import Reportes from './pages/reportes/Reportes.jsx';

//configuracion usuarios
import DatosUsuarios from './pages/config-datos/usuarios.jsx';

//layout
import Layout from './layouts/layout.jsx';

//configuracion empresa
import DatosEmpresa from './pages/auth/afip/datosEmpresa.jsx';

//pruebas
import TestFacturacion from './pages/pruebas/TestFacturacion.jsx';
import PuntosDeVentas from './pages/puntosDeVentas/puntosDeVentas.jsx';
import CreateFacturas from './pages/facturas/facturas.jsx';
import FacturacionPage from './pages/facturas/FacturacionPage.jsx';
import CrearTicket from './pages/tickets/CrearTicket.jsx';
import Despachador from './pages/ventas/Despachador.jsx';
import Proveedores from './pages/proveedores/Proveedores.jsx';
import CuentasPorPagar from './pages/cuentas/CuentasPorPagar.jsx';
import GestionClientes from './pages/crm/GestionClientes.jsx';


function App() {
  return (
    <Routes>
      {/* --- RUTAS PÚBLICAS (Sin Sidebar/Layout) --- */}
      <Route path="/" element={<Door />} />
      <Route path="/login-usuarios" element={<IniciarSesion />} />
      <Route path="/register-empresa" element={<RegisterEmpresa />} />
      <Route path="/register-usuarios" element={<LoginUsuarios />} />

      {/* --- RUTAS PRIVADAS (Protegidas) --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Facturación */}
          <Route path="/prueba-numeracion" element={<TestFacturacion />} />
          <Route path="/puntos-de-ventas" element={<PuntosDeVentas />} />
          <Route path="/crear-factura" element={<CreateFacturas />} />
          <Route path="/despachador" element={<Despachador />} />
          <Route path="/crear-ticket-interno" element={<CrearTicket />} />
          <Route path="/buscador-facturas" element={<FacturacionPage />} />

          {/* Inventario */}
          <Route path="/buscadorProductos" element={<BuscadorProductos />} />
          <Route path="/categorias-marcas" element={<CategoriasYMarcas />} />
          <Route path="/importacion-masiva" element={<ImportacionMasiva />} />

          {/* Cajas */}
          <Route path="/gestion-cajas" element={<GestionCajas />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/clientes" element={<GestionClientes />} />
          <Route path="/cuentas-por-pagar" element={<CuentasPorPagar />} />
          {/* Vendedores */}
          <Route path="/gestion-vendedores" element={<GestionVendedores />} />

          {/* Reportes */}
          <Route path="/reportes" element={<Reportes />} />

          {/* Configuración */}
          <Route path="/datosUsuario" element={<DatosUsuarios />} />
          <Route path="/DatosEmpresa" element={<DatosEmpresa />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
}

export default App;