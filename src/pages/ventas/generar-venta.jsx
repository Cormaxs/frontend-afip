import React, { useState, useEffect, useContext, useRef } from 'react';
import { apiContext } from '../../context/api_context';
import Swal from 'sweetalert2';

export default function GenerarVentas() {
  const { getPointsByCompany, getProductCodBarra } = useContext(apiContext);

  // --- Estados del Componente ---
  const [codBarra, setCodBarra] = useState('');
  const [empresaId, setEmpresaId] = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState(''); // Para mostrar el nombre de la empresa
  const [puntosDeVenta, setPuntosDeVenta] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorConfig, setErrorConfig] = useState(false);
  const [itemsFactura, setItemsFactura] = useState([]); // Array para los productos agregados a la factura

  const inputRef = useRef(null);

  // --- Efecto: Inicialización de datos al cargar el componente ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const storedEmpresaData = JSON.parse(localStorage.getItem('dataEmpresa'));
        console.log("Datos de empresa desde localStorage:", storedEmpresaData); 
        
        if (!storedEmpresaData?._id) {
          setErrorConfig(true);
          Swal.fire({ icon: 'error', title: 'Error de Configuración', text: 'ID de empresa no encontrado en localStorage. Asegúrate de iniciar sesión.' });
          return;
        }
        setEmpresaId(storedEmpresaData._id);
        setEmpresaNombre(storedEmpresaData.nombreEmpresa || storedEmpresaData.nombre || 'Nombre de Empresa Desconocido');

        const points = await getPointsByCompany(storedEmpresaData._id);
        if (points && points.length > 0) {
          setPuntosDeVenta(points);
          setPuntoSeleccionado(points[0]._id);
          inputRef.current?.focus(); 
        } else {
          Swal.fire({ icon: 'info', title: 'Sin Puntos de Venta', text: 'No se encontraron puntos de venta asociados a tu empresa. Configura al menos uno.' });
        }
      } catch (error) {
        console.error('Error al iniciar la configuración:', error);
        setErrorConfig(true);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo al cargar los datos iniciales de configuración. Intenta nuevamente.' });
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [getPointsByCompany]); 

  // --- Manejador para buscar y agregar producto a la factura ---
  const handleSearchAndAddItem = async () => {
    if (loading || errorConfig || !empresaId || !puntoSeleccionado || !codBarra.trim()) {
      Swal.fire('Atención', 'Asegura que la empresa, el punto de venta y el código de barras estén completos.', 'warning');
      return;
    }

    setLoading(true);
    try {
      console.log(`Intentando buscar producto: Empresa ID=${empresaId}, Punto ID=${puntoSeleccionado}, Código de Barras=${codBarra.trim()}`);
      
      const productResponse = await getProductCodBarra(empresaId, puntoSeleccionado, codBarra.trim());
      
      console.log("Respuesta completa de getProductCodBarra:", productResponse); 

      const product = productResponse?.data || productResponse; 

      if (product && product._id && product.producto && product.precioLista !== undefined) { 
        
        const existingItemIndex = itemsFactura.findIndex(item => item._id === product._id);

        if (existingItemIndex > -1) {
          const updatedItems = [...itemsFactura];
          updatedItems[existingItemIndex].cantidad += 1;
          setItemsFactura(updatedItems);
          Swal.fire('Éxito', `Cantidad de ${product.producto} actualizada a ${updatedItems[existingItemIndex].cantidad}.`, 'success');
        } else {
          setItemsFactura(prevItems => [...prevItems, { 
            _id: product._id, 
            producto: product.producto, 
            precio: parseFloat(product.precioLista), 
            cantidad: 1,
            categoria: product.categoria || 'N/A', 
            codigoBarra: product.codigoBarra || 'N/A', 
            marca: product.marca || 'N/A' 
          }]);
          Swal.fire('Éxito', `${product.producto} agregado a la factura.`, 'success');
        }
      } else {
        Swal.fire('Info', 'Producto no encontrado o datos incompletos. Revisa la consola para más detalles.', 'info');
        console.warn('Producto recibido no válido o con propiedades faltantes (esperando _id, producto, precioLista):', product); 
      }
    } catch (error) {
      console.error('Error al buscar o agregar producto:', error);
      Swal.fire('Error', `Fallo al buscar producto: ${error.message || 'Error desconocido'}`, 'error');
    } finally {
      setLoading(false);
      setCodBarra('');
      inputRef.current?.focus(); 
    }
  };

  // --- Manejador para cambiar la cantidad de un ítem en la factura ---
  const handleQuantityChange = (index, value) => {
    let newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      // Si el valor no es un número válido o es menor que 1, se establece en 1
      newQuantity = 1; 
      Swal.fire('Atención', 'La cantidad mínima es 1.', 'warning');
    }

    setItemsFactura(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, cantidad: newQuantity } : item
      )
    );
  };

  // --- Manejador de eventos de UI ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      handleSearchAndAddItem();
    }
  };

  const handleRemoveItem = (index) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡Estás a punto de quitar este producto de la factura!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const newItems = itemsFactura.filter((_, i) => i !== index);
        setItemsFactura(newItems);
        Swal.fire('Eliminado!', 'El producto ha sido quitado de la factura.', 'success');
      }
    });
  };

  const calculateTotal = () => {
    return itemsFactura.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0).toFixed(2);
  };

  // --- Renderizado Condicional ---
  if (loading && (!empresaId || puntosDeVenta.length === 0) && !errorConfig) { 
    return <div style={styles.container}>Cargando configuración inicial...</div>;
  }
  if (errorConfig) {
    return (
      <div style={styles.errorContainer}>
        <h3>Error de Configuración Esencial</h3>
        <p>No se pudo cargar la información de la empresa. Verifica que el `localStorage` contenga `dataEmpresa` con un `_id` válido y que tu API esté funcionando.</p>
        <button onClick={() => window.location.reload()} style={styles.button}>Recargar Página</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Generador de Facturas/Tickets</h2>
      <hr style={styles.hr} />

      {/* Información de la Empresa */}
      <div style={styles.infoBox}>
        <p><strong>Empresa:</strong> {empresaNombre || 'Cargando...'}</p>
        <p><strong>ID Empresa:</strong> {empresaId || 'Cargando...'}</p>
      </div>

      {/* Selector de Punto de Venta */}
      <div style={styles.formGroup}>
        <label htmlFor="puntoVentaSelect" style={styles.label}>Punto de Venta:</label>
        <select
          id="puntoVentaSelect"
          value={puntoSeleccionado}
          onChange={(e) => setPuntoSeleccionado(e.target.value)}
          disabled={loading || puntosDeVenta.length === 0}
          style={styles.select}
        >
          <option value="">-- Selecciona un punto --</option>
          {puntosDeVenta.map((p) => (
            <option key={p._id} value={p._id}>{p.nombre || `Punto ID: ${p._id}`}</option>
          ))}
        </select>
        {puntosDeVenta.length === 0 && !loading && <p style={styles.warningText}>No hay puntos de venta disponibles. Configura uno en tu panel.</p>}
      </div>

      {/* Input de Código de Barras y Botón */}
      <div style={styles.formGroup}>
        <label htmlFor="codBarraInput" style={styles.label}>Código de Barras:</label>
        <div style={styles.inputButtonContainer}>
          <input
            ref={inputRef}
            type="text"
            id="codBarraInput"
            value={codBarra}
            onChange={(e) => setCodBarra(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escanea o ingresa el código"
            disabled={loading || !puntoSeleccionado}
            style={styles.input}
            autoFocus
          />
          <button
            onClick={handleSearchAndAddItem}
            disabled={loading || !puntoSeleccionado || !codBarra.trim()}
            style={styles.button}
          >
            {loading ? 'Buscando...' : 'Agregar Producto'}
          </button>
        </div>
      </div>

      {/* Listado de Productos en la Factura */}
      <div style={styles.invoiceItemsContainer}>
        <h3 style={styles.sectionHeading}>Productos en Factura ({itemsFactura.length})</h3>
        {itemsFactura.length === 0 ? (
          <p style={styles.emptyListText}>Aún no hay productos en la factura. ¡Empieza a escanear!</p>
        ) : (
          <ul style={styles.itemList}>
            {itemsFactura.map((item, index) => (
              <li key={item._id + '-' + index} style={styles.itemListItem}>
                <div style={styles.itemDetails}>
                    <span style={styles.itemMainText}>
                        **{item.producto}**
                    </span>
                    <span style={styles.itemSubText}>
                        Categoría: {item.categoria} | Código: {item.codigoBarra} | Marca: {item.marca}
                    </span>
                </div>
                <div style={styles.itemQuantityPrice}>
                    <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={styles.quantityInput}
                    />
                    <span style={styles.itemPrice}>${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
                <button onClick={() => handleRemoveItem(index)} style={styles.removeButton}>X</button>
              </li>
            ))}
          </ul>
        )}
        <div style={styles.totalContainer}>
          <strong>Total: ${calculateTotal()}</strong>
        </div>
      </div>

      {/* Botones de Acción de Factura */}
      <div style={styles.actionButtons}>
        <button
          onClick={() => {
            Swal.fire({
              title: '¿Confirmar Venta?',
              text: `Estás a punto de generar una factura por $${calculateTotal()}.`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#28a745',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, generar venta',
              cancelButtonText: 'No, cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                // Aquí iría la lógica REAL para registrar la venta en tu backend
                Swal.fire('Venta Registrada!', 'La lógica de guardado de la venta iría aquí.', 'success');
                setItemsFactura([]); 
                setCodBarra(''); 
                inputRef.current?.focus();
              }
            });
          }}
          disabled={itemsFactura.length === 0 || loading}
          style={styles.buttonPrimary}
        >
          Generar Factura / Ticket
        </button>
        <button
          onClick={() => {
            Swal.fire({
              title: '¿Limpiar Factura?',
              text: "Estás a punto de borrar todos los productos agregados. Esta acción no se puede deshacer.",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, limpiar',
              cancelButtonText: 'No, cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                setItemsFactura([]);
                Swal.fire('Factura Vaciada!', 'Todos los productos han sido removidos.', 'success');
                setCodBarra(''); 
                inputRef.current?.focus();
              }
            });
          }}
          disabled={itemsFactura.length === 0 || loading}
          style={styles.buttonSecondary}
        >
          Limpiar Factura
        </button>
      </div>
    </div>
  );
}

// --- Estilos CSS en JavaScript ---
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '25px',
    maxWidth: '700px',
    margin: '30px auto',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
  },
  heading: {
    color: '#333',
    textAlign: 'center',
    marginBottom: '20px',
  },
  hr: {
    borderColor: '#eee',
    marginBottom: '25px',
  },
  infoBox: {
    backgroundColor: '#e9f7ef',
    borderLeft: '5px solid #28a745',
    padding: '10px 15px',
    marginBottom: '20px',
    borderRadius: '5px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  inputButtonContainer: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flexGrow: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    backgroundColor: '#fff',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap',
  },
  buttonPrimary: {
    padding: '12px 20px',
    backgroundColor: '#28a745', 
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
    marginRight: '10px',
  },
  buttonSecondary: {
    padding: '12px 20px',
    backgroundColor: '#dc3545', 
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '30px',
    gap: '10px',
  },
  invoiceItemsContainer: {
    marginTop: '25px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  },
  sectionHeading: {
    color: '#333',
    marginBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px',
  },
  itemList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    border: '1px solid #f0f0f0',
    borderRadius: '5px',
  },
  itemListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    borderBottom: '1px solid #f9f9f9',
    backgroundColor: '#fff',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  itemMainText: {
    color: '#444',
    fontSize: '1em',
    marginBottom: '5px',
  },
  itemSubText: {
    fontSize: '0.85em',
    color: '#777',
  },
  itemQuantityPrice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  quantityInput: {
    width: '60px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    textAlign: 'center',
    fontSize: '1em',
    '-moz-appearance': 'textfield', // Oculta flechas en Firefox
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#333',
    whiteSpace: 'nowrap', 
  },
  removeButton: {
    backgroundColor: '#ffc107', 
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    marginLeft: '10px', 
  },
  removeButtonHover: {
    backgroundColor: '#e0a800',
  },
  totalContainer: {
    textAlign: 'right',
    padding: '15px',
    fontSize: '1.2em',
    borderTop: '1px solid #eee',
    marginTop: '10px',
    backgroundColor: '#f6f6f6',
    borderRadius: '0 0 5px 5px',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
  },
  warningText: {
    color: '#ffc107',
    fontSize: '0.9em',
    marginTop: '5px',
  },
  errorContainer: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#ffebe6',
    border: '1px solid #ff4d4f',
    borderRadius: '8px',
    margin: '20px auto',
    maxWidth: '500px',
    color: '#cc0000',
  },
};