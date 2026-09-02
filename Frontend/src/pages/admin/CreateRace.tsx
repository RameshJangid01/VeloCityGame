import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, InputNumber, DatePicker, TimePicker, Select, Button, Alert, Typography, Space, Result } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { adminApi } from '../../services/raceApi';
import { getErrorMessage } from '../../services/api';
import type { BikeDto } from '../../types';

const { Title, Text } = Typography;

interface FormValues {
  numberOfBikes: number;
  date: Dayjs;
  time: Dayjs;
  duration: number;
  winnerBikeId: string;
}

export function CreateRace() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [bikes, setBikes] = useState<BikeDto[]>([]);
  const [numBikes, setNumBikes] = useState(0);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.getBikes().then(list => {
      const active = list.filter(b => b.isActive);
      setBikes(active);
      const defaultCount = Math.min(active.length, 15) || active.length;
      setNumBikes(defaultCount);
      form.setFieldsValue({
        numberOfBikes: defaultCount,
        date: dayjs().add(5, 'minute'),
        time: dayjs().add(5, 'minute'),
        duration: 15,
      });
    });
  }, [form]);

  const activeBikeCount = bikes.length;
  const bikesForSelection = bikes.slice(0, numBikes);

  function handleReview(values: FormValues) {
    setError(null);
    if (!bikesForSelection.some(b => b.id === values.winnerBikeId)) {
      setError('Winner bike must be among the selected race bikes.');
      return;
    }
    setPendingValues(values);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    const startDateTime = pendingValues.date
      .hour(pendingValues.time.hour())
      .minute(pendingValues.time.minute())
      .second(0);

    if (startDateTime.isBefore(dayjs())) {
      setError('Start time must be in the future.');
      setPendingValues(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminApi.createRace({
        numberOfBikes: pendingValues.numberOfBikes,
        startTimeUtc: startDateTime.toISOString(),
        durationSeconds: pendingValues.duration,
        winnerBikeId: pendingValues.winnerBikeId,
      });
      navigate('/admin/live-race');
    } catch (err) {
      setError(getErrorMessage(err));
      setPendingValues(null);
    } finally {
      setLoading(false);
    }
  }

  const winnerBike = pendingValues ? bikes.find(b => b.id === pendingValues.winnerBikeId) : null;

  if (activeBikeCount === 0) {
    return (
      <Card>
        <Result status="warning" title="No active bikes" subTitle="Add at least 2 active bikes before scheduling a race." />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <Title level={3} style={{ marginTop: 0 }}>Create New Race</Title>

      {!pendingValues ? (
        <Card>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form form={form} layout="vertical" onFinish={handleReview} requiredMark={false}>
            <Form.Item
              name="numberOfBikes"
              label={`Number of Bikes (2–${activeBikeCount} active available)`}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={2}
                max={activeBikeCount}
                style={{ width: '100%' }}
                onChange={(v) => setNumBikes(Number(v) || 0)}
              />
            </Form.Item>

            <Space.Compact block>
              <Form.Item name="date" label="Start Date" rules={[{ required: true }]} style={{ flex: 1, marginRight: 8 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="time" label="Start Time" rules={[{ required: true }]} style={{ flex: 1 }}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Space.Compact>

            <Form.Item name="duration" label="Duration (seconds)" rules={[{ required: true }]}>
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="winnerBikeId" label="Winner Bike" rules={[{ required: true, message: 'Select a winner bike.' }]}>
              <Select placeholder="Select winner bike...">
                {bikesForSelection.map(b => (
                  <Select.Option key={b.id} value={b.id}>
                    Bike {String(b.bikeNumber).padStart(2, '0')} — {b.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" style={{ fontWeight: 700 }}>
              CREATE RACE
            </Button>
          </Form>
        </Card>
      ) : (
        <Card>
          <Text style={{ display: 'block', marginBottom: 8 }}>
            Race will start at <Text strong>{pendingValues.date.hour(pendingValues.time.hour()).minute(pendingValues.time.minute()).format('DD MMM YYYY, hh:mm A')}</Text> and
            {' '}run for <Text strong>{pendingValues.duration} seconds</Text> with <Text strong>{pendingValues.numberOfBikes} bikes</Text>.
            {' '}Winner: <Text strong style={{ color: '#F79009' }}>Bike {String(winnerBike?.bikeNumber).padStart(2, '0')}</Text>.
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 20 }}>
            This winner is confidential and will not be shown to public viewers until the race finishes.
          </Text>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Space style={{ width: '100%' }}>
            <Button onClick={() => setPendingValues(null)} block>Cancel</Button>
            <Button type="primary" onClick={handleConfirm} loading={loading} block style={{ fontWeight: 700 }}>
              Confirm & Schedule
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
