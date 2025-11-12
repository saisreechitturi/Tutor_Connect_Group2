--
-- PostgreSQL database dump
--

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-12 10:10:31

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5331 (class 1262 OID 16388)
-- Name: TutorConnectTest; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "TutorConnectTest" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE "TutorConnectTest" OWNER TO postgres;

\unrestrict TVIjbMnVV2bgd6uiLcavgMEOcVzbnerFAV9mzYT5ZuJGFZE6WSH8KUltMu9Ck8d
\connect "TutorConnectTest"
\restrict TVIjbMnVV2bgd6uiLcavgMEOcVzbnerFAV9mzYT5ZuJGFZE6WSH8KUltMu9Ck8d

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5315 (class 0 OID 16700)
-- Dependencies: 229
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5317 (class 0 OID 16730)
-- Dependencies: 231
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5320 (class 0 OID 16781)
-- Dependencies: 234
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at, updated_at) VALUES ('f2e9ed7c-a3af-4c3d-8bdb-eab8586014e0', 'd7742ef6-946b-470f-a038-25382e5482e4', '5b09431f5c2c13289a85e5fae11926447a4addb81ae01b8f31a1bbec3c5a9e43', '2025-11-12 10:18:45.95-06', NULL, '2025-11-12 10:03:45.950859-06', '2025-11-12 09:32:07.607534-06');


