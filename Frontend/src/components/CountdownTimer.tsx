import { Typography } from 'antd';

const { Text, Title } = Typography;

function format(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function CountdownTimer({ seconds, label }: { seconds: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Title
        level={1}
        style={{
          margin: '4px 0 0',
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 800,
          letterSpacing: '0.02em',
        }}
      >
        {format(seconds)}
      </Title>
    </div>
  );
}
