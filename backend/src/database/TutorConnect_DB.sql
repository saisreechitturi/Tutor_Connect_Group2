--
-- PostgreSQL database dump
--

\restrict XCaPJ8wpzU8TCjPT2naWQT23ZWfooTN2LYZGfrSVNIyOgvwLxy60mbXnMUUN7LX

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-30 11:43:51

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
-- TOC entry 5153 (class 1262 OID 16384)
-- Name: TutorConnect; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "TutorConnect" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE "TutorConnect" OWNER TO postgres;

\unrestrict XCaPJ8wpzU8TCjPT2naWQT23ZWfooTN2LYZGfrSVNIyOgvwLxy60mbXnMUUN7LX
\connect "TutorConnect"
\restrict XCaPJ8wpzU8TCjPT2naWQT23ZWfooTN2LYZGfrSVNIyOgvwLxy60mbXnMUUN7LX

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
-- TOC entry 5142 (class 0 OID 16851)
-- Dependencies: 226
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, recipient_id, session_id, message_text, message_type, attachment_url, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5144 (class 0 OID 16904)
-- Dependencies: 228
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, is_sent, created_at) FROM stdin;
\.


--
-- TOC entry 5143 (class 0 OID 16878)
-- Dependencies: 227
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, session_id, payer_id, payee_id, amount, currency, payment_method, payment_status, stripe_payment_intent_id, transaction_fee, processed_at, created_at) FROM stdin;
\.


--
-- TOC entry 5141 (class 0 OID 16823)
-- Dependencies: 225
-- Data for Name: session_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_reviews (id, session_id, reviewer_id, reviewee_id, rating, review_text, is_public, created_at) FROM stdin;
\.


