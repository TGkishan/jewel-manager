import { Component, Product } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

export const parseComponentsExcel = async (file: File): Promise<Component[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(sheet);

        const components: Component[] = jsonData.map((row: any) => ({
          id: crypto.randomUUID(),
          name: row['Name'] || row['name'] || 'Unknown Component',
          price: Number(row['Price'] || row['price'] || 0),
          unit: row['Unit'] || row['unit'] || 'pcs',
          category: row['Category'] || row['category'] || 'General',
        }));

        resolve(components);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const generateTemplate = (type: 'component' | 'product') => {
  const data = type === 'component' 
    ? [{ Name: 'Gold Chain 2mm', Price: 15, Unit: 'meter', Category: 'Chain' }]
    : [{ Name: 'Necklace Set A1', SKU: 'NK-001', MakingCharges: 50 }];
    
  const ws = window.XLSX.utils.json_to_sheet(data);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Template");
  window.XLSX.writeFile(wb, `${type}_template.xlsx`);
};
