import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosConfig } from "../../configs/axioConfigs.js";
import { getYearRange, fetchWithCache, processAlertData } from "../../utils/alertDataUtils.js"
import axios from "axios";

// 응답 구조 검증
const validateResponse = (response) => {
  return (
    response?.data?.response?.body &&
    typeof response.data === 'object'
  );
};

// API 성공 여부 확인
const isApiSuccess = (responseData) => {
  return responseData?.header?.resultCode === '00';
};

// 에러 메시지 생성
const getErrorMessage = (error) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : '알 수 없는 오류가 발생했습니다.';
  }

  if (error.code === 'ECONNABORTED') {
    return '데이터 로드 시간 초과 (10초). 네트워크 연결을 확인하세요.';
  }

  if (error.response) {
    return error.response.status === 404
      ? '요청 경로 오류 (404 Not Found). API URL을 확인하세요.'
      : `서버 응답 오류 (${error.response.status}).`;
  }

  if (error.request) {
    return '응답을 받지 못했습니다 (네트워크 또는 CORS 오류).';
  }

  return `요청 설정 오류: ${error.message}`;
};

const alertStatusIndex = createAsyncThunk(
  'alertStatus/fetchAlerts',
  async ({ filterMonths = 1 }, thunkAPI) => {
    console.log('🚀 Thunk 시작:', { filterMonths });

    const pageNo = 1; // 👈 항상 1페이지만 (여러 연도 데이터를 합치므로)
    const years = getYearRange(filterMonths); // [2025, 2026] 또는 [2026]
    console.log('📅 Years to fetch:', years);

    const url = `${axiosConfig.BASE_URL}/UlfptcaAlarmInqireSvc/getUlfptcaAlarmInfo`;

    try {
      const promises = years.map(year =>
        fetchWithCache(url, {
          params: {
            serviceKey: axiosConfig.SERVICE_KEY,
            returnType: 'json',
            numOfRows: axiosConfig.NUM_OF_ROWS,
            pageNo,
            year,
          },
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          validateStatus: (status) => status >= 200 && status < 300,
          timeout: 10000,
        })
      );

      const responses = await Promise.all(promises);
      console.log('✅ All responses received');

      const validResponses = responses.filter(validateResponse);

      if (validResponses.length === 0) {
        return thunkAPI.rejectWithValue('Invalid API response structure.');
      }

      const allData = validResponses
        .map(response => response.data.response)
        .filter(isApiSuccess)
        .flatMap(responseData => responseData.body.items || []);

      console.log('📦 Total items:', allData.length);

      const { filteredList, currentView } = processAlertData(allData, filterMonths);
      console.log('📦 Filtered items:', filteredList.length);

      return {
        items: filteredList,
        currentView,
        years,
        totalCount: filteredList.length,
      };

    } catch (error) {
      console.error('💥 Error:', error);

      const errorMsg = `데이터 로드 실패: ${getErrorMessage(error)}`;
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);

export { alertStatusIndex };