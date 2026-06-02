import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import Swal from 'sweetalert2';
import { Lock } from 'lucide-react';
import '../auth/entrada.css';

const AdminLogin = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const ADMIN_PASSWORD = 'admin';

  const onSubmit = async (data) => {
    try {
      if (data.password !== ADMIN_PASSWORD) {
        Swal.fire({
          title: 'Acceso Denegado',
          text: 'Contraseña de administrador incorrecta',
          icon: 'error'
        });
        return;
      }

      // Guardar token de admin en localStorage
      localStorage.setItem('adminAuthToken', `Basic ${btoa('admin:' + data.password)}`);
      localStorage.setItem('isAdminLoggedIn', 'true');

      Swal.fire({
        title: '¡Bienvenido Admin!',
        text: 'Acceso al panel de administración',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      navigate("/admin");
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al acceder al panel',
        icon: 'error'
      });
    }
  };

  return (
    <div className="door-container">
      <div className="door-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Lock size={40} style={{ color: '#2563eb' }} />
          </div>
          <h1>Acceso Panel Admin</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Ingresa la contraseña para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="option">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Contraseña de Administrador
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Ingresa contraseña admin"
              {...register("password", { required: "La contraseña es obligatoria" })}
              autoFocus
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn btn-login" 
            style={{ width: '100%', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Verificando...' : 'Acceder al Panel'}
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0', borderTop: '1px solid #dee2e6' }}></div>

        <div className="option" style={{ textAlign: 'center' }}>
          <Link to='/' className="btn btn-reg" style={{ display: 'inline-block' }}>
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
