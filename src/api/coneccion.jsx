import axios from 'axios';

// Define la URL base de tu backend
// Puedes cambiarla por 'http://localhost:3000/api/v1 https://api.facstock.com/api/v1' para producción o desarrollo remoto
const URL_BACKEND = ' https://api.facstock.com/api/v1'; 

// --- Función de manejo de errores centralizada ---
// Esto ayuda a evitar repetir el mismo bloque try/catch y console.error
function handleError(error, functionName = "API call") {
    console.error(`Error en la función ${functionName}:`, error);
    // Puedes agregar lógica para mostrar notificaciones al usuario, loggear en un servicio externo, etc.
    if (error.response) {
        // El servidor respondió con un estado fuera del rango 2xx
        console.error("Data:", error.response.data);
        console.error("Status:", error.response.status);
        console.error("Headers:", error.response.headers);
        throw new Error(error.response.data.message || `Error del servidor (${error.response.status})`);
    } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        console.error("No se recibió respuesta del servidor:", error.request);
        throw new Error("No se pudo conectar con el servidor. Intente de nuevo más tarde.");
    } else {
        // Algo más causó el error
        console.error("Error al configurar la solicitud:", error.message);
        throw new Error(`Error inesperado: ${error.message}`);
    }
}

// --- Funciones de Autenticación ---

export async function Register(data) {
    try {
        console.log("Registrando usuario:", data);
        const response = await axios.post(`${URL_BACKEND}/auth/register`, data);
        return response.data;
    } catch (error) {
        handleError(error, "Register");
    }
}

export async function Login(data) {
    try {
        console.log("Intentando iniciar sesión:", data);
        const response = await axios.post(`${URL_BACKEND}/auth/login`, data);
        console.log("Login exitoso. Datos devueltos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "Login");
    }
}

// --- Funciones de Gestión de Recursos ---

export async function addProduct(data) {
    try {
        console.log("Agregando producto:", data);
        const response = await axios.post(`${URL_BACKEND}/products/add`, data);
        console.log("Producto agregado. Datos devueltos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "addProduct");
    }
}

export async function addPointSale(data) {
    try {
        console.log("Agregando punto de venta:", data);
        const response = await axios.post(`${URL_BACKEND}/point-sales/create`, data);
        console.log("Punto de venta agregado. Datos devueltos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "addPointSale");
    }
}

export async function addVendedores(data) {
    try {
        console.log("Registrando vendedor:", data);
        const response = await axios.post(`${URL_BACKEND}/vendors/register`, data);
        console.log("Vendedor registrado. Datos devueltos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "addVendedores");
    }
}

export async function createEmpresaApi(data) {
    try {
        console.log("Creando empresa:", data);
        const response = await axios.post(`${URL_BACKEND}/companies/create`, data);
        console.log("Empresa creada. Datos devueltos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "createEmpresaApi");
    }
}

export async function getPointSales(idEmpresa) {
    try {
        console.log(`Solicitando puntos de venta para ID de empresa: ${idEmpresa}`);
        const response = await axios.get(`${URL_BACKEND}/point-sales/${idEmpresa}`);
        console.log("Puntos de venta recibidos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "getPointSales");
    }
}

export async function getProductsCompany(idEmpresa, page,limit ) {
    try {
        console.log(`Solicitando productos para ID de empresa: ${idEmpresa}`);
        const response = await axios.get(`${URL_BACKEND}/products/${idEmpresa}?page=${page}&limit=${limit}`);
        console.log("Productos recibidos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "getProductsCompany");
    }
}

// --- Función para Crear Ticket ---

export async function createTiket(ticketDetails, idUserParam, idEmpresaParam) {
    try {
       // console.log("Creando ticket con detalles:", ticketDetails);
        //console.log("ID de usuario para URL:", idUserParam);
        //console.log("ID de empresa para body:", idEmpresaParam);

        // Ajusta la URL del endpoint según la configuración de tu backend.
        // Asumiendo que tu ruta es POST /api/v1/tikets/create/:idUser
        const response = await axios.post(`${URL_BACKEND}/tikets/create/${idUserParam}`, {
            datos: ticketDetails, // Envía el objeto 'ticketDetails' como la propiedad 'datos'
            idEmpresa: idEmpresaParam // Envía el 'idEmpresa' directamente en el body
        });
        
        //console.log("Ticket creado. Respuesta:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "createTiket");
    }
}

export async function getTikets(idEmpresa, page, limit){
    const response = await axios.get(`${URL_BACKEND}/tikets/get/all/${idEmpresa}?page=${page}&limit=${limit}`);
    return response.data;
}



export async function getEmpresaDataId(idEmpresa) {
    try {
        console.log(`Solicitando puntos de venta para ID de empresa: ${idEmpresa}`);
        const response = await axios.get(`${URL_BACKEND}/companies/get/${idEmpresa}`);
        console.log("Puntos de venta recibidos:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "getPointSales");
    }
}


export async function getProductCodBarraApi(idEmpresa, puntoDeVenta, codBarra) {
    try {
        console.log(`Buscando producto por código de barras para empresa: ${idEmpresa}, punto de venta: ${puntoDeVenta} codigo de barras : ${codBarra}`);
        console.log(`ruta -> ${URL_BACKEND}/products/get/codBarra/${idEmpresa}/${puntoDeVenta}`);
        // Realiza una solicitud POST, enviando el codBarra en el cuerpo
        const response = await axios.get(`${URL_BACKEND}/products/get/${codBarra}/${idEmpresa}/${puntoDeVenta}`
        );
        
        console.log("Producto recibido:", response.data);
        return response; // Devuelve los datos del producto
    } catch (error) {
        handleError(error, "getProductCodBarra");
    }
}


export async function getTiketsPdfDescargar(idAdmin, idVenta) {
    try {
        const response = await axios.get(`${URL_BACKEND}/archivos/descargar/${idAdmin}/${idVenta}`, {
            responseType: 'blob' // ¡IMPORTANTE! Indica que la respuesta es un blob (archivo binario)
        });

        // Crear una URL para el blob recibido
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Opción 1: Abrir el PDF en una nueva pestaña
        window.open(pdfUrl, '_blank');

        // Opción 2: Descargar automáticamente el PDF
        /* 
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `ticket_${idVenta}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        */

        return pdfUrl; // Puedes devolver la URL si necesitas usarla después
    } catch (error) {
        handleError(error, "getTiketsPdfDescargar");
    }
}