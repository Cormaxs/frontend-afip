import { Link } from "react-router-dom"; // Asegúrate de que sea react-router-dom
import './entrada.css';

const Door = () => {
  return (
    <div className="door-container">
      <div className="door-card">
        <h1>Facstock v1</h1>
        
        <div className="option-group">
          <p>¿Ya tenés cuenta?</p>
          <Link to='/login-usuarios' className="btn btn-primary">
            Iniciar sesión
          </Link>
        </div>

        <div className="divider">o</div>

        <div className="option-group">
          <p>¿No tenés cuenta?</p>
          <Link to='/register-empresa' className="btn btn-outline">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Door;