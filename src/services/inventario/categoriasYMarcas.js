import api from '../../api/api.js';

export const CategoriasYMarcasService = {
  // CATEGORÍAS
  obtenerCategorias: (idEmpresa, params = {}) =>
    api.get(`/api/v1/products/get/all/category/${idEmpresa}`, { params }),

  crearCategoria: ({ nombre, empresa }) =>
    api.post('/api/v1/products/categorias/', {
      nombreNuevo: nombre,
      idEmpresa: empresa,
    }),

  actualizarCategoria: ({ nombre, empresa, nombreAntiguo }) =>
    api.post('/api/v1/products/categorias/', {
      nombreNuevo: nombre,
      idEmpresa: empresa,
      nombreAntiguo,
    }),

  eliminarCategoria: (nombreCategoria, idEmpresa) =>
    api.delete(`/api/v1/products/delete/categoria/${encodeURIComponent(nombreCategoria)}/${idEmpresa}`),

  // MARCAS
  obtenerMarcas: (idEmpresa, params = {}) =>
    api.get(`/api/v1/products/get/all/marca/${idEmpresa}`, { params }),

  crearMarca: ({ nombre, empresa }) =>
    api.post('/api/v1/products/marcas/', {
      nombreNuevo: nombre,
      idEmpresa: empresa,
    }),

  actualizarMarca: ({ nombre, empresa, nombreAntiguo }) =>
    api.post('/api/v1/products/marcas/', {
      nombreNuevo: nombre,
      idEmpresa: empresa,
      nombreAntiguo,
    }),

  eliminarMarca: (nombreMarca, idEmpresa) =>
    api.delete(`/api/v1/products/delete/marca/${encodeURIComponent(nombreMarca)}/${idEmpresa}`),
};
