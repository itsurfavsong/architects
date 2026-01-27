import './AirQualityCard.css';
import { getDustLevel } from '../../utils/getDustLevel';

// 상태별 이미지 import
import good from '../../assets/good.png';
import moderate from '../../assets/moderate.png';
import bad from '../../assets/bad.png';
import veryBad from '../../assets/very-bad.png';
import caution from '../../assets/Caution.png';

// 등급과 이미지 매핑
const statusImages = {
  '좋음': good,
  '보통': moderate,
  '나쁨': bad,
  '매우나쁨': veryBad,
  '정보없음': caution,
};

// 카드 제목과 itemCode 매핑
const itemCodeMapping = {
  '미세먼지': 'PM10',
  '초미세먼지': 'PM25',
  '오존': 'O3',
  '이산화질소': 'NO2',
  '일산화탄소': 'CO',
  '아황산가스': 'SO2',
};

function AirQualityCard(props) {
  const { title, subtitle, value, unit } = props;

  const itemCode = itemCodeMapping[title];

  // 값이 들어있으면 등급을 계산, 아닐 경우 '정보없음' 처리
  const levelLabel = (itemCode)
    ? getDustLevel(value, itemCode).label
    : '정보없음';
  const statusImage = statusImages[levelLabel] || caution;

  return (
    <div className="air-quality-card">
      <div className="card-title">{title}</div>
      <div className="card-subtitle">{subtitle}</div>
      
      <div>
        <img src={statusImage} alt={levelLabel} className="card-image" />
      </div>
      
      <div className="card-value">{value}</div>
      <div className="card-unit">{unit}</div>
    </div>
  );
};

export default AirQualityCard;
