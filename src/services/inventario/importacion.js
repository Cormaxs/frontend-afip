import api from '../../api/api.js';

export const ImportacionService = {
  // Importar productos masivamente (Excel/CSV)
  importarProductos: (empresaId, puntoVentaId, archivo) => {
    const formData = new FormData();
    formData.append('importar-db', archivo);
    
    return api.post(
      `/api/v1/archivos/products-masivo/${empresaId}/${puntoVentaId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }
};
