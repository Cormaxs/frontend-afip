import React from 'react';
import ModalGenerico from '../../../components/modal/ModalGenerico.jsx';
import EmpresaForm from '../../../components/afip/EmpresaForm.jsx';
import { afipService } from '../../../services/afip/afip-general.js';
import Swal from 'sweetalert2';

const EditarEmpresaModal = ({ isOpen, onClose, user, datosActuales, onExito }) => {
  const handleUpdate = async (formData) => {
    try {
      const payload = {
        idPropietario: user.empresa,
        idEmpresa: user?.idDbAfip,
        empresa: formData,
        iduser: user._id
      };

      const idExistente = datosActuales?._id;
      const respuesta = await afipService.actualizarEmpresa(idExistente, payload);

      if (respuesta.status === 200 || respuesta.data?.success) {
        Swal.fire('¡Éxito!', 'Datos actualizados correctamente', 'success');
        onExito();
        onClose();
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
  };

  return (
    <ModalGenerico isOpen={isOpen} onClose={onClose} title="Editar Datos Fiscales">
      <EmpresaForm 
        onSubmit={handleUpdate} 
        initialData={datosActuales?.empresa} 
        isEditing={true} 
      />
      <button className="btn-cancelar-link" onClick={onClose}>Cancelar</button>
    </ModalGenerico>
  );
};

export default EditarEmpresaModal;