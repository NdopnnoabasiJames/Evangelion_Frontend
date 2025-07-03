/**
 * Frontend Excel export utility using xlsx library
 */
import * as XLSX from 'xlsx';

/**
 * Export table data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column configurations
 * @param {string} filename - Name for the exported file
 */
export const exportToExcel = (data, columns, filename) => {
  try {
    // Prepare headers
    const headers = columns.map(col => col.header || col.key);
    
    // Prepare data rows
    const rows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        
        // Handle nested objects
        if (col.key.includes('.')) {
          value = getNestedValue(item, col.key);
        }
        
        // Apply custom formatter if provided
        if (col.formatter) {
          value = col.formatter(value, item);
        }
        
        // Convert complex objects to string
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            value = value.length;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        return value || '';
      });
    });
    
    // Combine headers and data
    const wsData = [headers, ...rows];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-fit columns
    const colWidths = headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_Export_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, finalFilename);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to search in
 * @param {string} path - Dot notation path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Common column formatters
 */
export const formatters = {
  date: (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString();
  },
  
  dateTime: (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString();
  },
  
  currency: (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  },
  
  number: (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat().format(value);
  },
  
  boolean: (value) => {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  },
  
  badge: (value) => {
    if (!value) return '';
    return typeof value === 'object' ? value.text || value.label || String(value) : String(value);
  },
  
  email: (value, item) => {
    return item.email || '';
  },
  
  name: (value, item) => {
    return item.name || '';
  }
};
