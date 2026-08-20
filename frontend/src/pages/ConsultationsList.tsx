import React, { useState, useEffect } from 'react';
import { Calendar, Search, Edit2, Trash2, Users, IndianRupee, Clock, CalendarCheck, CheckCircle2, XCircle } from 'lucide-react';
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

interface ConsultationSlot {
  id: number;
  consultation_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Consultation {
  id: number;
  title: string;
  description: string;
  consultant_id: number;
  consultant_name: string;
  duration_minutes: number;
  pricing: number;
  status: string;
  created_at: string;
  slots: ConsultationSlot[];
}

interface ConsultationBooking {
  id: number;
  slot_id: number;
  student_id: number;
  student_name: string;
  consultation_title: string;
  date: string;
  start_time: string;
  booking_status: string;
  payment_status: string;
  amount_paid: number;
  created_at: string;
}

export const ConsultationsList: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'services' | 'bookings'>('services');
  const { success, error: showError } = useToast();

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [pricing, setPricing] = useState('0');
  const [status, setStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [conRes, bookRes] = await Promise.all([
              api.get('/institute-admin/consultations'),
              api.get('/institute-admin/consultations/bookings')
          ]);
          setConsultations(conRes.data);
          setBookings(bookRes.data);
          
          if (conRes.data.length === 0 && bookRes.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load consultations');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const totalRevenue = bookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.amount_paid, 0);

  const handleDeleteConfirm = async () => {
    if (selectedConsultation) {
      try {
          await api.delete(`/institute-admin/consultations/${selectedConsultation.id}`);
          fetchData();
          success('Consultation deleted successfully');
      } catch (err) {
          showError('Failed to delete consultation');
      }
      setIsDeleteOpen(false);
      setSelectedConsultation(null);
    }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedConsultation(null);
    setTitle('');
    setDescription('');
    setDuration('30');
    setPricing('0');
    setStatus('active');
    setIsFormOpen(true);
  };

  const openEditForm = (cons: Consultation) => {
    setIsEdit(true);
    setSelectedConsultation(cons);
    setTitle(cons.title);
    setDescription(cons.description || '');
    setDuration(cons.duration_minutes.toString());
    setPricing(cons.pricing.toString());
    setStatus(cons.status);
    setIsFormOpen(true);
  };
  
  const openSlotForm = (cons: Consultation) => {
      setSelectedConsultation(cons);
      
      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      setSlotDate(today.toISOString().slice(0, 16));
      setSlotStartTime(today.toISOString().slice(0, 16));
      
      const later = new Date(today.getTime() + (cons.duration_minutes * 60 * 1000));
      setSlotEndTime(later.toISOString().slice(0, 16));
      
      setIsSlotFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || !pricing) {
        showError("Title, Duration, and Pricing are required.");
        return;
    }

    setIsSubmitting(true);
    
    // In a real app we'd query for teachers to assign. Here we use 2 (which is teacher_user in our db)
    const payload = {
        title,
        description,
        consultant_id: 2, 
        duration_minutes: parseInt(duration),
        pricing: parseFloat(pricing),
        status
    };

    try {
        if (isEdit && selectedConsultation) {
            await api.put(`/institute-admin/consultations/${selectedConsultation.id}`, payload);
        } else {
            await api.post('/institute-admin/consultations', payload);
        }
        setIsFormOpen(false);
        success(`Consultation ${isEdit ? 'updated' : 'created'} successfully`);
        fetchData();
    } catch (e) {
        showError("Failed to save consultation.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleSlotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedConsultation) return;
      
      setIsSubmitting(true);
      const payload = {
          date: new Date(slotDate).toISOString(),
          start_time: new Date(slotStartTime).toISOString(),
          end_time: new Date(slotEndTime).toISOString(),
          status: 'available'
      };
      
      try {
          await api.post(`/institute-admin/consultations/${selectedConsultation.id}/slots`, payload);
          setIsSlotFormOpen(false);
          success('Slot added successfully');
          fetchData();
      } catch (e) {
          showError("Failed to add slot.");
      } finally {
          setIsSubmitting(false);
      }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="1:1 Consultations" description="Manage private sessions and bookings." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Consultations' }]} />} />
        <LoadingState message="Loading bookings database..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="1:1 Consultations" description="Manage private sessions and bookings." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Consultations' }]} />} />
        <ErrorState title="Failed to load data" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="1:1 Consultations"
          description="Offer personal mentorship, define paid time-slots, and track revenue."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Consultations' }]} />}
          actions={
            <Button variant="primary" size="sm" leftIcon={<Users className="h-4 w-4" />} onClick={openCreateForm}>
              Create Service
            </Button>
          }
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Services</p>
              <p className="text-2xl font-bold text-slate-200">{consultations.length}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><Users className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Bookings</p>
              <p className="text-2xl font-bold text-slate-200">{bookings.length}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><CalendarCheck className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Revenue Collected</p>
              <p className="text-2xl font-bold text-slate-200">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400"><IndianRupee className="h-5 w-5" /></div>
          </CardContent>
        </Card>
      </div>

      {(() => {
          const ServicesTable = () => {
              const {
                  paginatedData,
                  currentPage,
                  totalPages,
                  startIndex,
                  endIndex,
                  totalItems,
                  goToPage,
                  nextPage,
                  prevPage
              } = usePagination({ data: consultations, itemsPerPage: 10 });

              return (
                  <TableContainer>
                    <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHeaderCell>Service & Consultant</TableHeaderCell>
                              <TableHeaderCell>Duration & Pricing</TableHeaderCell>
                              <TableHeaderCell>Available Slots</TableHeaderCell>
                              <TableHeaderCell>Status</TableHeaderCell>
                              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {consultations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        No consultation services defined yet.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.map(c => (
                              <TableRow key={c.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-200">{c.title}</span>
                                    <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{c.description}</span>
                                    <span className="text-xs text-indigo-400/80 mt-1">Host: {c.consultant_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1 text-slate-300">
                                      <div className="flex items-center gap-1.5">
                                          <Clock className="w-3 h-3 text-slate-500" />
                                          <span className="text-xs font-medium">{c.duration_minutes} mins</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <IndianRupee className="w-3 h-3 text-slate-500" />
                                          <span className="text-xs font-bold text-amber-400">₹{c.pricing.toFixed(2)}</span>
                                      </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1.5">
                                        <Badge variant="info">
                                            {c.slots.filter(s => s.status === 'available').length} Available
                                        </Badge>
                                        <Badge variant="neutral">
                                            {c.slots.filter(s => s.status === 'booked').length} Booked
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={c.status === 'active' ? 'success' : 'warning'}>
                                        {c.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button variant="secondary" size="sm" onClick={() => openSlotForm(c)}>
                                      Add Slot
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => openEditForm(c)}>
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => { setSelectedConsultation(c); setIsDeleteOpen(true); }}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            totalItems={totalItems}
                            onPageChange={goToPage}
                            onNext={nextPage}
                            onPrev={prevPage}
                        />
                      </TableContainer>
              );
          };

          const BookingsTable = () => {
              const {
                  paginatedData,
                  currentPage,
                  totalPages,
                  startIndex,
                  endIndex,
                  totalItems,
                  goToPage,
                  nextPage,
                  prevPage
              } = usePagination({ data: bookings, itemsPerPage: 10 });

              return (
                      <TableContainer>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHeaderCell>Student</TableHeaderCell>
                              <TableHeaderCell>Service Booked</TableHeaderCell>
                              <TableHeaderCell>Date & Time</TableHeaderCell>
                              <TableHeaderCell>Payment</TableHeaderCell>
                              <TableHeaderCell>Status</TableHeaderCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        No student bookings yet.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.map(b => (
                              <TableRow key={b.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-200">{b.student_name}</span>
                                    <span className="text-xs text-slate-500">Booking #{b.id}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-slate-300 font-medium text-sm">
                                    {b.consultation_title}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-slate-300">
                                      <span className="text-xs font-medium">{new Date(b.date).toLocaleDateString()}</span>
                                      <span className="text-xs font-medium text-slate-500">{new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col items-start gap-1">
                                        <Badge variant={b.payment_status === 'paid' ? 'success' : 'warning'}>
                                            {b.payment_status}
                                        </Badge>
                                        <span className="text-xs text-amber-400 font-bold">₹{b.amount_paid.toFixed(2)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {b.booking_status === 'confirmed' ? (
                                        <div className="flex items-center gap-1.5 text-emerald-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Confirmed</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-rose-400">
                                            <XCircle className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Cancelled</span>
                                        </div>
                                    )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            totalItems={totalItems}
                            onPageChange={goToPage}
                            onNext={nextPage}
                            onPrev={prevPage}
                        />
                      </TableContainer>
              );
          };

          return (
            <Card>
                <CardContent className="p-0">
                <Tabs
                    activeId={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                    items={[
                        { id: 'services', label: "Consultation Services" },
                        { id: 'bookings', label: "Student Bookings & Revenue" }
                    ]}
                    className="w-full border-b border-slate-800 bg-slate-900/50 p-4 pb-0"
                />
                <div className="p-0">
                    {activeTab === 'services' && <ServicesTable />}
                    {activeTab === 'bookings' && <BookingsTable />}
                </div>
                </CardContent>
            </Card>
          );
      })()}

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Delete Consultation Service"
        message={`Are you sure you want to delete "${selectedConsultation?.title}"? All slots and bookings will be permanently removed.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={isEdit ? "Edit Consultation" : "Create Consultation Service"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Service Title <span className="text-red-500">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 1:1 Resume Review" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Duration (Minutes) <span className="text-red-500">*</span></label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="15" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Pricing (₹) <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" value={pricing} onChange={e => setPricing(e.target.value)} min="0" />
              </div>
          </div>
          
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-300">Status</label>
             <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Active (Available for booking)</option>
                <option value="inactive">Inactive (Hidden)</option>
             </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SLOT MANAGER MODAL */}
      <Modal isOpen={isSlotFormOpen} onClose={() => setIsSlotFormOpen(false)} title={`Add Slots: ${selectedConsultation?.title}`}>
        <form onSubmit={handleSlotSubmit} className="space-y-4">
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-300">Date <span className="text-red-500">*</span></label>
             <Input type="datetime-local" value={slotDate} onChange={e => setSlotDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Start Time <span className="text-red-500">*</span></label>
                 <Input type="datetime-local" value={slotStartTime} onChange={e => setSlotStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">End Time <span className="text-red-500">*</span></label>
                 <Input type="datetime-local" value={slotEndTime} onChange={e => setSlotEndTime(e.target.value)} />
              </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsSlotFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Slot'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ConsultationsList;
