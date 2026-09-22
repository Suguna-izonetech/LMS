import api from './client';

export const teacherApi = {
  // File Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/teacher/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/teacher/dashboard');
    return response.data;
  },

  // Courses
  getCourses: async () => {
    const response = await api.get('/teacher/courses');
    return response.data;
  },
  createCourse: async (data: any) => {
    const response = await api.post('/teacher/courses', data);
    return response.data;
  },
  getCourse: async (id: number) => {
    const response = await api.get(`/teacher/courses/${id}`);
    return response.data;
  },
  getCourseStudents: async (id: number) => {
    const response = await api.get(`/teacher/courses/${id}/students`);
    return response.data;
  },
  getCourseActivity: async (id: number) => {
    const response = await api.get(`/teacher/courses/${id}/activity`);
    return response.data;
  },

  // Live Classes
  getLiveClasses: async (status?: string) => {
    const response = await api.get('/teacher/live-classes', { params: { status } });
    return response.data;
  },
  scheduleLiveClass: async (data: any) => {
    const response = await api.post('/teacher/live-classes', data);
    return response.data;
  },
  getLiveClass: async (id: number) => {
    const response = await api.get(`/teacher/live-classes/${id}`);
    return response.data;
  },
  updateLiveClass: async (id: number, data: any) => {
    const response = await api.put(`/teacher/live-classes/${id}`, data);
    return response.data;
  },
  cancelLiveClass: async (id: number) => {
    const response = await api.delete(`/teacher/live-classes/${id}`);
    return response.data;
  },

  // Attendance
  getClassAttendance: async (id: number) => {
    const response = await api.get(`/teacher/live-classes/${id}/attendance`);
    return response.data;
  },
  saveClassAttendance: async (id: number, records: any[]) => {
    const response = await api.post(`/teacher/live-classes/${id}/attendance`, { records });
    return response.data;
  },
  getAttendanceLog: async (params?: any) => {
    const response = await api.get('/teacher/attendance', { params });
    return response.data;
  },
  exportAttendanceUrl: (courseId?: number, batchId?: number) => {
    const query = new URLSearchParams();
    if (courseId) query.append('course_id', String(courseId));
    if (batchId) query.append('batch_id', String(batchId));
    const token = localStorage.getItem('kite_token');
    return `${api.defaults.baseURL}/teacher/attendance/export?${query.toString()}&token=${token}`;
  },
  exportAttendanceBlob: async (courseId?: number, batchId?: number) => {
    const response = await api.get('/teacher/attendance/export', {
      params: { course_id: courseId, batch_id: batchId },
      responseType: 'blob'
    });
    return response;
  },

  // Books
  getBooks: async (search?: string) => {
    const response = await api.get('/teacher/books', { params: { search } });
    return response.data;
  },
  createBook: async (data: any) => {
    const response = await api.post('/teacher/books', data);
    return response.data;
  },
  updateBook: async (id: number, data: any) => {
    const response = await api.put(`/teacher/books/${id}`, data);
    return response.data;
  },
  deleteBook: async (id: number) => {
    const response = await api.delete(`/teacher/books/${id}`);
    return response.data;
  },

  // Study Materials
  getMaterials: async (courseId?: number) => {
    const response = await api.get('/teacher/materials', { params: { course_id: courseId } });
    return response.data;
  },
  createMaterial: async (data: any) => {
    const response = await api.post('/teacher/materials', data);
    return response.data;
  },
  updateMaterial: async (id: number, data: any) => {
    const response = await api.put(`/teacher/materials/${id}`, data);
    return response.data;
  },
  deleteMaterial: async (id: number) => {
    const response = await api.delete(`/teacher/materials/${id}`);
    return response.data;
  },

  // Quizzes
  getQuizzes: async () => {
    const response = await api.get('/teacher/quizzes');
    return response.data;
  },
  createQuiz: async (data: any) => {
    const response = await api.post('/teacher/quizzes', data);
    return response.data;
  },
  getQuiz: async (id: number) => {
    const response = await api.get(`/teacher/quizzes/${id}`);
    return response.data;
  },
  updateQuiz: async (id: number, data: any) => {
    const response = await api.put(`/teacher/quizzes/${id}`, data);
    return response.data;
  },
  deleteQuiz: async (id: number) => {
    const response = await api.delete(`/teacher/quizzes/${id}`);
    return response.data;
  },
  saveQuizQuestions: async (id: number, questions: any[]) => {
    const response = await api.post(`/teacher/quizzes/${id}/questions`, questions);
    return response.data;
  },
  getQuizAttempts: async (id: number) => {
    const response = await api.get(`/teacher/quizzes/${id}/attempts`);
    return response.data;
  },

  // Tasks & Assignments
  getTasks: async () => {
    const response = await api.get('/teacher/tasks');
    return response.data;
  },
  createTask: async (data: any) => {
    const response = await api.post('/teacher/tasks', data);
    return response.data;
  },
  getTask: async (id: number) => {
    const response = await api.get(`/teacher/tasks/${id}`);
    return response.data;
  },
  updateTask: async (id: number, data: any) => {
    const response = await api.put(`/teacher/tasks/${id}`, data);
    return response.data;
  },
  deleteTask: async (id: number) => {
    const response = await api.delete(`/teacher/tasks/${id}`);
    return response.data;
  },
  getTaskSubmissions: async (id: number) => {
    const response = await api.get(`/teacher/tasks/${id}/submissions`);
    return response.data;
  },
  gradeSubmission: async (submissionId: number, data: any) => {
    const response = await api.put(`/teacher/submissions/${submissionId}`, data);
    return response.data;
  },

  // Webinars
  getWebinars: async () => {
    const response = await api.get('/teacher/webinars');
    return response.data;
  },
  createWebinar: async (data: any) => {
    const response = await api.post('/teacher/webinars', data);
    return response.data;
  },
  updateWebinar: async (id: number, data: any) => {
    const response = await api.put(`/teacher/webinars/${id}`, data);
    return response.data;
  },
  deleteWebinar: async (id: number) => {
    const response = await api.delete(`/teacher/webinars/${id}`);
    return response.data;
  },

  // Leads
  getLeads: async () => {
    const response = await api.get('/teacher/leads');
    return response.data;
  },
  getLead: async (id: number) => {
    const response = await api.get(`/teacher/leads/${id}`);
    return response.data;
  },
  addLeadFollowup: async (id: number, note: string) => {
    const response = await api.post(`/teacher/leads/${id}/followups`, { note });
    return response.data;
  },

  // Students
  getStudents: async () => {
    const response = await api.get('/teacher/students');
    return response.data;
  },
  getStudent: async (id: number) => {
    const response = await api.get(`/teacher/students/${id}`);
    return response.data;
  },
  getStudentActivity: async (id: number) => {
    const response = await api.get(`/teacher/students/${id}/activity`);
    return response.data;
  },
  getStudentAttendance: async (id: number) => {
    const response = await api.get(`/teacher/students/${id}/attendance`);
    return response.data;
  },

  // Newsfeed
  getNewsfeed: async () => {
    const response = await api.get('/teacher/newsfeed');
    return response.data;
  },
  createNewsfeedPost: async (data: any) => {
    const response = await api.post('/teacher/newsfeed', data);
    return response.data;
  },
  deleteNewsfeedPost: async (id: number) => {
    const response = await api.delete(`/teacher/newsfeed/${id}`);
    return response.data;
  },

  // Chat
  getChatContacts: async () => {
    const response = await api.get('/teacher/chat/contacts');
    return response.data;
  },
  getConversations: async () => {
    const response = await api.get('/teacher/chat/conversations');
    return response.data;
  },
  initConversation: async (recipientId: number) => {
    const response = await api.post('/teacher/chat/conversations', { recipient_id: recipientId });
    return response.data;
  },
  getMessages: async (conversationId: number) => {
    const response = await api.get(`/teacher/chat/conversations/${conversationId}/messages`);
    return response.data;
  },
  sendMessage: async (conversationId: number, messageText: string) => {
    const response = await api.post(`/teacher/chat/conversations/${conversationId}/messages`, { message_text: messageText });
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/teacher/notifications');
    return response.data;
  },
  markNotificationRead: async (id: number) => {
    const response = await api.put(`/teacher/notifications/${id}/read`);
    return response.data;
  },
  markAllNotificationsRead: async () => {
    const response = await api.put('/teacher/notifications/read-all');
    return response.data;
  },

  // Reports
  getAttendanceReport: async (courseId?: number, batchId?: number) => {
    const response = await api.get('/teacher/reports/attendance', { params: { course_id: courseId, batch_id: batchId } });
    return response.data;
  },
  getQuizReport: async (courseId?: number) => {
    const response = await api.get('/teacher/reports/quiz', { params: { course_id: courseId } });
    return response.data;
  },
  getTaskReport: async (courseId?: number) => {
    const response = await api.get('/teacher/reports/tasks', { params: { course_id: courseId } });
    return response.data;
  },
  getActivityReport: async (courseId?: number) => {
    const response = await api.get('/teacher/reports/activity', { params: { course_id: courseId } });
    return response.data;
  },
  exportQuizUrl: (courseId?: number) => {
    const query = new URLSearchParams();
    if (courseId) query.append('course_id', String(courseId));
    const token = localStorage.getItem('kite_token');
    return `${api.defaults.baseURL}/teacher/reports/quiz/export?${query.toString()}&token=${token}`;
  },
  exportQuizBlob: async (courseId?: number) => {
    const response = await api.get('/teacher/reports/quiz/export', {
      params: { course_id: courseId },
      responseType: 'blob'
    });
    return response;
  },
  exportTaskUrl: (courseId?: number) => {
    const query = new URLSearchParams();
    if (courseId) query.append('course_id', String(courseId));
    const token = localStorage.getItem('kite_token');
    return `${api.defaults.baseURL}/teacher/reports/tasks/export?${query.toString()}&token=${token}`;
  },
  exportTaskBlob: async (courseId?: number) => {
    const response = await api.get('/teacher/reports/tasks/export', {
      params: { course_id: courseId },
      responseType: 'blob'
    });
    return response;
  },
  exportActivityUrl: (courseId?: number) => {
    const query = new URLSearchParams();
    if (courseId) query.append('course_id', String(courseId));
    const token = localStorage.getItem('kite_token');
    return `${api.defaults.baseURL}/teacher/reports/activity/export?${query.toString()}&token=${token}`;
  },
  exportActivityBlob: async (courseId?: number) => {
    const response = await api.get('/teacher/reports/activity/export', {
      params: { course_id: courseId },
      responseType: 'blob'
    });
    return response;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/teacher/settings');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/teacher/settings/profile', data);
    return response.data;
  },
  changePassword: async (data: any) => {
    const response = await api.put('/teacher/settings/password', data);
    return response.data;
  },
};
