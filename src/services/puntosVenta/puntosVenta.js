import api from '../../api/api.js';

export const puntosVentaService = {
    crearPuntoVenta: (datos) => api.post('/api/v1/point-sales/create', datos),
    obtenerPuntosVenta: (idEmpresa) => api.get(`/api/v1/point-sales/company/${idEmpresa}`),
    obtenerPuntoVentaPorId: (idPunto) => api.get(`/api/v1/point-sales/get/${idPunto}`),
    actualizarPuntoVenta: (idPunto, datos) => api.post(`/api/v1/point-sales/update/${idPunto}`, datos),
    eliminarPuntoVenta: (idPunto) => api.delete(`/api/v1/point-sales/delete/${idPunto}`)
};