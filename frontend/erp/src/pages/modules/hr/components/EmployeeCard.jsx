export default function EmployeeCard({ employee }) {
  const name = employee.user_username || employee.user?.username || employee.user_email || employee.user;
  const role = employee.role;
  const manager = employee.manager || '—';

  return (
    <div className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-slate-500">Role: {role}</div>
      </div>
      <div className="text-sm text-slate-500">Manager: {manager}</div>
    </div>
  );
}
