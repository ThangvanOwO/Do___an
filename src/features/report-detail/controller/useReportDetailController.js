/**
 * Controller: điều phối Model + gọi API + state, trả props cho View.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { reportsAPI, categoriesAPI } from '../../../services/api';
import { fetchVietMapRoute } from '../../../components/VietMap';
import { buildCategoriesMap, buildReportDetailDisplay } from '../model/reportDetailModel';

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
      () => {}
    );
  }, []);

  const display = useMemo(
    () => buildReportDetailDisplay(report, categoriesById),
    [report, categoriesById]
  );

  const handleGetRoute = useCallback(async () => {
    if (!report) return;
    if (!userLocation) {
      setRouteError('Không thể lấy vị trí hiện tại. Hãy bật GPS và thử lại.');
      return;
    }
    setRouteLoading(true);
    setRouteError('');
    setRouteData(null);
    setRouteInfo(null);
    try {
      const destination = { lat: report.latitude, lng: report.longitude };
      const result = await fetchVietMapRoute(userLocation, destination, vehicle);
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
  };
}
