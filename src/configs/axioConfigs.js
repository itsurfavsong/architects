export const axiosConfig = {
  SERVICE_KEY: import.meta.env.VITE_SERVICE_KEY,
  BASE_URL: '/dataApi',
  KAKAO_URL: '/kakaoApi',
  KAKAO_KEY: import.meta.env.VITE_KAKAO_REST_KEY || import.meta.env.VITE_MAP_KEY,
  NUM_OF_ROWS: 100,
  YEAR: '2025',
  VER: '1.0',
}

export const ITEMS_PER_PAGE = 5;

export const MONTH_OPTIONS = [
  { value: 1, label: '1개월 ' },
  { value: 2, label: '2개월' },
  { value: 3, label: '3개월' },
];
