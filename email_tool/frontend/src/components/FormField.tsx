import React from 'react';

type Option = { value: string; label: string };
type FormFieldProps = {
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'file';
  value?: string;
  onChange?: (e: React.ChangeEvent<any>) => void;
  required?: boolean;
  options?: Option[];
  name?: string;
  placeholder?: string;
  accept?: string;
  [key: string]: any;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  options = [],
  name,
  placeholder,
  accept,
  ...rest
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={value}
          onChange={onChange}
          name={name}
          placeholder={placeholder}
          required={required}
          {...rest}
        />
      ) : type === 'select' ? (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={value}
          onChange={onChange}
          name={name}
          required={required}
          {...rest}
        >
          <option value="">Select...</option>
          {(options as Option[]).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'file' ? (
        <input
          type="file"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          onChange={onChange}
          name={name}
          accept={accept}
          required={required}
          {...rest}
        />
      ) : (
        <input
          type={type}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={value}
          onChange={onChange}
          name={name}
          placeholder={placeholder}
          required={required}
          {...rest}
        />
      )}
    </div>
  );
};

export default FormField; 