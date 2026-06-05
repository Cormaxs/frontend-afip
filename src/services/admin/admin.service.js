import axios from 'axios';

// Usa variable de entorno o detecta puerto automáticamente (fallback a desarrollo local)
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3010").replace(/\/$/, "");

const adminApi = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/admin`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir el token dinámicamente
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminAuthToken');
    if (token) {
        config.headers.Authorization = token;
    } else {
        // Fallback por si acaso, aunque lo ideal es que el login lo setee
        config.headers.Authorization = 'Basic YWRtaW46YWRtaW4='; 
    }
    return config;
});

export const getCompaniesSummary = async () => {
    try {
        const response = await adminApi.get('/companies');
        return response.data;
    } catch (error) {
        console.error('Error completo:', error.response?.data || error.message);
        throw error;
    }
};

export const getCompanyDetails = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener detalles de la empresa:', error);
        throw error;
    }
};

export const getCompanyProducts = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/products`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener productos:', error);
        throw error;
    }
};

export const getCompanyTickets = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/tickets`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        throw error;
    }
};

export const getCompanyFacturas = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/facturas`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        throw error;
    }
};

export const getCompanyNotasPedido = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/notas-pedido`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener notas de pedido:', error);
        throw error;
    }
};

export const getCompanyCajas = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/cajas`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener cajas:', error);
        throw error;
    }
};

export const getCompanyPuntosVenta = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/puntos-venta`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener puntos de venta:', error);
        throw error;
    }
};

export const getCompanyPagosProveedor = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/pagos-proveedor`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener pagos a proveedores:', error);
        throw error;
    }
};

// Gestión de Planes
export const getAdminPlans = async () => {
    try {
        const response = await adminApi.get('/plans');
        return response.data;
    } catch (error) {
        console.error('Error al obtener planes:', error);
        throw error;
    }
};

export const createAdminPlan = async (planData) => {
    try {
        const response = await adminApi.post('/plans', planData);
        return response.data;
    } catch (error) {
        console.error('Error al crear plan:', error);
        throw error;
    }
};

export const updateAdminPlan = async (id, planData) => {
    try {
        const response = await adminApi.put(`/plans/${id}`, planData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar plan:', error);
        throw error;
    }
};

export const deleteAdminPlan = async (id) => {
    try {
        const response = await adminApi.delete(`/plans/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar plan:', error);
        throw error;
    }
};

export const getCompanyCuentasPagar = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/cuentas-pagar`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener cuentas por pagar:', error);
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const response = await adminApi.get('/users');
        return response.data;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
};

export const getCompanyPlanInfo = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/plan`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener información del plan:', error);
        throw error;
    }
};

export const getCompanyPlanLimits = async (companyId) => {
    try {
        const response = await adminApi.get(`/company/${companyId}/plan-limits`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener límites del plan:', error);
        throw error;
    }
};

export default adminApi;
