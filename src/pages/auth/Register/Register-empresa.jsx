import { useForm } from "react-hook-form";
import { authService } from '../../../services/auth/auth-general.js';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import '../entrada.css';

const RegisterEmpresa = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const respuesta = await authService.registerEmpresa(data);
      const empresaId = respuesta.data?._id || respuesta.data?.id;

      if (empresaId) {
        localStorage.setItem("temp_empresa_id", empresaId);

        await Swal.fire({
          title: '¡Éxito!',
          text: `Empresa "${data.nombreEmpresa}" registrada`,
          icon: 'success',
          confirmButtonText: 'Siguiente: Crear Usuario',
          confirmButtonColor: '#28a4d5' // Color acorde a tu CSS
        });
        
        navigate("/register-usuarios");
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        const mensajesDeError = error.response.data.errors
          .map(err => `<li>${err.msg}</li>`)
          .join('');

        Swal.fire({
          title: 'Datos inválidos',
          html: `<ul style="text-align: left;">${mensajesDeError}</ul>`,
          icon: 'error'
        });
      } else {
        Swal.fire('Error', error.response?.data?.message || 'Error de conexión', 'error');
      }
    }
  };

  return (
    <div className="door-container">
      <div className="door-card">
        <h1>Registrar Empresa</h1>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="option">
            <p style={{ textAlign: 'left', marginBottom: '8px' }}>Paso 1: Datos de la entidad</p>
            <input 
              type="text" 
              className="input-field"
              placeholder="Nombre de la empresa" 
              {...register("nombreEmpresa", { 
                required: "El nombre es obligatorio",
                minLength: { value: 3, message: "Mínimo 3 caracteres" }
              })} 
            />
            {errors.nombreEmpresa && (
              <span className="error-text">{errors.nombreEmpresa.message}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Continuar Registro
          </button>
        </form>

        <div className="divider"></div>

        <div className="option" style={{ textAlign: 'center' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline" 
            style={{ width: '100%', border: 'none', fontSize: '12px' }}
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterEmpresa;