import './MainMap.css';
import { useState } from 'react';
import { Map, Polygon, useKakaoLoader, MapInfoWindow } from 'react-kakao-maps-sdk';
import sido from '../../configs/sido.json';
import proj4 from 'proj4';
import { useSelector } from 'react-redux';
import { getDustLevel } from '../../utils/getDustLevel.js';

function MainMap() {

  useKakaoLoader({
    appkey: import.meta.env.VITE_MAP_KEY,
    libraries: ['services'],
  });

  const [map, setMap] = useState(null); // 카카오 맵 인스턴스
  const [mousePosition, setMousePosition] = useState({ lat: 0, lng: 0 }); // 마우스 위치
  const [hoveredPolygon, setHoveredPolygon] = useState(null); // 호버된 폴리곤
  const geoJsonData = sido; // 불러온 GeoJSON 데이터 
  const [polygonList, setPolygonList] = useState([]); // 폴리곤 리스트

  // --- 데이터 로딩 Effect ---
  // 맵이 준비되면 GeoJSON 데이터를 불러옵니다.
  
  const mapList = useSelector(state => state.mapAxio.mapList);

  const sidoList = ['서울', '경기', '강원', '부산', '경남', '울산', '광주', '전북', '전남', '제주', '대구', '경북', '대전', '충북', '충남', '세종', '인천'];
  const empty = Array.from({ length: 17 }, () => []);

  const gradeColor = (status) => {
    if (status === '좋음') {
      return '#0ca6ffff';
    } else if (status === '보통') {
      return '#92FF92';
    } else if (status === '나쁨') {
      return '#FFED69';
    } else if (status === '매우나쁨') {
      return '#FE4132';
    }
  }

  if(mapList.items) {
    for (const item of mapList.items) {
      const idx = sidoList.indexOf(item.sidoName);
      empty[idx].push(item);
    }

    const averrage = (region) => {
      let arrData = []
      const regionMungi = region?.map(item => {if(item.pm10Value !== 0 ) { return arrData.push(item.pm10Value) }}); // 미세먼지 값 0인것(장비점검)빼고 다 가져오기
      const cnt = regionMungi?.length // 객체 갯수
      const mungiAverrage = regionMungi?.reduce((sum, current) => sum + current, 0); // 객체들의 합
      const value = mungiAverrage / cnt // 객체들의 평균
      const grade = getDustLevel(value, 'PM10') // 평균값을 등급별로 나누는 처리(util)
      return grade.label // 평균값의 등급 출력
    }
    const averrageVal = (region) => {
      let arrData = []
      const regionMungi = region?.map(item => {if(item.pm10Value !== 0 ) { return arrData.push(item.pm10Value) }}); // 미세먼지 값 0인것(장비점검)빼고 다 가져오기
      const cnt = regionMungi?.length // 객체 갯수
      const mungiAverrage = regionMungi?.reduce((sum, current) => sum + current, 0); // 객체들의 합
      const value = mungiAverrage / cnt // 객체들의 평균
      return value // 평균값의 등급 출력
    }

    const utmk =
    "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";
    const wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    
    // --- 지도에 다각형을 그리는 Effect ---
    // GeoJSON 데이터가 준비되면 다각형을 그립니다.
    if (map && geoJsonData && polygonList.length === 0 ) {
      let polygonListTmp = [];
      let opacity = 0.4;
      const gwangjuFeature = geoJsonData.features.find(p => p.properties.CTP_KOR_NM === '광주');
      const gwangjuPath = gwangjuFeature.geometry.coordinates[0].map(coord => {
        const [lon, lat] = proj4(utmk, wgs84, coord);
        const latlng = new window.kakao.maps.LatLng(lat, lon);
        return { lat: latlng.Ma, lng: latlng.La };
      });

      geoJsonData.features.forEach(features => {
        const regionName = features.properties.CTP_KOR_NM;
        const idx = sidoList.indexOf(regionName);
        const geometry = features.geometry;
        const fillColor = gradeColor(averrage(empty[idx]));
        const mungiVal = averrageVal(empty[idx])
        if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach(ring => {
            const path = ring.map(coord => {
              const [lon, lat] = proj4(utmk, wgs84, coord);
              const latlng = new window.kakao.maps.LatLng(lat, lon);
              return { lat: latlng.Ma, lng: latlng.La };
            });
            polygonListTmp.push({ path, fillColor, opacity, name: regionName, val: Math.ceil(mungiVal)  });
          });
        } else if (geometry.type === 'MultiPolygon') {
            if (regionName === '전남') {
              let mainlandPolygon = geometry.coordinates.reduce((a, b) => a[0].length > b[0].length ? a : b);
              let islandPolygons = geometry.coordinates.filter(p => p !== mainlandPolygon);

              const mainlandPath = mainlandPolygon[0].map(coord => {
                const [lon, lat] = proj4(utmk, wgs84, coord);
                const latlng = new window.kakao.maps.LatLng(lat, lon);
                return { lat: latlng.Ma, lng: latlng.La };
              });
                polygonListTmp.push({ path: [mainlandPath, gwangjuPath], fillColor, opacity, name: regionName, val: Math.ceil(mungiVal) });

                islandPolygons.forEach(island => {
                  const islandPath = island[0].map(coord => {
                    const [lon, lat] = proj4(utmk, wgs84, coord);
                    const latlng = new window.kakao.maps.LatLng(lat, lon);
                    return { lat: latlng.Ma, lng: latlng.La };
                  });
                  polygonListTmp.push({ path: islandPath, fillColor, opacity, name: regionName, val: Math.ceil(mungiVal) });
                });

            } else {
                geometry.coordinates.forEach(polygon => {
                  polygon.forEach(ring => {
                    const path = ring.map(coord => {
                      const [lon, lat] = proj4(utmk, wgs84, coord);
                      const latlng = new window.kakao.maps.LatLng(lat, lon);
                      return { lat: latlng.Ma, lng: latlng.La };
                    });
                    polygonListTmp.push({ path, fillColor, opacity, name: regionName, val: Math.ceil(mungiVal) });
                  });
                });
            }
        }
      });
      setPolygonList(polygonListTmp);
    };
  }

  return (
      <div className='contents-size-main-right'>
        <h1 className='main-map-title main-head-title'>전국 미세먼지 수치(평균)</h1>
        <div className='position'>
          <Map
            center={{ lat: 36.3, lng: 127.8 }}
            className='main-map-manifest'
            level={13}
            onCreate={setMap}
            onMouseMove={(_map, mouseEvent) => {
              setMousePosition({
                lat: mouseEvent.latLng.getLat() + 0.05,
                lng: mouseEvent.latLng.getLng(),
              })
            }}
          >
            {
              polygonList.map((item, idx) => {
                return <Polygon
                  key={idx}
                  path={item.path}
                  strokeWeight={2} // 선의 두께입니다
                  strokeColor={"#f16a88ff"} // 선의 색깔입니다
                  strokeOpacity={0.8} // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
                  strokeStyle={"solid"} // 선의 스타일입니다
                  fillColor={item.fillColor || '#FFFFFF'} // 채우기 색깔입니다
                  fillOpacity={item.opacity} // 채우기 불투명도 입니다
                  onMouseover={() => setHoveredPolygon(`${item.name} : ${item.val}`)}
                  onMouseout={() => setHoveredPolygon(null)}
                />
              })
            }
            {hoveredPolygon && (
              <MapInfoWindow position={mousePosition}>
                <div style={{ padding: "2px 0px 7px 45px", fontSize: "14px" }}>{hoveredPolygon}</div>
              </MapInfoWindow>
            )}
            <div className='main-map-box'>
              <div className="main-map-box-content"><div className='main-map-box-content-circle-good'></div>0~30 좋음</div>
              <div className="main-map-box-content"><div className='main-map-box-content-circle-moderate'></div>31~81 보통</div>
              <div className="main-map-box-content"><div className='main-map-box-content-circle-bad'></div>81~150 나쁨</div>
              <div className="main-map-box-content"><div className='main-map-box-content-circle-very-bad'></div>150↑ 매우 나쁨</div>
            </div>
          </Map>
        </div>
        
      </div>
  )
}

export default MainMap;