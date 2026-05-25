import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import {
    AFIP_DOC_TIPOS,
    AFIP_ALICUOTAS_IVA,
    CONDICIONES_IVA_RECEPTOR,
    COMPROBANTES_CON_IVA_DESGLOSADO,
    AFIP_TIPOS_COMPROBANTE,
    AFIP_MONEDAS,
    AFIP_FORMAS_PAGO
} from '../../constants/afipConstants.js';
import { facturasService } from '../../services/afip/facturas/facturacion.js';
import { FacturacionRequerimentos } from '../../utils/facturacionHelper.js';

export const useFacturaLogic = ({ user, empresa }) => {
    // Estados de configuración
    const [puntosVenta, setPuntosVenta] = useState([]);
    const [pvSeleccionado, setPvSeleccionado] = useState(null);
    const [tipoCbte, setTipoCbte] = useState(11);
    const [proximoNumero, setProximoNumero] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serverErrors, setServerErrors] = useState([]);
    const [serverWarnings, setServerWarnings] = useState([]);

    // Inicialización del formulario
    const { register, control, setValue, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            concepto: 1,
            docTipo: 80,
            docNro: '',
            condicionIVAReceptor: 5,
            moneda: 'PES',      // ahora guardamos el código, no la descripción
            formaPago: 1,       // 1 = Contado (id numérico)
            items: []
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const watchedItems = useWatch({ control, name: "items" });
    const condicionIVA = useWatch({ control, name: "condicionIVAReceptor" });
    const docTipo = useWatch({ control, name: "docTipo" });

    // Cargar puntos de venta al montar
    useEffect(() => {
        const iniciarConfig = async () => {
            if (!user?.empresa) return;
            try {
                const config = await FacturacionRequerimentos.obtenerConfiguracionPuntosVenta(user.empresa);
                setPuntosVenta(config.todos);
                setPvSeleccionado(config.principal);
            } catch (err) {
                console.error("Error al cargar puntos de venta", err);
            } finally {
                setLoadingConfig(false);
            }
        };
        iniciarConfig();
    }, [user?.empresa]);

    // Obtener próximo número (optimizado: depende solo de valores primitivos)
    const cuitEmpresa = empresa?.cuit;
    useEffect(() => {
        const obtenerNumero = async () => {
            if (!user?.idDbAfip || !pvSeleccionado || !cuitEmpresa) return;
            try {
                const num = await FacturacionRequerimentos.obtenerProximoNumero({
                    idDbAfip: user.idDbAfip,
                    puntoVenta: pvSeleccionado.numero,
                    tipoComprobante: Number(tipoCbte),
                    datosEmpresa: empresa
                });
                setProximoNumero(num);
            } catch (err) {
                console.error("Error al obtener próximo número", err);
                setProximoNumero(null);
            }
        };
        obtenerNumero();
    }, [pvSeleccionado, tipoCbte, user?.idDbAfip, cuitEmpresa, empresa]);

    const esTipoA = useMemo(
        () => COMPROBANTES_CON_IVA_DESGLOSADO.includes(Number(tipoCbte)),
        [tipoCbte]
    );

    const validation = useMemo(() => {
        const t = Number(tipoCbte);
        const c = Number(condicionIVA);
        if (t === 1 && ![1, 6].includes(c)) {
            return {
                isValid: false,
                msg: "La Factura A solo puede emitirse a Responsables Inscriptos o Monotributistas."
            };
        }
        if (([11, 12, 13].includes(t)) && c !== 5) {
            return {
                isValid: false,
                msg: "La Factura C solo puede emitirse a Consumidor Final."
            };
        }
        return { isValid: true, msg: "" };
    }, [tipoCbte, condicionIVA]);

    const allowedCondiciones = useMemo(() => {
        if ([1, 2, 3].includes(tipoCbte)) return [1, 6];
        if ([6, 7, 8].includes(tipoCbte)) return [4, 5, 6];
        if ([11, 12, 13].includes(tipoCbte)) return [5];
        return [1, 4, 5, 6];
    }, [tipoCbte]);

    const allowedDocTipos = useMemo(() => {
        if ([1, 2, 3].includes(tipoCbte)) return [80, 86];
        if ([6, 7, 8].includes(tipoCbte)) return [80, 86, 96, 99];
        if ([11, 12, 13].includes(tipoCbte)) return [96, 99];
        return [80, 86, 94, 96, 99];
    }, [tipoCbte]);

    const defaultDocTipoByTipoCbte = useMemo(() => {
        if ([1, 2, 3].includes(tipoCbte)) return 80;
        if ([6, 7, 8].includes(tipoCbte)) return 96;
        if ([11, 12, 13].includes(tipoCbte)) return 96;
        return 80;
    }, [tipoCbte]);

    useEffect(() => {
        if (!setValue) return;
        const currentCond = Number(condicionIVA);
        if (!allowedCondiciones.includes(currentCond)) {
            setValue('condicionIVAReceptor', allowedCondiciones[0]);
        }

        const currentDoc = Number(docTipo);
        if (!allowedDocTipos.includes(currentDoc)) {
            setValue('docTipo', allowedDocTipos[0]);
        } else if (currentDoc !== defaultDocTipoByTipoCbte && allowedDocTipos.includes(defaultDocTipoByTipoCbte)) {
            setValue('docTipo', defaultDocTipoByTipoCbte);
        }
    }, [allowedCondiciones, allowedDocTipos, condicionIVA, docTipo, setValue, defaultDocTipoByTipoCbte]);

    const totales = useMemo(() => {
        let netoAcumulado = 0;
        let ivaAcumulado = 0;
        const ivaAgrupado = {};

        watchedItems?.forEach(item => {
            const cant = Number(item.cantidad) || 0;
            const precioIngresado = Number(item.precioUnitario) || 0;
            const alicuotaObj = AFIP_ALICUOTAS_IVA.find(a => a.id === Number(item.alicuotaIVA));
            const porcentaje = alicuotaObj ? alicuotaObj.value : 0;

            if (esTipoA) {
                const neto = Number((cant * precioIngresado).toFixed(2));
                const iva = Number((neto * porcentaje).toFixed(2));
                netoAcumulado += neto;
                ivaAcumulado += iva;
                if (item.alicuotaIVA) {
                    if (!ivaAgrupado[item.alicuotaIVA]) {
                        ivaAgrupado[item.alicuotaIVA] = { id: Number(item.alicuotaIVA), baseImponible: 0, importe: 0 };
                    }
                    ivaAgrupado[item.alicuotaIVA].baseImponible += neto;
                    ivaAgrupado[item.alicuotaIVA].importe += iva;
                }
            } else {
                const totalFila = Number((cant * precioIngresado).toFixed(2));
                const neto = Number((totalFila / (1 + porcentaje)).toFixed(2));
                const iva = Number((totalFila - neto).toFixed(2));
                netoAcumulado += neto;
                ivaAcumulado += iva;
                if (item.alicuotaIVA) {
                    if (!ivaAgrupado[item.alicuotaIVA]) {
                        ivaAgrupado[item.alicuotaIVA] = { id: Number(item.alicuotaIVA), baseImponible: 0, importe: 0 };
                    }
                    ivaAgrupado[item.alicuotaIVA].baseImponible += neto;
                    ivaAgrupado[item.alicuotaIVA].importe += iva;
                }
            }
        });

        return {
            neto: Number(netoAcumulado.toFixed(2)),
            ivaTotal: Number(ivaAcumulado.toFixed(2)),
            total: Number((netoAcumulado + ivaAcumulado).toFixed(2)),
            ivaArray: Object.values(ivaAgrupado).map(v => ({
                id: v.id,
                baseImponible: Number(v.baseImponible.toFixed(2)),
                importe: Number(v.importe.toFixed(2))
            }))
        };
    }, [watchedItems, esTipoA]);

    const onSelectProducto = useCallback((prod) => {
        const alicuotaMapeada = AFIP_ALICUOTAS_IVA.find(a => a.label === `${prod.alic_IVA}%`)?.id || 5;
        const porcentajeIva = prod.alic_IVA / 100;
        const precioParaInput = esTipoA
            ? Number((prod.precioLista / (1 + porcentajeIva)).toFixed(2))
            : prod.precioLista;

        append({
            codigo: prod.codigoInterno || 'S/C',
            descripcion: prod.producto,
            cantidad: 1,
            precioUnitario: precioParaInput,
            alicuotaIVA: alicuotaMapeada
        });
        setIsModalOpen(false);
    }, [esTipoA, append]);

    const onFormSubmit = async (data) => {
        // Validaciones adicionales para asegurar que CUIT y otros datos estén presentes
        if (!validation.isValid) return;
        if (!empresa?.cuit) {
            alert("Falta el CUIT de la empresa. No se puede emitir comprobante.");
            return;
        }
        if (!user?.idDbAfip) {
            alert("Falta la identificación AFIP del usuario.");
            return;
        }
        if (!proximoNumero) {
            alert("No se pudo obtener el próximo número de comprobante.");
            return;
        }

        setIsSubmitting(true);

        const itemsParaAfip = data.items.map(it => {
            const alicObj = AFIP_ALICUOTAS_IVA.find(a => a.id === Number(it.alicuotaIVA));
            const porcentaje = alicObj?.value || 0;
            const cant = Number(it.cantidad);
            const precioIngresado = Number(it.precioUnitario);

            const netoUnitario = esTipoA
                ? precioIngresado
                : precioIngresado / (1 + porcentaje);

            const precioUnitarioAfip = esTipoA
                ? netoUnitario
                : precioIngresado;

            const subtotalNeto = netoUnitario * cant;
            const iva = Number((subtotalNeto * porcentaje).toFixed(2));

            return {
                ...it,
                cantidad: cant,
                precioUnitario: Number(precioUnitarioAfip.toFixed(2)),
                subtotal: Number(subtotalNeto.toFixed(2)),
                iva: iva
            };
        });

        const payload = {
            id: user.idDbAfip,
            cuit: empresa.cuit,                    // CUIT siempre presente
            servicio: "wsfe",
            factura: {
                puntoVenta: Number(pvSeleccionado?.numero),
                tipoComprobante: Number(tipoCbte),
                numeroFactura: proximoNumero,
                concepto: Number(data.concepto),
                docTipo: Number(data.docTipo),
                docNro: Number(data.docNro),
                condicionIVAReceptor: Number(data.condicionIVAReceptor),
                importeNeto: totales.neto,
                importeIVA: totales.ivaTotal,
                importeTotal: totales.total,
                importeNoGravado: 0,
                importeExento: 0,
                importeTributos: 0,
                moneda: data.moneda,               // ahora envía 'PES' o 'DOL'
                cotizacion: 1,
                formaPago: Number(data.formaPago), // ahora envía 1,2,...
                fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                items: itemsParaAfip,
                iva: totales.ivaArray
            }
        };

        try {
            setServerErrors([]);
            setServerWarnings([]);
            const response = await facturasService.emitirfacturas(payload);
            // Verificar si la respuesta es un PDF
            const contentType = response.headers['content-type'] || '';
            if (contentType.includes('application/pdf')) {
                const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(pdfBlob);
                window.open(url, '_blank');
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            } else {
                const errorText = await (response.data?.text ? response.data.text() : Promise.resolve('Error desconocido'));
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("❌ Error al facturar:", error);
            const parsed = await parseApiError(error);
            setServerErrors(parsed.errors.length ? parsed.errors : [parsed.message]);
            setServerWarnings(parsed.warnings || []);
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseApiError = async (error) => {
        const defaultMessage = error?.message || 'Error desconocido';
        const parsed = {
            message: defaultMessage,
            errors: [],
            warnings: []
        };

        const rawData = error?.response?.data;
        if (!rawData) {
            return parsed;
        }

        let jsonBody = null;
        try {
            if (rawData instanceof Blob || rawData instanceof ArrayBuffer) {
                const text = await new Blob([rawData]).text();
                jsonBody = JSON.parse(text);
            } else if (typeof rawData === 'string') {
                jsonBody = JSON.parse(rawData);
            } else {
                jsonBody = rawData;
            }
        } catch {
            const text = rawData instanceof Blob || rawData instanceof ArrayBuffer
                ? await new Blob([rawData]).text()
                : String(rawData);
            parsed.message = text || parsed.message;
            return parsed;
        }

        parsed.message = jsonBody.message || jsonBody.error || parsed.message;
        if (Array.isArray(jsonBody.errores)) {
            parsed.errors = jsonBody.errores.map(e => {
                if (!e) return String(e);
                if (typeof e === 'string') return e;
                return e.mensaje || e.msg || e.Msg || e.Code || e.message || JSON.stringify(e);
            }).filter(Boolean);
        } else if (jsonBody.errores) {
            parsed.errors = [typeof jsonBody.errores === 'string' ? jsonBody.errores : JSON.stringify(jsonBody.errores)];
        } else if (Array.isArray(jsonBody.errors)) {
            parsed.errors = jsonBody.errors.map(e => typeof e === 'string' ? e : e.message || JSON.stringify(e)).filter(Boolean);
        } else if (jsonBody.error) {
            parsed.errors = [typeof jsonBody.error === 'string' ? jsonBody.error : JSON.stringify(jsonBody.error)];
        }

        if (Array.isArray(jsonBody.warnings)) {
            parsed.warnings = jsonBody.warnings.map(w => typeof w === 'string' ? w : w.message || JSON.stringify(w)).filter(Boolean);
        }

        if (jsonBody.observaciones) {
            const observaciones = Array.isArray(jsonBody.observaciones)
                ? jsonBody.observaciones.map(o => typeof o === 'string' ? o : o.Msg || o.mensaje || o.message || JSON.stringify(o)).filter(Boolean)
                : [String(jsonBody.observaciones)];
            if (observaciones.length > 0) {
                parsed.errors.push(...observaciones);
            }
        }

        if (parsed.errors.length === 0 && parsed.message) {
            parsed.errors = [parsed.message];
        }
        return parsed;
    };

    return {
        loadingConfig,
        puntosVenta,
        pvSeleccionado,
        setPvSeleccionado,
        tipoCbte,
        setTipoCbte,
        proximoNumero,
        isModalOpen,
        setIsModalOpen,
        register,
        control,
        errors,
        handleSubmit: handleSubmit(onFormSubmit),
        fields,
        append,
        remove,
        watchedItems,
        condicionIVA,
        docTipo,
        allowedCondiciones,
        allowedDocTipos,
        esTipoA,
        validation,
        totales,
        onSelectProducto,
        isSubmitting,
        fieldsLength: fields.length,
        serverErrors,
        serverWarnings
    };
};