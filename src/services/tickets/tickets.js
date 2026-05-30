import api from '../../api/api.js';

export const ticketsService = {
  crearTicketInterno: (idUser, body) => api.post(`/api/v1/tickets/create/${idUser}`, body, {
    responseType: 'blob'
  }),
  
  getTickets: (idEmpresa, params = {}) => api.get(`/api/v1/tickets/get/all/${idEmpresa}`, { 
    params 
  }),

  recuperarTicket: (idTicket) => api.get(`/api/v1/tickets/pdf/${idTicket}`, {
    responseType: 'arraybuffer'
  }),

  // Notas de Pedido
  createNotaPedido: (body) => api.post('/api/v1/tickets/nota-pedido', body),
  getNotasPedido: (idEmpresa, params = {}) => api.get(`/api/v1/tickets/nota-pedido/${idEmpresa}`, { params }),
  updateNotaPedidoStatus: (idNota, body) => api.put(`/api/v1/tickets/nota-pedido/${idNota}/status`, body),
  updateNotaPedidoData: (idNota, body) => api.put(`/api/v1/tickets/nota-pedido/${idNota}/data`, body),
  facturarNotaPedido: (idNota, body) => api.post(`/api/v1/tickets/nota-pedido/${idNota}/facturar`, body),
  recuperarNotaPedidoPdf: (idNota) => api.get(`/api/v1/tickets/nota-pedido/pdf/${idNota}`, {
    responseType: 'arraybuffer'
  })
};
