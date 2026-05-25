import api from '../../api/api.js';


export const ProductosService = {
    
    crearProducto : (datos) => api.post('/api/v1/products/add', datos),
    buscadorgeneralProduct : (datos) => api.get('/api/v1/products/buscar', { params: datos }),
    editarProducto : (idProduct, datos) => api.post('/api/v1/products/update/' + idProduct, datos),
    eliminarProducto : (idProduct) => api.delete('/api/v1/products/delete/' + idProduct),
    obtenerMovimientos : (idProduct, params) => api.get(`/api/v1/products/movimientos/${idProduct}`, { params }),
    ingresarMercaderia : (datos) => api.post('/api/v1/products/ingresar-mercaderia', datos),
    //agregar demas funcionalidades a futuro
}