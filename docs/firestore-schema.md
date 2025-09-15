# TutorConnect Firestore Data Structure

This document outlines the Firestore NoSQL database structure for the TutorConnect tutoring platform. This is an alternative to the PostgreSQL schema for teams preferring Firebase's ecosystem.

## Overview

Firebase Firestore is a NoSQL document database that organizes data into collections and documents. Unlike relational databases, Firestore requires data denormalization for optimal performance and supports real-time synchronization out of the box.

## Collections Structure

### 1. Users Collection

**Path:** `users/{userId}`

```javascript
{
  id: "user_123abc",
  email: "student@example.com",
  role: "student", // "student" | "tutor" | "admin"
  isActive: true,
  emailVerified: false,
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp,
  
  // Profile data (denormalized for performance)
  profile: {
    firstName: "Alice",
    lastName: "Johnson",
    phone: "+1234567890",
    avatarUrl: "https://images.unsplash.com/...",
    bio: "Computer Science student interested in algorithms and web development",
    location: "New York, NY",
    timezone: "America/New_York",
    joinedDate: "2024-01-15"
  },
  
  // User preferences
  preferences: {
    notifications: {
      email: true,
      push: true,
      sessions: true,
      messages: true
    },
    privacy: {
      showEmail: false,
      showPhone: false,
      profileVisibility: "public"
    }
  }
}
```

### 2. Tutor Profiles Collection

**Path:** `tutorProfiles/{userId}`

