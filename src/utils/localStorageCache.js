// utils/localStorageCache.js
import dayjs from "dayjs";

const CACHE_CONFIG = {
  prefix: 'alert_v3',
  ttl: 7 * 24 * 60 * 60 * 1000, // 7일
};

const generateKey = (year, pageNo) => {
  return `${CACHE_CONFIG.prefix}_${year}_page${pageNo}`;
};

export const setCache = (year, pageNo, axiosResponse) => {
  const key = generateKey(year, pageNo);
  const item = {
    axiosResponse: {
      data: axiosResponse.data,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
    },
    timestamp: dayjs().valueOf(),
    year,
    pageNo,
  };

  try {
    const jsonString = JSON.stringify(item);
    const sizeKB = new Blob([jsonString]).size / 1024;

    if (sizeKB > 5 * 1024) {  // 5MB 초과
      console.warn(`⚠️ Cache too large: ${sizeKB.toFixed(2)}KB`);
      return false;
    }

    localStorage.setItem(key, jsonString);
    console.log(`✅ Cached: ${year}-p${pageNo} (${sizeKB.toFixed(2)}KB)`);
    return true;
  } catch (e) {
    console.error('❌ Cache save failed:', e.name);

    if (e.name === 'QuotaExceededError') {
      console.warn('💾 localStorage full, clearing old cache...');
      clearOldest();

      try {
        localStorage.setItem(key, JSON.stringify(item));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};

export const getCache = (year, pageNo) => {
  const key = generateKey(year, pageNo);

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    // TTL 체크
    const age = Date.now() - parsed.timestamp;
    if (age > CACHE_CONFIG.ttl) {
      console.log(`🗑️ Cache expired: ${year}-p${pageNo} (${(age / 1000 / 60 / 60 / 24).toFixed(1)} days old)`);
      localStorage.removeItem(key);
      return null;
    }

    // axios response 형식으로 반환
    const response = {
      data: parsed.axiosResponse.data,
      status: parsed.axiosResponse.status,
      statusText: parsed.axiosResponse.statusText,
    };

    console.log(`✅ Cache valid: ${year}-p${pageNo}`);
    return response;

  } catch (e) {
    console.error(`❌ Cache parse failed for ${key}:`, e.message);
    localStorage.removeItem(key);
    return null;
  }
};

const clearOldest = () => {
  const items = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // v2 캐시만 대상
    if (key?.startsWith(CACHE_CONFIG.prefix)) {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        items.push({
          key,
          timestamp: item.timestamp,
          size: localStorage.getItem(key).length
        });
      } catch (e) {
        // 파싱 실패한 캐시는 즉시 삭제
        localStorage.removeItem(key);
      }
    }
  }

  if (items.length === 0) return;

  // 가장 오래된 20% 삭제
  items.sort((a, b) => a.timestamp - b.timestamp);
  const removeCount = Math.max(1, Math.ceil(items.length * 0.2));

  console.log(`🗑️ Removing ${removeCount} oldest cache items...`);
  items.slice(0, removeCount).forEach(item => {
    localStorage.removeItem(item.key);
  });
};

export const clearCache = () => {
  let count = 0;
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('alert_')) {  // v1, v2 모두 삭제
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    count++;
  });

  console.log(`🗑️ Cleared ${count} cache items`);
  return count;
};

export const clearYearCache = (year) => {
  let count = 0;
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${CACHE_CONFIG.prefix}_${year}_`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    count++;
  });

  console.log(`🗑️ Cleared ${year} cache: ${count} items`);
  return count;
};