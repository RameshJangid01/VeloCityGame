import { useEffect, useState } from 'react';
import { Modal, Typography, Button, Space } from 'antd';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { TrophyFilled } from '@ant-design/icons';
import type { PublicRaceStateDto } from '../types';

const { Title, Text } = Typography;

export function WinnerModal({ race, onClose }: { race: PublicRaceStateDto; onClose: () => void }) {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const winnerBike = race.bikes.find(b => b.bikeId === race.winnerBikeId);

  return (
    <>
      <Confetti width={dims.width} height={dims.height} numberOfPieces={220} recycle={false} colors={['#FFB800', '#00E0C6', '#FF3D8A', '#ffffff']} style={{ zIndex: 1001, position: 'fixed' }} />
      <Modal
        open
        onCancel={onClose}
        footer={null}
        centered
        width={420}
        styles={{ content: { padding: 0, borderRadius: 20, overflow: 'hidden' }, mask: { backdropFilter: 'blur(4px)' } }}
      >
        <div className="glass-card-light" style={{ padding: '36px 28px', textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring' }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}
          >
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD666, #FFB800)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px -8px rgba(255,184,0,0.6)',
            }}>
              <TrophyFilled style={{ fontSize: 34, color: '#101828' }} />
            </div>
          </motion.div>

          <Text style={{ color: '#FFB800', fontWeight: 700, fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Race Finished
          </Text>
          <Title level={3} style={{ margin: '2px 0 0' }}>WINNER</Title>

          <Title level={1} style={{
            margin: '12px 0 0',
            background: 'linear-gradient(90deg, #FFB800, #FFD666)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
          }}>
            BIKE {String(winnerBike?.bikeNumber ?? '--').padStart(2, '0')}
          </Title>
          <Text type="secondary">{winnerBike?.name}</Text>

          <Space size={32} style={{ margin: '24px 0', justifyContent: 'center', width: '100%' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Race</Text>
              <div style={{ fontWeight: 700 }}>#{race.raceId.slice(-6)}</div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Duration</Text>
              <div style={{ fontWeight: 700 }}>{race.durationSeconds}s</div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Bikes</Text>
              <div style={{ fontWeight: 700 }}>{race.bikes.length}</div>
            </div>
          </Space>

          <Button
            type="primary"
            block
            size="large"
            onClick={onClose}
            style={{ background: 'linear-gradient(90deg, #00E0C6, #00A895)', border: 'none', fontWeight: 700 }}
          >
            VIEW RESULTS
          </Button>
        </div>
      </Modal>
    </>
  );
}
