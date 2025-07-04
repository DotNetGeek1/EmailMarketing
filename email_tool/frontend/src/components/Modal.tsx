import React from 'react';

interface ModalProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 relative">
        <div className="flex justify-between items-center border-b px-6 py-4">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal; 