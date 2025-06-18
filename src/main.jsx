import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom';
import {ApiProvider} from "./context/api_context.jsx";

import App from './App.jsx'
import './App.css'

createRoot(document.getElementById('root')).render(
   <ApiProvider>
    <StrictMode>
   
    <BrowserRouter>
    <App />
    </BrowserRouter>
  
  </StrictMode>  
  </ApiProvider>,
)
