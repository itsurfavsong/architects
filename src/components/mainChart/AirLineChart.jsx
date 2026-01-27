import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function AirLineChart() {
  const { airQuality, status } = useSelector(state => state.airQuality);

  const options = { 
    responsive: true,
    maintainAspectRatio: false,
    interaction: { 
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
            y: {
              
            }    },
    plugins: {
      legend: {
        display: false, 
      },
    },
    layout: {
      padding: {
        top: 30
      }
    }
  };

  // 로딩 및 에러, 초기 상태 처리
  if (status === 'loading') {
    return <div style={{width: '14vw', height: '550px', textAlign: 'center', paddingTop: '250px', border: 'dashed 1px', borderRadius: '10px' }}>차트 데이터 로딩 중...📊</div>;
  }

  if (status === 'failed') {
    return <div style={{width: '14vw', height: '550px', textAlign: 'center', paddingTop: '250px', border: 'dashed 1px', borderRadius: '10px' }}>데이터 불러오기 실패⚠️</div>;
  }
  
  if (!airQuality || airQuality.labels.length === 0) {
    return <div style={{width: '14vw', height: '550px', textAlign: 'center', paddingTop: '250px', border: 'dashed 1px', borderRadius: '10px' }}>위치 정보를 허용해 주세요🙏</div>;
  }

  const labels = [...airQuality.labels].reverse();

  const pm10Data = { 
    labels, 
    datasets: [
      {
        label: "미세먼지",
        data: [...airQuality.pm10].reverse(),
        pointBackgroundColor: "#66c6ff",
        borderColor: "rgba(102, 102, 102, 0.6)",
      },
    ],
  };
  
  const pm25Data = {
    labels,
    datasets: [
      {
        label: "초미세먼지",
        data: [...airQuality.pm25].reverse(),
        backgroundColor: "#FF6384",
        borderColor: "rgba(102, 102, 102, 0.6)",
      },
    ],
  };

  return(
    <div style={{paddingTop: '70px'}}>
      <div style={{paddingBottom: '10px'}}>
        <p style={{fontSize:'25px', fontWeight:'600'}}>미세먼지</p>
        <div style={{position: 'relative', width: '14vw', height: '20vh', marginTop: '10px',}}>
          <div style={{ position: 'absolute', top: '-5px', left: '0', fontSize: '12px', color: '#666' }}>µg/m³</div>
          <Line options={options} data={pm10Data} />
        </div>
      </div>
      <div>
        <p style={{fontSize: '25px', fontWeight:'600'}}>초미세먼지</p>
        <div style={{position: 'relative', width: '14vw', height: '20vh', marginTop: '10px'}}>
          <div style={{ position: 'absolute', top: '-5px', left: '0', fontSize: '12px', color: '#666' }}>µg/m³</div>
          <Line options={options} data={pm25Data}></Line>
        </div>
      </div>
    </div>
  );
};

export default AirLineChart;