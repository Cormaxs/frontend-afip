import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { apiContext } from "../../context/api_context";
import Swal from 'sweetalert2';

// --- Íconos Reutilizables ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);
const SpinnerIcon = (props) => <Icon path="M12 3v1m0 16v1m8.4-15.4l-.7.7m-11.4 0l.7.7M21 12h-1M4 12H3m15.4 8.4l-.7-.7m-11.4 0l.7-.7" {...props} className={`animate-spin ${props.className || 'h-5 w-5'}`} />;
const OpenIcon = (props) => <Icon path="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.117 1.243H4.557c-.654 0-1.187-.585-1.117-1.243l1.263-12a1.125 1.125 0 011.117-1.007h8.878c.553 0 1.026.43 1.117 1.007z" {...props} />;
const CloseIcon = (props) => <Icon path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" {...props} />;
const MovementIcon = (props) => <Icon path="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" {...props} />;

// --- Componente Principal de Gestión de Caja ---
export default function GestionDeCaja() {
    const { userData, companyData, getPointsByCompany, abrirCaja, cerrarCaja, get_caja_company, ingreso_egreso } = useContext(apiContext);

    // --- Estados ---
    const [activeTab, setActiveTab] = useState('abrir');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Datos compartidos
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [cajasAbiertas, setCajasAbiertas] = useState([]);

    // Estado para formularios
    const [formAbrir, setFormAbrir] = useState({ puntoVenta: '', nombreCaja: '', montoInicial: '', fechaApertura: new Date().toISOString().split('T')[0] });
    const [formCerrar, setFormCerrar] = useState({ cajaId: '', montoFinal: '', observaciones: '' });
    const [formMovimiento, setFormMovimiento] = useState({ cajaId: '', tipo: 'ingreso', monto: '', descripcion: '' });
    
    // --- Lógica de Carga de Datos ---
    const fetchData = useCallback(async () => {
        if (!companyData?._id) return;
        setIsLoading(true);
        setError(null);
        try {
            const [puntosRes, cajasRes] = await Promise.all([
                getPointsByCompany(companyData._id, 1, 500),
                get_caja_company(companyData._id, 1, { estado: 'abierta', limit: 500 })
            ]);
            setPuntosDeVenta(puntosRes?.puntosDeVenta || []);
            setCajasAbiertas(cajasRes?.cajas || []);
        } catch (err) {
            setError("No se pudieron cargar los datos necesarios. Por favor, recargá la página.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [companyData, getPointsByCompany, get_caja_company]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Lógica Derivada (useMemo) ---
    const cajaSeleccionadaParaCerrar = useMemo(() => cajasAbiertas.find(c => c._id === formCerrar.cajaId), [cajasAbiertas, formCerrar.cajaId]);
    const diferenciaCierre = useMemo(() => {
        if (!cajaSeleccionadaParaCerrar) return 0;
        const esperado = cajaSeleccionadaParaCerrar.montoEsperadoEnCaja || 0;
        const final = parseFloat(formCerrar.montoFinal) || 0;
        return final - esperado;
    }, [cajaSeleccionadaParaCerrar, formCerrar.montoFinal]);

    // --- Manejadores de Formularios ---
    const handleAbrirCaja = async (e) => {
        e.preventDefault();
        if (!formAbrir.puntoVenta || !formAbrir.nombreCaja.trim()) {
            return Swal.fire('Atención', 'Debés seleccionar un punto de venta y darle un nombre a la caja.', 'warning');
        }
        setIsSubmitting(true);
        try {
            await abrirCaja({
                empresa: companyData._id,
                puntoDeVenta: formAbrir.puntoVenta,
                nombreCaja: formAbrir.nombreCaja.trim(),
                vendedorAsignado: userData._id,
                montoInicial: parseFloat(formAbrir.montoInicial) || 0,
                fechaApertura: formAbrir.fechaApertura,
            });
            await Swal.fire('¡Éxito!', 'La caja se abrió correctamente.', 'success');
            setFormAbrir({ puntoVenta: '', nombreCaja: '', montoInicial: '', fechaApertura: new Date().toISOString().split('T')[0] });
            await fetchData();
            setActiveTab('movimientos');
        } catch (err) {
            Swal.fire('Error', err.message || "No se pudo abrir la caja.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCerrarCaja = async (e) => {
        e.preventDefault();
        if (!cajaSeleccionadaParaCerrar) {
            return Swal.fire('Error', 'Debes seleccionar una caja para cerrar.', 'error');
        }
        const result = await Swal.fire({
            title: '¿Estás seguro?', text: `Vas a cerrar la caja "${cajaSeleccionadaParaCerrar.nombreCaja}". Esta acción no se puede deshacer.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, cerrar caja'
        });
        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            await cerrarCaja({
                montoFinalReal: parseFloat(formCerrar.montoFinal) || 0,
                observacionesCierre: formCerrar.observaciones,
                usuarioCierre: userData?._id
            }, formCerrar.cajaId);
            await Swal.fire('¡Éxito!', 'Caja cerrada exitosamente.', 'success');
            setFormCerrar({ cajaId: '', montoFinal: '', observaciones: '' });
            await fetchData();
        } catch (err) {
            Swal.fire('Error', err.message || "No se pudo cerrar la caja.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMovimiento = async (e) => {
        e.preventDefault();
        if (!formMovimiento.cajaId || !formMovimiento.descripcion.trim() || parseFloat(formMovimiento.monto) <= 0) {
            return Swal.fire('Atención', 'Seleccioná una caja, ingresá un monto mayor a cero y una descripción.', 'warning');
        }
        setIsSubmitting(true);
        try {
            await ingreso_egreso({
                tipo: formMovimiento.tipo,
                monto: parseFloat(formMovimiento.monto),
                descripcion: formMovimiento.descripcion,
            }, formMovimiento.cajaId);
            Swal.fire('¡Éxito!', `Movimiento de "${formMovimiento.tipo}" registrado.`, 'success');
            setFormMovimiento(prev => ({ ...prev, monto: '', descripcion: '' }));
            await fetchData();
        } catch (err) {
            Swal.fire('Error', err.message || "No se pudo registrar el movimiento.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100"><SpinnerIcon className="w-12 h-12 text-indigo-600"/></div>;
    }
    if (error) {
        return <div className="m-8 p-6 bg-red-100 text-red-700 rounded-lg text-center shadow-md">{error}</div>;
    }

    const hayCajasAbiertas = cajasAbiertas.length > 0;
    
    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Gestión de Caja</h1>
                    <p className="mt-2 text-lg text-gray-500">{userData?.username} en <span className="font-semibold">{companyData?.nombreEmpresa}</span></p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg">
                    {/* --- Pestañas de Navegación --- */}
                    <div className="flex border-b border-gray-200">
                        <TabButton icon={<OpenIcon/>} text="Abrir Caja" isActive={activeTab === 'abrir'} onClick={() => setActiveTab('abrir')} />
                        <TabButton icon={<MovementIcon/>} text="Movimientos" isActive={activeTab === 'movimientos'} onClick={() => setActiveTab('movimientos')} disabled={!hayCajasAbiertas} />
                        <TabButton icon={<CloseIcon/>} text="Cerrar Caja" isActive={activeTab === 'cerrar'} onClick={() => setActiveTab('cerrar')} disabled={!hayCajasAbiertas} />
                    </div>

                    {/* --- Contenido de la Pestaña Activa --- */}
                    <div className="p-6 sm:p-8">
                        {activeTab === 'abrir' && <AbrirCajaForm formState={formAbrir} setFormState={setFormAbrir} puntosDeVenta={puntosDeVenta} onSubmit={handleAbrirCaja} isSubmitting={isSubmitting} />}
                        {activeTab === 'movimientos' && <MovimientoForm formState={formMovimiento} setFormState={setFormMovimiento} cajasAbiertas={cajasAbiertas} onSubmit={handleMovimiento} isSubmitting={isSubmitting} />}
                        {activeTab === 'cerrar' && <CerrarCajaForm formState={formCerrar} setFormState={setFormCerrar} cajasAbiertas={cajasAbiertas} selectedCaja={cajaSeleccionadaParaCerrar} diferencia={diferenciaCierre} onSubmit={handleCerrarCaja} isSubmitting={isSubmitting} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Componentes de UI Internos (Pestañas y Formularios) ---

const TabButton = ({ icon, text, isActive, disabled, onClick }) => (
    <button onClick={onClick} disabled={disabled} className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-bold border-b-2 transition-all duration-200 ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {icon} <span className="hidden sm:inline">{text}</span>
    </button>
);

const AbrirCajaForm = ({ formState, setFormState, puntosDeVenta, onSubmit, isSubmitting }) => {
    const handleChange = (e) => setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    return (
        <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-700">Completá los datos para iniciar el día</h3>
            <div>
                <label htmlFor="puntoVenta" className="block text-sm font-medium text-gray-700">Punto de Venta*</label>
                <select id="puntoVenta" name="puntoVenta" value={formState.puntoVenta} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Seleccione un punto --</option>
                    {puntosDeVenta.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="nombreCaja" className="block text-sm font-medium text-gray-700">Nombre de la Caja*</label>
                <input type="text" id="nombreCaja" name="nombreCaja" value={formState.nombreCaja} onChange={handleChange} required placeholder="Ej: Caja Principal, Turno Mañana" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
                <label htmlFor="montoInicial" className="block text-sm font-medium text-gray-700">Monto Inicial ($)</label>
                <input type="number" id="montoInicial" name="montoInicial" value={formState.montoInicial} onChange={handleChange} min="0" step="any" placeholder="0.00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                {isSubmitting ? <><SpinnerIcon /> Abriendo...</> : 'Abrir Caja'}
            </button>
        </form>
    );
};

const CerrarCajaForm = ({ formState, setFormState, cajasAbiertas, selectedCaja, diferencia, onSubmit, isSubmitting }) => {
    const handleChange = (e) => setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    
    if (cajasAbiertas.length === 0) return <div className="text-center p-6 bg-gray-50 rounded-lg animate-fade-in"><p className="text-gray-600">No hay cajas abiertas para cerrar.</p></div>;
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="cajaId" className="block text-sm font-medium text-gray-700">Seleccioná la Caja a Cerrar*</label>
                <select id="cajaId" name="cajaId" value={formState.cajaId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Por favor, elige una opción --</option>
                    {cajasAbiertas.map(c => <option key={c._id} value={c._id}>{c.nombreCaja} (P.V: {c.puntoDeVenta?.nombre || 'N/A'})</option>)}
                </select>
            </div>
            {selectedCaja && (
                <form onSubmit={onSubmit} className="space-y-6 border-t pt-6 animate-fade-in">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-lg text-gray-700 mb-2">Resumen de Caja</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="font-semibold">Monto Esperado:</p><p className="font-bold text-lg">${selectedCaja.montoEsperadoEnCaja?.toLocaleString('es-AR', {minimumFractionDigits: 2}) || '0,00'}</p>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="montoFinal" className="block text-sm font-medium text-gray-700">Monto Final Contado (Dinero real en caja)*</label>
                        <input type="number" id="montoFinal" name="montoFinal" value={formState.montoFinal} onChange={handleChange} required min="0" step="0.01" className="text-lg mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="0.00" />
                    </div>
                    <div className={`p-3 text-center rounded-lg border font-semibold ${diferencia === 0 ? 'bg-gray-100' : diferencia < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        Diferencia de Caja: ${diferencia.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </div>
                    <div>
                        <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones (Opcional)</label>
                        <textarea id="observaciones" name="observaciones" value={formState.observaciones} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: Faltante por error en vuelto, etc." />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400">
                        {isSubmitting ? <><SpinnerIcon /> Cerrando...</> : 'Confirmar y Cerrar Caja'}
                    </button>
                </form>
            )}
        </div>
    );
};

const MovimientoForm = ({ formState, setFormState, cajasAbiertas, onSubmit, isSubmitting }) => {
    const handleChange = (e) => setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    
    if (cajasAbiertas.length === 0) return <div className="text-center p-6 bg-gray-50 rounded-lg animate-fade-in"><p className="text-gray-600">Necesitás tener una caja abierta para registrar movimientos.</p></div>;

    const color = formState.tipo === 'ingreso' ? 'green' : 'red';

    return (
        <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="cajaIdMov" className="block text-sm font-medium text-gray-700">Seleccioná la Caja*</label>
                <select id="cajaIdMov" name="cajaId" value={formState.cajaId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">-- Por favor, elige una opción --</option>
                    {cajasAbiertas.map(c => <option key={c._id} value={c._id}>{c.nombreCaja} (P.V: {c.puntoDeVenta?.nombre || 'N/A'})</option>)}
                </select>
            </div>
            <fieldset className="border border-gray-300 rounded-md p-4">
                <legend className="text-sm font-medium text-gray-700 px-1">Tipo de Movimiento</legend>
                <div className="flex gap-4">
                    <RadioOption label="Ingreso" value="ingreso" color="green" checked={formState.tipo === 'ingreso'} onChange={handleChange} />
                    <RadioOption label="Egreso" value="egreso" color="red" checked={formState.tipo === 'egreso'} onChange={handleChange} />
                </div>
            </fieldset>
            <div>
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700">Monto ($)*</label>
                <input type="number" id="monto" name="monto" value={formState.monto} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción*</label>
                <textarea id="descripcion" name="descripcion" value={formState.descripcion} onChange={handleChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej: Pago a proveedor, retiro de efectivo..." />
            </div>
            <button type="submit" disabled={isSubmitting || !formState.cajaId} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 disabled:bg-gray-400`}>
                {isSubmitting ? <><SpinnerIcon /> Registrando...</> : `Registrar ${formState.tipo}`}
            </button>
        </form>
    );
};

const RadioOption = ({ label, value, color, checked, onChange }) => (
    <label className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${checked ? `border-${color}-500 bg-${color}-50` : 'border-gray-300'}`}>
        <input type="radio" name="tipo" value={value} checked={checked} onChange={onChange} className="sr-only" />
        <span className={`text-sm font-semibold ${checked ? `text-${color}-700` : 'text-gray-600'}`}>{label}</span>
    </label>
);