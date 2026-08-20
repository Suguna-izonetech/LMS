import React, { createContext, useContext, useState, useEffect } from 'react';

// === Interfaces ===

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'Live' | 'Prerecorded' | 'Hybrid';
  visibility: 'Public' | 'Private' | 'Unlisted';
  activeBatch: string;
  status: 'Active' | 'Inactive' | 'Draft';
  price: number;
  duration: string;
  createdAt: string;
}

export interface LiveClass {
  id: string;
  title: string;
  courseId: string;
  workspace: string;
  scheduledAt: string;
  duration: number; // in mins
  meetingLink: string;
  meetingId: string;
  passcode: string;
  status: 'Scheduled' | 'Live' | 'Conducted' | 'Cancelled';
  recordingUrl?: string;
  attendance: { studentId: string; present: boolean }[];
}

export interface Lecture {
  id: string;
  title: string;
  duration: string;
  videoName: string;
}

export interface PrerecordedModule {
  id: string;
  name: string;
  description: string;
  courseId: string;
  status: 'Draft' | 'Published';
  lectures: Lecture[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  courseId: string;
  coverUrl: string;
  fileName: string;
  fileSize: string;
  status: 'Published' | 'Unpublished';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'InstituteAdmin' | 'Teacher' | 'Student';
  status: 'Active' | 'Inactive';
  crmAccess: boolean;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  note: string;
  loggedAt: string;
  staffName: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  assignedStaffId: string;
  status: 'Inquiry' | 'Assigned' | 'Follow-up' | 'Enrolled' | 'Incomplete' | 'Closed';
  source: string;
  inquiryDate: string;
  followUps: FollowUp[];
}

export interface IntegrationSetting {
  id: string;
  name: string;
  status: 'Not Connected' | 'Configured' | 'Verified' | 'Active' | 'Service Available';
  details: Record<string, any>;
}

export interface WorkflowLog {
  id: string;
  timestamp: string;
  status: string;
  details: string;
}

export interface Workflow {
  id: string;
  name: string;
  triggerEvent: string;
  workflowStep: string;
  systemAction: string;
  userNotification: string;
  enabled: boolean;
  runCount: number;
  logs: WorkflowLog[];
}

export interface ReportHistoryItem {
  id: string;
  name: string;
  category: string;
  fileFormat: 'CSV' | 'PDF';
  fileSize: string;
  generatedAt: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: string;
  status: 'Not Purchased' | 'Active';
}

export interface Comment {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: string;
  role: string;
  category: 'Announcement' | 'Educational' | 'Community';
  content: string;
  imageUrl?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface GlobalSettings {
  whatsappOtpLogin: boolean;
  googleSignIn: boolean;
  headerLogo: string;
  zoomShareRecordings: boolean;
  minAttendancePercent: number;
  enableFeedback: boolean;
  country: string;
  timezone: string;
  allowWebsiteDownloads: boolean;
  allowAppDownloads: boolean;
  downloadableTypes: {
    studyMaterials: boolean;
    books: boolean;
    lectures: boolean;
    attachments: boolean;
    recordings: boolean;
  };
  currency: string;
  taxGstin: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  invoicePrefix: string;
  chatEnabled: boolean;
  allowDisappearingChats: boolean;
  allowMessageDeletion: boolean;
  postingPermission: 'Everyone' | 'Admin Only';
  commentsPolicy: 'Enabled' | 'Disabled';
  hideStudentInfo: boolean;
  teacherContentEdit: boolean;
}

// === Context Interface ===

export interface MockDbContextType {
  courses: Course[];
  liveClasses: LiveClass[];
  prerecordedModules: PrerecordedModule[];
  books: Book[];
  users: User[];
  leads: Lead[];
  integrations: IntegrationSetting[];
  workflows: Workflow[];
  reportHistory: ReportHistoryItem[];
  addons: Addon[];
  posts: Post[];
  messages: Message[];
  settings: GlobalSettings;
  
