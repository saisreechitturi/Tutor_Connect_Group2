# TutorConnect - Pending Tasks

## Priority 1: Critical Fixes

### Backend Critical Issues
- [ ] **FIX: payments.js expressQuery undefined error (Line 424-428)**
  - Issue: `expressQuery` is used incorrectly, should be `query` from express-validator
  - Impact: Server crashes when accessing payment endpoints
  - Location: `backend/src/routes/payments.js` lines 424-428
  - Status: BLOCKING - Server cannot run with this error

## Priority 2: Frontend Authentication Improvements

### Login Page (Login.js)
- [x] ✓ Wrong password alert already implemented (lines 70-84)
- [x] ✓ Email validation already implemented (lines 35-42)
- [x] ✓ Password validation already implemented (lines 43-50)
- [x] ✓ Forgot password link already present (line 185-190)

### Signup Page (Signup.js)
- [x] ✓ Comprehensive validation already implemented
- [x] ✓ Email validation with regex (lines 50-55)
- [x] ✓ Password strength requirements (lines 62-69)
- [x] ✓ Password confirmation check (lines 76-79)
- [ ] Consider: Add real-time password strength indicator feedback

### Forgot Password Page (ForgotPassword.js)
- [x] ✓ Email validation already implemented (lines 19-35)
- [x] ✓ User-friendly error messages (lines 46-58)
- [x] ✓ Success message display (lines 42-44)
- [ ] Consider: Add link to login page if user remembers password

### Reset Password Page (ResetPassword.js)
- [x] ✓ Token validation implemented (lines 24-29)
- [x] ✓ Password validation implemented (lines 39-74)
- [ ] **ADD: Forgot password link** - Add link to request new reset if token expired
- [ ] Consider: Add password strength meter visual feedback

## Priority 3: Tutor Features - Backend Integration

### Tutor Analytics
- [ ] **Connect TutorAnalytics page to backend API**
  - Current: Uses mock data (TutorAnalytics.js)
  - Backend: `/api/analytics/dashboard/:tutorId` endpoint exists
  - Tasks:
    - [ ] Create analytics API service in frontend
    - [ ] Replace mock data with API calls
    - [ ] Add loading states
    - [ ] Add error handling
    - [ ] Test with real data

### Tutor Availability Management
- [ ] **Implement availability management UI**
  - Backend: `/api/availability/:tutorId` endpoints exist
  - Tasks:
    - [ ] Create availability management component
    - [ ] Implement recurring slots UI
    - [ ] Implement specific date overrides
    - [ ] Connect to backend API
    - [ ] Add calendar view for availability

### Tutor Payments/Earnings
- [ ] **Implement earnings tracking**
  - Backend: Payment endpoints need fixing first
  - Tasks:
    - [ ] Fix payments.js expressQuery error (Priority 1)
    - [ ] Create earnings history component
    - [ ] Display earnings breakdown
    - [ ] Show payment status (pending/available/withdrawn)
    - [ ] Add withdrawal request functionality

### Tutor Student Progress Tracking
- [ ] **Implement student progress tracking**
  - Backend: Tables exist (student_progress_tracking)
  - Tasks:
    - [ ] Create progress tracking component
    - [ ] Implement session notes/feedback form
    - [ ] Track comprehension and engagement levels
    - [ ] Set goals and improvement areas
    - [ ] View historical progress data

## Priority 4: Student Features - Backend Integration

### Student Payment History
- [ ] **Implement payment history view**
  - Tasks:
    - [ ] Create payment history component
    - [ ] List all transactions
    - [ ] Show payment status
    - [ ] Add filters (date, status, amount)
    - [ ] Download receipts/invoices

### Student Session Booking with Payment
- [ ] **Integrate payment flow with booking**
  - Tasks:
    - [ ] Add payment step to booking flow
    - [ ] Integrate with mock payment providers
    - [ ] Handle payment success/failure
    - [ ] Send confirmation emails
    - [ ] Update session status based on payment

### Student Progress View
- [ ] **Implement student progress dashboard**
  - Tasks:
    - [ ] Display progress tracked by tutors
    - [ ] Show comprehension/engagement trends
    - [ ] Display goals and achievements
    - [ ] View tutor notes and recommendations
    - [ ] Track improvement over time

## Priority 5: Database & Infrastructure

### Database Migrations
- [ ] **Verify migration 003_tutor_analytics_and_availability.sql**
  - Check if tables exist:
    - [ ] tutor_availability_slots
    - [ ] tutor_earnings
    - [ ] tutor_performance_metrics
    - [ ] student_progress_tracking
  - [ ] Test database triggers
  - [ ] Test database functions (update_tutor_performance_metrics)

### API Endpoints Testing
- [ ] **Test all tutor-related endpoints**
  - [ ] GET /api/analytics/dashboard/:tutorId
  - [ ] GET /api/availability/:tutorId
  - [ ] POST /api/availability/:tutorId
  - [ ] PUT /api/availability/:tutorId/:slotId
  - [ ] DELETE /api/availability/:tutorId/:slotId
  - [ ] GET /api/payments/user/:userId
  - [ ] POST /api/payments/session/:sessionId

### Error Handling & Monitoring
- [ ] **Implement comprehensive error handling**
  - [ ] Add try-catch blocks in all API calls
  - [ ] Display user-friendly error messages
  - [ ] Log errors for debugging
  - [ ] Add loading states for async operations
  - [ ] Implement retry logic for failed requests

## Priority 6: Testing & Quality Assurance

### End-to-End Testing
- [ ] **Password Reset Flow**
  - [ ] Request password reset
  - [ ] Receive email with token
  - [ ] Reset password with token
  - [ ] Login with new password

- [ ] **Tutor Analytics Flow**
  - [ ] View dashboard analytics
  - [ ] Filter by time range
  - [ ] View earnings breakdown
  - [ ] Check performance metrics

- [ ] **Payment Processing Flow**
  - [ ] Book session as student
  - [ ] Complete payment
  - [ ] Verify session confirmed
  - [ ] Check tutor earnings updated
  - [ ] Verify payment history

### Server Stability
- [ ] Keep server running for continuous testing
- [ ] Monitor for errors and crashes
- [ ] Test all endpoints with various inputs
- [ ] Check database connection stability
- [ ] Verify JWT token handling

## Implementation Notes

### Immediate Action Items (Start Here)
1. Fix the expressQuery error in payments.js (CRITICAL)
2. Add forgot password link to ResetPassword.js
3. Verify database migration has been applied
4. Create API service layer for analytics
5. Connect TutorAnalytics page to backend

### Development Approach
- Start with backend fixes (payments.js)
- Test each endpoint before frontend integration
- Implement features incrementally
- Test after each implementation
- Keep server running for continuous validation
- Use mock payment providers for testing

### Open Questions
- Should we simplify token handling (mentioned in analysis)?
- Do we need to change database schema for any features?
- What's the priority between tutor and student features?
- Should we focus on analytics first or payments first?

## Progress Tracking
- Total Tasks: 50+
- Critical Tasks: 1
- Completed: 8
- In Progress: 0
- Not Started: 42+

---
**Last Updated:** 2025-11-08
**Status:** Initial TODO list created, starting implementation
