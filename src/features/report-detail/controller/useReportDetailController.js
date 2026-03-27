/**
 * Controller: điều phối Model + gọi API + state, trả props cho View.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { reportsAPI, categoriesAPI } from '../../../services/api';
import { fetchVietMapRoute } from '../../../components/VietMap';
import { buildCategoriesMap, buildReportDetailDisplay } from '../model/reportDetailModel';

const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 };

function getCurrentPositionAsync() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị (Geolocation).'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const denied = err?.code === 1;
        reject(
          new Error(
            denied
              ? 'Trình duyệt đã chặn vị trí. Hãy bấm biểu tượng khóa / i thanh địa chỉ → cho phép Vị trí, rồi thử lại.'
              : 'Không lấy được GPS (timeout hoặc tín hiệu yếu). Bật định vị trên thiết bị và thử lại.'
          )
        );
      },
      GEO_OPTIONS
    );
  });
}

export function useReportDetailController(reportId, navigate) {
  const [report, setReport] = useState(null);
  const [categoriesById, setCategoriesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [vehicle, setVehicle] = useState('motorcycle');
  const [geoLoading, setGeoLoading] = useState(false);

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError('');
    try {
      const [catRes, repRes] = await Promise.all([
        categoriesAPI.getAll().catch(() => ({ success: false })),
        reportsAPI.getById(reportId),
      ]);
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategoriesById(buildCategoriesMap(catRes.data));
      }
      setReport(repRes.data);
    } catch (err) {
      setError(err.message || 'Không tìm thấy báo cáo');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }, []);

  const retryGeolocation = useCallback(async () => {
    setGeoLoading(true);
    setRouteError('');
    try {
      const loc = await getCurrentPositionAsync();
      setUserLocation(loc);
    } catch (e) {
      setRouteError(e.message || 'Không lấy được vị trí.');
    } finally {
      setGeoLoading(false);
    }
  }, []);

  const display = useMemo(
    () => buildReportDetailDisplay(report, categoriesById),
    [report, categoriesById]
  );

  const handleGetRoute = useCallback(async () => {
    if (!report) return;
    setRouteLoading(true);
    setRouteError('');
    setRouteData(null);
    setRouteInfo(null);
    let origin = userLocation;
    if (!origin) {
      try {
        origin = await getCurrentPositionAsync();
        setUserLocation(origin);
      } catch (e) {
        setRouteLoading(false);
        setRouteError(
          e.message ||
            'Chưa có vị trí của bạn. Bật GPS, cho phép trình duyệt truy cập vị trí, rồi bấm "Thử lại vị trí" hoặc "Chỉ đường" lần nữa.'
        );
        return;
      }
    }
    try {
      const destination = { lat: report.latitude, lng: report.longitude };
      const result = await fetchVietMapRoute(origin, destination, vehicle);
      setRouteData({ coordinates: result.coordinates, bbox: result.bbox });
      setRouteInfo({
        distance: result.distance,
        time: result.time,
        instructions: result.instructions,
      });
    } catch (err) {
      setRouteError(err.message || 'Không tìm được đường đi');
    } finally {
      setRouteLoading(false);
    }
  }, [report, userLocation, vehicle]);

  const handleClearRoute = useCallback(() => {
    setRouteData(null);
    setRouteInfo(null);
    setShowInstructions(false);
  }, []);

  const onVehicleChange = useCallback((v) => {
    setVehicle(v);
    handleClearRoute();
  }, [handleClearRoute]);

  const goBack = useCallback(() => {
    if (navigate) navigate(-1);
  }, [navigate]);

  return {
    loading,
    error,
    report,
    display,
    goBack,
    userLocation,
    setUserLocation,
    routeData,
    routeLoading,
    routeError,
    routeInfo,
    showInstructions,
    setShowInstructions,
    vehicle,
    onVehicleChange,
    handleGetRoute,
    handleClearRoute,
    geoLoading,
    retryGeolocation,
  };
}