  // Handlers
  addCourse: (course: Omit<Course, 'id' | 'createdAt'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  
  scheduleLiveClass: (liveClass: Omit<LiveClass, 'id' | 'status' | 'attendance'>) => void;
  updateLiveClass: (id: string, updates: Partial<LiveClass>) => void;
  saveAttendance: (classId: string, attendanceList: { studentId: string; present: boolean }[]) => void;
  
  saveModule: (module: Omit<PrerecordedModule, 'id'> & { id?: string }) => void;
  deleteModule: (id: string) => void;
  
  saveBook: (book: Omit<Book, 'id'> & { id?: string }) => void;
  deleteBook: (id: string) => void;
  
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  bulkUploadUsers: (userList: Omit<User, 'id' | 'createdAt'>[]) => void;
  enrollUserOffline: (name: string, email: string, courseId: string) => void;
  
  addLead: (lead: Omit<Lead, 'id' | 'inquiryDate' | 'followUps'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  logFollowUp: (leadId: string, note: string, staffName: string) => void;
  enrollLead: (leadId: string) => void;
  
  updateIntegration: (id: string, updates: Partial<IntegrationSetting>) => void;
  verifyIntegration: (id: string) => Promise<void>;
  
  toggleWorkflow: (id: string, enabled: boolean) => void;
  simulateWorkflowTrigger: (id: string) => void;
  
  generateReport: (category: string, name: string, format: 'CSV' | 'PDF') => Promise<void>;
  deleteReport: (id: string) => void;
  
  purchaseAddon: (id: string) => Promise<void>;
  
  addPost: (content: string, category: Post['category'], imageUrl?: string) => void;
  likePost: (id: string) => void;
  addComment: (postId: string, content: string) => void;
  
  sendMessage: (receiverId: string, text: string) => void;
  
  updateSettings: (updates: Partial<GlobalSettings>) => void;
}

const MockDbContext = createContext<MockDbContextType | undefined>(undefined);

// === Database Seeding & Provider ===

export const MockDbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // Helper to load from LocalStorage
  const loadState = <T,>(key: string, defaultValue: T): T => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  };

