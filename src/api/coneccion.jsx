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

export async function get_caja_company_api(idEmpresa, currentPage, filters) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.get(`/cajas/empresa/${idEmpresa}`, {params: { page: currentPage, ...filters }});
    return response.data;
}

export async function Ingreso_Egreso_Caja_api(data, idCaja) {
    // Para cargas de archivos, Axios detecta FormData y establece el 'Content-Type' correcto.
    const response = await axiosInstance.post(`/cajas/${idCaja}/transaccion`, data);
    return response.data;
}
// --- Obtención de Recursos (GET) ---

export async function getPointSales(idEmpresa, page, limit, filters) {
    const { nombre, provincia, numero } = filters || {};
    const response = await axiosInstance.get(`/point-sales/${idEmpresa}`, { params: { page, limit,nombre, provincia, numero  } });
    return response.data;
}

export async function getProductsCompany(idEmpresa, page, limit, category, product, marca, puntoVenta) {
    // Es mejor práctica pasar parámetros de URL a través del objeto `params`
    const response = await axiosInstance.get(`/products/${idEmpresa}`, { params: { page, limit, category, product, marca, puntoVenta} });
    return response.data;
}

export async function getCategoryCompany(idEmpresa, idPuntoVenta) {
    // Es mejor práctica pasar parámetros de URL a través del objeto `params`
    const response = await axiosInstance.get(`/products/get/all/category/${idEmpresa}`, {params: { idPuntoVenta }});
    return response.data;
}

export async function getMarcaCompany(idEmpresa, idPuntoVenta) {
    // Es mejor práctica pasar parámetros de URL a través del objeto `params`
    const response = await axiosInstance.get(`/products/get/all/marca/${idEmpresa}`, {params: { idPuntoVenta }});
    return response.data;
}

export async function getTikets(idEmpresa, page, limit, searchQuery, puntoventa) {
    // Construimos los parámetros para la petición
    const params = {
      page,
      limit,
      puntoventa,
    };
  
    // Solo añadimos el parámetro de búsqueda si no está vacío
    if (searchQuery) {
      params.search = searchQuery;
    }
  
    const response = await axiosInstance.get(`/tikets/get/all/${idEmpresa}`, { params });
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



export async function getProductsAgotados(idEmpresa, puntoDeVenta, filters) {
    const {page, limit} = filters || {};
    const response = await axiosInstance.get(`/products/agotados/${idEmpresa}/${puntoDeVenta}`, { params: { page, limit} });
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function getPriceInventario(idEmpresa, puntoDeVenta) {
    const response = await axiosInstance.get(`/products/totalInventario/${idEmpresa}/${puntoDeVenta}`);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function update_product_inventario(idProduct, dateproduct) {
    const response = await axiosInstance.post(`/products/update/${idProduct}`, dateproduct);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function deleted_product_coneccion(idProduct) {
    const response = await axiosInstance.delete(`/products/delete/${idProduct}`);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}

export async function UpdateUser(idUser, data) {
    const response = await axiosInstance.post(`/auth/update/${idUser}`, data);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function UpdateEmpresa(idEmpresa, data) {
    const response = await axiosInstance.post(`/companies/update/${idEmpresa}`, data);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function updateOrCreateMarcas_coneccion(data) {
    const response = await axiosInstance.post(`/products/marcas/`, data);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}

export async function updateOrCreateCategorias_coneccion(data) {
    const response = await axiosInstance.post(`/products/categorias/`, data);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}

export async function deleteCategoria_coneccion(categoria, empresaId) {
    const response = await axiosInstance.delete(`/products/delete/categoria/${categoria}/${empresaId}`);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function deleteMarca_coneccion(marca, empresaId) {
    const response = await axiosInstance.delete(`/products/delete/Marca/${marca}/${empresaId}`);
    // OJO: antes devolvías `response`, ahora devolvemos `response.data` para ser consistentes.
    // Si necesitas el status o headers, puedes seguir devolviendo `response` completo.
    return response.data;
}


export async function GenerateFacturas_coneccion(data) {
    try {
        const response = await axiosInstance.post(`/facturas/create/probar-facturas`, data, {
            responseType: 'blob' // <-- ¡Esta es la corrección clave!
        });

        // La respuesta ya es un Blob, por lo que la devolvemos directamente
        return response.data;

    } catch (error) {
        // Manejo de errores: Si el servidor devuelve un error, este será un Blob.
        // Necesitamos leerlo como texto para obtener el mensaje de error.
        if (error.response && error.response.data instanceof Blob) {
            const errorBlob = error.response.data;
            const text = await errorBlob.text();
            
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || "Error desconocido del servidor.");
            } catch {
                throw new Error(text || "Ocurrió un error inesperado al generar el PDF.");
            }
        }
        throw error; // Re-lanza cualquier otro tipo de error
    }
}



export async function getFacturas_coneccion(options) {
    try {
        const response = await axiosInstance.get(`/facturas/get/facturas`, {
            params: options,
        });

        return response.data;
    } catch (error) {
        // Verifica si el error es una cancelación de Axios
        if (!axios.isCancel(error)) {
            console.error("Error en getFacturas_coneccion:", error);
        }
        throw error;
    }
}


export async function getFacturasPdfDescargar(idAdmin, ventaId) {
    console.log("Descargando factura para:", idAdmin, ventaId);
    const response = await axiosInstance.get(`/archivos/facturas/${idAdmin}/${ventaId}`, {
        responseType: 'blob' // La configuración específica se mantiene en la llamada que la necesita
    });

    const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    return pdfUrl;
}