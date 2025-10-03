'use client';

import React from 'react';
import { FaDownload, FaPrint, FaFileExcel, FaPlus } from 'react-icons/fa';

type Props = {
  title: string;
  onPdf: () => void;
  onExcel: () => void;
  onPrint: () => void;
  createLabel: string;
  onCreate: () => void;
};

export default function ReportActionBar({ title, onPdf, onExcel, onPrint, createLabel, onCreate }: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPdf}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <FaDownload /> Reporte PDF
        </button>
        <button
          type="button"
          onClick={onExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <FaFileExcel /> Reporte Excel
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <FaPrint /> Imprimir
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> {createLabel}
        </button>
      </div>
    </div>
  );
}