  // Seed default data if not present
  const [courses, setCourses] = useState<Course[]>(() => loadState('kite_db_courses', [
    { id: 'c1', title: 'Full Stack Web Development', description: 'Master React, Node.js, and databases from scratch.', thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80', type: 'Hybrid', visibility: 'Public', activeBatch: 'Batch A - Morning', status: 'Active', price: 499, duration: '12 Weeks', createdAt: new Date().toISOString() },
    { id: 'c2', title: 'Data Science Core', description: 'Dive deep into statistics, python programming, and machine learning models.', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', type: 'Prerecorded', visibility: 'Public', activeBatch: 'Self Paced', status: 'Active', price: 399, duration: '8 Weeks', createdAt: new Date().toISOString() },
    { id: 'c3', title: 'Product Management Intro', description: 'Learn product roadmap planning, user research, and agile design systems.', thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80', type: 'Live', visibility: 'Private', activeBatch: 'Batch B - Evening', status: 'Active', price: 299, duration: '6 Weeks', createdAt: new Date().toISOString() },
    { id: 'c4', title: 'Digital Marketing Mastery', description: 'SEO growth strategies, Google AdWords, and Social media marketing.', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', type: 'Live', visibility: 'Public', activeBatch: 'Batch C - Weekend', status: 'Draft', price: 199, duration: '4 Weeks', createdAt: new Date().toISOString() }
  ]));

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>(() => loadState('kite_db_live_classes', [
    { id: 'lc1', title: 'Introduction to React Hooks', courseId: 'c1', workspace: 'main', scheduledAt: new Date(Date.now() + 3600000 * 2).toISOString(), duration: 90, meetingLink: 'https://zoom.us/j/987654321', meetingId: '987 654 321', passcode: '123456', status: 'Scheduled', attendance: [] },
    { id: 'lc2', title: 'Python Pandas Workshop', courseId: 'c2', workspace: 'tech', scheduledAt: new Date(Date.now() - 3600000 * 24).toISOString(), duration: 60, meetingLink: 'https://zoom.us/j/123456789', meetingId: '123 456 789', passcode: 'abcde', status: 'Conducted', recordingUrl: 'https://youtube.com/watch?v=pandas', attendance: [{ studentId: 'u4', present: true }, { studentId: 'u5', present: false }] },
    { id: 'lc3', title: 'Agile & Scrum Methodologies', courseId: 'c3', workspace: 'management', scheduledAt: new Date(Date.now() + 3600000 * 48).toISOString(), duration: 120, meetingLink: 'https://zoom.us/j/456789123', meetingId: '456 789 123', passcode: 'pwd99', status: 'Scheduled', attendance: [] }
  ]));

  const [prerecordedModules, setPrerecordedModules] = useState<PrerecordedModule[]>(() => loadState('kite_db_prerecorded', [
    { id: 'm1', name: 'Web Dev Basics: HTML & CSS', description: 'Foundational concepts of document structuring and styles.', courseId: 'c1', status: 'Published', lectures: [
      { id: 'l1', title: 'Setting up IDE and HTML Structure', duration: '12:40', videoName: '01_intro_html.mp4' },
      { id: 'l2', title: 'Flexbox Layout System Guide', duration: '22:15', videoName: '02_css_flexbox.mp4' }
    ]},
    { id: 'm2', name: 'Python Basics for Analytics', description: 'Data structures, list comprehensions, and loops.', courseId: 'c2', status: 'Published', lectures: [
      { id: 'l3', title: 'Variables and Type Definitions', duration: '15:30', videoName: '01_python_types.mp4' }
    ]}
  ]));

  const [books, setBooks] = useState<Book[]>(() => loadState('kite_db_books', [
    { id: 'b1', title: 'React Design Patterns & Best Practices', author: 'John Doe', description: 'Build modular, highly scalable web interfaces.', courseId: 'c1', coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&q=80', fileName: 'react_patterns.pdf', fileSize: '4.8 MB', status: 'Published' },
    { id: 'b2', title: 'Introduction to SQL Queries', author: 'Jane Smith', description: 'A complete beginner handbook to SQL database systems.', courseId: 'c2', coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=200&q=80', fileName: 'sql_handbook.pdf', fileSize: '3.2 MB', status: 'Published' }
  ]));

  const [users, setUsers] = useState<User[]>(() => loadState('kite_db_users', [
    { id: 'u1', name: 'Admin User', email: 'admin@kite.lms', role: 'Admin', status: 'Active', crmAccess: true, createdAt: new Date().toISOString() },
    { id: 'u2', name: 'Sarah Connor', email: 'sarah@kite.lms', role: 'Teacher', status: 'Active', crmAccess: true, createdAt: new Date().toISOString() },
    { id: 'u3', name: 'Alan Turing', email: 'alan@kite.lms', role: 'Teacher', status: 'Active', crmAccess: false, createdAt: new Date().toISOString() },
    { id: 'u4', name: 'Monik S.', email: 'monik@example.com', role: 'Student', status: 'Active', crmAccess: false, createdAt: new Date().toISOString() },
    { id: 'u5', name: 'John Doe', email: 'john@example.com', role: 'Student', status: 'Active', crmAccess: false, createdAt: new Date().toISOString() },
    { id: 'u6', name: 'Alice Liddell', email: 'alice@example.com', role: 'Student', status: 'Inactive', crmAccess: false, createdAt: new Date().toISOString() }
  ]));

  const [leads, setLeads] = useState<Lead[]>(() => loadState('kite_db_leads', [
    { id: 'ld1', name: 'Thomas Anderson', mobile: '+1 555-0199', email: 'neo@matrix.org', assignedStaffId: 'u2', status: 'Follow-up', source: 'Google Search', inquiryDate: new Date(Date.now() - 3600000 * 48).toISOString(), followUps: [
      { id: 'f1', note: 'Interested in Full Stack. Asked about batch timings.', loggedAt: new Date(Date.now() - 3600000 * 24).toISOString(), staffName: 'Sarah Connor' }
    ]},
    { id: 'ld2', name: 'Bruce Wayne', mobile: '+1 555-0120', email: '', assignedStaffId: 'u2', status: 'Incomplete', source: 'Facebook Lead', inquiryDate: new Date().toISOString(), followUps: [] },
    { id: 'ld3', name: 'Peter Parker', mobile: '+1 555-0155', email: 'spidey@bugle.com', assignedStaffId: 'u3', status: 'Inquiry', source: 'Referral', inquiryDate: new Date(Date.now() - 3600000 * 12).toISOString(), followUps: [] },
    { id: 'ld4', name: 'Tony Stark', mobile: '+1 555-0100', email: 'tony@stark.com', assignedStaffId: 'u1', status: 'Enrolled', source: 'Website Inquiry', inquiryDate: new Date(Date.now() - 3600000 * 120).toISOString(), followUps: [
      { id: 'f2', note: 'Ready to pay. Enrolled offline.', loggedAt: new Date(Date.now() - 3600000 * 96).toISOString(), staffName: 'Admin User' }
    ]}
  ]));

  const [integrations, setIntegrations] = useState<IntegrationSetting[]>(() => loadState('kite_db_integrations', [
    { id: 'email', name: 'Email Server (SMTP)', status: 'Active', details: { host: 'smtp.gmail.com', port: '587', user: 'notifications@kitelms.com' } },
    { id: 'whatsapp', name: 'WhatsApp Business API', status: 'Not Connected', details: {} },
    { id: 'razorpay', name: 'Razorpay Gateway', status: 'Active', details: { keyId: 'rzp_live_987213', secret: '********' } },
    { id: 'paypal', name: 'PayPal API', status: 'Configured', details: { clientId: 'paypal_client_98273' } }
  ]));

  const [workflows, setWorkflows] = useState<Workflow[]>(() => loadState('kite_db_workflows', [
    { id: 'w1', name: 'Lead Follow-up Automation', triggerEvent: 'Lead Status Updated to Follow-up', workflowStep: 'Check assignment rules', systemAction: 'Schedule calendar callback task', userNotification: 'Send WhatsApp reminder to staff', enabled: true, runCount: 8, logs: [] },
    { id: 'w2', name: 'Student Enrollment Automation', triggerEvent: 'Lead Status Changed to Enrolled', workflowStep: 'Verify enrollment details', systemAction: 'Create User account in database', userNotification: 'Send welcome email with credentials', enabled: true, runCount: 12, logs: [] },
    { id: 'w3', name: 'Payment Confirmation Flow', triggerEvent: 'Invoice Completed', workflowStep: 'Log financial records', systemAction: 'Generate receipts Ledger entry', userNotification: 'Send PDF invoice copy via Email', enabled: true, runCount: 22, logs: [] },
    { id: 'w4', name: 'Course Access Assignment', triggerEvent: 'Student Account Registered', workflowStep: 'Validate purchased course details', systemAction: 'Link User permissions to selected Course', userNotification: 'Push Course Start alert notification', enabled: true, runCount: 12, logs: [] },
    { id: 'w5', name: 'Notification Triggers', triggerEvent: 'Live Class Scheduled', workflowStep: 'Filter students enrolled in mapped Course', systemAction: 'Add session callback triggers', userNotification: 'Send Email warning class starting in 15m', enabled: false, runCount: 0, logs: [] },
    { id: 'w6', name: 'Certificate Issuance Rules', triggerEvent: 'Course Completion Confirmed', workflowStep: 'Check attendance & quiz grades', systemAction: 'Render PDF certificate mapping student data', userNotification: 'Send notification "Certificate Issued!"', enabled: false, runCount: 0, logs: [] },
    { id: 'w7', name: 'Communication Automation', triggerEvent: 'New Student Signed Up', workflowStep: 'Map course category', systemAction: 'Create profile tags', userNotification: 'Send introductory guide materials', enabled: true, runCount: 5, logs: [] }
  ]));

  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>(() => loadState('kite_db_reports', [
    { id: 'rep1', name: 'student_enrollments_jun26.csv', category: 'Student Enrolments', fileFormat: 'CSV', fileSize: '18.4 KB', generatedAt: new Date(Date.now() - 3600000 * 72).toISOString() },
    { id: 'rep2', name: 'financial_ledger_q2.csv', category: 'Financial Ledger', fileFormat: 'CSV', fileSize: '142.5 KB', generatedAt: new Date(Date.now() - 3600000 * 24).toISOString() }
  ]));

  const [addons, setAddons] = useState<Addon[]>(() => loadState('kite_db_addons', [
    { id: 'domain', name: 'On Domain Settings', description: 'Configure custom domains, subdomains, and WordPress embeds.', price: '$29/mo', status: 'Active' },
    { id: 'apps', name: 'Android & iOS App', description: 'White-labeled mobile applications for mobile learning.', price: '$199/mo', status: 'Not Purchased' },
    { id: 'lead_mgmt', name: 'Nrich Lead Management', description: 'Comprehensive dashboard for advanced CRM lead scoring.', price: '$49/mo', status: 'Not Purchased' },
    { id: 'whatsapp_pkg', name: 'WhatsApp integration API', description: 'Send direct WhatsApp OTP logs and announcements.', price: '$39/mo', status: 'Not Purchased' },
    { id: 'zoom_sdk', name: 'Zoom SDK Access', description: 'Host sessions natively inside your custom web player.', price: '$59/mo', status: 'Active' },
    { id: 'wordpress', name: 'WordPress Portal sync', description: 'Direct syncing plugin for WordPress sites.', price: '$19/mo', status: 'Not Purchased' }
  ]));

  const [posts, setPosts] = useState<Post[]>(() => loadState('kite_db_posts', [
    {
      id: 'p1',
      author: 'Sarah Connor',
      role: 'Teacher',
      category: 'Announcement',
      content: 'Hello everyone! Reminder that our Live Class on React Hooks starts today at 2 PM. Please ensure your IDE setups are ready.',
      likes: 8,
      likedByMe: false,
      comments: [
        { id: 'c_1', author: 'Monik S.', role: 'Student', content: 'Excited! Will be there.', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'p2',
      author: 'Alan Turing',
      role: 'Teacher',
      category: 'Educational',
      content: 'Here is a useful guide on Python Pandas fundamentals for next weeks analytics class. Review list indexing rules carefully.',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80',
      likes: 12,
      likedByMe: true,
      comments: [],
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ]));

  const [messages, setMessages] = useState<Message[]>(() => loadState('kite_db_messages', [
    { id: 'm_1', senderId: 'u2', receiverId: 'u4', text: 'Hi Monik! Have you checked the study materials for React?', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'm_2', senderId: 'u4', receiverId: 'u2', text: 'Yes, Teacher! I read the React patterns book yesterday.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'm_3', senderId: 'u2', receiverId: 'u4', text: 'Great! Let me know if you have any questions.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() }
  ]));

  const [settings, setSettings] = useState<GlobalSettings>(() => loadState('kite_db_settings', {
    whatsappOtpLogin: false,
    googleSignIn: true,
    headerLogo: '',
    zoomShareRecordings: true,
    minAttendancePercent: 80,
    enableFeedback: true,
    country: 'United States',
    timezone: 'UTC - 05:00',
    allowWebsiteDownloads: true,
    allowAppDownloads: false,
    downloadableTypes: {
      studyMaterials: true,
      books: true,
      lectures: false,
      attachments: true,
      recordings: false
    },
    currency: 'USD ($)',
    taxGstin: '27AAAAA1111A1Z1',
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    invoicePrefix: 'KTIN-',
    chatEnabled: true,
    allowDisappearingChats: false,
    allowMessageDeletion: true,
    postingPermission: 'Everyone',
    commentsPolicy: 'Enabled',
    hideStudentInfo: false,
    teacherContentEdit: true
  }));

  // Sync back to localstorage on change
  useEffect(() => { localStorage.setItem('kite_db_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('kite_db_live_classes', JSON.stringify(liveClasses)); }, [liveClasses]);
  useEffect(() => { localStorage.setItem('kite_db_prerecorded', JSON.stringify(prerecordedModules)); }, [prerecordedModules]);
  useEffect(() => { localStorage.setItem('kite_db_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('kite_db_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('kite_db_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('kite_db_integrations', JSON.stringify(integrations)); }, [integrations]);
  useEffect(() => { localStorage.setItem('kite_db_workflows', JSON.stringify(workflows)); }, [workflows]);
  useEffect(() => { localStorage.setItem('kite_db_reports', JSON.stringify(reportHistory)); }, [reportHistory]);
  useEffect(() => { localStorage.setItem('kite_db_addons', JSON.stringify(addons)); }, [addons]);
  useEffect(() => { localStorage.setItem('kite_db_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('kite_db_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('kite_db_settings', JSON.stringify(settings)); }, [settings]);

  // === Handler Implementations ===

  const addCourse = (course: Omit<Course, 'id' | 'createdAt'>) => {
    const newCourse: Course = {
      ...course,
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setCourses(prev => [...prev, newCourse]);
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const scheduleLiveClass = (liveClass: Omit<LiveClass, 'id' | 'status' | 'attendance'>) => {
    const newClass: LiveClass = {
      ...liveClass,
      id: 'lc_' + Math.random().toString(36).substr(2, 9),
      status: 'Scheduled',
      attendance: []
    };
    setLiveClasses(prev => [...prev, newClass]);
    
    // Trigger workflow event: Live Class Scheduled
    const matchingWorkflow = workflows.find(w => w.id === 'w5');
    if (matchingWorkflow && matchingWorkflow.enabled) {
      simulateWorkflowTrigger('w5');
    }
  };

  const updateLiveClass = (id: string, updates: Partial<LiveClass>) => {
    setLiveClasses(prev => prev.map(lc => lc.id === id ? { ...lc, ...updates } : lc));
  };

  const saveAttendance = (classId: string, attendanceList: { studentId: string; present: boolean }[]) => {
    setLiveClasses(prev => prev.map(lc => lc.id === classId ? { ...lc, status: 'Conducted', attendance: attendanceList } : lc));
    
    // Trigger workflow event: Attendance Checked (logs under notification triggers if desired)
  };

  const saveModule = (module: Omit<PrerecordedModule, 'id'> & { id?: string }) => {
    if (module.id) {
      setPrerecordedModules(prev => prev.map(m => m.id === module.id ? { ...m, ...module } as PrerecordedModule : m));
    } else {
      const newMod: PrerecordedModule = {
        ...module,
        id: 'm_' + Math.random().toString(36).substr(2, 9),
        lectures: module.lectures || []
      };
      setPrerecordedModules(prev => [...prev, newMod]);
    }
  };

  const deleteModule = (id: string) => {
    setPrerecordedModules(prev => prev.filter(m => m.id !== id));
  };

  const saveBook = (book: Omit<Book, 'id'> & { id?: string }) => {
    if (book.id) {
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, ...book } as Book : b));
    } else {
      const newBook: Book = {
        ...book,
        id: 'b_' + Math.random().toString(36).substr(2, 9)
      };
      setBooks(prev => [...prev, newBook]);
    }
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const bulkUploadUsers = (userList: Omit<User, 'id' | 'createdAt'>[]) => {
    const newUsers = userList.map(u => ({
      ...u,
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }));
    setUsers(prev => [...prev, ...newUsers]);
  };

  const enrollUserOffline = (name: string, email: string, courseId: string) => {
    console.log(`Enrolling student in course ID: ${courseId}`);
    // 1. Create Student user
    const studentUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: 'Student',
      status: 'Active',
      crmAccess: false,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, studentUser]);

    // 2. Log transaction
    
    // Add dynamic log trigger for workflow enrollment
    const wEnroll = workflows.find(w => w.id === 'w2');
    if (wEnroll && wEnroll.enabled) {
      simulateWorkflowTrigger('w2');
    }

    const wAccess = workflows.find(w => w.id === 'w4');
    if (wAccess && wAccess.enabled) {
      simulateWorkflowTrigger('w4');
    }

    const wPay = workflows.find(w => w.id === 'w3');
    if (wPay && wPay.enabled) {
      simulateWorkflowTrigger('w3');
    }
  };

  const addLead = (lead: Omit<Lead, 'id' | 'inquiryDate' | 'followUps'>) => {
    const newLead: Lead = {
      ...lead,
      id: 'ld_' + Math.random().toString(36).substr(2, 9),
      inquiryDate: new Date().toISOString(),
      followUps: []
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const logFollowUp = (leadId: string, note: string, staffName: string) => {
    const newFollowUp: FollowUp = {
      id: 'f_' + Math.random().toString(36).substr(2, 9),
      note,
      loggedAt: new Date().toISOString(),
      staffName
    };
    
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: 'Follow-up',
          followUps: [...l.followUps, newFollowUp]
        };
      }
      return l;
    }));

    // Trigger workflow event: Lead Follow-up Automation
    const matchingWorkflow = workflows.find(w => w.id === 'w1');
    if (matchingWorkflow && matchingWorkflow.enabled) {
      simulateWorkflowTrigger('w1');
    }
  };

  const enrollLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // 1. Update lead status to Enrolled
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'Enrolled' } : l));

    // 2. Perform offline user creation & transaction logging
    enrollUserOffline(lead.name, lead.email || (lead.name.toLowerCase().replace(' ', '') + '@example.com'), 'c1');
  };

  const updateIntegration = (id: string, updates: Partial<IntegrationSetting>) => {
    setIntegrations(prev => prev.map(int => int.id === id ? { ...int, ...updates } : int));
  };

  const verifyIntegration = async (id: string) => {
    updateIntegration(id, { status: 'Configured' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateIntegration(id, { status: 'Verified' });
  };

  const toggleWorkflow = (id: string, enabled: boolean) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled } : w));
  };

  const simulateWorkflowTrigger = (id: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: WorkflowLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp,
      status: 'Success',
      details: 'Automation process chain finished.'
    };

    setWorkflows(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          runCount: w.runCount + 1,
          logs: [newLog, ...w.logs].slice(0, 10) // keep last 10 logs
        };
      }
      return w;
    }));
  };

  const generateReport = async (category: string, name: string, format: 'CSV' | 'PDF') => {
    const newReport: ReportHistoryItem = {
      id: 'rep_' + Math.random().toString(36).substr(2, 9),
      name,
      category,
      fileFormat: format,
      fileSize: (10 + Math.random() * 200).toFixed(1) + ' KB',
      generatedAt: new Date().toISOString()
    };
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setReportHistory(prev => [newReport, ...prev]);
  };

  const deleteReport = (id: string) => {
    setReportHistory(prev => prev.filter(rep => rep.id !== id));
  };

  const purchaseAddon = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAddons(prev => prev.map(ad => ad.id === id ? { ...ad, status: 'Active' } : ad));
  };

