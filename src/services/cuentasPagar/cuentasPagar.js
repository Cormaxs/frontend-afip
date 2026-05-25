import api from '../../api/api.js';

export const CuentasPagarService = {
  crearCuenta: (datos) =>
    api.post('/api/v1/accounts-payable/create', datos),

  obtenerCuentasPorEmpresa: (idEmpresa, params = {}) =>
    api.get(`/api/v1/accounts-payable/get/all/${idEmpresa}`, { params }),

  obtenerCuentasPorProveedor: (idProveedor, params = {}) =>
    api.get(`/api/v1/accounts-payable/get/proveedor/${idProveedor}`, { params }),

  actualizarCuenta: (idCuenta, datos) =>
    api.post(`/api/v1/accounts-payable/update/${idCuenta}`, datos),

  eliminarCuenta: (idCuenta) =>
    api.delete(`/api/v1/accounts-payable/delete/${idCuenta}`),

  registrarPago: (datos) =>
    api.post('/api/v1/accounts-payable/payment', datos),

  obtenerPagosPorEmpresa: (idEmpresa, params = {}) =>
    api.get(`/api/v1/accounts-payable/payments/${idEmpresa}`, { params }),

  obtenerPagosPorProveedor: (idProveedor, params = {}) =>
    api.get(`/api/v1/accounts-payable/payments/proveedor/${idProveedor}`, { params }),

  obtenerVencidas: (idEmpresa) =>
    api.get(`/api/v1/accounts-payable/due/vencidas/${idEmpresa}`),

  obtenerProximas: (idEmpresa, dias = 30) =>
    api.get(`/api/v1/accounts-payable/due/proximas/${idEmpresa}`, { params: { dias } }),
};
