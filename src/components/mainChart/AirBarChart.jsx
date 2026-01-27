import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AirBarChart() {
  const { airQuality, status } = useSelector(state => state.airQuality);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    layout: {
      padding: {
        top: 30
      }
    },
    scales: {
            y: {
              beginAtZero: true
            },    },
  };

  // 로딩, 실패, 초기 상태 처리
  if (status === 'loading') {
    return <div>차트 데이터 로딩 중...</div>;
  }

  if (status === 'failed') {
    return <div>데이터를 불러오는데 실패했습니다.</div>;
  }
  
  if (!airQuality || airQuality.labels.length === 0) {
    return <div>지역을 선택하면 시간별 농도 차트가 표시됩니다.</div>;
  }

  const data = {
    labels: [...airQuality.labels].reverse(),
    datasets: [
      {
        label: '미세먼지 (PM10)',
        data: [...airQuality.pm10].reverse(),
        backgroundColor: '#66c6ff',
        borderColor: '#000',
        borderWidth: 1,
      },
      {
        label: '초미세먼지 (PM2.5)',
        data: [...airQuality.pm25].reverse(),
        backgroundColor: '#FF6384',
        borderColor: '#000',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ position: 'relative', width: '80vw', height: '300px' }}>
      <div style={{ position: 'absolute', top: '-5px', left: '0', fontSize: '12px', color: '#666' }}>µg/m³</div>
      <Bar options={options} data={data} />
    </div>
  );
};

export default AirBarChart;