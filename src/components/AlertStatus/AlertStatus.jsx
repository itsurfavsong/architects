import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { alertStatusIndex } from '../../store/thunks/alertStatusThunk.js';
import { setFilterMonth, setCurrentViewPage } from '../../store/slices/alertStatusSlice.js';
import './AlertStatus.css';
import { groupAlertsByDateAndDistrict, groupCardsByDate } from '../../utils/alertDataUtils.js';
import { ITEMS_PER_PAGE, MONTH_OPTIONS } from '../../configs/axioConfigs.js';
import dayjs from 'dayjs';
import { DUST_UNITS } from '../../utils/getDustLevel.js';

dayjs.locale('ko');

/* ============================================================================
   AlertDetailItem Component
   ============================================================================ */
const AlertDetailItem = ({ alert }) => {
  const {
    issueVal, clearVal,
    issueDate, issueTime,
    clearDate, clearTime,
    itemCode, moveName,
  } = alert;

  const issueTimeOnly = dayjs(`${issueDate} ${issueTime}`, 'YYYY-MM-DD HH:mm').format('A h시');

  const hasClearInfo = clearVal !== undefined && clearVal !== null && clearVal !== '';
  const clearTimeOnly = hasClearInfo
    ? dayjs(`${clearDate} ${clearTime}`, 'YYYY-MM-DD HH:mm').format('A h시')
    : null;

  const unit = DUST_UNITS[itemCode] || '';

  return (
    <div className="alert-detail-container">
      <p className="alert-detail-moveName">({moveName})</p>
      <div className="alert-detail-info alert-issue">
        <p className="alert-detail-value">
          <span>🚨 발령</span>:
          <span>{issueVal}{unit}</span>
          <span className="alert-detail-time">{issueTimeOnly}</span>
        </p>
      </div>

      {hasClearInfo && (
        <div className="alert-detail-info alert-clear">
          <p className="alert-detail-value">
            <span>✅ 해제</span>:
            <span>{clearVal}{unit}</span>
            <span className="alert-detail-time">{clearTimeOnly}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   AlertStatusCards Component
   ============================================================================ */
/**
 * @param {{groupedAlert: { dataDate: string, districtName: string, alerts: Array<Object> }}} props 
 */
const AlertStatusCards = ({ groupedAlert }) => {
  const { districtName, alerts } = groupedAlert;

  // 카드의 뱃지(issueGbn): 가장 최신 또는 중요한 항목의 issueGbn 사용 (경보 > 주의보 우선)
  const representativeAlert = alerts[0];
  const representativeIssueGbn = representativeAlert.issueGbn;

  const isWarning = representativeIssueGbn === "주의보";
  const isDanger = representativeIssueGbn === "경보";

  const badgeIssueGbnClass = isWarning
    ? 'badge-warning'
    : isDanger
      ? 'badge-danger'
      : 'badge-default';

  return (
    <div className="alert-status-card">

      {/* 1. 카드 헤더 및 제목 영역 - 스크롤 외부 -------------------------------------------------------------------- */}
      <div className="alert-status-card-header">
        <div className={`alert-status-card-issueGbn ${badgeIssueGbnClass}`}>
          {representativeIssueGbn}
        </div>
      </div>
      <div className="alert-status-card-title-area">
        <h2 className="alert-status-card-districtName">{districtName}</h2>
      </div>

      {/* 1-2. 스크롤 영역 -------------------------------------------------------------------- */}
      <div className="alert-status-card-scroll-contents">
        {alerts.map((alertItem, index) => (
          <AlertDetailItem key={alertItem.sn || index} alert={alertItem} />
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   Pagination Component
   ============================================================================ */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &lt;
      </button>
      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`pagination-button ${number === currentPage ? 'active' : ''}`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        &gt;
      </button>
    </div>
  );
};

/* ============================================================================
   AlertStatus Main Component
   ============================================================================ */
const AlertStatus = () => {
  const dispatch = useDispatch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hasInitialFetched = useRef(false); // 👈 초기 fetch 완료 여부 추적


  const {
    list: allAlerts,
    filteredList,
    loading: reduxLoading,
    noMoreApiData,
    error,
    filterMonth,
    isPeriodSelected,
    currentViewPage,
  } = useSelector(state => state.alertStatus);

  const today = dayjs().format('YYYY.MM.DD');

  const handleMonthChange = (month) => {
    dispatch(setFilterMonth(month));
    setIsDropdownOpen(false);
    hasInitialFetched.current = false; // 👈 필터 변경 시 리셋
  };

  // 외부 클릭 감지 useEffect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    // 기간이 선택되지 않았으면 아무것도 안 함
    if (!isPeriodSelected) {
      return;
    }

    // 이미 fetch 했으면 건너뜀
    if (hasInitialFetched.current) {
      return;
    }

    // 로딩 중이면 건너뜀
    if (reduxLoading) {
      return;
    }

    console.log('🚀 Fetching alerts...');
    dispatch(alertStatusIndex({ filterMonths: filterMonth })); // 👈 filterMonth 전달!
    hasInitialFetched.current = true;

  }, [dispatch, isPeriodSelected, filterMonth, reduxLoading]);

  const districtGroups = useMemo(() => {
    return groupAlertsByDateAndDistrict(filteredList);
  }, [filteredList]);

  const dateGroups = useMemo(() => {
    return groupCardsByDate(districtGroups);
  }, [districtGroups]);

  {/* Pagination ---------------------------------------------------------------------------------- */ }
  const totalItems = dateGroups.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const displayedDateGroups = useMemo(() => {
    const start = (currentViewPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return dateGroups.slice(start, end);
  }, [dateGroups, currentViewPage]);

  const isListEmpty = isPeriodSelected
    && !reduxLoading
    && totalItems === 0
    && noMoreApiData;

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      dispatch(setCurrentViewPage(page));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [dispatch, totalPages]);

  return (
    <div className="container">

      {/* 1. 헤더 영역 (항상 표시) ---------------------------------------------------------------------- */}
      <div className="title-area">
        <h2 className="main-sub-head-title main-head-title">미세먼지 경보</h2>
        <div className="dropdown-container">
          <p className="dropdown-label">
            최근 특보 현황 <br></br>(기준: {today})
          </p>

          {/* 1-1. 드랍다운 영역 ---------------------------------------------------------------------- */}
          <div
            className={`dropdown-select ${isDropdownOpen ? 'open' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            ref={dropdownRef}
          >
            <span className="selected-value">
              {isPeriodSelected
                ? MONTH_OPTIONS.find(opt => opt.value === filterMonth)?.label || `${filterMonth}개월`
                : "기간 선택"
              }
            </span>
            <span className="dropdown-arrow">▼</span>
            {isDropdownOpen && (
              <ul className="dropdown-menu">
                {MONTH_OPTIONS.map((option) => (
                  <li
                    key={option.value}
                    className={`dropdown-item ${filterMonth === option.value ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMonthChange(option.value);
                    }}>
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 2. 콘텐츠 영역 (조건부 렌더링) -------------------------------------------------------------------- */}
      <div className="content-wrapper">
        {isPeriodSelected === false && (
          <div className="prompt-msg-box">
            <p className="prompt-msg-txt">
              👉<span>기간 선택</span> 후 <br></br>미세먼지 특보를 확인해보세요.
            </p>
          </div>
        )}

        {/* 2-1. 콘텐츠 영역 (API issue) ---------------------------------------------------------------------- */}
        {isPeriodSelected === true && (
          <>
            {error && (
              <div className="error-msg-box">
                <h3 className="error-msg-title">⚠️ 데이터 로드 실패</h3>
                <p className="error-msg-txt">
                  오류 발생 - 다시 시도해 주세요.
                </p>
                <p className="error-msg-detail">오류 상태: {error}</p>
                <button
                  className="retry-btn"
                  onClick={() => dispatch(setFilterMonth(filterMonth))}
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* 2-2. 콘텐츠 영역 (loading message) ---------------------------------------------------------------------- */}
            {!error && reduxLoading && (
              <div className="loading-state-container">
                <div className="loading-spinner"></div>
                <p className="loading-txt">데이터 로딩 중...</p>
              </div>
            )}

            {/* 2-3. 콘텐츠 영역 (if data is empty) ---------------------------------------------------------------------- */}
            {!error && !reduxLoading && isListEmpty && (
              <div className="empty-msg-box">
                <p className="empty-msg-txt">
                  최근 {filterMonth}개월간 발령 내역이 없습니다.
                </p>
              </div>
            )}

            {/* 2-3. 콘텐츠 영역 (if data is not empty)---------------------------------------------------------------------- */}
            {(!error && displayedDateGroups.length > 0) && (
              <>
                {displayedDateGroups.map(dateGroup => (
                  <div key={dateGroup.date} className="date-group-container">
                    <h3 className="date-header">
                      {dayjs(dateGroup.date).format('YYYY.MM.DD')}
                    </h3>
                    <div className="cards-wrapper">
                      {dateGroup.cards.map(cardGroup => (
                        <AlertStatusCards
                          key={`${cardGroup.dataDate}-${cardGroup.districtName}`}
                          groupedAlert={cardGroup}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <Pagination
                  currentPage={currentViewPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlertStatus;