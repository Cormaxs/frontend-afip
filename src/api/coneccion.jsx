// src/api/axiosConfig.js
import axios from 'axios';
const URL_BACKEND = 'http://45.236.128.209/api/v1'; // Cambia esto a la URL de tu backend si es necesario localhost:3000 45.236.128.209


export async function Register (data){
    try{console.log(data)
        const creado = await axios.post(`${URL_BACKEND}/auth/register`, data);
        
        return creado.data; // Retorna los datos de la respuesta del backend
    }catch(error){
        console.error("Error en la función Login:", error);
    }
}


export async function Login (data){
  try{
      const creado = await axios.post(`${URL_BACKEND}/auth/login`, data);
      console.log("datos devueltos -> ", data)
      return creado.data; // Retorna los datos de la respuesta del backend
  }catch(error){
      console.error("Error en la función Login:", error);
  }
}

export async function addProduct (data){
    try{
        const creado = await axios.post(`${URL_BACKEND}/products/add`, data);
        console.log("datos devueltos -> ", data)
        return creado.data; // Retorna los datos de la respuesta del backend
    }catch(error){
        console.error("Error en la función Login:", error);
    }
  }
  
  export async function addPointSale (data){
    try{
        const creado = await axios.post(`${URL_BACKEND}/point-sales/create`, data);
        console.log("datos devueltos -> ", data)
        return creado.data; // Retorna los datos de la respuesta del backend
    }catch(error){
        console.error("Error en la función Login:", error);
    }
  }

  export async function addVendedores (data){
    try{
        const creado = await axios.post(`${URL_BACKEND}/vendors/register`, data);
        console.log("datos devueltos -> ", data)
        return creado.data; // Retorna los datos de la respuesta del backend
    }catch(error){
        console.error("Error en la función Login:", error);
    }
  }
  
  
  export async function createEmpresaApi (data){
    try{console.log("datos ingresados -> ", data)
        const creado = await axios.post(`${URL_BACKEND}/companies/create`, data);
        
        return creado.data; // Retorna los datos de la respuesta del backend
    }catch(error){
        console.error("Error en la función Login:", error);
    }
  }

  export async function getPointSales(idEmpresa){
    try{
        console.log(`getPointSales API: Solicitando puntos de venta para ID de empresa: ${idEmpresa}`);
        // Asumiendo que tu API tiene un endpoint como /point-sales/by-company/:idEmpresa
        const response = await axios.get(`${URL_BACKEND}/point-sales/${idEmpresa}`);
        console.log("getPointSales API: Respuesta recibida:", response.data);
        return response.data;
    }catch(error){
        handleError(error, "getPointSales");
    }
}

export async function getProductsCompany(idEmpresa){
    try{
        console.log(`getPointSales API: Solicitando puntos de venta para ID de empresa: ${idEmpresa}`);
        // Asumiendo que tu API tiene un endpoint como /point-sales/by-company/:idEmpresa
        const response = await axios.get(`${URL_BACKEND}/products/${idEmpresa}`);
        console.log("getPointSales API: Respuesta recibida:", response.data);
        return response.data;
    }catch(error){
        handleError(error, "getPointSales");
    }
}