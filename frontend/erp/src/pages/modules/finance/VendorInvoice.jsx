// src/pages/modules/finance/VendorInvoice.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';   // ← Use your centralized API
import { 
  Table, Button, Modal, Form, Input, DatePicker, message, 
  Card, Typography, Space, Tag 
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;

const VendorInvoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [pendingGRNs, setPendingGRNs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchPendingGRNs();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/inventory/vendor-invoices/');
      setInvoices(res.data);
    } catch (err) {
      message.error('Failed to load invoices');
    }
  };

  const fetchPendingGRNs = async () => {
    try {
      const res = await api.get('/inventory/vendor-invoices/pending_for_invoice/');
      setPendingGRNs(res.data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load pending GRNs');
    }
  };

  const openInvoiceModal = (grn) => {
    setSelectedGRN(grn);
    setIsModalOpen(true);
  };

  const handleCreateInvoice = async (values) => {
  if (!selectedGRN) return;

  setLoading(true);
  try {
    await api.post(`/inventory/grns/${selectedGRN.id}/create-from-grn/`, {
      invoice_number: values.invoice_number,
      invoice_date: values.invoice_date.format('YYYY-MM-DD'),
      total_amount: parseFloat(values.total_amount),
    });

    message.success('Invoice created successfully!');
    setIsModalOpen(false);
    setSelectedGRN(null);

    fetchInvoices();
    fetchPendingGRNs();
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.error || 
                  error.response?.data?.detail || 
                  'Failed to create invoice');
  } finally {
    setLoading(false);
  }
};

  const pendingColumns = [
    { title: 'GRN Number', dataIndex: 'grn_number' },
    { title: 'PO Number', dataIndex: 'po_number' },
    { title: 'Vendor', dataIndex: 'vendor_name' },
    { 
      title: 'Received Date', 
      dataIndex: 'received_date',
      render: (date) => dayjs(date).format('DD-MM-YYYY')
    },
    { 
      title: 'Total Value', 
      dataIndex: 'total_value',
      render: (val) => `₹ ${parseFloat(val || 0).toFixed(2)}`
    },
    {
      title: 'Action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => openInvoiceModal(record)}
        >
          Create Invoice
        </Button>
      ),
    },
  ];

  const invoiceColumns = [
    { title: 'Invoice No', dataIndex: 'invoice_number' },
    { title: 'GRN No', dataIndex: 'grn_number' },
    { title: 'Vendor', dataIndex: 'vendor_name' },
    { title: 'Date', dataIndex: 'invoice_date', render: (d) => dayjs(d).format('DD-MM-YYYY') },
    { title: 'Amount', dataIndex: 'total_amount', render: (v) => `₹ ${parseFloat(v || 0).toFixed(2)}` },
    { title: 'Paid', render: (_, rec) => `₹ ${parseFloat(rec.paid_amount || 0).toFixed(2)}` },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>Vendor Invoices</Title>
        </Space>

        <Card 
          title="Pending GRNs for Invoicing" 
          style={{ marginBottom: 24 }}
          extra={<Tag color="blue">{pendingGRNs.length} Pending</Tag>}
        >
          <Table 
            columns={pendingColumns} 
            dataSource={pendingGRNs} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Card title="Generated Invoices">
          <Table 
            columns={invoiceColumns} 
            dataSource={invoices} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Card>

      <Modal
        title={`Create Invoice - GRN: ${selectedGRN?.grn_number}`}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setSelectedGRN(null); }}
        footer={null}
      >
        <Form 
          layout="vertical" 
          onFinish={handleCreateInvoice}
          initialValues={{
            invoice_number: `INV-${dayjs().format('YYYYMMDD')}-`,
            invoice_date: dayjs(),
            total_amount: selectedGRN?.total_value || "",
          }}
        >
          <Form.Item label="GRN Number">
            <Input value={selectedGRN?.grn_number} disabled />
          </Form.Item>

          <Form.Item label="PO Number">
            <Input value={selectedGRN?.po_number} disabled />
          </Form.Item>

          <Form.Item label="Vendor">
            <Input value={selectedGRN?.vendor_name} disabled />
          </Form.Item>

          <Form.Item name="invoice_number" label="Invoice Number" rules={[{ required: true }]}>
            <Input placeholder="INV-20260402-001" />
          </Form.Item>

          <Form.Item name="invoice_date" label="Invoice Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>

          <Form.Item name="total_amount" label="Total Invoice Amount (₹)" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Generate & Save Invoice
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorInvoice;