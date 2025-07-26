import { createContext, useState, useCallback } from "react";
import {
    Login, Register, createEmpresaApi, addProduct,
    addPointSale, getPointSales, addVendedores, getProductsCompany,
    createTiket, getTikets, getEmpresaDataId, getProductCodBarraApi, getTiketsPdfDescargar,
    CargarMasiva_api, AbrirCaja_api, CerrarCaja_api, Ingreso_Egreso_Caja_api,get_caja_id_api,
    get_caja_company_api, getCategoryCompany, getMarcaCompany, getProductsAgotados, getPriceInventario,
    update_product_inventario
} from "../api/coneccion";

// --- Helper para leer de localStorage de forma segura y sin repetición ---
const getInitialStateFromStorage = (key) => {
    try {
        const storedData = localStorage.getItem(key);
        if (!storedData) {
            return null; // No hay datos, devuelve null
        }

        const parsedData = JSON.parse(storedData);

        // --- ¡LA VALIDACIÓN CLAVE! ---
        // Verifica si el dato parseado es realmente un array.
        if (Array.isArray(parsedData)) {
            return parsedData; // Es un array, perfecto.
        }
        
        // Si no es un array (es un objeto, etc.), trátalo como inválido.
       // console.warn(`Los datos para '${key}' no son un array, se limpiarán.`);
        //localStorage.removeItem(key); // Opcional: limpiar datos incorrectos.
        return parsedData;

    } catch (error) {
        console.error(`Error al parsear '${key}' desde localStorage:`, error);
        localStorage.removeItem(key); // Limpiar datos corruptos
        return null;
    }
};

export const apiContext = createContext();

