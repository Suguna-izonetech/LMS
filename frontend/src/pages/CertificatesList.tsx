import React, { useState, useEffect } from 'react';
import { Award, Edit2, Trash2, CheckCircle2, XCircle, Search, LayoutTemplate, Send, Clock } from 'lucide-react';
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

interface CertificateTemplate {
  id: number;
  name: string;
  title: string;
  body_text: string;
  layout: string;
  status: string;
}

interface CertificateRecord {
  id: number;
  student_name: string;
  course_name: string;
  template_name: string;
  issue_date: string;
  certificate_number: string;
  status: string;
}

export const CertificatesList: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [records, setRecords] = useState<CertificateRecord[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'tracking' | 'templates'>('tracking');
  const { success, error: showError } = useToast();

  // Modal States
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  
  // Data Options for Issue Form
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Template Form Fields
  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateLayout, setTemplateLayout] = useState('standard');
  const [templateStatus, setTemplateStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issue Form Fields
  const [issueStudent, setIssueStudent] = useState('');
  const [issueCourse, setIssueCourse] = useState('');
  const [issueTemplate, setIssueTemplate] = useState('');

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [tempRes, recRes, stuRes, crsRes] = await Promise.all([
              api.get('/institute-admin/certificates/templates'),
              api.get('/institute-admin/certificates/records'),
              api.get('/institute-admin/users?role=student'),
              api.get('/institute-admin/courses')
          ]);
          setTemplates(tempRes.data);
          setRecords(recRes.data);
          setStudents(stuRes.data);
          setCourses(crsRes.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load certificates module");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const openTemplateForm = (t?: CertificateTemplate) => {
      if (t) {
          setSelectedTemplate(t);
          setTemplateName(t.name);
          setTemplateTitle(t.title);
          setTemplateBody(t.body_text);
          setTemplateLayout(t.layout);
          setTemplateStatus(t.status);
      } else {
          setSelectedTemplate(null);
          setTemplateName('');
          setTemplateTitle('');
          setTemplateBody('');
          setTemplateLayout('standard');
          setTemplateStatus('active');
      }
      setIsTemplateFormOpen(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || !templateTitle || !templateBody) {
        showError("Please fill all required template fields.");
        return;
    }

    setIsSubmitting(true);
    
    const payload = {
        name: templateName,
        title: templateTitle,
        body_text: templateBody,
        layout: templateLayout,
        status: templateStatus
    };

    try {
        if (selectedTemplate) {
            await api.put(`/institute-admin/certificates/templates/${selectedTemplate.id}`, payload);
        } else {
            await api.post('/institute-admin/certificates/templates', payload);
        }
        setIsTemplateFormOpen(false);
        success(`Template ${selectedTemplate ? 'updated' : 'created'} successfully`);
        fetchData();
    } catch (e: any) {
        showError(e.response?.data?.detail || "Failed to save template.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleIssueSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!issueStudent || !issueCourse || !issueTemplate) {
          showError("Please select a student, course, and template.");
          return;
      }
      
      setIsSubmitting(true);
      try {
          await api.post('/institute-admin/certificates/records', {
              student_id: parseInt(issueStudent),
              course_id: parseInt(issueCourse),
              template_id: parseInt(issueTemplate),
              status: "issued"
          });
          setIsIssueFormOpen(false);
          setIssueStudent('');
          setIssueCourse('');
          setIssueTemplate('');
          success("Certificate issued successfully");
          fetchData();
      } catch (e: any) {
          showError(e.response?.data?.detail || "Failed to issue certificate.");
      } finally {
          setIsSubmitting(false);
      }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Certificates" description="Manage templates and issuances." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Certificates' }]} />} />
        <LoadingState message="Loading certificate module..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Certificates" description="Manage templates and issuances." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Certificates' }]} />} />
        <ErrorState title="Failed to load module" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Certificate Manager"
          description="Design custom templates and issue verifiable certificates to students."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Certificates' }]} />}
          actions={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openTemplateForm()} leftIcon={<LayoutTemplate className="w-4 h-4" />}>
                  New Template
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsIssueFormOpen(true)} leftIcon={<Award className="w-4 h-4" />}>
                  Issue Certificate
                </Button>
              </div>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
              items={[
                  { id: 'tracking', label: `Issuance & Tracking (${records.length})` },
                  { id: 'templates', label: `Certificate Templates (${templates.length})` }
              ]}
              className="w-full border-b border-slate-800 bg-slate-900/50 p-4 pb-0"
          />
          
          <div className="p-0">
            {activeTab === 'tracking' && (
                <>
                  {records.length === 0 ? (
                        <EmptyState title="No Certificates Issued" description="You have not issued any certificates yet." icon={<Award className="w-12 h-12 text-slate-700" />} />
                    ) : (() => {
                          const {
                            paginatedData: paginatedRecords,
                            currentPage: recordsPage,
                            totalPages: recordsTotalPages,
                            startIndex: recordsStartIndex,
                            endIndex: recordsEndIndex,
                            totalItems: recordsTotalItems,
                            goToPage: goToRecordsPage,
                            nextPage: nextRecordsPage,
                            prevPage: prevRecordsPage
                          } = usePagination({ data: records, itemsPerPage: 10 });

                          return (
                        <TableContainer>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Certificate Data</TableHeaderCell>
                                <TableHeaderCell>Student & Course</TableHeaderCell>
                                <TableHeaderCell>Template Used</TableHeaderCell>
                                <TableHeaderCell className="text-right">Status</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedRecords.map(r => (
                                <TableRow key={r.id}>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-mono text-xs text-indigo-400 font-bold">{r.certificate_number}</span>
                                      <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> Issued: {new Date(r.issue_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-200">{r.student_name}</span>
                                      <span className="text-xs text-slate-500">{r.course_name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant="neutral" className="bg-slate-800 border-slate-700">
                                          {r.template_name}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      {r.status === 'issued' ? (
                                          <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Valid
                                          </Badge>
                                      ) : (
                                          <Badge variant="danger" className="bg-rose-500/10 text-rose-400 border-rose-500/20">
                                              <XCircle className="w-3 h-3 mr-1 inline" /> {r.status}
                                          </Badge>
                                      )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <Pagination
                              currentPage={recordsPage}
                              totalPages={recordsTotalPages}
                              startIndex={recordsStartIndex}
                              endIndex={recordsEndIndex}
                              totalItems={recordsTotalItems}
                              onPageChange={goToRecordsPage}
                              onNext={nextRecordsPage}
                              onPrev={prevRecordsPage}
                          />
                        </TableContainer>
                          );
                        })()
                    }
                        </>
                    )}
            
            {activeTab === 'templates' && (
                <>
                  {templates.length === 0 ? (
                        <EmptyState title="No Templates" description="Create a certificate template to start issuing them to students." icon={<LayoutTemplate className="w-12 h-12 text-slate-700" />} />
                    ) : (() => {
                          const {
                            paginatedData: paginatedTemplates,
                            currentPage: templatesPage,
                            totalPages: templatesTotalPages,
                            startIndex: templatesStartIndex,
                            endIndex: templatesEndIndex,
                            totalItems: templatesTotalItems,
                            goToPage: goToTemplatesPage,
                            nextPage: nextTemplatesPage,
                            prevPage: prevTemplatesPage
                          } = usePagination({ data: templates, itemsPerPage: 10 });

                          return (
                        <TableContainer>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Template Design</TableHeaderCell>
                                <TableHeaderCell>Layout Style</TableHeaderCell>
                                <TableHeaderCell>Status</TableHeaderCell>
                                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedTemplates.map(t => (
                                <TableRow key={t.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                        <Award className="w-5 h-5" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-slate-200">{t.name}</span>
                                        <span className="text-xs text-slate-500">{t.title}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">{t.layout}</span>
                                  </TableCell>
                                  <TableCell>
                                      {t.status === 'active' ? (
                                          <Badge variant="success">Active</Badge>
                                      ) : (
                                          <Badge variant="neutral">Inactive</Badge>
                                      )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="secondary" size="sm" onClick={() => openTemplateForm(t)}>
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <Pagination
                              currentPage={templatesPage}
                              totalPages={templatesTotalPages}
                              startIndex={templatesStartIndex}
                              endIndex={templatesEndIndex}
                              totalItems={templatesTotalItems}
                              onPageChange={goToTemplatesPage}
                              onNext={nextTemplatesPage}
                              onPrev={prevTemplatesPage}
                          />
                        </TableContainer>
                          );
                        })()
                    }
                        </>
                    )}
          </div>
        </CardContent>
      </Card>

      {/* TEMPLATE BUILDER MODAL */}
      <Modal isOpen={isTemplateFormOpen} onClose={() => setIsTemplateFormOpen(false)} title={selectedTemplate ? "Edit Template" : "Design Certificate Template"} size="lg">
        <form onSubmit={handleTemplateSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Internal Template Name <span className="text-red-500">*</span></label>
            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Standard Web Dev Completion" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Certificate Display Title <span className="text-red-500">*</span></label>
            <Input value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} placeholder="e.g. Certificate of Excellence" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Certificate Body Text <span className="text-red-500">*</span></label>
            <textarea value={templateBody} onChange={e => setTemplateBody(e.target.value)} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" placeholder="This is to certify that [Student Name] has successfully completed..." />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Layout Format</label>
                 <Select value={templateLayout} onChange={e => setTemplateLayout(e.target.value)}>
                    <option value="standard">Standard Landscape</option>
                    <option value="modern">Modern Portrait</option>
                 </Select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Status</label>
                 <Select value={templateStatus} onChange={e => setTemplateStatus(e.target.value)}>
                    <option value="active">Active (Available to Issue)</option>
                    <option value="inactive">Inactive</option>
                 </Select>
              </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsTemplateFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Template'}</Button>
          </div>
        </form>
      </Modal>
      
      {/* ISSUE CERTIFICATE MODAL */}
      <Modal isOpen={isIssueFormOpen} onClose={() => setIsIssueFormOpen(false)} title="Issue Certificate to Student">
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Select Student <span className="text-red-500">*</span></label>
            <Select value={issueStudent} onChange={e => setIssueStudent(e.target.value)}>
                <option value="">-- Choose Student --</option>
                {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Select Course Program <span className="text-red-500">*</span></label>
            <Select value={issueCourse} onChange={e => setIssueCourse(e.target.value)}>
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                ))}
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Select Certificate Template <span className="text-red-500">*</span></label>
            <Select value={issueTemplate} onChange={e => setIssueTemplate(e.target.value)}>
                <option value="">-- Choose Template --</option>
                {templates.filter(t => t.status === 'active').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsIssueFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" leftIcon={<Send className="w-4 h-4" />} disabled={isSubmitting}>
                {isSubmitting ? 'Generating...' : 'Issue & Generate Certificate'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default CertificatesList;
