import React, { useState, useContext } from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { apiContext } from '../../context/api_context.jsx';
import UsuarioForm from '../../components/usuario/UsuarioForm.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx'; // Asegura la ruta correcta
import { authService } from '../../services/auth/auth-general.js';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import '../auth/entrada.css';

const DatosUsuarios = () => {
  const { user, updateUserData } = useAuth();
  const { setUserData } = useContext(apiContext);
  const [modalAbierto, setModalAbierto] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (formData) => {
    try {
      const dataAEnviar = {
        username: formData.username,
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
      };

      if (formData.password && formData.password.trim().length > 0) {
        dataAEnviar.password = formData.password;
      }

      const respuesta = await authService.actualizarUsuario(user._id, dataAEnviar);
      
      if (respuesta.status === 200 || respuesta.data?.user) {
        const updatedUser = respuesta.data.user || respuesta.data;
        
        // Actualizamos ambos contextos para mantener sincronización
        updateUserData(updatedUser);
        if (setUserData) setUserData(updatedUser);
        
        setModalAbierto(false); // Cerramos el modal tras el éxito
        Swal.fire('¡Éxito!', 'Perfil actualizado correctamente', 'success');
      }
    } catch (error) {
      console.error("Error en update:", error);
      Swal.fire('Error', 'No se pudo actualizar', 'error');
    }
  };

  if (!user) return <p>Cargando datos del usuario...</p>;

  return (
    <div className="container-fluid" style={{ maxWidth: '600px', margin: '20px auto' }}>
      <div className="door-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Mi Perfil</h2>
          <button className="btn btn-primary" onClick={() => setModalAbierto(true)}>
            <i className="fas fa-edit"></i> Editar Perfil
          </button>
        </div>

        {/* VISTA DE LECTURA (SIEMPRE VISIBLE) */}
        <div className="detalle-perfil">
          <div className="option">
            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 'bold' }}>USUARIO</p>
            <p style={{ fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>{user.username}</p>
          </div>
          
          <div className="option" style={{ marginTop: '20px' }}>
            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 'bold' }}>NOMBRE COMPLETO</p>
            <p style={{ fontWeight: '500', margin: 0 }}>{user.nombre} {user.apellido}</p>
          </div>

          <div className="option" style={{ marginTop: '20px' }}>
            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 'bold' }}>EMAIL DE CONTACTO</p>
            <p style={{ fontWeight: '500', margin: 0 }}>{user.email}</p>
          </div>

          <div className="option" style={{ marginTop: '20px' }}>
            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '2px', fontWeight: 'bold' }}>NIVEL DE ACCESO</p>
            <span className="badge" style={{ backgroundColor: '#eef2f5', color: '#28a4d5', padding: '5px 12px' }}>
              {user.rol?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* MODAL PARA EDICIÓN */}
        <ModalGenerico 
          isOpen={modalAbierto} 
          onClose={() => setModalAbierto(false)} 
          title="Editar información de perfil"
          width="500px"
        >
          <UsuarioForm 
            onSubmit={handleUpdate} 
            initialData={{ ...user, password: "" }} 
            isEditing={true} 
          />
          <button 
            className="btn-link" 
            onClick={() => setModalAbierto(false)}
            style={{ width: '100%', marginTop: '15px', border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}
          >
            Cerrar sin guardar
          </button>
        </ModalGenerico>
      </div>
    </div>
  );
};

export default DatosUsuarios;