import { afipService } from '../services/afip/afip-general.js';
import { puntosVentaService } from '../services/puntosVenta/puntosVenta.js';

export class FacturacionRequerimentos {
    
    /**
     * 1. LÓGICA DE NUMERACIÓN
     * Obtiene el próximo número de factura validado (Local vs AFIP).
     */
    static async obtenerProximoNumero({ idDbAfip, puntoVenta, tipoComprobante, datosEmpresa }) {
        if (!idDbAfip || !puntoVenta || !tipoComprobante) {
            throw new Error("Faltan parámetros requeridos (ID, Punto de Venta o Tipo)");
        }

        try {
            // CARGA RÁPIDA (DB LOCAL)
            const resL = await afipService.ultComprobanteLocal({ userId: idDbAfip, puntoVenta, tipoComprobante });
            const ultL = resL.data?.data?.ultimoNumero ?? 0;
            let proximoNumero = ultL + 1;

            // VERIFICACIÓN CON AFIP
            if (datosEmpresa?.cuit) {
                const resA = await afipService.ultComprobanteAfip({
                    id: idDbAfip, cuit: datosEmpresa.cuit, servicio: 'wsfe',
                    puntoVenta, tipoComprobante
                });
                const ultA = resA.data?.data?.CbteNro ?? 0;

                // SINCRONIZACIÓN SI HAY DISCREPANCIA
                if (ultL !== ultA) {
                    await afipService.sincronizarComprobantes({
                        id: idDbAfip, cuit: datosEmpresa.cuit, servicio: "wsfe",
                        puntosVenta: [{ puntoVenta, name: "Auto-Fix Facstock Service" }]
                    });
                    proximoNumero = ultA + 1;
                }
            }
            return proximoNumero;
        } catch (error) {
            console.error("Error en obtenerProximoNumero:", error);
            throw error;
        }
    }

    /**
     * 2. LÓGICA DE PUNTOS DE VENTA
     * Obtiene el listado de PV de la empresa y retorna el activo/principal.
     */
    static async obtenerConfiguracionPuntosVenta(idEmpresa) {
        if (!idEmpresa) throw new Error("ID de empresa requerido");
    
        try {
            const res = await puntosVentaService.obtenerPuntosVenta(idEmpresa);
            
            // El backend devuelve { puntosDeVenta: [], pagination: {} } dentro de res.data
            const puntos = res?.data?.puntosDeVenta || [];
            const pagination = res?.data?.pagination || null;
            
            // Ahora sí, buscamos sobre el array correcto
            const principal = puntos.find(pv => pv.activo) || puntos[0] || null;
    
            return {
                todos: puntos,
                principal: principal,
                tienePuntos: puntos.length > 0,
                pagination: pagination // Mantenemos la paginación para la tabla
            };
        } catch (error) {
            console.error("Error al obtener puntos de venta en la clase:", error);
            throw error;
        }
    }






    //IMPORTANTE PARA QUE NO HAYA ERRORES------------------------------------------------------------------------------

    
    /**
     * 3. FORMATO VISUAL
     * Convierte números a formato fiscal 0000-00000000
     */
    static formatearComprobante(puntoVenta, numero) {
        const pv = String(puntoVenta || 0).padStart(4, '0');
        const num = String(numero || 0).padStart(8, '0');
        return `${pv}-${num}`;
    }

    /**
     * 4. VALIDACIÓN PRE-EMISIÓN
     * Verifica que el punto de venta tenga los datos mínimos para ARCA
     */
    static validarPuntoVentaParaFacturar(pv) {
        if (!pv) return { valido: false, msj: "No hay punto de venta seleccionado" };
        
        const camposRequeridos = ['numero', 'direccion', 'provincia', 'ciudad'];
        const faltantes = camposRequeridos.filter(campo => !pv[campo]);

        return {
            valido: faltantes.length === 0,
            faltantes
        };
    }
}