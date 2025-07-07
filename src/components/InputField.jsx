import React from 'react';

// El componente ahora usa React.forwardRef para pasar la referencia al input interno
const InputField = React.forwardRef(({ label, name, type = 'text', options, required, error, ...props }, ref) => (
    <div className="form-group">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && '*'}
        </label>
        
        {type === 'select' ? (
            <select 
                id={name} 
                name={name} 
                ref={ref} 
                {...props} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${error ? 'border-red-500' : 'border-gray-300'}`}
            >
                {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
            </select>
        ) : (
            <input 
                id={name} 
                name={name} 
                type={type} 
                ref={ref} 
                {...props} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${error ? 'border-red-500' : 'border-gray-300'}`} 
            />
        )}

        {error && <em className="text-red-500 text-xs mt-1 block">{error}</em>}
    </div>
));

export default InputField;