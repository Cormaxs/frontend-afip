import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import CategoriaForm from '../../components/inventario/CategoriaForm.jsx';
import MarcaForm from '../../components/inventario/MarcaForm.jsx';
import { CategoriasYMarcasService } from '../../services/inventario/categoriasYMarcas.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';

const CategoriasYMarcas = () => {
  const { user } = useAuth();
  const companyId = user?.empresa || user?.empresaId || user?.companyId;

  const [activeTab, setActiveTab] = useState('categorias'); // 'categorias' o 'marcas'
  
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados para paginación y búsqueda
  const [categoriaSearchParams, setCategoriaSearchParams] = useState({
    page: 1,
    limit: 10,
    sortBy: 'nombre',
    order: 'asc',
    search: ''
  });
  const [marcaSearchParams, setMarcaSearchParams] = useState({
    page: 1,
    limit: 10,
    sortBy: 'nombre',
    order: 'asc',
    search: ''
  });

  const [categoriaPagination, setCategoriaPagination] = useState({});
  const [marcaPagination, setMarcaPagination] = useState({});

  // Cargar datos
  useEffect(() => {
    if (companyId) {
      cargarCategorias();
    }
  }, [companyId, categoriaSearchParams]);

  useEffect(() => {
    if (companyId) {
      cargarMarcas();
    }
  }, [companyId, marcaSearchParams]);

  const normalizeItems = (rawItems) =>
    (Array.isArray(rawItems)
      ? rawItems.map((item) => (typeof item === 'string' ? { nombre: item } : item))
      : []);

  const cargarCategorias = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await CategoriasYMarcasService.obtenerCategorias(companyId, categoriaSearchParams);
      // Extraemos de response.data ya que axios envuelve la respuesta
      const data = response.data || {};
      setCategorias(normalizeItems(data.categories || []));
      setCategoriaPagination(data.pagination || {});
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMarcas = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await CategoriasYMarcasService.obtenerMarcas(companyId, marcaSearchParams);
      // Extraemos de response.data ya que axios envuelve la respuesta
      const data = response.data || {};
      setMarcas(normalizeItems(data.marcas || []));
      setMarcaPagination(data.pagination || {});
    } catch (error) {
      console.error('Error cargando marcas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { value } = e.target;
    if (activeTab === 'categorias') {
      setCategoriaSearchParams(prev => ({ ...prev, search: value, page: 1 }));
    } else {
      setMarcaSearchParams(prev => ({ ...prev, search: value, page: 1 }));
    }
  };

  const handlePageChange = (newPage) => {
    if (activeTab === 'categorias') {
      setCategoriaSearchParams(prev => ({ ...prev, page: newPage }));
    } else {
      setMarcaSearchParams(prev => ({ ...prev, page: newPage }));
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
          await CategoriasYMarcasService.eliminarCategoria(itemName, companyId);
        } else {
          await CategoriasYMarcasService.eliminarMarca(itemName, companyId);
        }
        
        Swal.fire('Eliminado', 'Item borrado correctamente.', 'success');
        setSelectedItem(null);
        setModalOpen(false);
        if (activeTab === 'categorias') cargarCategorias();
        else cargarMarcas();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar', 'error');
      }
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    setSelectedItem(null);
    if (activeTab === 'categorias') {
      setCategoriaSearchParams(prev => ({ ...prev, page: 1 })); // Recargar la primera página
      cargarCategorias();
    } else {
      setMarcaSearchParams(prev => ({ ...prev, page: 1 })); // Recargar la primera página
      cargarMarcas();
    }
    Swal.fire({
      title: '¡Guardado!',
      text: 'Los cambios se realizaron correctamente',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const datos = activeTab === 'categorias' ? categorias : marcas;
  const pagination = activeTab === 'categorias' ? categoriaPagination : marcaPagination;
  const currentSearchParams = activeTab === 'categorias' ? categoriaSearchParams : marcaSearchParams;

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

      {/* Búsqueda */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder={`Buscar ${activeTab === 'categorias' ? 'categoría' : 'marca'}...`}
          value={currentSearchParams.search}
          onChange={handleSearchChange}
          style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        />
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
        {loading ? (
          <p>Cargando {activeTab === 'categorias' ? 'categorías' : 'marcas'}...</p>
        ) : datos.length > 0 ? (
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

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            style={{
              padding: '8px 15px',
              backgroundColor: '#f0f4f8',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#4a5568',
              opacity: pagination.hasPrevPage ? 1 : 0.5
            }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            style={{
              padding: '8px 15px',
              backgroundColor: '#f0f4f8',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#4a5568',
              opacity: pagination.hasNextPage ? 1 : 0.5
            }}
          >
            Siguiente
          </button>
        </div>
      )}

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
