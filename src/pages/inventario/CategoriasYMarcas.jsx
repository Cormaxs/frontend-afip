import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import CategoriaForm from '../../components/inventario/CategoriaForm.jsx';
import MarcaForm from '../../components/inventario/MarcaForm.jsx';
import { CategoriasYMarcasService } from '../../services/inventario/categoriasYMarcas.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';

const CategoriasYMarcas = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('categorias'); // 'categorias' o 'marcas'
  
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Cargar datos
  useEffect(() => {
    if (user?.empresa) {
      cargarCategorias();
      cargarMarcas();
    }
  }, [user?.empresa]);

  const normalizeItems = (rawItems) =>
    (Array.isArray(rawItems)
      ? rawItems.map((item) => (typeof item === 'string' ? { nombre: item } : item))
      : []);

  const cargarCategorias = async () => {
    if (!user?.empresa) return;
    setLoading(true);
    try {
      const response = await CategoriasYMarcasService.obtenerCategorias(user.empresa);
      setCategorias(normalizeItems(response.data || []));
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMarcas = async () => {
    if (!user?.empresa) return;
    setLoading(true);
    try {
      const response = await CategoriasYMarcasService.obtenerMarcas(user.empresa);
      setMarcas(normalizeItems(response.data || []));
    } catch (error) {
      console.error('Error cargando marcas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (item) => {
    console.log('Intentando eliminar:', item);
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar: ${item.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const itemName = item?.nombre || item;

        if (activeTab === 'categorias') {
          await CategoriasYMarcasService.eliminarCategoria(itemName, user.empresa);
        } else {
          await CategoriasYMarcasService.eliminarMarca(itemName, user.empresa);
        }
        
        Swal.fire('Eliminado', 'Item borrado correctamente.', 'success');
        setSelectedItem(null);
        setModalOpen(false);
        if (activeTab === 'categorias') cargarCategorias();
        else cargarMarcas();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    setSelectedItem(null);
    if (activeTab === 'categorias') cargarCategorias();
    else cargarMarcas();
    Swal.fire({
      title: '¡Guardado!',
      text: 'Los cambios se realizaron correctamente',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const datos = activeTab === 'categorias' ? categorias : marcas;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontWeight: '700' }}>Gestión de Categorías y Marcas</h1>
        <p style={{ color: '#666', margin: 0 }}>Administra el catálogo de tu inventario</p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('categorias')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'categorias' ? '#28a4d5' : 'transparent',
            color: activeTab === 'categorias' ? '#fff' : '#666',
            border: 'none',
            borderBottom: activeTab === 'categorias' ? '3px solid #28a4d5' : 'none',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '-2px'
          }}
        >
          📂 Categorías
        </button>
        <button
          onClick={() => setActiveTab('marcas')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'marcas' ? '#28a4d5' : 'transparent',
            color: activeTab === 'marcas' ? '#fff' : '#666',
            border: 'none',
            borderBottom: activeTab === 'marcas' ? '3px solid #28a4d5' : 'none',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '-2px'
          }}
        >
          🏷️ Marcas
        </button>
      </div>

      {/* BOTÓN NUEVO */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setSelectedItem(null);
            setModalOpen(true);
          }}
        >
          + {activeTab === 'categorias' ? 'Nueva Categoría' : 'Nueva Marca'}
        </button>
      </div>

      {/* TABLA */}
      <div style={{ marginBottom: '20px' }}>
        {datos.length > 0 ? (
          <div className="table-container" style={{ border: '1px solid #eee' }}>
            <table className="office-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Descripción</th>
                  <th style={{ textAlign: 'center', padding: '12px', width: '150px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((item) => (
                  <tr key={item._id || item.nombre} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{item.nombre}</strong>
                    </td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '0.95rem' }}>
                      {item.descripcion || '---'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setModalOpen(true);
                        }}
                        style={{
                          backgroundColor: '#28a4d5',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px',
                          fontSize: '0.85rem'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleEliminar(item)}
                        style={{
                          backgroundColor: '#d9534f',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <p style={{ color: '#999', marginBottom: '10px' }}>
              No hay {activeTab === 'categorias' ? 'categorías' : 'marcas'} creadas aún
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedItem(null);
                setModalOpen(true);
              }}
            >
              + Crear {activeTab === 'categorias' ? 'Categoría' : 'Marca'}
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      <ModalGenerico
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        title={`${selectedItem ? 'Editar' : 'Nueva'} ${activeTab === 'categorias' ? 'Categoría' : 'Marca'}`}
        width="500px"
      >
        {activeTab === 'categorias' ? (
          <CategoriaForm initialData={selectedItem} onSuccess={handleSuccess} />
        ) : (
          <MarcaForm initialData={selectedItem} onSuccess={handleSuccess} />
        )}
      </ModalGenerico>
    </div>
  );
};

export default CategoriasYMarcas;
