import { Link } from "react-router-dom";

export default function Elegir() {
  return (
    // Contenedor principal: ocupa toda la pantalla y centra el contenido.
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* Tarjeta de contenido con sombra, bordes redondeados y padding */}
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 text-center">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Bienvenido a facstock!
        </h1>
        <p className="text-gray-600 mb-8">
          Elige una opción para continuar 
        </p> 
        
        {/* Contenedor para los botones, apilados verticalmente con espacio entre ellos */}
        <div className="flex flex-col space-y-4">
          
          {/* Opción 1: Iniciar Sesión (botón secundario) */}
          <Link
            to="/login"
            className="w-full py-3 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors duration-300"
          >
            Ya tengo una cuenta
          </Link>
          
          {/* Opción 2: Crear Empresa (botón primario) */}
          <Link
            to="/empresa-register"
            className="w-full py-3 px-4 bg-[var(--principal)] text-white font-semibold rounded-lg hover:bg-[var(--principal-activo)] transition-colors duration-300"
          >
            Crear nueva cuenta de Empresa
          </Link>

        </div>
      </div>

    </div>
  );
}