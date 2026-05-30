# 💻 Front-FacStock - Frontend

## 📋 Descripción del Proyecto

**front-facstock** es la **interfaz web** de la plataforma FacStock. Es una aplicación React moderna que consume los servicios REST del backend de inventario y proporciona una experiencia de usuario completa para gestionar:

- 📝 Facturación electrónica
- 📦 Inventario y productos
- 🏪 Punto de venta
- 💰 Gestión de caja
- 👥 Usuarios y permisos
- ⚙️ Configuración de empresas

### 🎯 Características Principales
- ✔️ Autenticación y autorización con JWT
- ✔️ Dashboard intuitivo
- ✔️ Creación de facturas electrónicas
- ✔️ Búsqueda avanzada de productos
- ✔️ Gestión de inventario en tiempo real
- ✔️ Interfaz responsiva (Mobile, Tablet, Desktop)
- ✔️ Manejo de errores y validaciones
- ✔️ Diseño limpio y profesional

### 🤝 Relación con Otros Proyectos
- **Consumidor de**: → backend-gestor de inventario (API REST)
- **Consumidor indirecto de**: → backend-afip-facturacion (vía backend inventario)
- **Base de URL**: `http://localhost:3010` (configurable)

---

## 🛠️ Stack Tecnológico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| **React** | 19.2.4 | UI library |
| **Vite** | 8.0.0 | Build tool / Dev server |
| **React Router** | 7.13.1 | Routing |
| **React Hook Form** | 7.71.2 | Manejo de formularios |
| **Axios** | 1.13.6 | HTTP client |
| **React Icons** | 5.6.0 | Iconos |
| **SweetAlert2** | 11.26.23 | Modales y alertas |
| **Tanstack React Table** | 8.21.3 | Tablas avanzadas |
| **ESLint** | Latest | Linting |

---

## 📁 Estructura de Carpetas

```
front-facstock/
├── index.html                # Página HTML principal
├── package.json
├── vite.config.js            # Configuración Vite
├── eslint.config.js          # Configuración ESLint
├── .env.local               # Variables de ambiente (no commitar)
├── .env.example             # Template de .env
│
└── src/
    ├── main.jsx             # Entry point React
    ├── App.jsx              # Componente raíz
    ├── App.css
    ├── index.css            # Estilos globales
    │
    ├── api/
    │   └── api.js           # Configuración axios + interceptores
    │
    ├── components/          # Componentes reutilizables
    │   ├── afip/            # Componentes AFIP
    │   ├── auth/            # Login, Register, ProtectedRoute
    │   ├── facturas/        # Crear factura, búsqueda
    │   ├── productos/       # Búsqueda, listado productos
    │   ├── puntoDeVenta/    # POS interface
    │   ├── tables/          # Tablas reutilizables
    │   ├── modal/           # Componentes modales
    │   ├── usuario/         # Gestión usuario
    │   └── menu/            # Navegación
    │
    ├── contexts/            # Contextos globales
    │   └── auth/            # AuthContext
    │       ├── AuthContext.jsx
    │       └── useAuth.js   # Custom hook
    │
    ├── pages/               # Vistas/páginas
    │   ├── auth/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── RegisterEmpresa.jsx
    │   ├── dashboard/
    │   │   └── Dashboard.jsx
    │   ├── facturas/
    │   │   ├── CrearFactura.jsx
    │   │   └── BuscadorFacturas.jsx
    │   ├── productos/
    │   │   └── BuscadorProductos.jsx
    │   ├── configuracion/
    │   │   ├── DatosUsuario.jsx
    │   │   └── DatosEmpresa.jsx
    │   └── ...
    │
    ├── layouts/
    │   └── Layout.jsx        # Layout principal con sidebar
    │
    ├── routes/
    │   ├── Routes.jsx        # Definición de rutas
    │   ├── ProtectedRoute.jsx
    │   └── ...
    │
    ├── services/            # Lógica de negocio (API calls)
    │   ├── afip/
    │   ├── auth/
    │   ├── inventario/
    │   ├── puntosVenta/
    │   ├── tickets/
    │   └── ...
    │
    ├── styles/              # Estilos organizados
    │   ├── variables.css
    │   ├── common.css
    │   └── ...
    │
    ├── utils/               # Funciones helper
    │   ├── formatters.js    # Formateo de valores
    │   ├── validators.js    # Validaciones
    │   ├── constants.js     # Constantes globales
    │   └── ...
    │
    └── constants/           # Constantes de la app
        ├── rolePermissions.js
        └── apiEndpoints.js
```

---

## 🚀 Instalación y Setup

### Prerequisitos
- **Node.js**: 18 o superior
- **npm**: 9 o superior
- **Backend**: Gestor de Inventario corriendo (Puerto 3010)

### Pasos de Instalación

```bash
# 1. Descargar proyecto
cd frontend-afip

# 2. Instalar dependencias
npm install

# 3. Configurar variables de ambiente
cp .env.example .env
# Editar .env (VITE_API_URL=http://localhost:3010)

# 4. Levantar servidor de desarrollo
npm run dev
```

### Archivo `.env` Sugerido

```bash
# URL del orquestador central (Backend Inventario)
VITE_API_URL=http://localhost:3010/api/v1
```

---

## 🎨 Estructura de Componentes

### Componentes Base

#### ProtectedRoute.jsx
```jsx
// Envuelve rutas que requieren autenticación
<ProtectedRoute requiredRol="admin_principal">
  <AdminDashboard />
</ProtectedRoute>
```

#### Layout.jsx
```jsx
// Proporciona sidebar, header, y estructura común
<Layout>
  <Page />
</Layout>
```

