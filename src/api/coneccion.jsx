// src/api/axiosConfig.js
import axios from 'axios';
const URL_BACKEND = 'http://localhost:3000/api/v1'; // Cambia esto a la URL de tu backend si es necesario


export async function Register (data){
    try{
        const creado = await axios.post(`${URL_BACKEND}/auth/register`, data);
        console.log(data)
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
        const creado = await axios.post(`${URL_BACKEND}/vendors/create`, data);
        console.log("datos devueltos -> ", data)
        return creado.data; // Retorna los datos de la respuesta del backend
    }catch(error){
        console.error("Error en la función Login:", error);
    }
  }
  
  



