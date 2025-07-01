import { createContext, useState } from "react";
import { Login, Register, createEmpresaApi, addProduct,
     addPointSale, getPointSales, addVendedores, getProductsCompany,
     createTiket, getTikets, getEmpresaDataId, getProductCodBarraApi, getTiketsPdfDescargar
    } from "../api/coneccion";

export const apiContext = createContext();

export const ApiProvider = ({ children }) => {
    // 1. Inicializa isAuthenticated leyendo directamente de localStorage
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const storedUserData = localStorage.getItem("userData");
        return !!storedUserData; // Devuelve true si hay userData en localStorage, false si no
    });

    // 2. Inicializa userData de forma segura con una función en useState
    const [userData, setUserData] = useState(() => {
        const storedUserData = localStorage.getItem("userData");
        try {
            // Intenta parsear los datos. Si hay un error (ej. JSON corrupto), devuelve null.
            return storedUserData ? JSON.parse(storedUserData) : null;
        } catch (error) {
            console.error("Error parsing userData from localStorage:", error);
            localStorage.removeItem("userData"); // Limpiar datos corruptos
            return null;
        }
    });

    // 3. Inicializa companyData de forma similar
    const [companyData, setCompanyData] = useState(() => {
        const storedCompanyData = localStorage.getItem("dataEmpresa");
        try {
            return storedCompanyData ? JSON.parse(storedCompanyData) : null;
        } catch (error) {
            console.error("Error parsing companyData from localStorage:", error);
            localStorage.removeItem("dataEmpresa"); // Limpiar datos corruptos
            return null;
        }
    });
    const login = async (data) => {
        try {
            const responseData = await Login(data);
            if (responseData) {
                localStorage.setItem("userData", JSON.stringify(responseData));
                setIsAuthenticated(true); // Update state on successful login
                setUserData(responseData); // Store user data
                const dataEmpresa = await getCompanyID(responseData.empresa)
                console.log("datos de la empresa -> ", dataEmpresa);
                localStorage.setItem("dataEmpresa", JSON.stringify(dataEmpresa));
                return responseData;
            } else {
                throw new Error("No se pudo obtener datos del usuario después del login.");
            }
        } catch (error) {
            console.error("Error en la función login del Context:", error);
            throw error;
        }
    };

    const register = async (userDataToRegister) => {
        console.log("Datos de registro recibidos en Context:", userDataToRegister);
        try {
            const responseData = await Register(userDataToRegister);
            if (responseData) {
                console.log("Registro exitoso en Context:", responseData);
                return responseData;
            } else {
                throw new Error("No se pudo completar el registro. Datos inválidos o error del servidor.");
            }
        } catch (error) {
            console.error("Error en la función register del Context:", error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    };
    

    const logout = () => {
        localStorage.removeItem("userData");
        localStorage.removeItem("dataEmpresa"); // Also clear company data on logout
        setIsAuthenticated(false);
        setUserData(null);
        console.log("Sesión cerrada.");
    };

    const createEmpresa = async (empresaData) => {
        try {
            console.log("API Context: Enviando datos de empresa:", empresaData);
            const response = await createEmpresaApi(empresaData);
            // Guardar en localStorage solo si la respuesta es exitosa y contiene el nombre de la empresa
            if (response && response.nombreEmpresa) {
                localStorage.setItem("dataEmpresa", JSON.stringify(response));
            }
            console.log("API Context: Empresa registrada, respuesta:", response);
            return response;
        } catch (error) {
            console.error("API Context: Error al registrar la empresa:", error);
            // Propagar el error con un mensaje significativo si está disponible del backend
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    };

    const createProduct = async (productData) => {
        try {
            console.log("API Context: Enviando datos de producto:", productData);
            const response = await addProduct(productData); // Call the API function
            console.log("API Context: Producto creado, respuesta:", response);
            return response; // Return the response data from the API
        } catch (error) {
            console.error("API Context: Error al crear el producto:", error);
            // Propagate the error with a meaningful message if available from the backend
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error; // Re-throw the original error if no specific message
        }
    };

    const createPointSale = async (dataPoint) => {
        try {
            console.log("API Context: Enviando datos de punto de venta:", dataPoint);
            const response = await addPointSale(dataPoint); // Llama a la función de la API
            console.log("API Context: Punto de venta creado, respuesta:", response);
            return response; // Devuelve la respuesta de la API
        } catch (error) {
            console.error("API Context: Error al crear el punto de venta:", error);
            // Propaga el error con un mensaje significativo si está disponible del backend
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error; // Vuelve a lanzar el error original si no hay un mensaje específico
        }
    };

    const getPointsByCompany = async (idEmpresa) => { // Renombré a getPointsByCompany para mayor claridad
        try {
            console.log(`API Context: Obteniendo puntos de venta para empresa ID: ${idEmpresa}`);
            const response = await getPointSales(idEmpresa); // Llama a la función de la API
            console.log("API Context: Puntos de venta obtenidos, respuesta:", response);
            return response; // Devuelve los puntos de venta
        } catch (error) {
            console.error("API Context: Error al obtener puntos de venta:", error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    };

    const createVendedor = async (dataVendedor) => { // Renombré a `createVendedor` (camelCase) para consistencia
        try {
            console.log("API Context: Enviando datos de vendedor:", dataVendedor);
            const vendedorAgregado = await addVendedores(dataVendedor); // Llama a la función de la API
            console.log("API Context: Vendedor agregado, respuesta:", vendedorAgregado);
            return vendedorAgregado; // Devuelve la respuesta de la API
        } catch (error) {
            console.error("API Context: Error al crear el vendedor:", error);
            // Propaga el error con un mensaje significativo si está disponible del backend
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error; // Vuelve a lanzar el error original si no hay un mensaje específico
        }
    };

    const getProductsEmpresa = async (idEmpresa, page, limit) => {
        try {
          console.log(`API Context: Obteniendo productos para empresa ID: ${idEmpresa}`);
          const productos = await getProductsCompany(idEmpresa, page, limit);
          console.log("API Context: Productos obtenidos, respuesta:", productos);
          return productos; // Devuelve los productos
        } catch (error) {
          console.error("API Context: Error al obtener productos de la empresa:", error);
          if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
          }
          throw error;
        }
      };

      const createTiketContext = async (ticketDataForBackend) => {
        try {
            //console.log("API Context: Datos de ticket recibidos para enviar:", ticketDataForBackend);
            const userDataString = localStorage.getItem("userData");
            let idUsuario = null;

            if (userDataString) {
                try {
                    const user = JSON.parse(userDataString);
                    if (user._id) {
                        idUsuario = user._id;
                    }
                } catch (e) {
                    console.error("Error al parsear userData de localStorage en apiContext:", e);
                }
            }

            if (!idUsuario) {
                throw new Error("ID de usuario no disponible. Por favor, inicie sesión.");
            }
            const idEmpresa = ticketDataForBackend.idEmpresa; 
            const response = await createTiket(ticketDataForBackend, idUsuario, idEmpresa); 
            
            //console.log("API Context: Ticket creado, respuesta:", response);
            return response;
        } catch (error) {
            console.error("API Context: Error al crear el ticket:", error);
            throw error;
        }
    };

    const getTiketsContext = async (id, page, limit) =>{
        try{
            const respuesta = await getTikets(id, page, limit);
            console.log("desde context ",respuesta)
            return respuesta;
        }catch(err){

        }
    }

    const getCompanyID = async (idEmpresa) =>{
        try{
            const respuesta = await getEmpresaDataId(idEmpresa)
            return respuesta;
        }catch(err){

        }
    }
 
    const getProductCodBarra = async (idEmpresa, puntoVenta, codBarra) =>{
        try{
            console.log("recibidos -> desde getcod", idEmpresa, puntoVenta, codBarra)
            const respuesta = await getProductCodBarraApi(idEmpresa, puntoVenta, codBarra)
            //console.log("respuesta desde getProductCodBarra -> ", respuesta)
            return respuesta;
        }catch(err){

        }
    }

    const getTiketsPdf = async (idAdmin, ventaID) =>{
        try{
            const respuesta = await getTiketsPdfDescargar(idAdmin, ventaID);
            console.log(respuesta)
            return respuesta
        }catch(err){

        }
    }

    return (
        <apiContext.Provider value={{
            login,
            register,
            logout,
            createEmpresa,
            createProduct,
            createPointSale,
            getPointsByCompany,
            createVendedor, // Asegúrate de que el nombre aquí coincida con la función definida arriba (createVendedor)
            getProductsEmpresa,
            getTiketsContext,
            createTiketContext,
            getCompanyID,
            getProductCodBarra,
            getTiketsPdf,
            isAuthenticated,
            userData,
            companyData
        }}>
            {children} 
        </apiContext.Provider>
    );
};