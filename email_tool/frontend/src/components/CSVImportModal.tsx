import React, { useState, useRef } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { apiUrl } from '../config';
import { useToast } from '../contexts/ToastContext';

interface CSVImportData {
  tag: string;
  copy: string;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  projects: Array<{ id: number; name: string }>;
  availableTags: Array<{ id: number; name: string; color: string }>;
  templateId: number;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  projects,
  availableTags,
  templateId
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLocale, setSelectedLocale] = useState<string>('en');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<CSVImportData[]>([]);
  const [validationResults, setValidationResults] = useState<{
    valid: CSVImportData[];
    missingTags: string[];
    extraTags: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    } else {
      showWarning('Invalid File', 'Please select a valid CSV file.');
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const data: CSVImportData[] = [];
      
      // Skip header row and parse data
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          // Split by comma, but handle quoted values
          const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
            data.push({
              tag: parts[0],
              copy: parts[1]
            });
          }
        }
      }
      
      setPreviewData(data);
      validateData(data);
    };
    reader.readAsText(file);
  };

  const validateData = (data: CSVImportData[]) => {
    const availableTagNames = availableTags.map(tag => tag.name);
    const csvTagNames = data.map(item => item.tag);
    
    // Normalize tag names for comparison (remove {{ }} if present)
    const normalizeTag = (tag: string) => {
      return tag.replace(/^\{\{|\}\}$/g, '').trim();
    };
    
    const normalizedAvailableTags = availableTagNames.map(normalizeTag);
    const normalizedCsvTags = csvTagNames.map(normalizeTag);
    
    // Find missing tags (tags in CSV that don't exist in project)
    const missingTags = normalizedCsvTags.filter(tag => !normalizedAvailableTags.includes(tag));
    
    // Find extra tags (tags in project that aren't in CSV)
    const extraTags = normalizedAvailableTags.filter(tag => !normalizedCsvTags.includes(tag));
    
    // Filter valid entries (tags that exist in project)
    const valid = data.filter(item => {
      const normalizedTag = normalizeTag(item.tag);
      return normalizedAvailableTags.includes(normalizedTag);
    });
    
    setValidationResults({
      valid,
      missingTags,
      extraTags
    });
  };

  const handleImport = async () => {
    if (!selectedProject || !csvFile || !validationResults) return;
    if (!templateId) {
      showError('Import Failed', 'No template selected. Please select a template before importing.');
      return;
    }
    setImporting(true);
    try {
      // Normalize tag names (remove {{ }} if present)
      const normalizeTag = (tag: string) => {
        return tag.replace(/^[{]{2}|[}]{2}$/g, '').trim();
      };
      // Prepare bulk payload
      const bulkPayload = validationResults.valid.map(item => ({
        project_id: Number(selectedProject),
        template_id: templateId,
        placeholder_name: normalizeTag(item.tag),
        copy_text: item.copy,
        locale: selectedLocale,
        status: 'Draft',
      }));
      const response = await fetch(apiUrl('/localized-copy/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkPayload),
      });
      if (response.ok) {
        showSuccess('Import Complete', `Successfully imported ${bulkPayload.length} copy entries.`);
        onImportComplete();
        onClose();
        resetForm();
      } else {
        showError('Import Failed', 'Failed to import CSV data. Please try again.');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      showError('Import Failed', 'Failed to import CSV data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedProject('');
    setSelectedLocale('en');
    setCsvFile(null);
    setPreviewData([]);
    setValidationResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      title="Import Copy from CSV" 
      isOpen={isOpen} 
      onClose={handleClose}
      size="lg"
    >
      <div className="space-y-6">
        {/* Project and Locale Selection */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Project"
            type="select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={projects.map(p => ({ value: p.id.toString(), label: p.name }))}
            required
          />
          <FormField
            label="Locale"
            type="select"
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
            options={languages}
            required
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-brand-accent file:text-white
                     hover:file:bg-blue-700
                     file:cursor-pointer"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Upload a CSV file with columns: Tag, Copy. First row should be headers.
          </p>
        </div>

        {/* Preview and Validation */}
        {previewData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview & Validation</h3>
            
            {/* Validation Results */}
            {validationResults && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {validationResults.valid.length} valid entries ready to import
                  </span>
                </div>
                
                {validationResults.missingTags.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {validationResults.missingTags.length} tags not found in project: {validationResults.missingTags.join(', ')}
                    </span>
                  </div>
                )}
                
                {validationResults.extraTags.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {validationResults.extraTags.length} project tags not in CSV: {validationResults.extraTags.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Preview Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Copy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.slice(0, 5).map((item, index) => {
                      const isValid = validationResults?.valid.some(v => v.tag === item.tag);
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.tag}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="max-w-xs truncate" title={item.copy}>
                              {item.copy}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isValid 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {previewData.length > 5 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          ... and {previewData.length - 5} more entries
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || !selectedProject || !csvFile || !validationResults || validationResults.valid.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {importing ? 'Importing...' : 'Import Copy'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CSVImportModal; 