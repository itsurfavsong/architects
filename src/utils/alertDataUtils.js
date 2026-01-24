// alertDataUtils.js
// 통합된 Alert 데이터 처리 유틸리티

import dayjs from 'dayjs';
import axios from 'axios';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { getCache, setCache } from './localStorageCache.js';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/* ============================================================================
   API Helper - API 호출 및 캐싱
   ============================================================================ */

/**
 * 주어진 개월 수에 해당하는 연도 범위를 반환합니다.
 */
export const getYearRange = (months) => {
  const now = dayjs();
  const startDate = now.subtract(months, 'month');

  const currentYear = now.year();
  const startYear = startDate.year();

  const years = new Set();
  for (let year = startYear; year <= currentYear; year++) {
    years.add(year);
  }

  return Array.from(years);
};

/**
 * localStorage 캐시를 확인하고 없으면 API 호출 후 캐싱합니다.
 */
export const fetchWithCache = async (url, config) => {
  const { year, pageNo } = config.params;

  // localStorage 확인
  const cached = getCache(year, pageNo);
  if (cached) {
    console.log(`📦 Cache hit: ${year}년 ${pageNo}페이지`);
    // 디버깅용 로그
    if (cached.data) {
      console.log('📦 Cached contents snippet:', {
        keys: Object.keys(cached.data),
        sample: JSON.stringify(cached.data).slice(0, 100)
      });
    }
    return cached;
  }

  console.log(`🌐 API call: ${year}년 ${pageNo}페이지`);
  const response = await axios.get(url, config);

  console.log('🌐 API response structure:', {
    hasData: !!response.data,
    hasResponse: !!response.data?.response,
    hasBody: !!response.data?.response?.body,
  });

  // localStorage에 저장
  setCache(year, pageNo, response);

  return response;
};

/**
 * 날짜 기준으로 데이터를 필터링합니다.
 */
export const filterByDate = (items, months, dateField = 'occrrncDt') => {
  const cutoffDate = dayjs().subtract(months, 'month');

  return items.filter(item => {
    const itemDate = dayjs(item[dateField]);
    return itemDate >= cutoffDate;
  });
};

/* ============================================================================
   Date Sorter - 날짜/시간 정렬 함수
   ============================================================================ */

/**
 * 두 항목의 날짜/시간 문자열을 비교하여 내림차순(최신 순)으로 정렬하는 함수를 생성합니다.
 * @param {string} dateFieldKey - 날짜 필드 이름 (예: 'issueDate', 'dataDate')
 * @param {string} [timeFieldKey] - 시간 필드 이름 (옵션, issueDate와 issueTime처럼 분리된 경우)
 * @param {string} [format] - 날짜/시간 문자열의 Day.js 파싱 포맷 (timeFieldKey가 있으면 'YYYY-MM-DD HH:mm'를 기본값으로 사용)
 * @returns {function(Object, Object): number} 정렬 비교 함수
 */
export function createDateTimeDescSorter(dateFieldKey, timeFieldKey = null, format = 'YYYY-MM-DD') {
  const dateTimeFormat = timeFieldKey ? 'YYYY-MM-DD HH:mm' : format;

  return (a, b) => {
    // 1. 날짜/시간 문자열 조합
    const dateTimeA = timeFieldKey
      ? `${a[dateFieldKey]} ${a[timeFieldKey]}`
      : a[dateFieldKey];
    const dateTimeB = timeFieldKey
      ? `${b[dateFieldKey]} ${b[timeFieldKey]}`
      : b[dateFieldKey];

    // 2. Day.js 객체로 파싱
    const dateA = dayjs(dateTimeA, dateTimeFormat);
    const dateB = dayjs(dateTimeB, dateTimeFormat);

    // 3. 내림차순 정렬 로직 (B가 A보다 이후이면 1 반환)
    if (dateB.isAfter(dateA)) return 1;
    if (dateB.isBefore(dateA)) return -1;

    // 날짜/시간이 동일한 경우 0 반환 (후순위 정렬 로직은 개별 모듈에서 처리)
    return 0;
  };
}

