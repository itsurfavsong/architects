import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './MainChart.css';
import MainDropDown from './MainDropDown.jsx';
import AirQualityCard from './AirQualityCard.jsx';
import AirLineChart from './AirLineChart.jsx';
import AirBarChart from './AirBarChart.jsx';
import { getAirQuality } from '../../store/thunks/airQualityThunk.js';
import good from '../../assets/good.png';
import moderate from '../../assets/moderate.png';
import bad from '../../assets/bad.png';
import veryBad from '../../assets/very-bad.png';
import caution from '../../assets/Caution.png';
import { getDustLevel } from '../../utils/getDustLevel.js';
import guideContents from '../../configs/guide-data.js';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getLocation } from '../../store/thunks/locationThunk.js';
import { setRegion, setDistrict } from '../../store/slices/locationSlice.js';

// **[추가/수정]** 대체 지역 목록과 데이터 유효성 검사 함수
const FALLBACK_STATIONS = ['종로구', '중구', '강남구', '송파구', '영등포구']; // 순차적으로 시도할 서울 지역 목록

// 데이터가 유효하지 않은지 검사 (모두 '-'이거나 null인 경우)
const isDataInvalid = (stationData) => {
  return !stationData || (
    (stationData.pm10Value === 0 || stationData.pm10Value === null) ||
    (stationData.pm25Value === 0 || stationData.pm25Value === null) ||
    (stationData.o3Value === 0 || stationData.o3value === null) ||
    (stationData.no2Value === 0 || stationData.no2Value === null) ||
    (stationData.coValue === 0 || stationData.coValue === null) ||
    (stationData.so2Value === 0 || stationData.so2Value === null)

    // 여기에 다른 핵심 오염원 체크를 추가할 수 있습니다.
  );
};

