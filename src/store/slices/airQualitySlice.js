import { createSlice } from "@reduxjs/toolkit";
import { getAirQuality } from "../thunks/airQualityThunk.js";

const airQualitySlice = createSlice({
  name: 'airQuality',
  initialState: {
    airQuality: null,
    status: 'idle',
  },
  reducers: {},

  extraReducers: builder => {
    builder
      .addCase(getAirQuality.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getAirQuality.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.airQuality = action.payload;
      })
      .addCase(getAirQuality.rejected, (state) => {
        state.status = 'failed';
      })
  }
});

export default airQualitySlice.reducer;
