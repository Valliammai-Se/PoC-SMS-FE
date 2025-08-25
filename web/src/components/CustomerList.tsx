import React, { useState } from "react";
import { Table, Button, Modal, List, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Customer } from "../types";

const { Title } = Typography;

const customers: Customer[] = [
  {
    id: 1,
    name: "John Doe",
    phone: "+1 234 567 890",
    email: "john@example.com",
    chatHistory: ["Hello!", "How can I help you?", "Thank you!"]
  },
  {
    id: 2,
    name: "Jane Smith",
    phone: "+1 987 654 321",
    email: "jane@example.com",
    chatHistory: ["Hi!", "Need assistance", "Issue resolved"]
  }
];

const CustomerList: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="primary" style={{ marginRight: 8 }}>
            Send
          </Button>
          <Button onClick={() => showHistory(record)}>History</Button>
        </>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Customer List</Title>
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered
      />

      <Modal
        title={`Chat History - ${selectedCustomer?.name}`}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="close" danger onClick={handleCancel}>
            Close
          </Button>
        ]}
      >
        {selectedCustomer && (
          <List
            dataSource={selectedCustomer.chatHistory}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        )}
      </Modal>
    </div>
  );
};

export default CustomerList;
