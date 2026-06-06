// components/transport/CreateTransportTrip.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { ArrowLeft, List } from "lucide-react";

const CreateTransportTrip = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sales_order: "",
    customer: "",
    vehicle: "",
    driver: "",
    route: "",
    trip_date: new Date().toISOString().split("T")[0],
    trip_type: "outbound",
    starting_km: "",
    fuel_used: "",
    remarks: "",
    items: [],
  });

  const [salesOrders, setSalesOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Master Data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [salesRes, vehiclesRes, driversRes] = await Promise.all([
          api.get("/sale/sales-orders/"),
          api.get("/transport/vehicles/"),
          api.get("/transport/drivers/"),
        ]);

        setSalesOrders(salesRes.data);
        setVehicles(vehiclesRes.data);
        setDrivers(driversRes.data);
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    };
    fetchMasterData();
  }, []);

  const handleSalesOrderChange = async (e) => {
    const soId = e.target.value;
    
    setFormData((prev) => ({ 
      ...prev, 
      sales_order: soId, 
      customer: "",
      items: [] 
    }));
    setSelectedOrderDetails(null);

    if (!soId) return;

    try {
      const res = await api.get(`/transport/trips/from_sales_order/?sales_order_id=${soId}`);
      const data = res.data;

      setSelectedOrderDetails(data);

      const tripItems = data.items?.map((item) => ({
        sales_order_item: item.sales_order_item,
        item: item.item,
        description: item.description,
        ordered_qty: item.ordered_qty,
        loaded_qty: 0,
        delivered_qty: 0,
        damaged_qty: 0,
      })) || [];

      setFormData((prev) => ({
        ...prev,
        sales_order: data.sales_order,
        customer: data.customer || "",
        items: tripItems,
      }));
    } catch (err) {
      console.error("Failed to fetch sales order details:", err);
      
      const selectedOrder = salesOrders.find((order) => order.id === parseInt(soId));
      if (selectedOrder) {
        setSelectedOrderDetails(selectedOrder);
        
        const tripItems = selectedOrder.items?.map((item) => ({
          sales_order_item: item.id,
          item: item.product?.id || null,
          description: item.description || item.product_name || "",
          ordered_qty: item.quantity || 0,
          loaded_qty: 0,
          delivered_qty: 0,
          damaged_qty: 0,
        })) || [];

        setFormData((prev) => ({
          ...prev,
          sales_order: soId,
          customer: selectedOrder.customer?.id || "",
          items: tripItems,
        }));
      }
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: parseFloat(value) || 0,
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vehicle) return alert("Please select a vehicle");
    if (!formData.driver) return alert("Please select a driver");

    try {
      setLoading(true);

      const payload = {
        sales_order: formData.sales_order || null,
        customer: formData.customer || null,
        vehicle: formData.vehicle,
        driver: formData.driver,
        route: formData.route || null,
        trip_date: formData.trip_date,
        trip_type: formData.trip_type,
        starting_km: parseFloat(formData.starting_km) || 0,
        fuel_used: parseFloat(formData.fuel_used) || 0,
        remarks: formData.remarks || "",
        items: formData.items,
      };

      await api.post("/transport/trips/", payload);
      
      alert("Transport Trip Created Successfully!");
      navigate("/transport");
    } catch (error) {
      console.error("Error Response:", error.response?.data);
      alert(`Error creating trip: ${error.response?.data?.detail || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header - Updated with View Trip List Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/transport")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Create Transport Trip</h1>
              <p className="text-zinc-600 mt-1">Fill in the details to schedule a new delivery trip</p>
            </div>
          </div>

          {/* Right Side Button - View Trip List */}
          <button
  onClick={() => navigate("/transport-list")}
  className="flex items-center gap-3 px-6 py-3 bg-black border border-black hover:bg-zinc-900 rounded-2xl text-zinc-300 hover:text-white transition font-medium"
>
  <List size={20} />
  View Trip List
</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Basic Information */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sales Order */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Sales Order
                  </label>
                  <select
                    value={formData.sales_order}
                    onChange={handleSalesOrderChange}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-zinc-50"
                  >
                    <option value="">Select Sales Order</option>
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.order_number || `SO-${so.id}`} - {so.customer?.name || "No Customer"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Vehicle *
                  </label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Driver *
                  </label>
                  <select
                    value={formData.driver}
                    onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trip Date */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Trip Date</label>
                  <input
                    type="date"
                    value={formData.trip_date}
                    onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>

                {/* Trip Type */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Trip Type</label>
                  <select
                    value={formData.trip_type}
                    onChange={(e) => setFormData({ ...formData, trip_type: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <option value="outbound">Outbound Delivery</option>
                    <option value="inbound">Inbound / Return</option>
                    <option value="transfer">Internal Transfer</option>
                  </select>
                </div>

                {/* Starting KM */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Starting KM</label>
                  <input
                    type="number"
                    value={formData.starting_km}
                    onChange={(e) => setFormData({ ...formData, starting_km: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Trip Items */}
            {formData.items.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-zinc-800 mb-4">Trip Items</h2>
                <div className="border border-zinc-200 rounded-xl overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-100">
                      <tr>
                        <th className="px-6 py-4 text-left">Description</th>
                        <th className="px-6 py-4 text-center">Ordered Qty</th>
                        <th className="px-6 py-4 text-center">Loaded Qty</th>
                        <th className="px-6 py-4 text-center">Delivered Qty</th>
                        <th className="px-6 py-4 text-center">Damaged Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 font-medium">{item.description}</td>
                          <td className="px-6 py-4 text-center">{item.ordered_qty}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={item.loaded_qty ?? ""}
                              onChange={(e) => updateItem(index, "loaded_qty", e.target.value)}
                              className="w-24 text-center border border-zinc-300 rounded-lg py-1 focus:outline-none focus:ring-1"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={item.delivered_qty ?? ""}
                              onChange={(e) => updateItem(index, "delivered_qty", e.target.value)}
                              className="w-24 text-center border border-zinc-300 rounded-lg py-1 focus:outline-none focus:ring-1"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={item.damaged_qty ?? ""}
                              onChange={(e) => updateItem(index, "damaged_qty", e.target.value)}
                              className="w-24 text-center border border-zinc-300 rounded-lg py-1 focus:outline-none focus:ring-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Remarks / Notes</label>
              <textarea
                rows={4}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Any special instructions for the driver..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/transport")}
                className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-xl hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-zinc-900 hover:bg-black text-white font-medium rounded-xl transition-all disabled:opacity-70"
              >
                {loading ? "Creating Trip..." : "Create Transport Trip"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTransportTrip;