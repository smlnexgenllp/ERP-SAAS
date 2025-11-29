// src/hr/components/HrSidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const LinkItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `block px-3 py-2 rounded ${isActive ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-600'}`}
  >
    {children}
  </NavLink>
);

export default function HrSidebar() {
  return (
    <aside className="w-56 bg-slate-800 text-white min-h-screen p-4 hidden md:block">
      <div className="mb-6 text-lg font-semibold">HR</div>
      <nav className="space-y-2">
        <LinkItem to="/hr/employees">Employees</LinkItem>
        <LinkItem to="/hr/employees/add">Add Employee</LinkItem>
        <LinkItem to="/hr/attendance">Attendance</LinkItem>
        <LinkItem to="/hr/payroll">Payroll</LinkItem>
        <LinkItem to="/hr/leaves">Leaves</LinkItem>
        <LinkItem to="/hr/documents">My Documents</LinkItem>
        <LinkItem to="/hr/org-tree">Org Tree</LinkItem>
      </nav>
    </aside>
  );
}
