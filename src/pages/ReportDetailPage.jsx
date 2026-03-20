/**
 * Trang: chỉ kết nối route → Controller → View (MVC).
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useReportDetailController } from '../features/report-detail/controller/useReportDetailController';
import { ReportDetailView } from '../features/report-detail/view/ReportDetailView';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ctrl = useReportDetailController(id, navigate);
  return <ReportDetailView {...ctrl} />;
}
