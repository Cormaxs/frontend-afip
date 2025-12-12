# Frontend facstock-panel

Esta es la arquitectura frontend de Facstock, una aplicación de gestión de inventario y facturación desarrollada con React. Utiliza un enfoque Semi-Modular para la separación de responsabilidades y la gestión del estado global.

## Como se piden, almacenan y usan los datos

+ **/App.js** -> entrada
+ **/routes** -> gestiona las rutas y su privacidad.
+ **/api** -> llamadas a la api en backend.
+ **/context** -> datos globales, gestiona los datos que usamos en el momento.
+ **/pages** -> renderizan datos y consumen /api a traves de /context.

### Instrucciones de Instalación

**Requisitos Previos**

+ Node.js (v18+)
+ npm o yarn

### Clonar el repositorio:

```bash
https://github.com/Cormaxs/frontend-afip.git
```

### Instalar dependencias:

```bash
npm install
# o
yarn install
```

### Configurar Variables de Entorno: 

Crea un archivo .env.local en la raíz del proyecto y añade la URL de tu API de backend:

```bash
REACT_APP_API_URL=http://localhost:3000/api
```

### Ejecutar la aplicación:

```bash
npm start
# o
yarn start
```


### Por cualquier duda o consulta vaya al **[sitio oficial](https://facstock.com)**