import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosConfig } from "../../configs/axioConfigs";
import axios from "axios";

const getMapList = createAsyncThunk(
  'mapAxio/getMapList',
  async () => {
    const url = `${axiosConfig.BASE_URL}/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty`;

    const config = {
      params: {
        serviceKey: axiosConfig.SERVICE_KEY,
        ver: axiosConfig.VER,
        sidoName: '전국',
        numOfRows: 1000,
        returnType: 'json',
      }
    }

    const response = await axios.get(url, config);

    return response.data.response.body;
  }
);

export { getMapList };
