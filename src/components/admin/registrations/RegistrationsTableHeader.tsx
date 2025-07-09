
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText } from 'lucide-react';

interface RegistrationsTableHeaderProps {
  selectedRows: string[];
  onBulkApprove: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

const RegistrationsTableHeader: React.FC<RegistrationsTableHeaderProps> = ({
  selectedRows,
  onBulkApprove,
  onExportPDF,
  onExportExcel
}) => {
  return (
    <div className="flex gap-2">
      {selectedRows.length > 0 && (
        <Button
          onClick={onBulkApprove}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Bulk Approve ({selectedRows.length})
        </Button>
      )}
      <Button
        onClick={onExportPDF}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
      <Button onClick={onExportExcel} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export Excel
      </Button>
    </div>
  );
};

export default RegistrationsTableHeader;
