import {Routes, Route} from "react-router-dom";
import {GetDashboardData} from "../pages/dashboard";
import {RegisterPage} from "../pages/propietario/register";
import {LoginPage} from "../pages/propietario/login";
import {EmpresaRegister} from "../pages/empresa/empresa-register.jsx";
import {AgregarProducto} from "../pages/productos/productos.jsx";
import {AgregarPuntoVenta} from "../pages/puntos-venta/create-punto-venta.jsx";
import {AddVendedores} from "../pages/vendedores/create-vendedor.jsx";
import {CrearFactura} from "../pages/facturas/create-factura.jsx";
import {GenerarCertificadoDigital} from "../pages/credenciales/key-csr.jsx";
import {CertificateUploader} from "../pages/credenciales/create-crt.jsx";

export function LoadRoutes() {
    return(
        <Routes>
            {/* Ruta principal */}
            <Route path="/" element={<GetDashboardData/>} />
            
            {/* Autenticación */}
            <Route path="/login" element={<LoginPage/>} />
            <Route path="/register" element={<RegisterPage/>} />
            
            {/* Configuración inicial */}
            <Route path="/empresa-register" element={<EmpresaRegister/>} />
            <Route path="/generate-key-crs" element={<GenerarCertificadoDigital/>} />
            <Route path="/generate-crt" element={<CertificateUploader/>} />
            
            {/* Gestión de Catálogo */}
            <Route path="/add-product" element={<AgregarProducto/>} />
            <Route path="/productos" element="productos" />
            
            {/* Puntos de Venta */}
            <Route path="/add-puntoVenta" element={<AgregarPuntoVenta/>} />
            
            {/* Personal */}
            <Route path="/add-vendedor" element={<AddVendedores/>} />
            <Route path="/usuarios" element="usuarios" />
            
            {/* Operaciones */}
            <Route path="/create-factura" element={<CrearFactura/>} />
        </Routes>
    )
}