import api from '../../api/api.js';

export const ReportesService = {
  // Resumen de ventas
  obtenerResumenVentas: (idEmpresa, params = {}) =>
    api.get(`/api/v1/reports/sales-summary/${idEmpresa}`, { params }),
  
  // Productos más vendidos
  obtenerMasVendidos: (idEmpresa, params = {}) =>
    api.get(`/api/v1/reports/best-sellers/${idEmpresa}`, { params }),
  
  // Productos menos vendidos
  obtenerMenosVendidos: (idEmpresa, params = {}) =>
    api.get(`/api/v1/reports/worst-sellers/${idEmpresa}`, { params }),
  
  // Alertas de stock
  obtenerAlertasStock: (idEmpresa, params = {}) =>
    api.get(`/api/v1/reports/stock-alerts/${idEmpresa}`, { params }),
  // Reporte detallado de productos (opcional: start, end)
  obtenerReporteProductos: (idEmpresa, params = {}) =>
    api.get(`/api/v1/reports/product-report/${idEmpresa}`, { params }),
  // Resumen financiero: ingresos, egresos, compras, COGS, soporta granularity
  obtenerResumenFinanciero: (idEmpresa, params = {}) =>
    api.get(`/api/v1/reports/financial-summary/${idEmpresa}`, { params }),
};
