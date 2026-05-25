import api from '../../api/api.js';

export const ticketsService = {
  crearTicketInterno: (idUser, body) => api.post(`/api/v1/tickets/create/${idUser}`, body, {
    responseType: 'blob'
  }),
};