--
-- TOC entry 5316 (class 0 OID 16715)
-- Dependencies: 230
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5314 (class 0 OID 16681)
-- Dependencies: 228
-- Data for Name: session_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5319 (class 0 OID 16762)
-- Dependencies: 233
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('1e50dcf8-22e1-4f7e-9d37-12475fb39230', 'language', 'en', 'Default language', 'general', 'string', false, '2025-09-29 11:07:37.486707-05', '2025-09-30 13:03:21.727336-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('c0de0539-f193-4dd7-8366-bd76e536f0f9', 'contact_email', 'admin@TutorConnectTest.com', 'Contact email', 'general', 'string', false, '2025-09-29 11:07:37.48323-05', '2025-09-30 13:03:21.607573-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('0fc63ddb-329b-4e46-9fa2-dd434c66245c', 'site_description', 'Connect with expert tutors for personalized learning', 'Platform description', 'general', 'string', false, '2025-09-29 11:07:37.482231-05', '2025-09-30 13:03:21.632116-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('d14203d2-e6ef-4d7e-98ec-2d8b08a777fa', 'site_name', 'TutorConnectTest', 'Platform name', 'general', 'string', false, '2025-09-29 11:07:37.477251-05', '2025-09-30 13:03:21.652737-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('32718288-ed24-4ca0-8530-c0d65516b2a2', 'commission_rate', '15', 'Platform commission rate in percentage', 'payment', 'number', false, '2025-09-29 11:07:37.495938-05', '2025-09-30 13:03:21.661759-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('53cff740-e313-40e1-a87d-39ec2bde9532', 'enable_two_factor', 'false', 'Enable two-factor authentication', 'security', 'boolean', false, '2025-09-29 11:07:37.488629-05', '2025-09-30 13:03:21.680726-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('39efe29e-5c0d-46e5-9bb2-fa77c64a1a6c', 'session_timeout', '24', 'Session timeout in hours', 'security', 'number', false, '2025-09-29 11:07:37.489834-05', '2025-09-30 13:03:21.693933-05');
INSERT INTO public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) VALUES ('964f75aa-4bb4-4039-9e58-5aca0e69495f', 'auto_approval_tutors', 'false', 'Auto-approve new tutors', 'user_management', 'boolean', false, '2025-09-29 11:07:37.499233-05', '2025-09-30 13:03:21.700292-05');


--
-- TOC entry 5310 (class 0 OID 16602)
-- Dependencies: 224
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.student_profiles (id, user_id, grade_level, school_name, learning_goals, preferred_learning_style, subjects_of_interest, availability_schedule, emergency_contact, created_at, updated_at) VALUES ('133b7060-a776-4b95-89dd-b1b6fc541028', '7b80fc04-d7c0-4123-8c73-c8c33310a817', '11th Grade', 'Lincoln High School', 'Improve SAT scores and prepare for AP Calculus', 'both', NULL, NULL, NULL, '2025-09-25 14:33:18.622678-05', '2025-09-25 14:33:18.622678-05');
INSERT INTO public.student_profiles (id, user_id, grade_level, school_name, learning_goals, preferred_learning_style, subjects_of_interest, availability_schedule, emergency_contact, created_at, updated_at) VALUES ('b736f650-252b-45e0-8940-991378fcf47b', 'e42db01c-739b-4b03-a288-e8ead8c5f8e7', 'College Freshman', 'State University', 'Pass organic chemistry and maintain GPA', 'both', NULL, NULL, NULL, '2025-09-25 14:33:18.625949-05', '2025-09-25 14:33:18.625949-05');


--
-- TOC entry 5325 (class 0 OID 16884)
-- Dependencies: 239
-- Data for Name: student_progress_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5309 (class 0 OID 16587)
-- Dependencies: 223
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.subjects (id, name, description, category, is_active, created_at, updated_at) VALUES ('5300be37-5643-4372-98c7-3c468655c838', 'Mathematics', 'Basic to advanced mathematics including algebra, calculus, and statistics', 'academics', true, '2025-09-25 14:33:18.609739-05', '2025-09-25 14:33:18.609739-05');
INSERT INTO public.subjects (id, name, description, category, is_active, created_at, updated_at) VALUES ('886240f2-186d-4f7c-8a6a-89b41d11adca', 'Physics', 'Physics concepts from basic mechanics to advanced quantum physics', 'science', true, '2025-09-25 14:33:18.611069-05', '2025-09-25 14:33:18.611069-05');
INSERT INTO public.subjects (id, name, description, category, is_active, created_at, updated_at) VALUES ('95b21b45-c123-4d56-8e9f-a1b2c3d4e5f6', 'Spanish', 'Spanish language learning from beginner to advanced levels', 'language', true, '2025-09-25 14:33:18.612289-05', '2025-09-25 14:33:18.612289-05');
INSERT INTO public.subjects (id, name, description, category, is_active, created_at, updated_at) VALUES ('b59cf17e-6bdf-4de9-b775-7a55609eb1c6', 'Computer Science', 'Programming, algorithms, data structures, and software development', 'technology', true, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05');


--
-- TOC entry 5321 (class 0 OID 16795)
-- Dependencies: 235
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5322 (class 0 OID 16815)
-- Dependencies: 236
-- Data for Name: tutor_availability_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5323 (class 0 OID 16837)
-- Dependencies: 237
-- Data for Name: tutor_earnings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5324 (class 0 OID 16857)
-- Dependencies: 238
-- Data for Name: tutor_performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5311 (class 0 OID 16617)
-- Dependencies: 225
-- Data for Name: tutor_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES ('35dc308a-1b0d-495c-9c8c-da06eca755e5', '80812a35-7730-4408-978b-6778c5c8135e', 45.00, 5, 'M.S. in Mathematics, Stanford University', NULL, NULL, 0.00, 0, 0, true, 'English, Spanish', 'both', '2025-09-25 14:33:18.613108-05', '2025-09-25 14:33:18.613108-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);
INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES ('55dc9ea6-b90e-452f-96fe-5efc90da4e68', '9d5c540b-e76c-4511-ad1b-615b98b54cae', 50.00, 7, 'Ph.D. in Physics, MIT', NULL, NULL, 0.00, 0, 0, true, 'English, Mandarin', 'both', '2025-09-25 14:33:18.617585-05', '2025-09-25 14:33:18.617585-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);
INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES ('77b252e0-9356-446e-85ad-2f29d6b2a5ed', '9035f001-56a5-4ec4-9b51-b412193ed125', 35.00, 3, 'B.A. in Spanish Literature, UC Berkeley', NULL, NULL, 0.00, 0, 0, true, 'Spanish, English', 'both', '2025-09-25 14:33:18.620003-05', '2025-09-25 14:33:18.620003-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);
INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES ('8959b340-63ab-4fd2-a8f3-401e0f607da3', '2cebaa54-380c-4e71-8455-66cfb40fdb40', 25.00, 3, NULL, NULL, NULL, 4.50, 0, 12, true, 'English', 'both', '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);
INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES ('91efc493-28da-46c7-9b2b-ddae7f2be745', '919affe9-c8f0-45b5-aaf4-0cbe1f213c65', 55.00, 12, 'PhD Physics, MIT', NULL, NULL, 4.90, 0, 203, true, 'English, Mandarin', 'both', '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);
INSERT INTO public.tutor_profiles (id, user_id, hourly_rate, years_of_experience, education_background, certifications, teaching_philosophy, rating, total_students, total_sessions, is_verified, languages_spoken, preferred_teaching_method, created_at, updated_at, total_earnings, average_session_duration, cancellation_rate, response_rate, weekly_availability_hours, monthly_earnings) VALUES ('a16ff69b-2b76-438c-b35b-d0a81be6b895', '6f28afdd-9211-49cf-9bef-18216f5a667f', 50.00, 6, 'B.S. Computer Science, Carnegie Mellon', NULL, NULL, 4.80, 0, 134, true, 'English, Korean', 'both', '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', 0.00, 0.00, 0, 100.00, 0.00, 0.00);


--
-- TOC entry 5312 (class 0 OID 16645)
-- Dependencies: 226
-- Data for Name: tutor_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5313 (class 0 OID 16658)
-- Dependencies: 227
-- Data for Name: tutoring_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, meeting_room, cancellation_reason, cancelled_by, created_at, updated_at, session_date) VALUES ('d393f36b-866b-484c-9307-85ad9c8aa0f0', '1b760852-694e-41a9-afd6-37f0d42216d7', '2cebaa54-380c-4e71-8455-66cfb40fdb40', '5300be37-5643-4372-98c7-3c468655c838', 'JavaScript Fundamentals', NULL, 'online', '2025-01-05 10:00:00-06', '2025-01-05 11:00:00-06', NULL, NULL, 'scheduled', 50.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 18:00:42.160461-05', '2025-09-28 18:00:42.160461-05', NULL);
INSERT INTO public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, meeting_room, cancellation_reason, cancelled_by, created_at, updated_at, session_date) VALUES ('47e95bea-b70c-492f-8cc0-59210068d511', '1b760852-694e-41a9-afd6-37f0d42216d7', '2cebaa54-380c-4e71-8455-66cfb40fdb40', '5300be37-5643-4372-98c7-3c468655c838', 'React Components', NULL, 'online', '2025-01-03 14:00:00-06', '2025-01-03 15:30:00-06', NULL, NULL, 'completed', 50.00, 75.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 18:00:42.166763-05', '2025-09-28 18:00:42.166763-05', NULL);
INSERT INTO public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, meeting_room, cancellation_reason, cancelled_by, created_at, updated_at, session_date) VALUES ('aa4a0465-0805-4927-882c-e87c23b0cba6', '27bd24b5-2677-4320-a1b1-8adf09ef7464', '80812a35-7730-4408-978b-6778c5c8135e', '5300be37-5643-4372-98c7-3c468655c838', 'Calculus Practice Session', 'Review of derivatives and integrals, practice problems for upcoming exam', 'online', '2025-10-01 12:58:03.769849-05', '2025-10-01 13:58:03.769849-05', NULL, NULL, 'scheduled', 45.00, 45.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', NULL);
INSERT INTO public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, meeting_room, cancellation_reason, cancelled_by, created_at, updated_at, session_date) VALUES ('1215610e-35a0-43f1-850c-403657018918', '27bd24b5-2677-4320-a1b1-8adf09ef7464', '919affe9-c8f0-45b5-aaf4-0cbe1f213c65', '886240f2-186d-4f7c-8a6a-89b41d11adca', 'Physics Problem Solving', 'Work through mechanics problems, focus on forces and motion', 'online', '2025-10-02 12:58:03.769849-05', '2025-10-02 14:28:03.769849-05', NULL, NULL, 'scheduled', 55.00, 82.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', NULL);
INSERT INTO public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, payment_amount, session_notes, homework_assigned, materials_used, meeting_link, meeting_room, cancellation_reason, cancelled_by, created_at, updated_at, session_date) VALUES ('ec3ecda2-b570-49f1-9fa6-dc41dfc7c78f', '7088f167-1cd0-48db-8f36-26e6cf16417c', '6f28afdd-9211-49cf-9bef-18216f5a667f', 'b59cf17e-6bdf-4de9-b775-7a55609eb1c6', 'JavaScript Fundamentals', 'Introduction to JavaScript, variables, functions, and DOM manipulation', 'online', '2025-09-28 12:58:03.769849-05', '2025-09-28 13:58:03.769849-05', '2025-09-28 12:58:03.769849-05', '2025-09-28 13:58:03.769849-05', 'completed', 50.00, 50.00, 'Great progress! Student understood concepts well. Recommended practicing DOM manipulation exercises.', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-29 12:58:03.769849-05', '2025-09-29 12:58:03.769849-05', NULL);


--
-- TOC entry 5308 (class 0 OID 16569)
-- Dependencies: 222
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5318 (class 0 OID 16746)
-- Dependencies: 232
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5307 (class 0 OID 16548)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('1b760852-694e-41a9-afd6-37f0d42216d7', 'student@demo.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Demo', 'Student', NULL, NULL, 'student', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', NULL, false, true, '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('2cebaa54-380c-4e71-8455-66cfb40fdb40', 'tutor@demo.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Demo', 'Tutor', NULL, NULL, 'tutor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NULL, false, true, '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('025efe1f-c8bd-4f8e-9282-6bcdb27db0d7', 'admin@demo.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Demo', 'Admin', NULL, NULL, 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', NULL, false, true, '2025-09-28 17:34:44.885969-05', '2025-09-28 17:34:44.885969-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('80812a35-7730-4408-978b-6778c5c8135e', 'sarah.math@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Sarah', 'Johnson', '+1234567891', NULL, 'tutor', NULL, 'Experienced mathematics tutor with 5+ years of teaching experience', true, true, '2025-09-25 14:33:18.611429-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('9d5c540b-e76c-4511-ad1b-615b98b54cae', 'david.physics@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'David', 'Chen', '+1234567892', NULL, 'tutor', NULL, 'Physics PhD with passion for making complex concepts simple', true, true, '2025-09-25 14:33:18.615982-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('9035f001-56a5-4ec4-9b51-b412193ed125', 'maria.spanish@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Maria', 'Rodriguez', '+1234567893', NULL, 'tutor', NULL, 'Native Spanish speaker with teaching certification', true, true, '2025-09-25 14:33:18.618913-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('7b80fc04-d7c0-4123-8c73-c8c33310a817', 'john.student@example.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'John', 'Smith', '+1234567894', NULL, 'student', NULL, 'High school student looking to improve in math and science', true, true, '2025-09-25 14:33:18.621316-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('e42db01c-739b-4b03-a288-e8ead8c5f8e7', 'emma.student@example.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Emma', 'Wilson', '+1234567895', NULL, 'student', NULL, 'College freshman seeking help with organic chemistry', true, true, '2025-09-25 14:33:18.624785-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('ef910e0b-1654-489e-b3f4-d647a22bff84', 'admin@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Admin', 'User', '+1234567890', NULL, 'admin', NULL, 'System administrator for TutorConnectTest platform', true, true, '2025-09-25 14:33:18.607808-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('27bd24b5-2677-4320-a1b1-8adf09ef7464', 'alex.student@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Alex', 'Thompson', '+1-555-0201', NULL, 'student', NULL, 'High school senior preparing for college entrance exams. Needs help with calculus and physics.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('919affe9-c8f0-45b5-aaf4-0cbe1f213c65', 'mike.science@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Michael', 'Chen', '+1-555-0102', NULL, 'tutor', NULL, 'PhD in Physics with passion for teaching. I help students understand complex scientific concepts through practical examples.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('6f28afdd-9211-49cf-9bef-18216f5a667f', 'david.cs@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'David', 'Kim', '+1-555-0104', NULL, 'tutor', NULL, 'Software engineer and computer science tutor. Helps students with programming, web development, and algorithms.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('7088f167-1cd0-48db-8f36-26e6cf16417c', 'jamie.learner@TutorConnectTest.com', '$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK', 'Jamie', 'Wilson', '+1-555-0202', NULL, 'student', NULL, 'College sophomore studying computer science. Looking for help with advanced programming concepts.', true, true, '2025-09-29 12:58:03.769849-05', '2025-09-29 15:56:50.015432-05');
INSERT INTO public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_picture_url, bio, email_verified, is_active, created_at, updated_at) VALUES ('d7742ef6-946b-470f-a038-25382e5482e4', 'abhinaykotla@gmail.com', '$2b$12$18TDxqc0UiXcToxH0B6oMeNTxr4MsJ9LGDwvx8.4Mk04Mngo6b0x2', 'Abhinay', 'Kotla', '14696741021', NULL, 'student', NULL, NULL, false, true, '2025-11-12 00:03:14.923541-06', '2025-11-12 00:03:14.923541-06');


-- Completed on 2025-11-12 10:10:31

--
-- PostgreSQL database dump complete
--

\unrestrict TVIjbMnVV2bgd6uiLcavgMEOcVzbnerFAV9mzYT5ZuJGFZE6WSH8KUltMu9Ck8d

