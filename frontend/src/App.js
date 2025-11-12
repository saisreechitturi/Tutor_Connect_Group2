import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import BrowseTutors from './pages/BrowseTutors';
import TutorProfile from './pages/TutorProfile';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import StudentRoutes from './routes/StudentRoutes';
import TutorRoutes from './routes/TutorRoutes';
import AdminRoutes from './routes/AdminRoutes';
import AIChatbot from './components/ui/AIChatbot';
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

                        <Route
                            path="/tutor/:id"
                            element={
                                <ProtectedRoute requireAuth={false}>
                                    <>
                                        <Navbar />
                                        <TutorProfile />
                                    </>
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

                    {/* AI Chatbot - Available on all pages */}
                    <AIChatbot />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
