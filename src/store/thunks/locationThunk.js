import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosConfig } from "../../configs/axioConfigs"
import axios from "axios";

const getLocation = createAsyncThunk(
  'location/getLocation',
  async ({ lat, lon }) => {
    // 1. GPS(WGS84) -> TM 좌표 변환
    const query = new URLSearchParams({
      x: lon,
      y: lat,
      input_coord: 'WGS84',
      output_coord: 'TM',
    }).toString();
    const kakaoUrl = `${axiosConfig.KAKAO_URL}/v2/local/geo/transcoord.json?${query}`;

    // axios 인터셉터나 설정을 피하기 위해 브라우저 기본 fetch 사용
    const transResponse = await fetch(kakaoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${axiosConfig.KAKAO_KEY}`.trim(),
      },
    });

    const transData = await transResponse.json();

    if (transData.errorType) {
      console.error('Kakao API Error:', transData);
      throw new Error(`Kakao API: ${transData.message}`);
    }

    const { x: tmX, y: tmY } = transData.documents[0];

    // 2. TM 좌표로 근처 측정소 조회
    const url = `${axiosConfig.BASE_URL}/MsrstnInfoInqireSvc/getNearbyMsrstnList`;

    const config = {
      params: {
        serviceKey: axiosConfig.SERVICE_KEY,
        ver: axiosConfig.VER,
        tmX: tmX,
        tmY: tmY,
        returnType: 'json',
      }
    }

    const response = await axios.get(url, config);

    return response.data.response.body;
  }
);

export { getLocation };