--
-- TOC entry 5146 (class 0 OID 16970)
-- Dependencies: 231
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, description, category, data_type, is_public, created_at, updated_at) FROM stdin;
c0de0539-f193-4dd7-8366-bd76e536f0f9	contact_email	admin@tutorconnect.com	Contact email	general	string	f	2025-09-29 11:07:37.48323-05	2025-09-29 12:44:16.065643-05
1e50dcf8-22e1-4f7e-9d37-12475fb39230	language	en	Default language	general	string	f	2025-09-29 11:07:37.486707-05	2025-09-29 12:44:16.091961-05
0fc63ddb-329b-4e46-9fa2-dd434c66245c	site_description	Connect with expert tutors for personalized learning	Platform description	general	string	f	2025-09-29 11:07:37.482231-05	2025-09-29 12:44:16.11107-05
d14203d2-e6ef-4d7e-98ec-2d8b08a777fa	site_name	TutorConnect	Platform name	general	string	f	2025-09-29 11:07:37.477251-05	2025-09-29 12:44:16.112139-05
85dbd81d-ab45-4c04-b362-528b251e0171	support_email	support@tutorconnect.com	Support email	general	string	f	2025-09-29 11:07:37.484233-05	2025-09-29 12:44:16.119351-05
bd540fa3-5a83-4717-b37c-6901bc0b0300	timezone	America/New_York	Default timezone	general	string	f	2025-09-29 11:07:37.485372-05	2025-09-29 12:44:16.120318-05
32718288-ed24-4ca0-8530-c0d65516b2a2	commission_rate	15	Platform commission rate in percentage	payment	number	f	2025-09-29 11:07:37.495938-05	2025-09-29 12:44:16.126532-05
3b2ae31d-0db5-44fb-a571-625dd79ae752	minimum_payout	50	Minimum payout amount	payment	number	f	2025-09-29 11:07:37.497089-05	2025-09-29 12:44:16.127109-05
96b336de-15ae-4017-bbb9-ea6a43ecdefe	payout_schedule	weekly	Payout schedule	payment	string	f	2025-09-29 11:07:37.498238-05	2025-09-29 12:44:16.133669-05
53cff740-e313-40e1-a87d-39ec2bde9532	enable_two_factor	false	Enable two-factor authentication	security	boolean	f	2025-09-29 11:07:37.488629-05	2025-09-29 12:44:16.134509-05
3a5396fc-bd6e-43df-94f4-a88160266c82	max_login_attempts	5	Maximum login attempts	security	number	f	2025-09-29 11:07:37.490989-05	2025-09-29 12:44:16.140591-05
e9168683-1baf-4df8-9d72-b0c949f08dcc	password_min_length	8	Minimum password length	security	number	f	2025-09-29 11:07:37.4925-05	2025-09-29 12:44:16.141638-05
a8f69791-af15-4d7e-9bc4-4bafa67aa399	require_email_verification	true	Require email verification for new users	security	boolean	f	2025-09-29 11:07:37.48765-05	2025-09-29 12:44:16.147652-05
d1fa4f5a-fffd-4129-9b53-7a6ba572c4cd	require_strong_passwords	true	Require strong passwords	security	boolean	f	2025-09-29 11:07:37.494301-05	2025-09-29 12:44:16.148245-05
39efe29e-5c0d-46e5-9bb2-fa77c64a1a6c	session_timeout	24	Session timeout in hours	security	number	f	2025-09-29 11:07:37.489834-05	2025-09-29 12:44:16.15395-05
32590aa8-aa70-4223-b465-ec7eeb3cd9c6	allow_public_profiles	true	Allow public tutor profiles	user_management	boolean	f	2025-09-29 11:07:37.502515-05	2025-09-29 12:44:16.154614-05
964f75aa-4bb4-4039-9e58-5aca0e69495f	auto_approval_tutors	false	Auto-approve new tutors	user_management	boolean	f	2025-09-29 11:07:37.499233-05	2025-09-29 12:44:16.160408-05
7b406f27-ce05-49f6-b204-6c3e989394b8	max_students_per_tutor	50	Maximum students per tutor	user_management	number	f	2025-09-29 11:07:37.501352-05	2025-09-29 12:44:16.161072-05
b85fddbc-0f56-40f2-909c-d35facde07b0	require_tutor_verification	true	Require tutor verification	user_management	boolean	f	2025-09-29 11:07:37.500253-05	2025-09-29 12:44:16.164887-05
\.


--
-- TOC entry 5139 (class 0 OID 16771)
-- Dependencies: 223
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_profiles (id, user_id, grade_level, school_name, learning_goals, preferred_session_type, parent_name, parent_email, parent_phone, created_at, updated_at) FROM stdin;
133b7060-a776-4b95-89dd-b1b6fc541028	7b80fc04-d7c0-4123-8c73-c8c33310a817	11th Grade	Lincoln High School	Improve SAT scores and prepare for AP Calculus	both	\N	\N	\N	2025-09-25 14:33:18.622678-05	2025-09-25 14:33:18.622678-05
b736f650-252b-45e0-8940-991378fcf47b	e42db01c-739b-4b03-a288-e8ead8c5f8e7	College Freshman	State University	Pass organic chemistry and maintain GPA	both	\N	\N	\N	2025-09-25 14:33:18.625949-05	2025-09-25 14:33:18.625949-05
\.