### Componentes de Presentación

- **facturas/CrearFactura.jsx**: Formulario para crear facturas
- **productos/BuscadorProductos.jsx**: Búsqueda y filtrado de productos
- **puntoDeVenta/POS.jsx**: Interfaz de punto de venta
- **tablas/TablaProductos.jsx**: Tabla reutilizable para productos
- **modal/ModalConfirmacion.jsx**: Modal de confirmación genérica

---

## 🌐 API & Services

### Configuración Axios

```javascript
// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expirado, redirigir a login
      localStorage.removeItem('token');
      window.location.href = '/login-usuarios';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Services (Ejemplos)

#### Auth Service
```javascript
// src/services/auth/authService.js
import api from '../../api/api.js';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  async getCurrentUser() {
    const response = await api.get('/auth/get');
    return response.data;
  }
};
```

#### Product Service
```javascript
// src/services/inventario/productService.js
import api from '../../api/api.js';

export const productService = {
  async searchProducts(query, empresa) {
    const response = await api.get('/products/buscar', {
      params: { q: query, empresaId: empresa }
    });
    return response.data;
  },
  
  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  async createProduct(data) {
    const response = await api.post('/products/add', data);
    return response.data;
  }
};
```

---

## 🔐 Autenticación (AuthContext)

### AuthContext.jsx
```jsx
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token guardado
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 🗂️ Rutas Principales

```javascript
// src/routes/Routes.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import CrearFactura from '../pages/facturas/CrearFactura';
import Dashboard from '../pages/dashboard/Dashboard';
import Layout from '../layouts/Layout';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login-usuarios" element={<Login />} />
        
        {/* Protegidas */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crear-factura" element={<CrearFactura />} />
          <Route path="/buscador-productos" element={<BuscadorProductos />} />
          <Route path="/datosUsuario" element={<DatosUsuario />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📑 Páginas Principales

### 1. Login (`/login-usuarios`)
- Formulario email + password
- Validaciones
- Redirección a dashboard post-login
- Link a registro

### 2. Dashboard (`/`)
- Resumen de estadísticas
- Accesos rápidos
- Notificaciones

### 3. Crear Factura (`/crear-factura`)
- Selección de cliente
- Búsqueda y selección de productos
- Tabla con líneas
- Cálculo de totales
- Opción: Factura electrónica o interna
- Generar y descargar PDF

### 4. Buscador Productos (`/buscador-productos`)
- Búsqueda por nombre/código
- Filtrado por categoría
- Tabla con stock
- Editar/ver detalles

### 5. Punto de Venta (`/puntos-de-ventas`)
- Interfaz rápida de POS
- Código de barras
- Carrito de compras
- Pago

### 6. Configuración Empresa (`/DatosEmpresa`)
- Datos empresa
- CUIT
- Certificado AFIP
- Puntos de venta

### 7. Datos Usuario (`/datosUsuario`)
- Perfil
- Cambiar contraseña
- Permisos

---

## 🎣 Custom Hooks

### useAuth
```jsx
const { user, login, logout, loading } = useAuth();
```

### useForm (React Hook Form)
```jsx
const { register, handleSubmit, formState: { errors } } = useForm();
```

---

## 🎨 Estilos

### Estructura CSS
```
styles/
├── variables.css      # Variables de color, tamaño, etc
├── common.css         # Estilos globales
├── components.css     # Estilos de componentes
└── responsive.css     # Media queries
```

### Ejemplo de Variables
```css
/* variables.css */
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --success-color: #16a34a;
  --error-color: #dc2626;
  --warning-color: #ea580c;
  
  --border-radius: 8px;
  --transition-duration: 200ms;
}
```

---

## 🧪 Formularios con React Hook Form

```jsx
import { useForm } from 'react-hook-form';
import { productService } from '../services/productService';

export default function FormProducto() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await productService.createProduct(data);
      alert('Producto creado!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register('nombre', { required: 'Nombre requerido' })}
        placeholder="Nombre"
      />
      {errors.nombre && <span>{errors.nombre.message}</span>}
      
      <button type="submit">Crear</button>
    </form>
  );
}
```

---

## 🚀 Scripts Disponibles

```bash
npm run dev            # Inicia servidor desarrollo
npm run build          # Build para producción
npm run preview        # Preview del build
npm run lint           # Ejecutar ESLint
```

---

## 📖 Documentación Adicional

- [../OVERVIEW.md](../OVERVIEW.md) - Visión general del proyecto
- [../ARQUITECTURA-GENERAL.md](../ARQUITECTURA-GENERAL.md) - Cómo se integra con backends

---

## ✨ Características Implementadas

- [x] Autenticación con JWT
- [x] Protección de rutas
- [x] Login/Register usuarios
- [x] Crear facturas
- [x] Búsqueda de productos
- [x] Dashboard
- [x] Responsive design
- [x] Alertas y toasts
- [x] Validación de formularios
- [x] Manejo de errores
- [ ] Modo oscuro
- [ ] Reportes
- [ ] Exportación a Excel
- [ ] Mobile app

---

## 🐛 Troubleshooting

### Error: VITE_API_URL no definido
- Crear `.env.local` con la URL correcta
- Reiniciar servidor dev

### Error: Token no se envía en requests
- Verificar que el interceptor de axios está correctamente configurado
- Revisar que token esté en localStorage

### Blank page en producción
- Revisar que base URL en vite.config.js es correcta
- Check browser console for errors

---

**Última actualización**: Mayo 2026
**Responsabilidad**: Interfaz Web del Sistema ERP