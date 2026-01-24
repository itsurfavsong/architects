import { createSlice } from "@reduxjs/toolkit";
import { getMapList } from "../thunks/mapAxioThunk.js";

const mapAxioSlice = createSlice({
  name: 'map',
  initialState: {
    mapList: [],
  },
  reducers: {},

  extraReducers: builder => {
    builder
      .addCase(getMapList.fulfilled, (state, action) => {
        state.mapList = action.payload;
      })
  }
});


export default mapAxioSlice.reducer;