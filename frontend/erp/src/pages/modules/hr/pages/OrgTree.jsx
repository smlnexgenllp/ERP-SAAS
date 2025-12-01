// src/hr/pages/OrgTree.jsx
import React, { useEffect, useState } from 'react';
import { fetchOrgTree } from '../api/hrApi';

function Node({ node }) {
  return (
    <li className="mb-2">
      <div className="inline-block p-2 bg-white rounded shadow">{node.name} <span className="text-xs text-slate-500">({node.role})</span></div>
      {node.children && node.children.length > 0 && (
        <ul className="pl-6 mt-2">
          {node.children.map((c, i) => <Node key={i} node={c} />)}
        </ul>
      )}
    </li>
  );
}

export default funcorg_user = OrganizationUser.objects.create(
    organization=org,
    user=admin,
    role="admin",   # or "owner" if your system uses it
    is_active=True
)
tion OrgTreePage() {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    fetchOrgTree().then(r => setTree(r.data)).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Organization Tree</h2>
      <ul>
        {tree.map((n, i) => <Node key={i} node={n} />)}
      </ul>
    </div>
  );
}
