import React, { useState, useEffect } from 'react';
import { Bell, Edit2, Trash2, Calendar, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  ConfirmationDialog,
  LoadingState,
  EmptyState,
  ErrorState,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Modal,
  Tabs,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface NotificationData {
  id: number;
  title: string;
  message: string;
  target_audience: string;
  status: string;
  scheduled_date: string | null;
  published_date: string | null;
  created_at: string;
}

export const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'published' | 'scheduled' | 'draft'>('published');
  const { success, error: showError } = useToast();

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [status, setStatus] = useState('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const res = await api.get('/institute-admin/notifications');
          setNotifications(res.data);
          
          if (res.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load notifications");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);
  
  const published = notifications.filter(n => n.status === 'published');
  const scheduled = notifications.filter(n => n.status === 'scheduled');
  const drafts = notifications.filter(n => n.status === 'draft');

  const publishedPagination = usePagination({ data: published, itemsPerPage: 10 });
  const scheduledPagination = usePagination({ data: scheduled, itemsPerPage: 10 });
  const draftsPagination = usePagination({ data: drafts, itemsPerPage: 10 });

  const handleDeleteConfirm = async () => {
    if (selectedNotif) {
      try {
          await api.delete(`/institute-admin/notifications/${selectedNotif.id}`);
          success("Notification deleted successfully");
          fetchData();
      } catch (e: any) {
          showError('Failed to delete notification');
      }
      setIsDeleteOpen(false);
      setSelectedNotif(null);
    }
  };
  
  const handlePublishConfirm = async () => {
      if (selectedNotif) {
          try {
              await api.post(`/institute-admin/notifications/${selectedNotif.id}/publish`);
              success("Notification published successfully");
              fetchData();
          } catch (e: any) {
              showError(e.response?.data?.detail || 'Failed to publish notification');
          }
          setIsPublishOpen(false);
          setSelectedNotif(null);
      }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedNotif(null);
    setTitle('');
    setMessage('');
    setTargetAudience('all');
    setStatus('draft');
    setScheduledDate('');
    setIsFormOpen(true);
  };

  const openEditForm = (notif: NotificationData) => {
    setIsEdit(true);
    setSelectedNotif(notif);
    setTitle(notif.title);
    setMessage(notif.message);
    setTargetAudience(notif.target_audience);
    setStatus(notif.status);
    setScheduledDate(notif.scheduled_date ? new Date(notif.scheduled_date).toISOString().slice(0, 16) : '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
        showError("Title and Message are required.");
        return;
    }

    setIsSubmitting(true);
    
    const payload = {
        title,
        message,
        target_audience: targetAudience,
        status: status,
        scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null
    };

    try {
        if (isEdit && selectedNotif) {
            await api.put(`/institute-admin/notifications/${selectedNotif.id}`, payload);
        } else {
            await api.post('/institute-admin/notifications', payload);
        }
        setIsFormOpen(false);
        success(`Notification ${isEdit ? 'updated' : 'created'} successfully`);
        fetchData();
    } catch (e: any) {
        showError(e.response?.data?.detail || "Failed to save notification.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const renderTable = (data: NotificationData[], paginationObj: any) => {
      if (data.length === 0) {
          return (
             <div className="py-12 text-center text-slate-500">
                No notifications match this category.
             </div>
          );
      }
      return (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Message Content</TableHeaderCell>
                <TableHeaderCell>Audience</TableHeaderCell>
                <TableHeaderCell>Timeline</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(n => (
                <TableRow key={n.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border shrink-0 mt-1 ${n.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : n.status === 'scheduled' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {n.status === 'published' ? <CheckCircle2 className="w-4 h-4" /> : n.status === 'scheduled' ? <Clock className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-xs text-slate-400 max-w-md line-clamp-2 mt-1">{n.message}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                       <Badge variant={n.target_audience === 'all' ? 'info' : 'neutral'}>
                          {n.target_audience === 'all' ? 'All Users' : n.target_audience === 'student' ? 'Students Only' : 'Teachers Only'}
                      </Badge>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1 text-slate-300">
                          {n.status === 'published' && n.published_date && (
                              <div className="flex items-center gap-1.5 text-xs">
                                  <Send className="w-3 h-3 text-slate-500" /> Published: {new Date(n.published_date).toLocaleDateString()}
                              </div>
                          )}
                          {n.status === 'scheduled' && n.scheduled_date && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                                  <Calendar className="w-3 h-3" /> Scheduled: {new Date(n.scheduled_date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                              </div>
                          )}
                          {n.status === 'draft' && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Edit2 className="w-3 h-3" /> Draft Created: {new Date(n.created_at).toLocaleDateString()}
                              </div>
                          )}
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {n.status !== 'published' && (
                          <Button variant="outline" size="sm" onClick={() => { setSelectedNotif(n); setIsPublishOpen(true); }}>
                            Publish Now
                          </Button>
                      )}
                      {n.status !== 'published' && (
                          <Button variant="secondary" size="sm" onClick={() => openEditForm(n)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => { setSelectedNotif(n); setIsDeleteOpen(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
              currentPage={paginationObj.currentPage}
              totalPages={paginationObj.totalPages}
              startIndex={paginationObj.startIndex}
              endIndex={paginationObj.endIndex}
              totalItems={paginationObj.totalItems}
              onPageChange={paginationObj.goToPage}
              onNext={paginationObj.nextPage}
              onPrev={paginationObj.prevPage}
          />
        </TableContainer>
      );
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Manage institute announcements." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Notifications' }]} />} />
        <LoadingState message="Loading notification history..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Manage institute announcements." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Notifications' }]} />} />
        <ErrorState title="Failed to load data" message="Could not fetch notifications from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Institute Announcements"
          description="Draft, schedule, and broadcast announcements to targeted roles."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Notifications' }]} />}
          actions={
            <Button variant="primary" size="sm" leftIcon={<Bell className="h-4 w-4" />} onClick={openCreateForm}>
              Draft Announcement
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
              items={[
                  { id: 'published', label: `Published (${published.length})` },
                  { id: 'scheduled', label: `Scheduled (${scheduled.length})` },
                  { id: 'draft', label: `Drafts (${drafts.length})` }
              ]}
              className="w-full border-b border-slate-800 bg-slate-900/50 p-4 pb-0"
          />
          
          <div className="p-0">
              {activeTab === 'published' && renderTable(publishedPagination.paginatedData, publishedPagination)}
              {activeTab === 'scheduled' && renderTable(scheduledPagination.paginatedData, scheduledPagination)}
              {activeTab === 'draft' && renderTable(draftsPagination.paginatedData, draftsPagination)}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Delete Notification"
        message={`Are you sure you want to permanently delete this announcement? This action cannot be undone.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />
      
      <ConfirmationDialog
        isOpen={isPublishOpen}
        title="Publish Notification"
        message={`This will immediately dispatch the announcement to the selected audience. Do you wish to proceed?`}
        confirmLabel="Publish Now"
        cancelLabel="Cancel"
        onConfirm={handlePublishConfirm}
        onClose={() => setIsPublishOpen(false)}
        variant="info"
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={isEdit ? "Edit Announcement" : "Draft Announcement"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Message Title <span className="text-red-500">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Server Maintenance Notice" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Announcement Body <span className="text-red-500">*</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Target Audience</label>
                 <Select value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
                    <option value="all">Entire Institute (All Users)</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                 </Select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Dispatch Intent</label>
                 <Select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Save as Draft</option>
                    <option value="scheduled">Schedule for Later</option>
                 </Select>
              </div>
          </div>
          
          {status === 'scheduled' && (
              <div className="space-y-1 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                 <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-indigo-400" /> Dispatch Date & Time <span className="text-red-500">*</span></label>
                 <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
              </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Announcement'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default NotificationsList;
