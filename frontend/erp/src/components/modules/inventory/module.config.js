export default {
  id: "inventory",
  code: "inventory",
  name: "inventory Module",
  description: "Manage inventory orders, quotations, and billing.",
  available_in_plans: ["basic", "advance", "enterprise"],
  pages: [
    { path: "/inventory/stock", name: "stock" },
    { path: "/inventory/add-stock", name: "add-stock" }
  ]
};