--
-- TOC entry 5136 (class 0 OID 16712)
-- Dependencies: 220
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (id, name, description, category, is_active, created_at) FROM stdin;
5300be37-5643-4372-98c7-3c468655c838	Mathematics	Algebra, Calculus, Geometry, Statistics	STEM	t	2025-09-25 14:33:18.53732-05
886240f2-186d-4f7c-8a6a-89b41d11adca	Physics	Classical mechanics, Thermodynamics, Electromagnetism	STEM	t	2025-09-25 14:33:18.543227-05
5fbc496f-7623-48a3-88f8-f7d40dbe3f17	Chemistry	Organic, Inorganic, Physical Chemistry	STEM	t	2025-09-25 14:33:18.5451-05
ee901832-56ed-4ca4-9c97-56c88869d5f1	Biology	Cell Biology, Genetics, Evolution, Ecology	STEM	t	2025-09-25 14:33:18.546442-05
b59cf17e-6bdf-4de9-b775-7a55609eb1c6	Computer Science	Programming, Data Structures, Algorithms	STEM	t	2025-09-25 14:33:18.547671-05
daa1116d-2893-49ba-9e00-64a7ec335383	English Literature	Reading comprehension, Essay writing, Literary analysis	Languages	t	2025-09-25 14:33:18.548976-05
d31e6995-65fc-4d82-96be-a7824107f3d8	History	World History, American History, European History	Social Studies	t	2025-09-25 14:33:18.550306-05
b7a05b9d-e945-4643-9c7b-da64d2b35fc7	Spanish	Grammar, Conversation, Literature	Languages	t	2025-09-25 14:33:18.551922-05
f3c04501-d9d0-4475-9fd8-a6fa1c7ed4f1	French	Grammar, Conversation, Literature	Languages	t	2025-09-25 14:33:18.553326-05
72bc6104-f2d0-4d46-a10e-ca971805e234	Economics	Microeconomics, Macroeconomics, International Trade	Social Studies	t	2025-09-25 14:33:18.55471-05
31ec8aa1-423b-41ea-bfa5-17ddc1b69bee	Psychology	General Psychology, Cognitive Psychology, Social Psychology	Social Studies	t	2025-09-29 12:58:03.769849-05
\.


--
-- TOC entry 5147 (class 0 OID 16989)
-- Dependencies: 232
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, user_id, session_id, title, description, category, priority, status, due_date, completed_at, estimated_hours, actual_hours, notes, created_at, updated_at) FROM stdin;
aa01975d-6534-43e2-a01d-21c945581b13	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Complete Math Assignment #5	Solve problems 1-15 from Chapter 4: Linear Equations	homework	high	pending	2025-10-01 12:54:37.331487-05	\N	\N	\N	\N	2025-09-29 12:54:37.331487-05	2025-09-29 12:54:37.331487-05
81ad60a9-8fe2-4032-9d45-37c84312a30c	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Read Chapter 3: Biology Basics	Read and take notes on cellular structure and function	reading	medium	pending	2025-10-04 12:54:37.331487-05	\N	\N	\N	\N	2025-09-29 12:54:37.331487-05	2025-09-29 12:54:37.331487-05
bca9da81-7e36-42f1-a756-1fbf4832c333	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Practice Spanish Vocabulary	Study vocabulary words from Lesson 12	practice	low	completed	2025-09-28 12:54:37.331487-05	2025-09-29 06:54:37.331487-05	\N	\N	\N	2025-09-29 12:54:37.331487-05	2025-09-29 12:54:37.331487-05
b40a168d-e5bf-4803-a653-5cadf798ebae	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Complete Calculus Homework	Solve problems 1-20 from Chapter 7: Integration by Parts	homework	high	pending	2025-09-30 12:58:03.769849-05	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
9fe3d4cb-b983-4d0b-ad2d-ed8432a2561d	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Physics Lab Report	Write lab report on pendulum motion experiment	assignment	medium	in_progress	2025-10-03 12:58:03.769849-05	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
90e0d513-3d37-4f35-ab1f-cdaa2dcbcd99	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Review JavaScript Arrays	Go through array methods: map, filter, reduce	practice	low	completed	2025-09-28 12:58:03.769849-05	2025-09-29 10:58:03.769849-05	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
cf86c22c-cf0b-4941-9a13-1f2f101a730f	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Build Portfolio Website	Create personal portfolio using HTML, CSS, and JavaScript	project	high	in_progress	2025-10-13 12:58:03.769849-05	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
a0c409a3-5816-48d2-b02f-174ab5966d39	1b760852-694e-41a9-afd6-37f0d42216d7	\N	Algebra Practice Problems	Complete worksheet on linear equations	homework	medium	pending	2025-10-01 12:58:03.769849-05	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
\.


