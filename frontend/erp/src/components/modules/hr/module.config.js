export default {
  id: "hr",
  code: "hr",
  name: "hr Module",
  description: "Manage payrolls and employees",
  available_in_plans: ["basic", "advance", "enterprise"],
  pages: [
    { path: "/hr/payroll", name: "payroll" },
    { path: "/hr/employee", name: "employee" }
  ]
};