/* ============================================================================
   Date Filter - 날짜 범위 필터링
   ============================================================================ */

/**
 * 주어진 데이터 배열에서 '현재' 시점부터 `months`개월 이전까지의 데이터만 필터링하여 반환합니다.
 * @param {Array<Object>} allData - 미세먼지 관측 데이터 전체 배열
 * @param {number} months - 필터링할 개월 수 (기본값: 1)
 * @returns {Array<Object>} 최근 `months`개월 동안의 데이터 항목 배열
 */
export function getRecentOneMonthData(allData, months = 1) {
  const today = dayjs().startOf('day');
  const monthsAgo = today.subtract(months, 'month').startOf('day');

  const filteredData = allData.filter(item => {
    const itemDate = dayjs(item.issueDate).startOf('day');

    const isRecentEnough = itemDate.isSameOrAfter(monthsAgo, 'day');
    const isNotFuture = itemDate.isSameOrBefore(today, 'day');

    return isRecentEnough && isNotFuture;
  });

  return filteredData;
}

/* ============================================================================
   Alert Data Processor - 필터링 + 정렬 조합
   ============================================================================ */

// 날짜/시간 내림차순 정렬 함수 생성 ('issueDate'와 'issueTime' 기준)
const dateTimeSorter = createDateTimeDescSorter('issueDate', 'issueTime');

export function processAlertData(list, filterMonth) {
  const filtered = getRecentOneMonthData(list, filterMonth);

  // slice()로 원본 배열 복사 후 정렬
  const sortedFiltered = filtered.slice().sort((a, b) => {
    const dateTimeCompare = dateTimeSorter(a, b);

    // 날짜/시간이 동일하면 sn 내림차순으로 정렬
    if (dateTimeCompare !== 0) {
      return dateTimeCompare;
    }

    return b.sn - a.sn; // sn 내림차순
  });

  return {
    filteredList: sortedFiltered,
    currentView: sortedFiltered,
  };
}

/* ============================================================================
   Data Grouping Logic - 그룹화 로직
   ============================================================================ */

// 날짜 내림차순 정렬 함수 생성 ('dataDate' 기준)
const dateDescSorter = createDateTimeDescSorter('dataDate', null, 'YYYY-MM-DD');

/**
 * API 응답으로 받은 개별 특보 목록을 '날짜'와 '지역 이름' 기준으로 그룹화합니다.
 */
export const groupAlertsByDateAndDistrict = (items) => {
  if (!items || items.length === 0) {
    return [];
  }

  const groupedMap = items.reduce((acc, item) => {
    const dateField = item.issueDate;
    const key = `${dateField}-${item.districtName}`;

    if (!acc[key]) {
      acc[key] = {
        dataDate: dateField,
        districtName: item.districtName,
        alerts: [],
      };
    }

    acc[key].alerts.push(item);
    return acc;
  }, {});

  return Object.values(groupedMap).sort((a, b) => {
    const dateCompare = dateDescSorter(a, b);

    if (dateCompare !== 0) {
      return dateCompare; // 날짜 내림차순
    }

    // 같은 날짜면 지역명 오름차순 (기존 로직 유지)
    return a.districtName.localeCompare(b.districtName);
  });
};

export function groupCardsByDate(cardGroups) {
  const groupedByDate = cardGroups.reduce((acc, card) => {
    const dateKey = card.dataDate;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        cards: []
      };
    }
    acc[dateKey].cards.push(card);
    return acc;
  }, {});

  // 배열로 변환 후 날짜 내림차순 (최신 날짜가 먼저)으로 정렬합니다.
  return Object.values(groupedByDate).sort((a, b) => {
    return dateDescSorter(a, b);
  });
}