--
-- TOC entry 5137 (class 0 OID 16724)
-- Dependencies: 221
-- Data for Name: tutor_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tutor_profiles (id, user_id, hourly_rate, experience_years, education, certifications, availability_hours, rating, total_reviews, total_sessions, is_available, languages, preferred_session_type, created_at, updated_at) FROM stdin;
35dc308a-1b0d-495c-9c8c-da06eca755e5	80812a35-7730-4408-978b-6778c5c8135e	45.00	5	M.S. in Mathematics, Stanford University	\N	\N	0.00	0	0	t	English, Spanish	both	2025-09-25 14:33:18.613108-05	2025-09-25 14:33:18.613108-05
55dc9ea6-b90e-452f-96fe-5efc90da4e68	9d5c540b-e76c-4511-ad1b-615b98b54cae	50.00	7	Ph.D. in Physics, MIT	\N	\N	0.00	0	0	t	English, Mandarin	both	2025-09-25 14:33:18.617585-05	2025-09-25 14:33:18.617585-05
77b252e0-9356-446e-85ad-2f29d6b2a5ed	9035f001-56a5-4ec4-9b51-b412193ed125	35.00	3	B.A. in Spanish Literature, UC Berkeley	\N	\N	0.00	0	0	t	Spanish, English	both	2025-09-25 14:33:18.620003-05	2025-09-25 14:33:18.620003-05
8959b340-63ab-4fd2-a8f3-401e0f607da3	2cebaa54-380c-4e71-8455-66cfb40fdb40	25.00	3	\N	\N	\N	4.50	0	12	t	English	both	2025-09-28 17:34:44.885969-05	2025-09-28 17:34:44.885969-05
91efc493-28da-46c7-9b2b-ddae7f2be745	919affe9-c8f0-45b5-aaf4-0cbe1f213c65	55.00	12	PhD Physics, MIT	\N	\N	4.90	0	203	t	English, Mandarin	both	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
be200c12-62f3-48a7-800e-598e157cb4f1	8f541560-36bb-4a6c-81fc-fcf0c2320314	40.00	5	B.A. Spanish Literature, UC Berkeley	\N	\N	4.70	0	89	t	English, Spanish	both	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
a16ff69b-2b76-438c-b35b-d0a81be6b895	6f28afdd-9211-49cf-9bef-18216f5a667f	50.00	6	B.S. Computer Science, Carnegie Mellon	\N	\N	4.80	0	134	t	English, Korean	both	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
\.


--
-- TOC entry 5138 (class 0 OID 16750)
-- Dependencies: 222
-- Data for Name: tutor_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tutor_subjects (id, tutor_id, subject_id, proficiency_level, created_at) FROM stdin;
\.


