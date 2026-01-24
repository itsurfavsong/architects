import { createSlice } from '@reduxjs/toolkit';
import { alertStatusIndex } from '../thunks/alertStatusThunk.js';
import { processAlertData } from '../../utils/alertDataUtils.js';

const initialState = {
  list: [],           // 전체 원본 데이터
  filteredList: [],   // 필터링된 데이터
  loading: false,
  noMoreApiData: false,
  error: null,
  filterMonth: 1,
  isPeriodSelected: false,
  currentViewPage: 1,
  currentPage: 0,     // API 페이지네이션용
};

const alertStatusSlice = createSlice({
  name: 'alertStatus',
  initialState,
  reducers: {
    setFilterMonth: (state, action) => {
      state.filterMonth = action.payload;
      state.isPeriodSelected = true;
      state.currentViewPage = 1;
      // 👇 필터 변경 시 데이터 초기화
      state.list = [];
      state.filteredList = [];
      state.currentPage = 0;
      state.noMoreApiData = false;
      state.error = null;
    },
    setCurrentViewPage: (state, action) => {
      state.currentViewPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(alertStatusIndex.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(alertStatusIndex.fulfilled, (state, action) => {
        state.loading = false;

        const { items, totalCount } = action.payload;

        // 👇 데이터 교체 (추가가 아니라!)
        state.list = items;
        state.filteredList = items;

        // 데이터가 없으면 더 이상 가져올 게 없음
        if (totalCount === 0) {
          state.noMoreApiData = true;
        }

        console.log('✅ Data loaded:', {
          total: totalCount,
          filterMonth: state.filterMonth,
        });
      })
      .addCase(alertStatusIndex.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.noMoreApiData = true;
      });
  }
});

export const { setFilterMonth, setCurrentViewPage } = alertStatusSlice.actions;
export default alertStatusSlice.reducer;