  const addPost = (content: string, category: Post['category'], imageUrl?: string) => {
    const newPost: Post = {
      id: 'p_' + Math.random().toString(36).substr(2, 9),
      author: 'Admin User',
      role: 'Admin',
      category,
      content,
      imageUrl,
      likes: 0,
      likedByMe: false,
      comments: [],
      createdAt: new Date().toISOString()
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const likePost = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
          likedByMe: !p.likedByMe
        };
      }
      return p;
    }));
  };

  const addComment = (postId: string, content: string) => {
    const newComment: Comment = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      author: 'Admin User',
      role: 'Admin',
      content,
      createdAt: new Date().toISOString()
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));
  };

  const sendMessage = (receiverId: string, text: string) => {
    const newMsg: Message = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      senderId: 'u1', // Admin is sender
      receiverId,
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    // Simulated Auto-Reply
    setTimeout(() => {
      const recipient = users.find(u => u.id === receiverId);
      const replyMsg: Message = {
        id: 'm_' + Math.random().toString(36).substr(2, 9),
        senderId: receiverId,
        receiverId: 'u1',
        text: `Hey, this is ${recipient ? recipient.name : 'User'}. I received your message: "${text.substring(0, 15)}..." and will get back to you shortly!`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1500);
  };

  const updateSettings = (updates: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <MockDbContext.Provider
      value={{
        courses,
        liveClasses,
        prerecordedModules,
        books,
        users,
        leads,
        integrations,
        workflows,
        reportHistory,
        addons,
        posts,
        messages,
        settings,
        
        addCourse,
        updateCourse,
        deleteCourse,
        scheduleLiveClass,
        updateLiveClass,
        saveAttendance,
        saveModule,
        deleteModule,
        saveBook,
        deleteBook,
        addUser,
        updateUser,
        bulkUploadUsers,
        enrollUserOffline,
        addLead,
        updateLead,
        logFollowUp,
        enrollLead,
        updateIntegration,
        verifyIntegration,
        toggleWorkflow,
        simulateWorkflowTrigger,
        generateReport,
        deleteReport,
        purchaseAddon,
        addPost,
        likePost,
        addComment,
        sendMessage,
        updateSettings
      }}
    >
      {children}
    </MockDbContext.Provider>
  );
};

export const useMockDb = () => {
  const context = useContext(MockDbContext);
  if (!context) {
    throw new Error('useMockDb must be used within a MockDbProvider');
  }
  return context;
};
export default MockDbContext;
