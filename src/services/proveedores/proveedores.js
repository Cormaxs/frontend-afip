import api from '../../api/api.js';

export const ProveedoresService = {
  // CRUD general (asumiendo estructura similar a otros módulos)
  crearProveedor: (datos) => 
    api.post('/api/v1/providers/create', datos),
  
  obtenerProveedores: (idEmpresa, params) =>
    api.get(`/api/v1/providers/get/all/${idEmpresa}`, { params }),
  
  obtenerProveedor: (idProveedor) => 
    api.get(`/api/v1/providers/get/${idProveedor}`),
  
  actualizarProveedor: (idProveedor, datos) => 
    api.post(`/api/v1/providers/update/${idProveedor}`, datos),
  
  eliminarProveedor: (idProveedor) => 
    api.delete(`/api/v1/providers/delete/${idProveedor}`),
};
