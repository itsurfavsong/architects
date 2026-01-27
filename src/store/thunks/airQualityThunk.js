import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosConfig } from "../../configs/axioConfigs.js";
import axios from "axios";

export const getAirQuality = createAsyncThunk(
  'airQuality/getAirQuality',
  async (payload, { rejectWithValue }) => {
    // payload가 없을 경우를 대비하여 기본값 설정
    const stationName = payload ? payload.stationName : null;
    if (!stationName) {
      // stationName이 없으면 요청을 보내지 않고 빈 데이터를 반환하거나 에러 처리
      return { labels: [], pm10: [], pm25: [] };
    }

    // 측정소별 실시간 측정정보 조회 API
    const url = `${axiosConfig.BASE_URL}/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty`;

    const config = {
      params: {
        serviceKey: axiosConfig.SERVICE_KEY,
        returnType: 'json',
        numOfRows: 100, // 24시간 데이터
        pageNo: 1,
        stationName: stationName,
        dataTerm: 'MONTH', // 일별 데이터
        ver: axiosConfig.VER,
      }
    };

    try {
      const response = await axios.get(url, config);
      const items = response.data.response.body.items;

      // 데이터가 없을 경우 빈 배열 반환
      if (!items) {
        return { labels: [], pm10: [], pm25: [] };
      }

      // 최근 5개 데이터 (현재 포함)
      const recentItems = items.slice(-5); // 뒤에서 5개 추출 

      // 데이터가 최신순(현재 -> 과거)이라면 순서를 뒤집기 
      const orderedItems = recentItems;

      // Chart.js 형식에 맞게 데이터 가공 
      const processedData = {
        labels: orderedItems.map(item => {
          const time = item.dataTime.split(' ')[1];
          return time;
        }),
        pm10: orderedItems.map(item => item.pm10Value),
        pm25: orderedItems.map(item => item.pm25Value),
      };

      return processedData;

    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);