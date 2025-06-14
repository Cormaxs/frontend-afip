// src/api/axiosConfig.js
import axios from 'axios';
const URL_BACKEND = 'http://localhost:3000'; // Cambia esto a la URL de tu backend si es necesario


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
      console.log(data)
      return creado.data; // Retorna los datos de la respuesta del backend
  }catch(error){
      console.error("Error en la función Login:", error);
  }
}





