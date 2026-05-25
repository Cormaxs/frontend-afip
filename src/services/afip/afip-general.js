import api from '../../api/api.js';


export const afipService = {
    
    // CRUD EMPRESA --------------------------------------------------------------------------------        

    crearEmpresa : (datos) => api.post('/api/v1/afip/crearCompanyAfip', datos),
    actualizarEmpresa : (idEmpresa, datos) => api.post('/api/v1/afip/updateCompany/'+ idEmpresa, datos),
    //obtener datos de empresaAfip
    obtenerdatosEmpresa : (idDbAfip) => api.get(`/api/v1/afip/empresa/${idDbAfip}`), 
    
    // CREDENCIALES --------------------------------------------------------------------------------

    generarKeyCsr : (datos) => api.post(`/api/v1/afip/credenciales/generar`, datos), 
    guardarCrt : (datos) => api.post(`/api/v1/afip/credenciales/guardarCRT`, datos), 

    // TICKETS DE ACCESO ---------------------------------------------------------------------------------

    //verificar tiket de acceso
    verificarTA : (datos) => api.post(`/api/v1/afip/credenciales/verificarAcceso`, datos), //recibe idDbAfip, cuit, servicio

    // COMPROBANTES --------------------------------------------------------------------------------

    //ultimo comprobante local
    ultComprobanteLocal : (datos) => api.post(`/api/v1/afip/comprobantes/ultimodb`, datos),//userid es idDbAfip, puntoVenta y tipoComprobante
    //verificar numero en afip
    ultComprobanteAfip : (datos) => api.post(`/api/v1/afip/comprobantes/ultimoafip`, datos),//userid es idDbAfip, puntoVenta y tipoComprobante
    //sincronizo db local con afip
    sincronizarComprobantes : (datos) => api.post(`/api/v1/afip/comprobantes/sincronizar`, datos),

    //proximo numero de comprobante segun db local
   // proximoComprobantes : (datos) => api.post(`/api/v1/afip/comprobantes/proximo`, datos),
    //reservo un numero de comprobante como ocupado para facturas pendientes o rechazadas
    //reservarNumeroComprobantes : (datos) => api.post(`/api/v1/afip/comprobantes/reservar`, datos),


    //  FACTURACION --------------------------------------------------------------------------------
}