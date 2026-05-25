import React from 'react';
import { useForm } from "react-hook-form";
import { useAuth } from '../../contexts/auth/authContext.jsx'; // Importamos el context

const EmpresaForm = ({ onSubmit, initialData, isEditing = false }) => {
  const { user } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      ...initialData,
      // Autorrelleno inteligente de contacto
      contacto: {
        email: initialData?.contacto?.email || user?.email || "",
        celular: initialData?.contacto?.celular || "" // El celular usualmente no viene en el registro básico
      }
    }
  });

  const errorStyle = { color: '#d9534f', fontSize: '11px', display: 'block', marginTop: '2px' };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="door-form">
      {/* SECCIÓN 1: DATOS IDENTIFICATORIOS */}
      <div className="option">
        <p style={{ fontWeight: '600', marginBottom: '10px', borderBottom: '1px solid #eee' }}>Identificación Fiscal</p>
        
        <input 
          type="text" 
          className="input-field" 
          placeholder="Razón Social / Nombre Completo" 
          {...register("razonSocial", { required: "La Razón Social es obligatoria" })} 
        />
        {errors.razonSocial && <span style={errorStyle}>{errors.razonSocial.message}</span>}

        <input 
          type="text" 
          className="input-field" 
          placeholder="CUIT (Sin guiones)" 
          style={{ marginTop: '8px' }}
          {...register("cuit", { 
            required: "CUIT obligatorio", 
            pattern: { value: /^[0-9]{11}$/, message: "Deben ser 11 números" } 
          })} 
        />
        {errors.cuit && <span style={errorStyle}>{errors.cuit.message}</span>}

        <select 
          className="input-field" 
          style={{ marginTop: '8px' }}
          {...register("tipoResponsable", { required: "Seleccione condición frente al IVA" })}
        >
          <option value="">Condición frente al IVA</option>
          <option value="RI">Responsable Inscripto</option>
          <option value="M">Monotributo</option>
          <option value="E">Exento</option>
          <option value="CF">Consumidor Final</option>
          <option value="NR">No Responsable</option>
        </select>
      </div>

      {/* SECCIÓN 2: DOMICILIO FISCAL */}
      <div className="option" style={{ marginTop: '20px' }}>
        <p style={{ fontWeight: '600', marginBottom: '10px', borderBottom: '1px solid #eee' }}>Domicilio Fiscal</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" className="input-field" placeholder="Calle" {...register("domicilio.calle")} />
          <input type="text" className="input-field" placeholder="N°" style={{ width: '80px' }} {...register("domicilio.numero")} />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input type="text" className="input-field" placeholder="Localidad" {...register("domicilio.localidad")} />
          <input type="text" className="input-field" placeholder="Provincia" {...register("domicilio.provincia")} />
        </div>
        <input type="text" className="input-field" placeholder="Código Postal" style={{ marginTop: '8px' }} {...register("domicilio.codigoPostal")} />
      </div>

      {/* SECCIÓN 3: ACTIVIDAD Y AFIP */}
      <div className="option" style={{ marginTop: '20px' }}>
        <p style={{ fontWeight: '600', marginBottom: '10px', borderBottom: '1px solid #eee' }}>Actividad y AFIP</p>
        <input type="text" className="input-field" placeholder="Ingresos Brutos (IIBB)" {...register("datosFiscales.iibb")} />
        
        <label style={{ fontSize: '12px', color: '#666', marginTop: '8px', display: 'block' }}>Inicio de Actividades:</label>
        <input type="date" className="input-field" {...register("datosFiscales.fechaInicioActividades")} />
        
        <input type="text" className="input-field" placeholder="Actividad Principal" style={{ marginTop: '8px' }} {...register("datosFiscales.actividadPrincipal")} />
      </div>

      {/* SECCIÓN 4: CONTACTO (NUEVA) */}
      <div className="option" style={{ marginTop: '20px' }}>
        <p style={{ fontWeight: '600', marginBottom: '10px', borderBottom: '1px solid #eee' }}>Contacto Comercial</p>
        <input 
          type="email" 
          className="input-field" 
          placeholder="Email de contacto" 
          {...register("contacto.email", { required: "Email de contacto necesario" })} 
        />
        {errors.contacto?.email && <span style={errorStyle}>{errors.contacto.email.message}</span>}

        <input 
          type="text" 
          className="input-field" 
          placeholder="Celular (Ej: 5493834...)" 
          style={{ marginTop: '8px' }}
          {...register("contacto.celular")} 
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px', padding: '12px' }}>
        {isEditing ? 'Actualizar Datos de Empresa' : 'Registrar Empresa'}
      </button>
    </form>
  );
};

export default EmpresaForm;