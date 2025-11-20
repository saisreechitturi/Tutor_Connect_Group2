import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import BrowseTutors from './pages/BrowseTutors';
import TutorProfile from './pages/TutorProfile';
import TutorProfileSetup from './pages/TutorProfileSetup';
import StudentProfileSetup from './pages/StudentProfileSetup';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import StudentRoutes from './routes/StudentRoutes';
import TutorRoutes from './routes/TutorRoutes';
import AdminRoutes from './routes/AdminRoutes';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/error/NotFound';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        {/* Public routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <>
                                        <Navbar />
                                        <LandingPage />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/login"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <Login />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/signup"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <Signup />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor-setup"
                            element={
                                <ProtectedRoute allowedRoles={['tutor']}>
                                    <TutorProfileSetup />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student-setup"
                            element={
                                <ProtectedRoute allowedRoles={['student']}>
                                    <StudentProfileSetup />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/forgot-password"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <ForgotPassword />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reset-password/:token"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <ResetPassword />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/about"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <>
                                        <Navbar />
                                        <AboutUs />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/browse-tutors"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <>
                                        <Navbar />
                                        <BrowseTutors />
                                    </>
                                </ProtectedRoute>
                            }
                        />

                        {/* Public tutor profile view - Use /tutors/:id to avoid conflict with /tutor/* dashboard */}
                        <Route
                            path="/tutors/:id"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <>
                                        <Navbar />
                                        <TutorProfile />
                                    </>
                                </ProtectedRoute>
                            }
                        />

                        {/* Dashboard redirect - redirects to appropriate role-based dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute requireAuth={true}>
                                    <DashboardRedirect />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected routes - Student Dashboard */}
                        <Route
                            path="/student/*"
                            element={
                                <ProtectedRoute allowedRoles={['student']}>
                                    <StudentRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected routes - Tutor Dashboard */}
                        <Route
                            path="/tutor/*"
                            element={
                                <ProtectedRoute allowedRoles={['tutor']}>
                                    <TutorRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected routes - Admin Dashboard */}
                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Catch all route - 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>

                    {/* AI Assistant - Available on all pages */}
                    <ErrorBoundary>
                        <FloatingAIAssistant />
                    </ErrorBoundary>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
