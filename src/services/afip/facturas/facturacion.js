import api from '../../../api/api.js';

export const facturasService = {
    // Agregamos el tercer parámetro con la configuración de Axios
    emitirfacturas: (datos) => api.post('/api/v1/afip/facturas/emitir', datos, {
        responseType: 'blob' // <--- ESTO ES LA CLAVE
    }),
    //recuperar factura
    recuperarFactura: (idFactura) => api.get(`/api/v1/afip/facturas/recuperar/${idFactura}`, {
        responseType: 'blob' // <--- ESTO ES LA CLAVE
      
    }),
    //buscador
    buscarFacturas: (params) => api.get('/api/v1/afip/facturas/buscar?', { params }),

    //reintentar facturacion
    reintentarFacturacion: (idFactura, datos) => api.post(`/api/v1/afip/facturas/reintentar/${idFactura}`, datos), //debo mandar idEmpresa afip, cuit, servicio en body

    //anular factura
    anularFactura: (datosAnulacion) => api.post(`/api/v1/afip/facturas/anular`, datosAnulacion), //mando lop necesario en body
}


//ajustar el backend para reintentos de facturas en afip y no duplicar el numero de la factura