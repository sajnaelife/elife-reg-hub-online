
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Registration } from './types';

export const exportToExcel = (registrations: Registration[]) => {
  if (!registrations) return;
  
  // Helper function to calculate days remaining
  const calculateDaysRemaining = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 15 - diffDays);
    
    if (remaining === 0) return 'Expired';
    if (remaining === 1) return '1 day left';
    return `${remaining} days left`;
  };
  
  const exportData = registrations.map(reg => ({
    'Customer ID': reg.customer_id,
    'Name': reg.name,
    'Mobile Number': reg.mobile_number,
    'Address': reg.address,
    'Category': reg.categories?.name,
    'Panchayath': reg.panchayaths?.name,
    'District': reg.panchayaths?.district,
    'Ward': reg.ward,
    'Agent/PRO': reg.agent_pro || '',
    'Preference': reg.preference || '',
    'Status': reg.status,
    'Fee Paid': reg.fee_paid,
    'Applied Date': new Date(reg.created_at).toLocaleDateString('en-IN'),
    'Updated Date': new Date(reg.updated_at).toLocaleDateString('en-IN'),
    'Expiry Status': calculateDaysRemaining(reg.created_at)
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
  XLSX.writeFile(workbook, `registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (registrations: Registration[]) => {
  if (!registrations || registrations.length === 0) {
    throw new Error('No registrations available to export');
  }
  
  // Helper function to calculate days remaining
  const calculateDaysRemaining = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 15 - diffDays);
    
    if (remaining === 0) return 'Expired';
    if (remaining === 1) return '1 day';
    return `${remaining} days`;
  };
  
  console.log('Starting PDF export...');
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(16);
  doc.text('Registrations Report', 14, 15);

  // Add export date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 25);

  // Prepare table data
  const tableData = registrations.map(reg => [
    reg.customer_id || '',
    reg.name || '',
    reg.mobile_number || '',
    reg.categories?.name || '',
    reg.preference || '-',
    reg.status || '',
    `₹${reg.fee_paid || 0}`,
    new Date(reg.created_at).toLocaleDateString('en-IN'),
    calculateDaysRemaining(reg.created_at)
  ]);
  
  console.log('Table data prepared:', tableData.length, 'rows');

  // Add table using autoTable
  autoTable(doc, {
    head: [['Customer ID', 'Name', 'Mobile', 'Category', 'Preference', 'Status', 'Fee', 'Date', 'Expiry']],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 7,
      cellPadding: 1.5
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Customer ID
      1: { cellWidth: 30 }, // Name
      2: { cellWidth: 22 }, // Mobile
      3: { cellWidth: 25 }, // Category
      4: { cellWidth: 18 }, // Preference
      5: { cellWidth: 18 }, // Status
      6: { cellWidth: 18 }, // Fee
      7: { cellWidth: 22 }, // Date
      8: { cellWidth: 20 }  // Expiry
    }
  });

  // Save the PDF
  const fileName = `registrations_${new Date().toISOString().split('T')[0]}.pdf`;
  console.log('Saving PDF as:', fileName);
  doc.save(fileName);
};
