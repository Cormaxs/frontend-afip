import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ProductosService } from '../../services/inventario/productos.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import GenericTable from '../../components/tables/GenericTable.jsx';
import ProductosForm from '../../components/productos/productosForm.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx'; 
import DetalleProducto from '../../components/productos/DetalleProducto.jsx';
import HistorialMovimientos from '../../components/productos/HistorialMovimientos.jsx';
import IngresarMercaderiaForm from '../../components/productos/IngresarMercaderiaForm.jsx';
import ImportacionMasiva from './ImportacionMasiva.jsx';


const BuscadorProductos = () => {
  const { user } = useAuth();
  const [resultados, setResultados] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADOS DE CONTROL
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [esNuevo, setEsNuevo] = useState(false); // <--- Nuevo estado para distinguir
  const [verHistorial, setVerHistorial] = useState(false);
  const [verImportacion, setVerImportacion] = useState(false);
  const [verIngresoMercaderia, setVerIngresoMercaderia] = useState(false);

  useEffect(() => {
    if (user?.empresa) handleSearch(1);
  }, [user?.empresa]);

  const handleSearch = async (page = 1) => {
    if (!user?.empresa) return;
    setLoading(true);
    try {
      const response = await ProductosService.buscadorgeneralProduct({
        empresa: user.empresa, q: searchTerm, page
      });
      setResultados(response.data.productos || []);
      setPagination(response.data.pagination);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- FUNCIÓN PARA ELIMINAR ---
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar: ${productoSeleccionado.producto}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await ProductosService.eliminarProducto(productoSeleccionado._id);
        Swal.fire('Eliminado', 'Producto borrado correctamente.', 'success');
        cerrarModal();
        handleSearch(pagination?.page || 1);
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  const abrirNuevoProducto = () => {
    setProductoSeleccionado(null); // No hay datos previos
    setEsNuevo(true);
    setModoEdicion(true); // Abrir directo el form
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setModoEdicion(false);
    setEsNuevo(false);
    setVerHistorial(false);
    setVerImportacion(false);
    setVerIngresoMercaderia(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Productos y Precios</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Gestiona tu inventario, precios e importaciones</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn" 
            style={{ backgroundColor: '#f0f9ff', color: '#28a4d5', border: '1px solid #28a4d5' }} 
            onClick={() => setVerImportacion(true)}
          >
            📥 Importación Masiva
          </button>
          <button className="btn btn-primary" onClick={abrirNuevoProducto}>
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* MODAL DE IMPORTACIÓN */}
      <ModalGenerico
        isOpen={verImportacion}
        onClose={() => {
          setVerImportacion(false);
          handleSearch(1); // Recargar al cerrar por si importó algo
        }}
        title="Importación Masiva de Productos"
        width="900px"
      >
        <ImportacionMasiva />
      </ModalGenerico>

      {/* MODAL DE HISTORIAL */}
      <HistorialMovimientos 
        isOpen={verHistorial} 
        onClose={() => setVerHistorial(false)} 
        producto={productoSeleccionado} 
      />

      {/* MODAL DE INGRESO DE MERCADERÍA */}
      <IngresarMercaderiaForm
        isOpen={verIngresoMercaderia}
        onClose={() => setVerIngresoMercaderia(false)}
        producto={productoSeleccionado}
        onSuccess={() => {
          setVerIngresoMercaderia(false);
          handleSearch(pagination?.page || 1);
          // Si estaba viendo el detalle, actualizar el producto seleccionado
          if (productoSeleccionado) {
            ProductosService.buscadorgeneralProduct({
              empresa: user.empresa, q: productoSeleccionado.producto, limit: 1
            }).then(res => {
              if (res.data.productos.length > 0) setProductoSeleccionado(res.data.productos[0]);
            });
          }
        }}
      />

      <ModalGenerico 
  isOpen={(modoEdicion || !!productoSeleccionado) && !verHistorial && !verIngresoMercaderia} 
  onClose={cerrarModal}
  title={esNuevo ? "Nuevo Producto" : (modoEdicion ? "Edición de Producto" : "Ficha Técnica")}
>
  {!modoEdicion ? (
    <DetalleProducto 
      producto={productoSeleccionado}
      onEdit={() => setModoEdicion(true)}
      onDelete={handleDelete}
      onClose={cerrarModal}
      onShowHistory={() => setVerHistorial(true)}
      onIngresoMercaderia={() => setVerIngresoMercaderia(true)}
    />
  ) : (
    <div className="form-container">
      <ProductosForm 
        initialData={esNuevo ? null : productoSeleccionado} 
        onSuccess={(productoActualizado) => {
          // 1. Refrescamos la lista de fondo (la tabla)
          handleSearch(esNuevo ? 1 : (pagination?.page || 1));
          
          // 2. Si estábamos editando, actualizamos el objeto seleccionado para que la ficha se vea nueva
          if (!esNuevo && productoActualizado) {
            setProductoSeleccionado(productoActualizado);
            setModoEdicion(false); // Volvemos a la vista de detalles automáticamente
          } else {
            cerrarModal(); // Si es nuevo, quizás sí convenga cerrar o limpiar
          }

          Swal.fire({
            title: '¡Guardado!',
            text: esNuevo ? 'Producto creado con éxito' : 'Los datos se actualizaron correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }} 
      />
      
      {/* Botón para volver atrás MANUALMENTE sin cerrar todo */}
      <button 
        className="btn" 
        style={{ width: '100%', marginTop: '10px', color: '#666', border: '1px solid #ccc', background: 'none', padding: '10px', borderRadius: '4px' }} 
        onClick={() => esNuevo ? cerrarModal() : setModoEdicion(false)}
      >
        {esNuevo ? 'Cancelar' : '← Volver a detalles sin guardar'}
      </button>
    </div>
  )}
</ModalGenerico>

      {/* BÚSQUEDA */}
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(1); }} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input 
          type="text" className="input-field" style={{ maxWidth: '350px' }} 
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Buscar producto..." 
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      <GenericTable 
        data={resultados} 
        type="productos" 
        pagination={pagination} 
        onPageChange={handleSearch} 
        onRowClick={(prod) => {
          setProductoSeleccionado(prod);
          setModoEdicion(false);
          setEsNuevo(false);
        }} 
      />
    </div>
  );
};

export default BuscadorProductos;