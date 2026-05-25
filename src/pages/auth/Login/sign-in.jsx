import { useForm } from "react-hook-form";
import { authService } from '../../../services/auth/auth-general.js';
import Swal from 'sweetalert2';
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../../../contexts/auth/authContext.jsx';
import '../entrada.css';

const IniciarSesion = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const respuesta = await authService.loginUsers(data);
      if (respuesta.status === 200 || respuesta.data) {
        await login(respuesta.data); 
        
        await Swal.fire({
          title: '¡Bienvenido!',
          text: `Sesión iniciada correctamente`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        navigate("/datosUsuario");
      }
    } catch (error) {
      const mensajeError = error.response?.data?.message || 'Credenciales incorrectas';
      Swal.fire({
        title: 'Error de acceso',
        text: mensajeError,
        icon: 'error'
      });
    }
  };

  return (
    <div className="door-container">
      <div className="door-card">
        <h1>Iniciar Sesión</h1>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="option">
            <input
              type="text"
              className="input-field"
              placeholder="Nombre de usuario"
              {...register("username", { required: "El usuario es obligatorio" })}
            />
            {errors.username && <span className="error-text">{errors.username.message}</span>}
          </div>

          <div className="option">
            <input
              type="password"
              className="input-flex input-field"
              placeholder="Contraseña"
              {...register("password", { required: "La contraseña es obligatoria" })}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-login" style={{ width: '100%', cursor: 'pointer' }}>
            Entrar al Sistema
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0', borderTop: '1px solid #dee2e6' }}></div>

        <div className="option">
          <p>¿No tenés cuenta?</p>
          <Link to='/register-empresa' className="btn btn-reg">Registrarse</Link>
        </div>
      </div>
    </div>
  );
};

export default IniciarSesion;