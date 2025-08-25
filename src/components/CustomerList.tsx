import React, { useEffect, useState } from "react";
import { Table, Button, Modal, List, Typography, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Customer } from "../types";

const { Title } = Typography;

const { Option } = Select;

const CustomerList: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const showHistory = async(customer: Customer) => {
    const response = await fetch("https://poc-sms-production.up.railway.app/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({id: customer.id})
    })

    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }
    const custhistory = await response.json();
    setHistory(custhistory);
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const getCustomers = async () => {
    const response = await fetch("https://poc-sms-production.up.railway.app/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: 'John' })
    })
  
    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }
    const customerList = await response.json();
    if(customerList?.length)
      {
          setCustomers(customerList);
      }
};

   
  useEffect(() => {
    getCustomers();
  }, []);

  const statusOptions: Record<number, string> = {
    0: "Ordered",
    1: "Ready for Pickup",
    2: "Scheduled for Delivery",
    3: "Delivered",
    4: "Cancelled",
  };
  
  const handleStatusChange = async(key: number, value: number) => {
    const response = await fetch("https://poc-sms-production.up.railway.app/statuses", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({id: key,status: value}),
    });
  
    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }

    getCustomers();
  };

  const sendSms = async(id: number) => {
    const response = await fetch("https://poc-sms-production.up.railway.app/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({id}),
      });
    
      if (!response.ok) {
        throw new Error("Failed to send SMS");
      }
      console.log(response)
      return response.json();
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Phone",
      dataIndex: "mobile_number",
      key: "phone"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value, record) => (
        <Select
          value={value}
          style={{ width: 200 }}
          onChange={(val) => handleStatusChange(record.id, val)}
        >
          {Object.entries(statusOptions).map(([key, label]) => (
            <Option key={key} value={Number(key)}>
              {label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          {/* <Button type="primary" style={{ marginRight: 8 }} onClick={() => sendSms(record?.id)}>
            Send
          </Button> */}
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
            dataSource={history}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: item?.Admin?.length ? "flex-start" : "flex-end",
                  background: item?.Admin?.length ? "#f0f0f0" : "",
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 8,
                  maxWidth: "80%",
                  width: "fit-content"
                }}
              >
                <div style={{ fontWeight: "bold" }}>{item?.Admin?.length > 0 ? item?.Admin : item?.Customer}</div>
                <small style={{ color: "#999" }}>{item?.Date}</small>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default CustomerList;