--
-- TOC entry 5140 (class 0 OID 16790)
-- Dependencies: 224
-- Data for Name: tutoring_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tutoring_sessions (id, student_id, tutor_id, subject_id, title, description, session_type, scheduled_start, scheduled_end, actual_start, actual_end, status, hourly_rate, total_amount, session_notes, homework_assigned, meeting_link, location_address, cancellation_reason, cancelled_by, cancelled_at, created_at, updated_at) FROM stdin;
d393f36b-866b-484c-9307-85ad9c8aa0f0	1b760852-694e-41a9-afd6-37f0d42216d7	2cebaa54-380c-4e71-8455-66cfb40fdb40	5300be37-5643-4372-98c7-3c468655c838	JavaScript Fundamentals	\N	online	2025-01-05 10:00:00-06	2025-01-05 11:00:00-06	\N	\N	scheduled	50.00	50.00	\N	\N	\N	\N	\N	\N	\N	2025-09-28 18:00:42.160461-05	2025-09-28 18:00:42.160461-05
47e95bea-b70c-492f-8cc0-59210068d511	1b760852-694e-41a9-afd6-37f0d42216d7	2cebaa54-380c-4e71-8455-66cfb40fdb40	5300be37-5643-4372-98c7-3c468655c838	React Components	\N	online	2025-01-03 14:00:00-06	2025-01-03 15:30:00-06	\N	\N	completed	50.00	75.00	\N	\N	\N	\N	\N	\N	\N	2025-09-28 18:00:42.166763-05	2025-09-28 18:00:42.166763-05
aa4a0465-0805-4927-882c-e87c23b0cba6	27bd24b5-2677-4320-a1b1-8adf09ef7464	80812a35-7730-4408-978b-6778c5c8135e	5300be37-5643-4372-98c7-3c468655c838	Calculus Practice Session	Review of derivatives and integrals, practice problems for upcoming exam	online	2025-10-01 12:58:03.769849-05	2025-10-01 13:58:03.769849-05	\N	\N	scheduled	45.00	45.00	\N	\N	\N	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
1215610e-35a0-43f1-850c-403657018918	27bd24b5-2677-4320-a1b1-8adf09ef7464	919affe9-c8f0-45b5-aaf4-0cbe1f213c65	886240f2-186d-4f7c-8a6a-89b41d11adca	Physics Problem Solving	Work through mechanics problems, focus on forces and motion	online	2025-10-02 12:58:03.769849-05	2025-10-02 14:28:03.769849-05	\N	\N	scheduled	55.00	82.50	\N	\N	\N	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
ec3ecda2-b570-49f1-9fa6-dc41dfc7c78f	7088f167-1cd0-48db-8f36-26e6cf16417c	6f28afdd-9211-49cf-9bef-18216f5a667f	b59cf17e-6bdf-4de9-b775-7a55609eb1c6	JavaScript Fundamentals	Introduction to JavaScript, variables, functions, and DOM manipulation	online	2025-09-28 12:58:03.769849-05	2025-09-28 13:58:03.769849-05	2025-09-28 12:58:03.769849-05	2025-09-28 13:58:03.769849-05	completed	50.00	50.00	Great progress! Student understood concepts well. Recommended practicing DOM manipulation exercises.	\N	\N	\N	\N	\N	\N	2025-09-29 12:58:03.769849-05	2025-09-29 12:58:03.769849-05
\.


--
-- TOC entry 5135 (class 0 OID 16698)
-- Dependencies: 219
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_addresses (id, user_id, street_address, city, state, postal_code, country, is_primary, created_at) FROM stdin;
\.


