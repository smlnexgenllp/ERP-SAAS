import React from "react";

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,.08)"
};

const AnalyticsDashboard = () => {
  const kpis = [
    { title: "Revenue", value: "₹12.4M", color: "#16a34a" },
    { title: "Expenses", value: "₹8.1M", color: "#dc2626" },
    { title: "Net Profit", value: "₹4.3M", color: "#2563eb" },
    { title: "Growth", value: "+18%", color: "#7c3aed" },
    { title: "Orders", value: "1,248" },
    { title: "Customers", value: "486" },
    { title: "Inventory Value", value: "₹2.8M" },
    { title: "Receivables", value: "₹1.4M" },
  ];

  const monthly = [
    { month: "Jan", revenue: "1.2M", expense: "0.8M", profit: "0.4M" },
    { month: "Feb", revenue: "1.5M", expense: "1.0M", profit: "0.5M" },
    { month: "Mar", revenue: "1.8M", expense: "1.1M", profit: "0.7M" },
    { month: "Apr", revenue: "2.1M", expense: "1.4M", profit: "0.7M" },
    { month: "May", revenue: "2.4M", expense: "1.5M", profit: "0.9M" },
    { month: "Jun", revenue: "3.4M", expense: "2.3M", profit: "1.1M" },
  ];

  return (
    <div style={{ padding: 25, background: "#f5f7fb", minHeight: "100vh" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 25
        }}
      >
        <div>
          <h2>Business Dashboard</h2>
          <p>Overall Business KPI & Analytics</p>
        </div>

        <button
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: 0,
            background: "#2563eb",
            color: "#fff"
          }}
        >
          Export Report
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 20
        }}
      >
        {kpis.map((item) => (
          <div key={item.title} style={cardStyle}>
            <h4>{item.title}</h4>
            <h2 style={{ color: item.color }}>{item.value}</h2>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginTop: 25
        }}
      >
        <div style={cardStyle}>
          <h3>Revenue vs Expenses</h3>

          <div
            style={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999"
            }}
          >
            Line Chart Here
          </div>
        </div>

        <div style={cardStyle}>
          <h3>Business Health</h3>

          <ul>
            <li>Revenue Growth : 18%</li>
            <li>Customer Growth : 9%</li>
            <li>Inventory Health : Good</li>
            <li>Cash Flow : Stable</li>
            <li>Overall Score : 87%</li>
          </ul>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 25 }}>
        <h3>Monthly Business Comparison</h3>

        <table width="100%" cellPadding="10">
          <thead>
            <tr>
              <th align="left">Month</th>
              <th>Revenue</th>
              <th>Expense</th>
              <th>Profit</th>
            </tr>
          </thead>

          <tbody>
            {monthly.map((m) => (
              <tr key={m.month}>
                <td>{m.month}</td>
                <td>{m.revenue}</td>
                <td>{m.expense}</td>
                <td>{m.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 25
        }}
      >
        <div style={cardStyle}>
          <h3>Top Branches</h3>

          <ul>
            <li>Chennai - ₹4.8M</li>
            <li>Salem - ₹3.5M</li>
            <li>Coimbatore - ₹2.2M</li>
            <li>Bangalore - ₹1.9M</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h3>Recent Activities</h3>

          <ul>
            <li>Sales target achieved.</li>
            <li>Purchase Order Approved.</li>
            <li>New Customer Added.</li>
            <li>Inventory Low Stock Alert.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;