function MainChart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const moveGuide = () => { navigate('/guideLine'); };

  // **[수정]** dayjs 변수를 state로 관리하여 갱신 가능하도록 변경
  const [todayDate, setTodayDate] = useState(dayjs().format('YY.MM.DD'));
  const [currentHour, setCurrentHour] = useState(dayjs().format('HH'));

  // **[추가]** 위치 획득 성공/실패 상태
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0); // 대체 지역 시도 인덱스

  const [selectedRegion, setSelectedRegion] = useState('서울');
  const [selectedDistrict, setSelectedDistrict] = useState('종로구');
  const [selectedStationData, setSelectedStationData] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [nearbyFlg, setNearbyFlg] = useState(true);
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 800px)').matches);

  const mapList = useSelector(state => state.mapAxio.mapList);
  const { nearbyStations } = useSelector(state => state.location);

  const handleToggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // 1. **[추가]** 10분마다 시간 및 날짜 갱신
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTodayDate(dayjs().format('YY.MM.DD'));
      setCurrentHour(dayjs().format('HH'));
    }, 600000); // 10분마다 갱신

    return () => clearInterval(intervalId);
  }, []);

  // 2. **[수정]** 위치 허용 시 현재 위치 불러오기
  useEffect(() => {

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          dispatch(getLocation({ lat, lon }));
          setLocationSuccess(true); // 위치 획득 성공
          setLocationFailed(false);
        },
        () => {
          // console.error("위치 권한 거부 또는 에러:", error);
          setLocationFailed(true); // 위치 획득 실패
          setLocationSuccess(false);
        }
      );
    } else {
      // Geolocation API 미지원 시에도 실패 처리
      setLocationFailed(true);
    }
  }, []);


  // 3. **[추가/수정]** 위치 권한 거부 시 대체 지역 순차 시도
  useEffect(() => {
    // 위치 획득에 실패한 경우에만 실행
    if (locationFailed && !locationSuccess) {
      const stationName = FALLBACK_STATIONS[currentStationIndex];

      if (stationName) {
        dispatch(getAirQuality({ stationName: stationName }));
        // UI 상태 업데이트 (대체 지역 정보 표시)
        setSelectedRegion('서울');
        setSelectedDistrict(stationName);
        dispatch(setRegion('서울'));
        dispatch(setDistrict(stationName));
      }
    }
  }, [locationFailed, locationSuccess, currentStationIndex]);


  // 4. **[수정]** 위치 기반 측정소 데이터 적용 (위치 획득 성공 시에만)
  useEffect(() => {
    // :triangular_flag_on_post: 위치 획득 성공(locationSuccess) 시에만 이 로직 실행
    if (locationSuccess && nearbyFlg && nearbyStations?.items?.length > 0 && mapList?.items?.length > 0) {
      const closestStationName = nearbyStations.items[0].Station_name;
      const match = mapList?.items.find(item => item.stationName === closestStationName);

      if (match) {
        // 지역, 상세지역 상태 업데이트
        dispatch(setRegion(match.sidoName));
        setSelectedRegion(match.sidoName);
        dispatch(setDistrict(match.stationName));
        setSelectedDistrict(match.stationName);

        // 차트용 대기질 데이터 요청 (즉시 반영)
        dispatch(getAirQuality({ stationName: match.stationName }));
      }

      setNearbyFlg(false);
    }
  }, [nearbyStations, mapList, nearbyFlg, locationSuccess]);

  // 5. **[수정]** mapList 변경 시 stationData 동기화 및 대체 지역 유효성 검사
  useEffect(() => {
    if (mapList?.items && selectedRegion && selectedDistrict) {
      const stationData = mapList.items.find(
        (item) => item.sidoName === selectedRegion && item.stationName === selectedDistrict
      );

      if (stationData) {
        setSelectedStationData(stationData);

        // 🚩 핵심 수정:
        // 1. 위치 실패 상태(locationFailed)이고
        // 2. 현재 선택된 지역이 FALLBACK_STATIONS 목록 안에 있는 경우에만 유효성 검사 실행
        const isFallbackStation = FALLBACK_STATIONS.includes(selectedDistrict);

        if (locationFailed && isFallbackStation) {
          if (isDataInvalid(stationData)) {
            // 데이터가 유효하지 않고, 시도할 다음 지역이 남아 있다면
            if (currentStationIndex < FALLBACK_STATIONS.length - 1) {
              // 다음 지역으로 인덱스 업데이트 -> Effect 3 트리거
              setCurrentStationIndex(prevIndex => prevIndex + 1);
            }
          }
        }
        // 📌 else: 위치 성공 시 또는 수동 선택 시에는 이 블록이 실행되지 않음

      }
    }
    // currentStationIndex를 의존성 배열에서 제거하면 루프가 멈추므로 유지해야 합니다.
  }, [mapList, selectedRegion, selectedDistrict, locationFailed, currentStationIndex]);


  // 화면 크기 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 800px)');
    const handleResize = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // 지역 변경 시 상세지역 자동 선택 (가나다순 첫 번째)
  useEffect(() => {
    if (mapList?.items && selectedRegion && !selectedDistrict) {
      const selectedItems = mapList.items.filter(item => item.sidoName === selectedRegion);
      if (selectedItems.length > 0) {
        const sortStations = selectedItems
          // .map(item => item.stationName)
          // .sort((a, b) => a.localeCompare(b)); // 가나다순
          .sort((a, b) => a.stationName.localeCompare(b.stationName))
        const firstDistrict = sortStations[0].stationName;
        setSelectedDistrict(firstDistrict);
        dispatch(getAirQuality({ stationName: firstDistrict }));

        const stationData = selectedItems.find(item => item.stationName === firstDistrict);
        if (stationData) setSelectedStationData(stationData);
      }
    }
  }, [mapList, selectedRegion, selectedDistrict]);

  // Dropdown 선택 핸들러
  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setSelectedDistrict(null); // 상세지역 초기화
    setSelectedStationData(null);

    // 드롭다운 수동 선택 시, 위치 기반 플래그 초기화
    setNearbyFlg(false);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    const stationData = mapList?.items?.find(item => item.stationName === district);
    if (stationData) {
      setSelectedStationData(stationData);
      dispatch(getAirQuality({ stationName: district }));
    }
  };

  // 지역/상세지역 리스트
  const customSidoOrder = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충남', '충북', '전남', '전북', '경남', '경북', '제주'];
  const sidoRegions = mapList?.items ? [...new Set(mapList.items.map(item => item.sidoName))].sort((a, b) => {
    const indexA = customSidoOrder.indexOf(a);
    const indexB = customSidoOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }) : [];
  const selectedItems = mapList?.items?.filter(val => val.sidoName === selectedRegion);
  const selectedStations = selectedItems?.map(item => item.stationName);
  const sortStations = selectedStations?.sort((a, b) => a.localeCompare(b)) || [];

  // 대기질 카드 데이터
  const airQualityData = selectedStationData ? [
    { title: '미세먼지', subtitle: '(PM-10)', value: selectedStationData.pm10Value || '-', unit: 'µg/m³' },
    { title: '초미세먼지', subtitle: '(PM-2.5)', value: selectedStationData.pm25Value || '-', unit: 'µg/m³' },
    { title: '오존', subtitle: '(O₃)', value: selectedStationData.o3Value || '-', unit: 'ppm' },
    { title: '이산화질소', subtitle: '(NO₂)', value: selectedStationData.no2Value || '-', unit: 'ppm' },
    { title: '일산화탄소', subtitle: '(CO)', value: selectedStationData.coValue || '-', unit: 'ppm' }, // CO, SO2 값도 API에서 가져오도록 수정했을 것으로 가정하고 코드에 반영
    { title: '아황산가스', subtitle: '(SO₂)', value: selectedStationData.so2Value || '-', unit: 'ppm' },
  ] : [
    { title: '초미세먼지', subtitle: '(PM-2.5)', value: '-', unit: 'µg/m³' },
    { title: '미세먼지', subtitle: '(PM-10)', value: '-', unit: 'µg/m³' },
    { title: '오존', subtitle: '(O₃)', value: '-', unit: 'ppm' },
    { title: '이산화질소', subtitle: '(NO₂)', value: '-', unit: 'ppm' },
    { title: '일산화탄소', subtitle: '(CO)', value: '-', unit: 'ppm' },
    { title: '아황산가스', subtitle: '(SO₂)', value: '-', unit: 'ppm' },
  ];

  // 대기질 이미지 및 텍스트 처리
  const statusImages = {
    '좋음': good,
    '보통': moderate,
    '나쁨': bad,
    '매우나쁨': veryBad,
    '정보없음': caution,
  };

  const airQualityDataPM10 = selectedStationData ? selectedStationData.pm10Value : null;
  const levelLabel = getDustLevel(airQualityDataPM10, 'PM10').label;
  const statusImage = airQualityDataPM10 ? statusImages[levelLabel] : caution;

  const textJson = (val) => {
    if (val === guideContents.good.status) return guideContents.good;
    else if (val === guideContents.moderate.status) return guideContents.moderate;
    else if (val === guideContents.bad.status) return guideContents.bad;
    else if (val === guideContents.veryBad.status) return guideContents.veryBad;
    else return guideContents.noneData;
  };

  const textJsondata = airQualityDataPM10 ? textJson(levelLabel) : guideContents.noneData;

  return (
    <div className='contents-size-main-left'>
      <div className='main-container'>
        <div className='main-air-quality-container'>
          <div className='main-head-container'>
            <div className="air-quality-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className='main-head-title'>오늘의 대기질</p>
              {/* **[수정]** 시간/날짜가 1초마다 갱신된 값으로 표시 */}
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#666666', marginTop: '5px' }}>
                {todayDate} {currentHour}시
              </span>
            </div>
            <div className='dropdown-btn'>
              <MainDropDown
                title={selectedRegion || "지역"}
                options={sidoRegions}
                onOptionSelect={handleRegionSelect}
                variant="region"
                isOpen={openDropdown === 'region'}
                toggleDropdown={() => handleToggleDropdown('region')}
              />
              <MainDropDown
                title={selectedDistrict || "상세지역"}
                options={sortStations}
                onOptionSelect={handleDistrictSelect}
                variant="district"
                isOpen={openDropdown === 'district'}
                toggleDropdown={() => handleToggleDropdown('district')}
              />
            </div>
            <div className='card-container'>
              {airQualityData.map((data, index) => (
                <AirQualityCard
                  key={index}
                  title={data.title}
                  subtitle={data.subtitle}
                  value={data.value}
                  unit={data.unit}
                />
              ))}
            </div>
          </div>

          {isDataInvalid(selectedStationData) && <div className='injection'><img src={caution} alt="점검 중" /> : 측정소점검</div>}
        </div>

        <div className='chart-padding'>
          {selectedStationData ? (
            isMobile ? <AirBarChart /> : <AirLineChart />
          ) :
            <div className="chart-placeholder">
              {/* 위치 획득 실패 및 데이터 부재 시 사용자 안내 문구 추가 */}
              {locationFailed && <p style={{ width: '14vw', height: '550px', textAlign: 'center', paddingTop: '250px', border: 'dashed 1px', borderRadius: '10px' }}>위치 정보를 가져올 수 없습니다. 서울 지역의 유효한 측정소 정보를 표시합니다.</p>}
            </div>
          }
        </div>
      </div>

      <div className='main-guide-container'>
        <h1 className='main-guide-title main-head-title'>행동 요령</h1>
        <div className='main-guide-card-container'>
          <div>
            <img src={statusImage} alt="" className='main-guide-image' />
          </div>
          <div className='main-guide-card'>
            <div className='main-guide-card-sensitive'>
              <p className='main-guide-card-sub-title'>민감군</p>
              <div className='main-guide-sensitive-content-box'>
                <div className={`main-guide-sensitive-content ${textJsondata?.public[0] ? 'pseudo' : ''}`}>
                  {textJsondata && textJsondata.sensitive[0]}
                </div>
                <div className={`main-guide-sensitive-content ${textJsondata?.public[1] ? 'pseudo' : ''}`}>
                  {textJsondata && textJsondata.sensitive[1]}
                </div>
              </div>
            </div>
            <hr className='line' />
            <div className='main-guide-card-public'>
              <p className='main-guide-card-sub-title'>일반군</p>
              <div className='main-guide-public-content-box'>
                <div className={`main-guide-public-content ${textJsondata?.public[0] ? 'pseudo' : ''}`}>
                  {textJsondata && textJsondata.public[0]}
                </div>
                <div className={`main-guide-public-content ${textJsondata?.public[1] ? 'pseudo' : ''}`}>
                  {textJsondata && textJsondata.public[1]}
                </div>
              </div>
            </div>
          </div>
          <div className='main-guide-button'>
            <p className='main-button' onClick={moveGuide}>더 보기</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainChart