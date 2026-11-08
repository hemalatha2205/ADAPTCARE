import { useState, useEffect } from 'react';
import { adaptiveService } from '../../services/adaptiveService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { History, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function AdaptationHistory() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchHistory = (p = 0) => {
    setLoading(true);
    adaptiveService.getHistory(p, 10)
      .then((res) => {
        const data = res.data?.data;
        setEvents(data?.content || []);
        setPage(data?.page || 0);
        setTotalPages(data?.totalPages || 1);
        setTotalElements(data?.totalElements || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory(0);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adaptation Event Audit Trail</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable log of all automated adjustments, state transitions, and closed-loop actions ({totalElements} total).
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchHistory(page)}>
          Refresh
        </Button>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner text="Querying audit records..." />
        ) : events.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8">No adaptation records found.</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Rule Name</th>
                    <th className="pb-3">Trigger Condition</th>
                    <th className="pb-3">Action Executed</th>
                    <th className="pb-3">Entity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-500 whitespace-nowrap">
                        {e.executedAt ? new Date(e.executedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 font-bold text-gray-900">{e.ruleName}</td>
                      <td className="py-3 text-gray-600 max-w-xs truncate italic">{e.triggerCondition}</td>
                      <td className="py-3 font-medium text-teal-800">{e.action}</td>
                      <td className="py-3 text-gray-500">{e.affectedEntityType} #{e.affectedEntityId || '-'}</td>
                      <td className="py-3">
                        <Badge variant={e.status === 'SUCCESS' ? 'success' : 'warning'} size="xs">
                          {e.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="ghost" icon={Eye} onClick={() => setSelectedEvent(e)}>
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
              <span>Page {page + 1} of {totalPages || 1}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={ChevronLeft}
                  disabled={page <= 0}
                  onClick={() => fetchHistory(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={ChevronRight}
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchHistory(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Inspect Modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Adaptation Audit Record">
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{selectedEvent.ruleName}</span>
                <Badge variant={selectedEvent.status === 'SUCCESS' ? 'success' : 'warning'}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <p className="text-gray-500">Rule ID: <span className="font-mono text-gray-700">{selectedEvent.ruleId}</span></p>
              <p className="text-gray-500">Execution Timestamp: <span className="text-gray-700">{new Date(selectedEvent.executedAt).toLocaleString()}</span></p>
              <p className="text-gray-500">Executing Agent: <span className="text-gray-700 font-semibold">{selectedEvent.executedBy}</span></p>
            </div>

            <div>
              <span className="font-semibold text-gray-700 uppercase block mb-1">Trigger Condition</span>
              <p className="p-3 bg-white border border-gray-200 rounded-lg text-gray-800">{selectedEvent.triggerCondition}</p>
            </div>

            <div>
              <span className="font-semibold text-gray-700 uppercase block mb-1">Decision Reason</span>
              <p className="p-3 bg-white border border-gray-200 rounded-lg text-gray-800">{selectedEvent.reason}</p>
            </div>

            <div>
              <span className="font-semibold text-gray-700 uppercase block mb-1">Action Executed</span>
              <p className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-semibold">{selectedEvent.action}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-gray-700 uppercase block mb-1">Previous State</span>
                <pre className="p-2.5 bg-gray-100 rounded-lg text-[11px] font-mono text-gray-700 overflow-x-auto">{selectedEvent.previousState || 'None'}</pre>
              </div>
              <div>
                <span className="font-semibold text-gray-700 uppercase block mb-1">New State</span>
                <pre className="p-2.5 bg-gray-100 rounded-lg text-[11px] font-mono text-teal-800 font-bold overflow-x-auto">{selectedEvent.newState || 'None'}</pre>
              </div>
            </div>

            {selectedEvent.details && (
              <div>
                <span className="font-semibold text-gray-700 uppercase block mb-1">Additional Telemetry</span>
                <p className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">{selectedEvent.details}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
