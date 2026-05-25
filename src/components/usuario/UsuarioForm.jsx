import React from 'react';
import { useForm } from "react-hook-form";

// Añadimos isEditing como prop (por defecto false para el registro)
const UsuarioForm = ({ onSubmit, initialData, isEditing = false }) => {
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    // Si editamos, limpiamos el password del initialData para que no se cargue el hash
    defaultValues: isEditing ? { ...initialData, password: "" } : initialData
  });

  const errorStyle = { color: '#d9534f', fontSize: '11px', textAlign: 'left', display: 'block', marginTop: '2px' };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="option">
        <p style={{ textAlign: 'left', marginBottom: '8px', fontWeight: '600' }}>Datos de acceso</p>
        
        <input 
          type="text" 
          className={`input-field ${errors.username ? 'input-error' : ''}`} 
          placeholder="Nombre de usuario" 
          {...register("username", { required: "El usuario es obligatorio" })} 
        />
        {errors.username && <span style={errorStyle}>{errors.username.message}</span>}

        <input 
          type="password" 
          className={`input-field ${errors.password ? 'input-error' : ''}`} 
          style={{ marginTop: '8px' }}
          // Dinámico: Si edita, aclara que es opcional
          placeholder={isEditing ? "Nueva contraseña (opcional)" : "Contraseña"} 
          {...register("password", { 
            // Dinámico: Solo obligatorio si NO está editando
            required: isEditing ? false : "La contraseña es obligatoria",
            minLength: { value: 6, message: "Mínimo 6 caracteres" }
          })} 
        />
        {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
        {isEditing && (
          <p style={{ fontSize: '10px', color: '#999', textAlign: 'left', marginTop: '4px' }}>
            * Deja vacío para mantener la contraseña actual
          </p>
        )}
      </div>

      <div className="option">
        <p style={{ textAlign: 'left', marginBottom: '8px', fontWeight: '600' }}>Información personal</p>
        
        <input 
          type="email" 
          className="input-field" 
          placeholder="Correo electrónico" 
          {...register("email", { 
            required: "Email obligatorio",
            pattern: { value: /^\S+@\S+$/i, message: "Email inválido" } 
          })} 
        />
        {errors.email && <span style={errorStyle}>{errors.email.message}</span>}

        <input 
          type="text" 
          className="input-field" 
          placeholder="Nombre" 
          style={{ marginTop: '8px' }}
          {...register("nombre", { required: "Nombre obligatorio" })} 
        />
        {errors.nombre && <span style={errorStyle}>{errors.nombre.message}</span>}

        <input 
          type="text" 
          className="input-field" 
          placeholder="Apellido" 
          style={{ marginTop: '8px' }}
          {...register("apellido", { required: "Apellido obligatorio" })} 
        />
        {errors.apellido && <span style={errorStyle}>{errors.apellido.message}</span>}
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
        {isEditing ? 'Guardar Cambios' : 'Finalizar Registro'}
      </button>
    </form>
  );
};

export default UsuarioForm;