export const ApiProvider = ({ children }) => {
    // --- ESTADOS ---
    // Inicialización limpia usando el helper
    const [userData, setUserData] = useState(() => getInitialStateFromStorage("userData"));
    const [companyData, setCompanyData] = useState(() => getInitialStateFromStorage("dataEmpresa"));
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getInitialStateFromStorage("userData"));
    const [cajasActivas, setCajasActivas] = useState(() => getInitialStateFromStorage("cajasActivas") || []); // Inicializa como un array vacío si no hay datos
    // --- MANEJO DE SESIÓN ---

    const login = async (data) => {
        try {
            const userResponse = await Login(data);
            
            // Obtenemos los datos de la empresa después de un login exitoso
            const companyResponse = await getEmpresaDataId(userResponse.empresa);

            // Guardamos todo en localStorage
            localStorage.setItem("userData", JSON.stringify(userResponse));
            localStorage.setItem("dataEmpresa", JSON.stringify(companyResponse));

            // Actualizamos todos los estados de una vez
            setUserData(userResponse);
            setCompanyData(companyResponse);
            setIsAuthenticated(true);

            return userResponse;
        } catch (error) {
            console.error("Error en el flujo de login del Context:", error);
            throw error; // Relanzamos el error para que el componente de UI reaccione
        }
    };

    const logout = () => {
        localStorage.removeItem("userData");
        localStorage.removeItem("dataEmpresa");
        setUserData(null);
        setCompanyData(null);
        setIsAuthenticated(false);
        console.log("Sesión cerrada.");
    };

    // --- FUNCIONES WRAPPER DE LA API ---
    // Todas las funciones ahora siguen el mismo patrón simple y robusto.
    // Usamos useCallback para optimizar y evitar re-creaciones innecesarias de funciones.

    const register = useCallback(async (userDataToRegister) => {
        try {
            return await Register(userDataToRegister);
        } catch (error) {
            console.error("Error en register (Context):", error);
            throw error;
        }
    }, []);

    const createEmpresa = useCallback(async (empresaData) => {
        try {
            const response = await createEmpresaApi(empresaData);
            // Actualiza los datos de la empresa en el contexto si es exitoso
            if (response) {
                localStorage.setItem("dataEmpresa", JSON.stringify(response));
                setCompanyData(response);
            }
            return response;
        } catch (error) {
            console.error("Error en createEmpresa (Context):", error);
            throw error;
        }
    }, []);
    
    // El resto de las funciones ahora simplemente llaman a la API y manejan errores de forma unificada.
    const createProduct = useCallback(async (productData) => {
        try {
            return await addProduct(productData);
        } catch (error) {
            console.error("Error en createProduct (Context):", error);
            throw error;
        }
    }, []);

    const createPointSale = useCallback(async (dataPoint) => {
        try {
            return await addPointSale(dataPoint);
        } catch (error) {
            console.error("Error en createPointSale (Context):", error);
            throw error;
        }
    }, []);

    const getPointsByCompany = useCallback(async (idEmpresa, page, limit, filters) => { // Añadido `page` para consistencia
        try {
            console.log("llego a puntos de venta, page _ >", page, limit, filters);
            // Pasamos los parámetros que necesite la función de la API
            const respuesta = await getPointSales(idEmpresa, page, limit, filters);
            console.log(respuesta)
            return respuesta; 
        } catch (error) {
            console.error("Error en getPointsByCompany (Context):", error);
            throw error;
        }
    }, []);

    const createVendedor = useCallback(async (dataVendedor) => {
        try {
            return await addVendedores(dataVendedor);
        } catch (error) {
            console.error("Error en createVendedor (Context):", error);
            throw error;
        }
    }, []);

    const getProductsEmpresa = useCallback(async (idEmpresa, filters = {}) => {
        try {
          // Extraemos los valores del objeto filters. Si no vienen, serán undefined.
          const { page, limit, category, product, marca, puntoVenta } = filters;
            console.log(`getproducts : -> pagina -> ${page} limite -> ${limit} categoria -> ${category} producto -> ${product} marca -> ${marca} punto de venta -> ${puntoVenta}`);
            return await getProductsCompany(idEmpresa, page, limit, category, product, marca, puntoVenta);
        } catch (error) {
            console.error("Error en getProductsEmpresa (Context):", error);
            throw error;
        }
    }, []);


    const getCategoryEmpresa = useCallback(async (idEmpresa, idPuntoVenta  ) => {
        try {
            console.log(idPuntoVenta)
            return await getCategoryCompany(idEmpresa, idPuntoVenta);
        } catch (error) {
            console.error("Error en getProductsEmpresa (Context):", error);
            throw error;
        }
    }, []);



    const getMarcaEmpresa = useCallback(async (idEmpresa, idPuntoVenta  ) => {
        try {
            console.log("desde marca -> ", idPuntoVenta)
            return await getMarcaCompany(idEmpresa, idPuntoVenta);
        } catch (error) {
            console.error("Error en getProductsEmpresa (Context):", error);
            throw error;
        }
    }, []);


    const createTiketContext = useCallback(async (ticketDataForBackend) => {
        try {
            // Usamos el 'userData' del estado, no de localStorage. Es más seguro y eficiente.
            if (!userData?._id) {
                throw new Error("ID de usuario no disponible. Por favor, inicie sesión.");
            }
            const idEmpresa = ticketDataForBackend.idEmpresa;
            return await createTiket(ticketDataForBackend, userData._id, idEmpresa);
        } catch (error) {
            console.error("Error en createTiketContext (Context):", error);
            throw error;
        }
    }, [userData]); // Depende de userData, así que se añade a las dependencias

    const getTiketsContext = useCallback(async (id, page, limit, searchQuery, puntoventa) => { // 1. Añade searchQuery aquí
        try {
          // 2. Pasa searchQuery a la función de la API
          return await getTikets(id, page, limit, searchQuery, puntoventa);
        } catch (error) {
          console.error("Error en getTiketsContext (Context):", error);
          throw error;
        }
      }, []);

    const getCompanyID = useCallback(async (idEmpresa) => {
        try {
            return await getEmpresaDataId(idEmpresa);
        } catch (error) {
            console.error("Error en getCompanyID (Context):", error);
            throw error;
        }
    }, []);

    const getProductCodBarra = useCallback(async (idEmpresa, puntoVenta, codBarra) => {
        try {
            return await getProductCodBarraApi(idEmpresa, puntoVenta, codBarra);
        } catch (error) {
            console.error("Error en getProductCodBarra (Context):", error);
            throw error;
        }
    }, []);

    const getTiketsPdf = useCallback(async (idAdmin, ventaID) => {
        try {
            return await getTiketsPdfDescargar(idAdmin, ventaID);
        } catch (error) {
            console.error("Error en getTiketsPdf (Context):", error);
            throw error;
        }
    }, []);

    const cargaMasiva = useCallback(async (listado, empresaId, puntoVentaid) => {
        try {
            return await CargarMasiva_api(listado, empresaId, puntoVentaid);
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);


    const abrirCaja = useCallback(async (data) => {
        try {
            console.log("Datos recibidos para abrir caja:", data);
           const respuesta = await AbrirCaja_api(data)
           if(respuesta._id){
            localStorage.setItem("cajasActivas", JSON.stringify(respuesta)); // Guardamos la caja activa en localStorage
            const datosParaGuardar = Array.isArray(respuesta) ? respuesta : (respuesta ? [respuesta] : []);
            setCajasActivas(datosParaGuardar);
            console.log("caja desd context -> ",cajasActivas)
           }
            return respuesta;
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);


    const cerrarCaja = useCallback(async (data, idCaja) => {
        try {
            console.log(data)
            console.log("Datos recibidos para cerrar caja:", data, idCaja);
            setCajasActivas([])
            return await CerrarCaja_api(data, idCaja);
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);

    const ingreso_egreso = useCallback(async (data, idCaja) => {
        try {
            console.log("Datos recibidos para abrir caja:", data);
            return await Ingreso_Egreso_Caja_api(data, idCaja);
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);

    const get_caja_id = useCallback(async (idCaja) => {
        try {
            console.log("Datos recibidos para abrir caja:", data);
            return await get_caja_id_api(idCaja);
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);


    const get_caja_company = useCallback(async (idEmpresa, currentPage, filters) => {
        try {
            console.log("Datos recibidos para abrir caja:", idEmpresa, currentPage, filters);
            return await get_caja_company_api(idEmpresa, currentPage, filters);
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);
    


    const get_products_agotados = useCallback(async (idEmpresa, idPuntoVenta, filters) => {
        try {
            console.log("Datos recibidos para productos agotados:", idEmpresa, idPuntoVenta, filters);
            return await getProductsAgotados(idEmpresa, idPuntoVenta, filters);
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);


    const get_price_inventario = useCallback(async (idEmpresa, idPuntoVenta) => {
        try {
            console.log("Datos recibidos precio inventario:", idEmpresa, idPuntoVenta);
            const respuesta = await getPriceInventario(idEmpresa, idPuntoVenta);
            console.log(`respuesta precio -> ${respuesta?.valorTotalInventario}`)
            return respuesta;
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);


    const update_product = useCallback(async (idProduct, dateproduct) => {
        try {
            console.log("Datos recibidos precio inventario:", idProduct, dateproduct);
            const respuesta = await update_product_inventario(idProduct, dateproduct);
            return respuesta;
        } catch (error) {
            console.error("Error en cargaMasiva (Context):", error);
            throw error;
        }
    }, []);

    return (
        <apiContext.Provider value={{
            login,
            register,
            logout,
            createEmpresa,
            createProduct,
            createPointSale,
            getPointsByCompany,
            createVendedor,
            update_product,
            getProductsEmpresa,
            getTiketsContext,
            createTiketContext,
            getCompanyID, // La función se llama `getCompanyID`, pero la de la API es `getEmpresaDataId`
            getProductCodBarra,
            getTiketsPdf,
            cargaMasiva,
            abrirCaja,
            cerrarCaja,
            ingreso_egreso,
            get_caja_id,
            get_caja_company,
            getCategoryEmpresa,
            getMarcaEmpresa,
            get_products_agotados,
            get_price_inventario,
            isAuthenticated,
            userData,
            companyData,
            cajasActivas
        }}>
            {children}
        </apiContext.Provider>
    );
}; 