// src/pages/HistoryPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { History, LayoutDashboard } from 'lucide-react';

export function HistoryPage() {
  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen text-gray-100">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <History className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-bold text-white">Order History</h1>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Back to Dashboard
        </Link>
      </header>
      <main>
        <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-xl font-semibold">Past Orders</h2>
            <p className="text-gray-400 mt-2">This page will show a list of completed orders.</p>
        </div>
      </main>
    </div>
  );
}