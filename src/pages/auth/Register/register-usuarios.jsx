import React from 'react';
import { authService } from '../../../services/auth/auth-general.js';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import '../entrada.css';
import UsuarioForm from '../../../components/usuario/UsuarioForm.jsx';

const LoginUsuarios = () => {
  const navigate = useNavigate();

  const handleRegistroFinal = async (formData) => {
    const empresaId = localStorage.getItem("temp_empresa_id");
  
    const dataFinal = {
      ...formData,
      empresa: empresaId,
      rol: "admin_principal",
      activo: true
    };
  
    try {
      //console.log("Datos enviados al backend:", dataFinal);
      const respuesta = await authService.registrarUsuarios(dataFinal);
     // console.log("Respuesta del backend:", respuesta);
      if (respuesta.status === 201 || respuesta.data) {
        localStorage.removeItem("temp_empresa_id"); 
        await Swal.fire({
          title: '¡Registro Completo!',
          text: 'Usuario administrador creado correctamente',
          icon: 'success',
          confirmButtonColor: '#28a4d5'
        });
        navigate("/login-usuarios");
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        const listaErrores = error.response.data.errors
          .map(err => `<li>${err.msg}</li>`)
          .join('');
  
        Swal.fire({
          title: 'Datos inválidos',
          html: `<ul style="text-align: left; font-size: 0.9em;">${listaErrores}</ul>`,
          icon: 'error'
        });
      } else {
        Swal.fire('Error', error.response?.data?.message || 'Error al procesar el registro', 'error');
      }
    }
  };

  return (
    <div className="door-container">
      <div className="door-card" style={{ width: '350px' }}>
        <h1>Crear Administrador</h1>
        
        {/* Usamos el componente reutilizable */}
        <UsuarioForm onSubmit={handleRegistroFinal} />

        <div className="divider"></div>
        <p style={{ fontSize: '12px', color: '#999' }}>Paso 2 de 2</p>
      </div>
    </div>
  );
};

export default LoginUsuarios;