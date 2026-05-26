import api from '../../api/api.js';

export const CajasService = {
  // Abrir caja
  abrirCaja: (datos) => 
    api.post('/api/v1/cajas/abrirCaja', datos),
  
  // Agregar transacción a una caja abierta
  agregarTransaccion: (idCaja, datos) => 
    api.post(`/api/v1/cajas/${idCaja}/transaccion`, datos),
  
  // Cerrar caja
  cerrarCaja: (idCaja, datos) => 
    api.post(`/api/v1/cajas/cerrarcaja/${idCaja}`, datos),
  
  // Obtener detalle de una caja
  obtenerCaja: (idCaja) => 
    api.get(`/api/v1/cajas/${idCaja}`),

  // Obtener resumen de caja (arqueo)
  obtenerResumenCaja: (idCaja) =>
    api.get(`/api/v1/cajas/${idCaja}/resumen`),
  
  // Obtener cajas de una empresa
  obtenerCajasEmpresa: (idEmpresa, params = {}) => 
    api.get(`/api/v1/cajas/empresa/${idEmpresa}`, { params }),
};
