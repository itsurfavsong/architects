import { createSlice } from "@reduxjs/toolkit";
import { getLocation } from "../thunks/locationThunk.js";
const initialState = {
  selectedRegion: '서울',
  selectedDistrict: null,
  nearbyStations: null,
  status: 'idle',
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setRegion: (state, action) => {
      state.selectedRegion = action.payload;
      state.selectedDistrict = null; // Reset district when region changes
    },
    setDistrict: (state, action) => {
      state.selectedDistrict = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getLocation.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getLocation.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.nearbyStations = action.payload;
      })
      .addCase(getLocation.rejected, (state) => {
        state.status = 'failed';
      })
  }
});

export const { setRegion, setDistrict } = locationSlice.actions;
export default locationSlice.reducer;