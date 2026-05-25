import api from '../../api/api.js';

export const VendedoresService = {
  // Registrar vendedor
  registrarVendedor: (datos) => 
    api.post('/api/v1/vendors/register', datos),
  
  // Login vendedor
  loginVendedor: (datos) => 
    api.post('/api/v1/vendors/login', datos),
  
  // Obtener vendedor por ID
  obtenerVendedor: (idVendedor) => 
    api.get(`/api/v1/vendors/get/${idVendedor}`),
  
  // Obtener vendedores por empresa
  obtenerVendedoresEmpresa: (idEmpresa) => 
    api.get(`/api/v1/vendors/company/${idEmpresa}`),
  
  // Actualizar vendedor
  actualizarVendedor: (idVendedor, datos) => 
    api.post(`/api/v1/vendors/update/${idVendedor}`, datos),
  
  // Eliminar vendedor
  eliminarVendedor: (idVendedor) => 
    api.delete(`/api/v1/vendors/delete/${idVendedor}`),
};
