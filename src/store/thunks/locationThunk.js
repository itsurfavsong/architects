import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosConfig } from "../../configs/axioConfigs"
import axios from "axios";
import proj4 from "proj4";

// 좌표계 정의 (WGS84 -> TM)
const wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
const tm =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 " +
  "+x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";

const getLocation = createAsyncThunk(
  'location/getLocation',
  async ({ lat, lon }) => {
    console.log(lat, lon);
    // 1. WGS84 -> TM 좌표 변환
    const [tmX, tmY] = proj4(wgs84, tm, [lon, lat]);
    console.log(tmX, tmY);

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