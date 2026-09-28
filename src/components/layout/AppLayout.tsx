import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Navbar } from './Navbar.tsx';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/70">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