```javascript
{
  userId: "user_456def",
  hourlyRate: 45.00,
  experience: "5+ years",
  education: "BS Computer Science, Stanford University",
  languages: ["English", "Spanish"],
  rating: 4.8,
  totalReviews: 23,
  totalSessions: 156,
  responseTime: "< 1 hour",
  verified: true,
  teachingStyle: "Hands-on coding with real-world projects",
  specializations: ["Web Development", "API Design", "Database Management"],
  isAcceptingStudents: true,
  
  // Subjects with individual rates (denormalized)
  subjects: [
    {
      name: "JavaScript",
      rate: 45.00,
      isActive: true
    },
    {
      name: "React",
      rate: 50.00,
      isActive: true
    },
    {
      name: "Node.js",
      rate: 48.00,
      isActive: true
    }
  ],
  
  // Basic availability (simplified)
  availability: {
    timezone: "America/Los_Angeles",
    generalSchedule: "Most weekdays 9 AM - 6 PM",
    bufferTime: 15 // minutes between sessions
  },
  
  // Statistics for quick access
  stats: {
    thisMonthSessions: 12,
    thisMonthEarnings: 540.00,
    averageSessionDuration: 75,
    responseRate: 0.98
  },
  
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 3. Tutor Search Index Collection

**Path:** `tutorSearchIndex/{tutorId}`

This collection is optimized for tutor discovery and filtering:

```javascript
{
  tutorId: "user_456def",
  
  // Denormalized user data for search
  name: "Bob Smith",
  firstName: "Bob",
  lastName: "Smith",
  avatarUrl: "https://images.unsplash.com/...",
  
  // Search-optimized fields
  subjects: ["JavaScript", "React", "Node.js", "Full-Stack Development"],
  subjectsLower: ["javascript", "react", "node.js", "full-stack development"], // For case-insensitive search
  minRate: 45.00,
  maxRate: 55.00,
  rating: 4.8,
  totalReviews: 23,
  location: "San Francisco, CA",
  locationLower: "san francisco, ca",
  verified: true,
  isAcceptingStudents: true,
  responseTime: "< 1 hour",
  experience: "5+ years",
  
  // For filtering
  languages: ["English", "Spanish"],
  specializations: ["Web Development", "API Design"],
  
  // Metadata
  lastActive: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 4. Sessions Collection

**Path:** `sessions/{sessionId}`

```javascript
{
  id: "session_789ghi",
  studentId: "user_123abc",
  tutorId: "user_456def",
  subject: "React Development",
  status: "completed", // "pending" | "scheduled" | "completed" | "cancelled"
  scheduledStart: Firebase.Timestamp,
  scheduledEnd: Firebase.Timestamp,
  durationMinutes: 60,
  price: 45.00,
  meetingLink: "https://zoom.us/j/123456789",
  notes: "Focus on component lifecycle and hooks",
  
  // Denormalized user data for easy display
  student: {
    id: "user_123abc",
    name: "Alice Johnson",
    firstName: "Alice",
    lastName: "Johnson",
    avatar: "https://images.unsplash.com/...",
    email: "student@example.com"
  },
  tutor: {
    id: "user_456def",
    name: "Bob Smith",
    firstName: "Bob",
    lastName: "Smith",
    avatar: "https://images.unsplash.com/...",
    email: "tutor@example.com"
  },
  
  // Feedback (embedded for simplicity)
  feedback: {
    studentRating: 5,
    tutorRating: 5,
    studentComment: "Excellent explanation of React hooks!",
    tutorComment: "Alice is a quick learner, great questions!",
    studentFeedbackAt: Firebase.Timestamp,
    tutorFeedbackAt: Firebase.Timestamp
  },
  
  // Cancellation info (if applicable)
  cancellationReason: null,
  cancelledBy: null,
  cancelledAt: null,
  refundAmount: null,
  
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 5. Tasks Collection

**Path:** `tasks/{taskId}`

```javascript
{
  id: "task_101jkl",
  userId: "user_123abc",
  title: "Complete React Router tutorial",
  description: "Go through the official React Router documentation and build a small multi-page app",
  category: "Web Development",
  priority: "high", // "low" | "medium" | "high"
  status: "in-progress", // "pending" | "in-progress" | "completed"
  progress: 65, // 0-100
  dueDate: "2024-09-18", // ISO date string
  tags: ["React", "Frontend", "Tutorial"],
  estimatedHours: 4,
  actualHours: 2.5,
  
  // Completion tracking
  completedAt: null, // Firebase.Timestamp when completed
  
  // Optional session linking
  relatedSessionId: null,
  
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 6. Calendar Events Collection

**Path:** `calendarEvents/{eventId}`

```javascript
{
  id: "event_202mno",
  userId: "user_123abc",
  title: "React Tutoring Session",
  description: "One-on-one React development session with Bob",
  type: "session", // "session" | "exam" | "deadline" | "study-group" | "personal"
  startAt: Firebase.Timestamp,
  endAt: Firebase.Timestamp,
  location: "Online - Zoom",
  color: "#3B82F6",
  allDay: false,
  
  // Reminders array
  reminders: [
    { type: "email", minutes: 60 },
    { type: "push", minutes: 15 }
  ],
  
  // Recurrence settings
  recurring: false,
  recurringPattern: null, // "daily" | "weekly" | "monthly" | "yearly"
  recurringEndDate: null,
  
  // Related entities
  relatedTaskId: null,
  relatedSessionId: "session_789ghi",
  
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 7. Conversations Collection

**Path:** `conversations/{conversationId}`

```javascript
{
  id: "conv_303pqr",
  type: "direct", // "direct" | "session" | "group"
  title: null, // Usually null for direct messages
  lastMessageAt: Firebase.Timestamp,
  
  // Participants with denormalized data
  participants: {
    "user_123abc": {
      id: "user_123abc",
      name: "Alice Johnson",
      firstName: "Alice",
      lastName: "Johnson",
      avatar: "https://images.unsplash.com/...",
      role: "student",
      lastReadAt: Firebase.Timestamp,
      joinedAt: Firebase.Timestamp,
      isActive: true
    },
    "user_456def": {
      id: "user_456def",
      name: "Bob Smith",
      firstName: "Bob",
      lastName: "Smith",
      avatar: "https://images.unsplash.com/...",
      role: "tutor",
      lastReadAt: Firebase.Timestamp,
      joinedAt: Firebase.Timestamp,
      isActive: true
    }
  },
  
  // Conversation metadata
  participantIds: ["user_123abc", "user_456def"], // For queries
  participantCount: 2,
  
  // Related session (if applicable)
  relatedSessionId: null,
  
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 8. Messages Subcollection

**Path:** `conversations/{conversationId}/messages/{messageId}`

```javascript
{
  id: "msg_404stu",
  senderId: "user_123abc",
  
  // Denormalized sender info
  senderName: "Alice Johnson",
  senderAvatar: "https://images.unsplash.com/...",
  senderRole: "student",
  
  content: "Hi Bob! Thanks for the great React session yesterday.",
  type: "text", // "text" | "system"
  
  // Message features
  edited: false,
  editedAt: null,
  replyToId: null, // Reference to another message
  
  // Read receipts (simple version)
  readBy: {
    "user_123abc": Firebase.Timestamp, // Sender auto-read
    "user_456def": Firebase.Timestamp  // When recipient read it
  },
  
  createdAt: Firebase.Timestamp
}
```

### 9. Admin Announcements Collection

**Path:** `adminAnnouncements/{announcementId}`

```javascript
{
  id: "ann_505vwx",
  title: "Platform Maintenance Scheduled",
  content: "We will be performing scheduled maintenance on Sunday, January 21st from 2:00 AM to 4:00 AM EST. During this time, the platform may be temporarily unavailable.",
  priority: "high", // "low" | "medium" | "high"
  status: "published", // "draft" | "published" | "archived"
  audience: "all", // "all" | "students" | "tutors" | "admins"
  
  // Author info (denormalized)
  authorUserId: "admin_001",
  authorName: "System Admin",
  
  // Publishing info
  publishedAt: Firebase.Timestamp,
  expiresAt: Firebase.Timestamp,
  
  // Engagement metrics
  viewCount: 1247,
  viewedBy: ["user_123abc", "user_456def"], // Array of user IDs who viewed
  
  // Tags for categorization
  tags: ["maintenance", "system"],
  
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

### 10. User Stats Collection (Optional)

**Path:** `userStats/{userId}`

For analytics and dashboard displays:

```javascript
{
  userId: "user_456def",
  role: "tutor",
  
  // Session statistics
  totalSessions: 156,
  completedSessions: 142,
  cancelledSessions: 6,
  
  // Financial statistics (for tutors)
  totalEarnings: 7020.00,
  thisMonthEarnings: 540.00,
  averageSessionPrice: 47.50,
  
  // Performance metrics
  averageRating: 4.8,
  responseRate: 0.98,
  onTimeRate: 0.95,
  
  // Time-based stats
  thisWeekSessions: 3,
  thisMonthSessions: 12,
  lastSessionAt: Firebase.Timestamp,
  
  // For students
  studyHours: 45.5,
  completedTasks: 12,
  upcomingSessions: 2,
  
  updatedAt: Firebase.Timestamp
}
```

### 11. AI Interaction Logs Collection (Optional)

**Path:** `aiLogs/{logId}`

```javascript
{
  id: "ai_606yza",
  userId: "user_123abc",
  query: "How do I book a tutoring session?",
  response: "To book a tutoring session: 1) Go to 'Find Tutors', 2) Browse available tutors...",
  helpful: true, // User feedback
  category: "platform", // "platform" | "study-help" | "subject-help"
  sessionId: "ai_session_789", // For tracking conversation flow
  responseTimeMs: 245,
  createdAt: Firebase.Timestamp
}
```

## Security Rules

Here are sample Firestore security rules for the collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tutor profiles are publicly readable, writable by owner
    match /tutorProfiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tutor search index is publicly readable
    match /tutorSearchIndex/{tutorId} {
      allow read: if true;
      allow write: if false; // Only updated by Cloud Functions
    }
    
    // Sessions are readable by participants
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.studentId || 
         request.auth.uid == resource.data.tutorId);
    }
    
    // Tasks are private to the user
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Calendar events are private to the user
    match /calendarEvents/{eventId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Conversations are readable by participants
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
      
      // Messages within conversations
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
      }
    }
    
    // Admin announcements are publicly readable
    match /adminAnnouncements/{announcementId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Queries and Indexing

### Common Queries

1. **Find tutors by subject:**

```javascript
db.collection('tutorSearchIndex')
  .where('subjects', 'array-contains', 'JavaScript')
  .where('isAcceptingStudents', '==', true)
  .orderBy('rating', 'desc')
  .limit(10)
```

2. **Get user's upcoming sessions:**

```javascript
db.collection('sessions')
  .where('studentId', '==', userId)
  .where('status', '==', 'scheduled')
  .where('scheduledStart', '>', new Date())
  .orderBy('scheduledStart')
```

3. **Get conversation messages (real-time):**

```javascript
db.collection('conversations')
  .doc(conversationId)
  .collection('messages')
  .orderBy('createdAt')
  .onSnapshot(callback)
```

### Required Composite Indexes

These indexes need to be created in the Firebase Console:

1. `tutorSearchIndex`: `subjects` (array) + `isAcceptingStudents` (ascending) + `rating` (descending)
2. `sessions`: `studentId` (ascending) + `status` (ascending) + `scheduledStart` (ascending)
3. `sessions`: `tutorId` (ascending) + `status` (ascending) + `scheduledStart` (ascending)
4. `tasks`: `userId` (ascending) + `status` (ascending) + `dueDate` (ascending)
5. `calendarEvents`: `userId` (ascending) + `startAt` (ascending)

## Migration Strategy

When moving from mock data to Firestore:

1. **Phase 1:** Set up Firebase project and collections
2. **Phase 2:** Create seed data script to populate initial users/tutors
3. **Phase 3:** Update React components to use Firebase SDK
4. **Phase 4:** Implement real-time listeners
5. **Phase 5:** Add Cloud Functions for business logic
6. **Phase 6:** Set up proper security rules

## Limitations and Considerations

### Firestore Limitations

- **Query limitations:** Cannot filter by multiple array fields simultaneously
- **Transaction limitations:** Cannot span multiple documents efficiently
- **Cost:** Scales with read/write operations
- **Offline support:** Built-in but requires careful data structure planning

### Workarounds

- **Denormalize data** for better query performance
- **Use Cloud Functions** for complex business logic
- **Implement search indexes** for complex filtering
- **Cache frequently accessed data** in user documents

## Cloud Functions Integration

Key Cloud Functions needed:

1. **onUserCreate:** Create corresponding documents in other collections
2. **onSessionComplete:** Update tutor ratings and user statistics
3. **onMessageCreate:** Send push notifications and update conversation metadata
4. **searchTutors:** Advanced search functionality beyond Firestore's capabilities
5. **generateReports:** Aggregate data for analytics dashboards

This Firestore structure provides a solid foundation for the TutorConnect platform with real-time capabilities and good performance characteristics for a tutoring application.
