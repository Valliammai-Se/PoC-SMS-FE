import React, { useEffect, useState } from "react";
import { Table, Button, Modal, List, Typography, Select, Input, Switch, message, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MessageOutlined, WhatsAppOutlined } from "@ant-design/icons";
export interface Customer {
  id: number;
  name: string;
  mobile_number: string;
  email: string;
  created_at:string;
  chatHistory: string[];
  is_sms: boolean;
  is_whatsapp: boolean;
}

const { Title } = Typography;

const { Option } = Select;

const CustomerList: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [wphistory, setWpHistory] = useState<any[]>([]);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
   const [smsMessage, setSmsMessage] = useState("");
   const [loadingSwitch, setLoadingSwitch] = useState<{ id: number; type: "sms" | "whatsapp" } | null>(null);

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
    setHistory(custhistory.response);
    setWpHistory(custhistory.wpresponse);
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSendClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSmsMessage("");
    setIsSmsModalOpen(true);
  };

  const handleSmsModalCancel = () => {
    setIsSmsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSmsSend = async () => {
    if (selectedCustomer && smsMessage.trim()) {
      await sendSms(selectedCustomer.id, smsMessage);
      setIsSmsModalOpen(false);
      setSelectedCustomer(null);
      setSmsMessage("");
    }
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
  const handleNotificationChange = async(key: number, is_sms?: boolean , is_whatsapp? : boolean) => {
    let payload : any = { id: key };
    if (is_sms !== undefined) payload = { ...payload, is_sms };
    if (is_whatsapp !== undefined) payload = { ...payload, is_whatsapp };
    const response = await fetch("https://poc-sms-production.up.railway.app/notification", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
     
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }
    getCustomers();
  };
  const handleSmsToggle = async(key: number, checked: boolean) => {
    setLoadingSwitch({ id: key, type: "sms" });
    await handleNotificationChange(key, checked, undefined);
    setLoadingSwitch(null);
  };

  const handleWhatsappToggle = async(key: number, checked: boolean) => {
    setLoadingSwitch({ id: key, type: "whatsapp" });
    await handleNotificationChange(key, undefined, checked);
    setLoadingSwitch(null);
  };

  const sendSms = async(id: number, msg : string) => {
    const response = await fetch("https://poc-sms-production.up.railway.app/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({id,msg}),
      });
    
      if (!response.ok) {
        throw new Error("Failed to send SMS");
      }
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
          <Button type="primary" style={{ marginRight: 8 }} onClick={() => handleSendClick(record)}>
            Send
          </Button>
          <Button onClick={() => showHistory(record)}>History</Button>
        </>
      )
    },
    {
    title: "SMS",
    key: "sms",
    render: (_, record) => (
      <Switch
        checked={record.is_sms}
        loading={loadingSwitch?.id === record.id && loadingSwitch.type === "sms"}
        onChange={(checked) => {
          console.log(record);
          if (!checked && !record.is_whatsapp) {
            console.log(record);
            message.warning("At least one channel (SMS or WhatsApp) must remain enabled");
            return;
          }
          handleSmsToggle(record.id, checked);
        }}
        checkedChildren={<MessageOutlined />}
        unCheckedChildren={<MessageOutlined />}
      />
    ),
  },
  {
    title: "WhatsApp",
    key: "whatsapp",
    render: (_, record) => (
      <Switch
        checked={record.is_whatsapp}
        loading={loadingSwitch?.id === record.id && loadingSwitch.type === "whatsapp"}
        onChange={(checked) => {
          if (!checked && !record.is_sms) {
            console.log(record);
            message.warning("At least one channel (SMS or WhatsApp) must remain enabled");
            return;
          }
          handleWhatsappToggle(record.id, checked);
        }}
        checkedChildren={<WhatsAppOutlined />}
        unCheckedChildren={<WhatsAppOutlined />}
      />
    ),
  },
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
        </Button>,
      ]}
      width={800}
    >
      <Tabs
        defaultActiveKey="chat"
        items={[
          {
            key: "chat",
            label: "Chat History",
            children: (
              <List style={{paddingLeft:"10%", paddingRight:"10%"}}
                dataSource={history}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      display: "flex",  
                      flexDirection: "column",
                      alignItems: item?.Admin?.length ? "flex-start" : "flex-end",
                      background: item?.Admin?.length ? "#f0f0f0" : "",
                      marginBottom: 8,
                      padding: "2%",
                      borderRadius: 8,
                      maxWidth: "100%",
                    }}
                  >
                    <div style={{ fontWeight: "bold", textAlign: item?.Admin?.length ? "left" : "right", maxWidth: "80%"}}>
                      {item?.Admin?.length > 0 ? item?.Admin : item?.Customer}
                    </div>
                    <small style={{ color: "#999" }}>
                      {item?.Date
                        ? new Intl.DateTimeFormat(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }).format(new Date(item.Date))
                        : ""}
                    </small>
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: "whatsapp",
            label: "WhatsApp",
            children: (
              <List style = {{paddingLeft:"10%", paddingRight:"10%"}}
                dataSource={wphistory}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: item?.Admin?.length ? "flex-start" : "flex-end",
                      background: item?.Admin?.length ? "#e6ffe6" : "",
                      marginBottom: 8,
                      padding: "2%",
                      borderRadius: 8,
                      maxWidth: "100%",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>
                      {item?.Admin?.length > 0 ? item?.Admin : item?.Customer}
                    </div>
                    <small style={{ color: "#999" }}>
                      {item?.Date
                        ? new Intl.DateTimeFormat(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }).format(new Date(item.Date))
                        : ""}
                    </small>
                  </List.Item>
                )}
              />
            ),
          },
        ]}
      />
    </Modal>
      <Modal
        title={`Send SMS to ${selectedCustomer?.name}`}
        open={isSmsModalOpen}
        onCancel={handleSmsModalCancel}
        onOk={handleSmsSend}
        okText="Send"
      >
        <Input.TextArea
          rows={4}
          placeholder="Type your message..."
          value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default CustomerList;
