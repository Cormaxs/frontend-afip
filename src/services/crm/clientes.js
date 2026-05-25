import api from '../../api/api.js';

export const ClientesService = {
    crearCliente: (datos) => api.post('/api/v1/clients', datos),
    obtenerClientesEmpresa: (idEmpresa, params) => api.get(`/api/v1/clients/company/${idEmpresa}`, { params }),
    obtenerCliente: (id) => api.get(`/api/v1/clients/${id}`),
    actualizarCliente: (id, datos) => api.put(`/api/v1/clients/${id}`, datos),
    eliminarCliente: (id) => api.delete(`/api/v1/clients/${id}`)
};