--
-- TOC entry 5145 (class 0 OID 16920)
-- Dependencies: 229
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (id, user_id, email_notifications, push_notifications, sms_notifications, session_reminders, marketing_emails, theme, timezone, language, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5134 (class 0 OID 16683)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, first_name, last_name, phone, date_of_birth, role, profile_image_url, bio, is_verified, is_active, created_at, updated_at) FROM stdin;
1b760852-694e-41a9-afd6-37f0d42216d7	student@demo.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Demo	Student	\N	\N	student	https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150	\N	f	t	2025-09-28 17:34:44.885969-05	2025-09-28 17:34:44.885969-05
2cebaa54-380c-4e71-8455-66cfb40fdb40	tutor@demo.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Demo	Tutor	\N	\N	tutor	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150	\N	f	t	2025-09-28 17:34:44.885969-05	2025-09-28 17:34:44.885969-05
025efe1f-c8bd-4f8e-9282-6bcdb27db0d7	admin@demo.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Demo	Admin	\N	\N	admin	https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150	\N	f	t	2025-09-28 17:34:44.885969-05	2025-09-28 17:34:44.885969-05
09d63e9d-f137-4b28-a9fb-38012f7e241d	taylor.study@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Taylor	Brown	+1-555-0203	\N	student	\N	Middle school student struggling with algebra. Motivated to improve math skills.	t	t	2025-09-29 12:58:03.769849-05	2025-09-29 15:56:50.015432-05
27bd24b5-2677-4320-a1b1-8adf09ef7464	alex.student@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Alex	Thompson	+1-555-0201	\N	student	\N	High school senior preparing for college entrance exams. Needs help with calculus and physics.	t	t	2025-09-29 12:58:03.769849-05	2025-09-29 15:56:50.015432-05
6f28afdd-9211-49cf-9bef-18216f5a667f	david.cs@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	David	Kim	+1-555-0104	\N	tutor	\N	Software engineer and computer science tutor. Helps students with programming, web development, and algorithms.	t	t	2025-09-29 12:58:03.769849-05	2025-09-29 15:56:50.015432-05
7088f167-1cd0-48db-8f36-26e6cf16417c	jamie.learner@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Jamie	Wilson	+1-555-0202	\N	student	\N	College sophomore studying computer science. Looking for help with advanced programming concepts.	t	t	2025-09-29 12:58:03.769849-05	2025-09-29 15:56:50.015432-05
7b80fc04-d7c0-4123-8c73-c8c33310a817	john.student@example.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	John	Smith	+1234567894	\N	student	\N	High school student looking to improve in math and science	t	t	2025-09-25 14:33:18.621316-05	2025-09-29 15:56:50.015432-05
80812a35-7730-4408-978b-6778c5c8135e	sarah.math@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Sarah	Johnson	+1234567891	\N	tutor	\N	Experienced mathematics tutor with 5+ years of teaching experience	t	t	2025-09-25 14:33:18.611429-05	2025-09-29 15:56:50.015432-05
8f541560-36bb-4a6c-81fc-fcf0c2320314	emma.language@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Emma	Rodriguez	+1-555-0103	\N	tutor	\N	Bilingual educator specializing in Spanish and English. Native Spanish speaker with 5 years tutoring experience.	t	t	2025-09-29 12:58:03.769849-05	2025-09-29 15:56:50.015432-05
9035f001-56a5-4ec4-9b51-b412193ed125	maria.spanish@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Maria	Rodriguez	+1234567893	\N	tutor	\N	Native Spanish speaker with teaching certification	t	t	2025-09-25 14:33:18.618913-05	2025-09-29 15:56:50.015432-05
919affe9-c8f0-45b5-aaf4-0cbe1f213c65	mike.science@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Michael	Chen	+1-555-0102	\N	tutor	\N	PhD in Physics with passion for teaching. I help students understand complex scientific concepts through practical examples.	t	t	2025-09-29 12:58:03.769849-05	2025-09-29 15:56:50.015432-05
9d5c540b-e76c-4511-ad1b-615b98b54cae	david.physics@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	David	Chen	+1234567892	\N	tutor	\N	Physics PhD with passion for making complex concepts simple	t	t	2025-09-25 14:33:18.615982-05	2025-09-29 15:56:50.015432-05
e42db01c-739b-4b03-a288-e8ead8c5f8e7	emma.student@example.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Emma	Wilson	+1234567895	\N	student	\N	College freshman seeking help with organic chemistry	t	t	2025-09-25 14:33:18.624785-05	2025-09-29 15:56:50.015432-05
ef910e0b-1654-489e-b3f4-d647a22bff84	admin@tutorconnect.com	$2b$10$Dcz6SwwJs7NiUqQZXhY18uIigg6RL8oU2TBiRVr3gV1WTlEybVTaK	Admin	User	+1234567890	\N	admin	\N	System administrator for TutorConnect platform	t	t	2025-09-25 14:33:18.607808-05	2025-09-29 15:56:50.015432-05
\.


-- Completed on 2025-09-30 11:43:52

--
-- PostgreSQL database dump complete
--

\unrestrict XCaPJ8wpzU8TCjPT2naWQT23ZWfooTN2LYZGfrSVNIyOgvwLxy60mbXnMUUN7LX

