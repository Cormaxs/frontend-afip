import axios from 'axios';

// ============================================================================
// 1. CONFIGURACIÓN CENTRAL DE AXIOS
// ============================================================================

// Determina la URL base según el entorno (desarrollo vs. producción) http://localhost:3000/api/v1  https://api.facstock.com/api/v1
const URL_BACKEND = "https://api.facstock.com/api/v1"

// Crea una instancia de Axios con configuración predeterminada
const axiosInstance = axios.create({
    baseURL: URL_BACKEND,
    // headers: { 'Content-Type': 'application/json' } // Puedes añadir headers por defecto aquí
});

// ============================================================================
// 2. INTERCEPTORES (LÓGICA AUTOMÁTICA PARA CADA LLAMADA)
// ============================================================================

// --- Interceptor de Petición (Request) ---
// Se ejecuta ANTES de que cada petición sea enviada. Ideal para añadir tokens.
axiosInstance.interceptors.request.use(
    (config) => {
        // Ejemplo: Obtener token del localStorage y añadirlo a los headers
        // const token = localStorage.getItem('token');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        // Esto rara vez se dispara, pero es bueno tenerlo.
        return Promise.reject(error);
    }
);

//console.log("backend -> ", URL_BACKEND)
// --- Interceptor de Respuesta (Response) ---
// Se ejecuta DESPUÉS de recibir una respuesta. Ideal para manejar errores globales.
axiosInstance.interceptors.response.use(
    (response) => {
        // Si la respuesta es exitosa (status 2xx), simplemente la devuelve.
        return response;
    },
    (error) => {
        // Si la respuesta es un error, aquí se maneja la parte del LOGGING.
        console.error("Error detectado por el interceptor de Axios:", error);
        
        if (error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
        } else if (error.request) {
            console.error("No se recibió respuesta del servidor:", error.request);
        } else {
            console.error("Error al configurar la solicitud:", error.message);
        }
        
        // ¡CRUCIAL! Rechazamos la promesa para que el bloque .catch() en el
        // componente o contexto que hizo la llamada sea ejecutado.
        return Promise.reject(error);
    }
);


// ============================================================================
// 3. FUNCIONES DE LA API (SIMPLIFICADAS)
// ============================================================================
// Ahora cada función es una línea simple que se enfoca en su tarea.

// --- Autenticación ---

export async function Register(data) {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
}

export async function Login(data) {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
}

// --- Gestión de Recursos (POST) ---

export async function addProduct(data) {
    const response = await axiosInstance.post('/products/add', data);
    return response.data;
}

export async function addPointSale(data) {
    const response = await axiosInstance.post('/point-sales/create', data);
    return response.data;
}

export async function addVendedores(data) {
    const response = await axiosInstance.post('/vendors/register', data);
    return response.data;
}

export async function createEmpresaApi(data) {
    const response = await axiosInstance.post('/companies/create', data);
    return response.data;
}

export async function createTiket(ticketDetails, idUserParam, idEmpresaParam) {
    const response = await axiosInstance.post(`/tikets/create/${idUserParam}`, {
        datos: ticketDetails,
        idEmpresa: idEmpresaParam
    });
    return response.data;
}

export async function CargarMasiva_api(data, empresaId, puntoVentaid) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.post(`/archivos/products-masivo/${empresaId}/${puntoVentaid}`, data);
    return response.data;
}

export async function AbrirCaja_api(data) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.post(`/cajas/abrirCaja/`, data);
    return response.data;
}
export async function CerrarCaja_api(data, idCaja) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.post(`/cajas/cerrarCaja/${idCaja}`, data);
    return response.data;
}

export async function get_caja_id_api(idCaja) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.get(`/cajas/${idCaja}`);
    return response.data;
}

export async function get_caja_company_api(idEmpresa) {
    console.log("id empresa desde coneccion -> ",idEmpresa)
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.get(`/cajas/empresa/${idEmpresa}`);
    return response.data;
}

export async function Ingreso_Egreso_Caja_api(data, idCaja) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.post(`/cajas/${idCaja}/transaccion`, data);
    return response.data;
}
// --- Obtención de Recursos (GET) ---

export async function getPointSales(idEmpresa, page, limit) {
    console.log(page)
    const response = await axiosInstance.get(`/point-sales/${idEmpresa}?page=${page}&limit=${limit}`);
    return response.data;
}

export async function getProductsCompany(idEmpresa, page, limit, category, product, marca) {
    // Es mejor práctica pasar parámetros de URL a través del objeto `params`
    console.log(page, limit)
    const response = await axiosInstance.get(`/products/${idEmpresa}`, { params: { page, limit, category, product, marca} });
    return response.data;
}

export async function getTikets(idEmpresa, page, limit) {
    const response = await axiosInstance.get(`/tikets/get/all/${idEmpresa}`, { params: { page, limit } });
    return response.data;
}

export async function getEmpresaDataId(idEmpresa) {
    const response = await axiosInstance.get(`/companies/get/${idEmpresa}`);
    return response.data;
}

export async function getProductCodBarraApi(idEmpresa, puntoDeVenta, codBarra) {
    const response = await axiosInstance.get(`/products/get/${codBarra}/${idEmpresa}/${puntoDeVenta}`);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}

export async function getTiketsPdfDescargar(idAdmin, idVenta) {
    const response = await axiosInstance.get(`/archivos/descargar/${idAdmin}/${idVenta}`, {
        responseType: 'blob' // La configuración específica se mantiene en la llamada que la necesita
    });

    const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    return pdfUrl;
}