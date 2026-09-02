import { useEffect, useState } from 'react';
import { Typography, Button, Card, Row, Col, Tag, Space, Modal, Form, Input, InputNumber, Switch, Alert, Popconfirm, Empty, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/raceApi';
import { getErrorMessage } from '../../services/api';
import type { BikeDto } from '../../types';

const { Title, Text } = Typography;

export function BikesManagement() {
  const [bikes, setBikes] = useState<BikeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BikeDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setBikes(await adminApi.getBikes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    try {
      await adminApi.deleteBike(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleToggleActive(bike: BikeDto) {
    try {
      await adminApi.updateBike(bike.id, { name: bike.name, imageUrl: bike.imageUrl ?? undefined, isActive: !bike.isActive });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col><Title level={3} style={{ margin: 0 }}>Bikes</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>Add Bike</Button></Col>
      </Row>

      {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : bikes.length === 0 ? (
        <Card><Empty description="No bikes yet." /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {bikes.map(bike => (
            <Col key={bike.id} xs={24} sm={12} lg={8}>
              <Card size="small">
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong style={{ fontSize: 16 }}>Bike {String(bike.bikeNumber).padStart(2, '0')}</Text>
                    <div><Text type="secondary" style={{ fontSize: 12 }}>{bike.name}</Text></div>
                    <Tag
                      color={bike.isActive ? 'success' : 'default'}
                      style={{ cursor: 'pointer', marginTop: 6 }}
                      onClick={() => handleToggleActive(bike)}
                    >
                      {bike.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </Col>
                  <Col>
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(bike)} />
                      <Popconfirm title="Delete this bike?" description="This cannot be undone." onConfirm={() => handleDelete(bike.id)} okText="Delete" okButtonProps={{ danger: true }}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {(showCreate || editing) && (
        <BikeFormModal
          bike={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={() => { setShowCreate(false); setEditing(null); load(); }}
        />
      )}
    </Space>
  );
}

function BikeFormModal({ bike, onClose, onSaved }: { bike: BikeDto | null; onClose: () => void; onSaved: () => void }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setError(null);
      if (bike) {
        await adminApi.updateBike(bike.id, { name: values.name, imageUrl: values.imageUrl || undefined, isActive: values.isActive });
      } else {
        await adminApi.createBike({ bikeNumber: values.bikeNumber, name: values.name, imageUrl: values.imageUrl || undefined });
      }
      onSaved();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error, already shown inline
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onCancel={onClose}
      title={bike ? 'Edit Bike' : 'Add Bike'}
      onOk={handleSave}
      confirmLoading={saving}
      okText="Save"
    >
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          bikeNumber: bike ? bike.bikeNumber : undefined,
          name: bike?.name ?? '',
          imageUrl: bike?.imageUrl ?? '',
          isActive: bike?.isActive ?? true,
        }}
      >
        {!bike && (
          <Form.Item name="bikeNumber" label="Bike Number" rules={[{ required: true, message: 'Bike number is required.' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        )}
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required.' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="imageUrl" label="Image URL (optional)">
          <Input />
        </Form.Item>
        {bike && (
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
