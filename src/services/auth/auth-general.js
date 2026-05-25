import api from '../../api/api.js';


export const authService = {
    
    registerEmpresa : (datos) => api.post('/api/v1/companies/create', datos),
    registrarUsuarios : (datos) => api.post('/api/v1/auth/register', datos),
    loginUsers : (datos) => api.post('/api/v1/auth/login', datos),
    actualizarUsuario : (userId, datos) => api.post('/api/v1/auth/update/' + userId, datos),
}