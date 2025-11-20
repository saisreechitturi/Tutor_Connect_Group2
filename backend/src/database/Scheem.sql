--
-- PostgreSQL database dump
--

\restrict jqmAyIn85izSTQ1QQ6neOykzjAta7eZi9e5F3WSVC7Kojj2KlKJctkV0T1x1I1V

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-20 13:11:25

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
-- TOC entry 5312 (class 1262 OID 16388)
-- Name: TutorConnect; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "TutorConnect" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE "TutorConnect" OWNER TO postgres;

\unrestrict jqmAyIn85izSTQ1QQ6neOykzjAta7eZi9e5F3WSVC7Kojj2KlKJctkV0T1x1I1V
\connect "TutorConnect"
\restrict jqmAyIn85izSTQ1QQ6neOykzjAta7eZi9e5F3WSVC7Kojj2KlKJctkV0T1x1I1V

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
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 239 (class 1255 OID 26665)
-- Name: update_ai_chat_session_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ai_chat_session_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
                UPDATE ai_chat_sessions 
                SET updated_at = NOW(),
                    total_messages = total_messages + 1
                WHERE id = NEW.session_id;
                RETURN NEW;
            END;
            $$;


ALTER FUNCTION public.update_ai_chat_session_timestamp() OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 25914)
-- Name: update_tutor_performance_metrics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tutor_performance_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            -- This function will be called when sessions are completed
            IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
                INSERT INTO tutor_performance_metrics (
                    tutor_id, year, month, total_sessions, completed_sessions, 
                    total_earnings, total_hours
                )
                VALUES (
                    NEW.tutor_id,
                    EXTRACT(YEAR FROM NEW.scheduled_start),
                    EXTRACT(MONTH FROM NEW.scheduled_start),
                    1, 1,
                    COALESCE(NEW.payment_amount, 0),
                    NEW.duration_minutes / 60.0
                )
                ON CONFLICT (tutor_id, year, month) 
                DO UPDATE SET
                    total_sessions = tutor_performance_metrics.total_sessions + 1,
                    completed_sessions = tutor_performance_metrics.completed_sessions + 1,
                    total_earnings = tutor_performance_metrics.total_earnings + COALESCE(NEW.payment_amount, 0),
                    total_hours = tutor_performance_metrics.total_hours + (NEW.duration_minutes / 60.0),
                    updated_at = CURRENT_TIMESTAMP;
            END IF;
            
            RETURN NEW;
        END;
        $$;


ALTER FUNCTION public.update_tutor_performance_metrics() OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 16390)
-- Name: update_tutor_profile_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tutor_profile_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update total_sessions and rating when session is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE tutor_profiles 
        SET total_sessions = total_sessions + 1,
            rating = COALESCE((
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM session_reviews sr
                JOIN tutoring_sessions ts ON sr.session_id = ts.id
                WHERE ts.tutor_id = NEW.tutor_id
            ), rating)
        WHERE user_id = NEW.tutor_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_tutor_profile_stats() OWNER TO postgres;

--
-- TOC entry 240 (class 1255 OID 16391)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 26640)
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message_type character varying(20) NOT NULL,
    content text NOT NULL,
    model_used character varying(100),
    tokens_used integer,
    response_time_ms integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_chat_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])))
);


ALTER TABLE public.ai_chat_messages OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 26622)
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) DEFAULT 'New Chat'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    total_messages integer DEFAULT 0
);


ALTER TABLE public.ai_chat_sessions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16700)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16781)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16715)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid,
    payer_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'mock'::character varying NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    recipient_id uuid,
    currency character varying(3) DEFAULT 'USD'::character varying,
    description text DEFAULT 'Mock payment'::text,
    CONSTRAINT payments_payment_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('refunded'::character varying)::text]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16681)
-- Name: session_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewer_type character varying(20) NOT NULL,
    rating integer NOT NULL,
    comment text,
    would_recommend boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reviewee_id uuid NOT NULL,
    CONSTRAINT session_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT session_reviews_reviewer_type_check CHECK (((reviewer_type)::text = ANY (ARRAY[('student'::character varying)::text, ('tutor'::character varying)::text])))
);


ALTER TABLE public.session_reviews OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16762)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description text,
    category character varying(50) DEFAULT 'general'::character varying,
    data_type character varying(20) DEFAULT 'string'::character varying,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT settings_data_type_check CHECK (((data_type)::text = ANY (ARRAY[('string'::character varying)::text, ('number'::character varying)::text, ('boolean'::character varying)::text, ('json'::character varying)::text])))
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16602)
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    grade_level character varying(50),
    school_name character varying(255),
    learning_goals text,
    preferred_learning_style character varying(50),
    subjects_of_interest text[],
    availability_schedule jsonb,
    emergency_contact jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_profiles_preferred_learning_style_check CHECK (((preferred_learning_style)::text = ANY (ARRAY[('visual'::character varying)::text, ('auditory'::character varying)::text, ('kinesthetic'::character varying)::text, ('reading'::character varying)::text, ('both'::character varying)::text])))
);


ALTER TABLE public.student_profiles OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16884)
-- Name: student_progress_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_progress_tracking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    tutor_id uuid,
    skill_name character varying(255) NOT NULL,
    proficiency_level character varying(50) NOT NULL,
    progress_percentage integer DEFAULT 0,
    last_assessment_date timestamp with time zone,
    next_milestone character varying(255),
    strengths text[],
    areas_for_improvement text[],
    learning_resources jsonb,
    parent_feedback text,
    tutor_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_progress_tracking_proficiency_level_check CHECK (((proficiency_level)::text = ANY (ARRAY[('beginner'::character varying)::text, ('elementary'::character varying)::text, ('intermediate'::character varying)::text, ('advanced'::character varying)::text, ('expert'::character varying)::text]))),
    CONSTRAINT student_progress_tracking_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100)))
);


ALTER TABLE public.student_progress_tracking OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16587)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16795)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    estimated_hours numeric(5,2),
    tags text[],
    progress_percentage integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    subject character varying(100),
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text]))),
    CONSTRAINT tasks_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16815)
-- Name: tutor_availability_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_availability_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_recurring boolean DEFAULT true NOT NULL,
    specific_date date,
    CONSTRAINT check_time_range CHECK ((end_time > start_time)),
    CONSTRAINT tutor_availability_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.tutor_availability_slots OWNER TO postgres;

--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE tutor_availability_slots; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tutor_availability_slots IS 'Simplified tutor availability slots - recurring weekly slots by day of week';


--
-- TOC entry 234 (class 1259 OID 16837)
-- Name: tutor_earnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_earnings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    session_id uuid NOT NULL,
    gross_amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    net_amount numeric(10,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payout_date timestamp with time zone,
    tax_year integer,
    currency character varying(3) DEFAULT 'USD'::character varying,
    exchange_rate numeric(10,4) DEFAULT 1.0000,
    payment_method character varying(50),
    transaction_reference character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_earnings_payment_status_check CHECK (((payment_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('paid'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.tutor_earnings OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16857)
-- Name: tutor_performance_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_performance_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    total_sessions integer DEFAULT 0,
    completed_sessions integer DEFAULT 0,
    cancelled_sessions integer DEFAULT 0,
    no_show_sessions integer DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT 0.00,
    total_hours numeric(8,2) DEFAULT 0.00,
    average_rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    response_time_hours numeric(5,2) DEFAULT 0.00,
    new_students integer DEFAULT 0,
    returning_students integer DEFAULT 0,
    satisfaction_score numeric(3,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_performance_metrics_month_check CHECK (((month >= 1) AND (month <= 12)))
);


ALTER TABLE public.tutor_performance_metrics OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16617)
-- Name: tutor_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    years_of_experience integer NOT NULL,
    education_background text,
    certifications text[],
    teaching_philosophy text,
    rating numeric(3,2) DEFAULT 0.00,
    total_students integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    languages_spoken character varying(255),
    preferred_teaching_method character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_earnings numeric(10,2) DEFAULT 0.00,
    weekly_availability_hours numeric(5,2) DEFAULT 0.00,
    monthly_earnings numeric(10,2) DEFAULT 0.00,
    is_available_now boolean DEFAULT true,
    CONSTRAINT tutor_profiles_preferred_teaching_method_check CHECK (((preferred_teaching_method)::text = ANY (ARRAY[('online'::character varying)::text, ('in_person'::character varying)::text, ('both'::character varying)::text]))),
    CONSTRAINT tutor_profiles_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


ALTER TABLE public.tutor_profiles OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16434)
-- Name: tutor_search_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.tutor_search_view AS
 SELECT NULL::uuid AS id,
    NULL::character varying(100) AS first_name,
    NULL::character varying(100) AS last_name,
    NULL::character varying(255) AS email,
    NULL::character varying(500) AS profile_image_url,
    NULL::text AS bio,
    NULL::numeric(8,2) AS hourly_rate,
    NULL::integer AS experience_years,
    NULL::text AS education,
    NULL::numeric(3,2) AS rating,
    NULL::integer AS total_reviews,
    NULL::integer AS total_sessions,
    NULL::boolean AS is_available,
    NULL::character varying(255) AS languages,
    NULL::character varying(20) AS preferred_session_type,
    NULL::character varying[] AS subjects,
    NULL::character varying[] AS subject_categories;


ALTER VIEW public.tutor_search_view OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16645)
-- Name: tutor_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tutor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    proficiency_level character varying(50),
    years_taught integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutor_subjects_proficiency_level_check CHECK (((proficiency_level)::text = ANY (ARRAY[('beginner'::character varying)::text, ('intermediate'::character varying)::text, ('advanced'::character varying)::text, ('expert'::character varying)::text])))
);


ALTER TABLE public.tutor_subjects OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16658)
-- Name: tutoring_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutoring_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    tutor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    session_type character varying(20) NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    hourly_rate numeric(10,2) NOT NULL,
    payment_amount numeric(10,2),
    session_notes text,
    homework_assigned text,
    materials_used text[],
    meeting_link character varying(500),
    meeting_room character varying(255),
    cancellation_reason text,
    cancelled_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    session_date timestamp with time zone,
    duration_minutes integer GENERATED ALWAYS AS ((EXTRACT(epoch FROM (scheduled_end - scheduled_start)) / (60)::numeric)) STORED,
    CONSTRAINT tutoring_sessions_session_type_check CHECK (((session_type)::text = ANY (ARRAY[('online'::character varying)::text, ('in_person'::character varying)::text]))),
    CONSTRAINT tutoring_sessions_status_check CHECK (((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text, ('no_show'::character varying)::text])))
);


ALTER TABLE public.tutoring_sessions OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16548)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    date_of_birth date,
    role character varying(20) NOT NULL,
    profile_picture_url text,
    bio text,
    email_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    address text,
    pincode character varying(20),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('student'::character varying)::text, ('tutor'::character varying)::text, ('admin'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN users.date_of_birth; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.date_of_birth IS 'User date of birth for age verification and demographics';


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN users.pincode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.pincode IS 'Postal/ZIP code for user address - for future use';


--
-- TOC entry 5125 (class 2606 OID 26654)
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5121 (class 2606 OID 26634)
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5092 (class 2606 OID 16714)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 16792)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5103 (class 2606 OID 16794)
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 5105 (class 2606 OID 17548)
-- Name: password_reset_tokens password_reset_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_key UNIQUE (user_id);


--
-- TOC entry 5095 (class 2606 OID 16729)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5084 (class 2606 OID 16697)
-- Name: session_reviews session_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5086 (class 2606 OID 16699)
-- Name: session_reviews session_reviews_session_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_session_id_reviewer_id_key UNIQUE (session_id, reviewer_id);


--
-- TOC entry 5097 (class 2606 OID 16780)
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- TOC entry 5099 (class 2606 OID 16778)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5069 (class 2606 OID 16614)
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 2606 OID 16616)
-- Name: student_profiles student_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 5119 (class 2606 OID 16901)
-- Name: student_progress_tracking student_progress_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 16601)
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- TOC entry 5067 (class 2606 OID 16599)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 5107 (class 2606 OID 16814)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5111 (class 2606 OID 16836)
-- Name: tutor_availability_slots tutor_availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability_slots
    ADD CONSTRAINT tutor_availability_slots_pkey PRIMARY KEY (id);


--
-- TOC entry 5113 (class 2606 OID 16856)
-- Name: tutor_earnings tutor_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_earnings
    ADD CONSTRAINT tutor_earnings_pkey PRIMARY KEY (id);


--
-- TOC entry 5115 (class 2606 OID 16881)
-- Name: tutor_performance_metrics tutor_performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_performance_metrics
    ADD CONSTRAINT tutor_performance_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 16883)
-- Name: tutor_performance_metrics tutor_performance_metrics_tutor_id_year_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_performance_metrics
    ADD CONSTRAINT tutor_performance_metrics_tutor_id_year_month_key UNIQUE (tutor_id, year, month);


--
-- TOC entry 5073 (class 2606 OID 16642)
-- Name: tutor_profiles tutor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5075 (class 2606 OID 16644)
-- Name: tutor_profiles tutor_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 5078 (class 2606 OID 16655)
-- Name: tutor_subjects tutor_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 5080 (class 2606 OID 16657)
-- Name: tutor_subjects tutor_subjects_tutor_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_tutor_id_subject_id_key UNIQUE (tutor_id, subject_id);


--
-- TOC entry 5082 (class 2606 OID 16680)
-- Name: tutoring_sessions tutoring_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5088 (class 2606 OID 25923)
-- Name: session_reviews unique_session_reviewer; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT unique_session_reviewer UNIQUE (session_id, reviewer_id);


--
-- TOC entry 5061 (class 2606 OID 16568)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5063 (class 2606 OID 16566)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 1259 OID 26669)
-- Name: idx_ai_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages USING btree (created_at);


--
-- TOC entry 5127 (class 1259 OID 26667)
-- Name: idx_ai_chat_messages_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages USING btree (session_id);


--
-- TOC entry 5128 (class 1259 OID 26668)
-- Name: idx_ai_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages USING btree (user_id);


--
-- TOC entry 5122 (class 1259 OID 26671)
-- Name: idx_ai_chat_sessions_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_sessions_updated_at ON public.ai_chat_sessions USING btree (updated_at);


--
-- TOC entry 5123 (class 1259 OID 26670)
-- Name: idx_ai_chat_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions USING btree (user_id);


--
-- TOC entry 5089 (class 1259 OID 25897)
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- TOC entry 5090 (class 1259 OID 25911)
-- Name: idx_messages_pair_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_pair_created_at ON public.messages USING btree (sender_id, recipient_id, created_at DESC);


--
-- TOC entry 5093 (class 1259 OID 25898)
-- Name: idx_payments_payer_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_payer_created ON public.payments USING btree (payer_id, created_at DESC);


--
-- TOC entry 5108 (class 1259 OID 25912)
-- Name: idx_tutor_availability_specific_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_availability_specific_date ON public.tutor_availability_slots USING btree (tutor_id, specific_date);


--
-- TOC entry 5109 (class 1259 OID 17708)
-- Name: idx_tutor_availability_tutor_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_availability_tutor_day ON public.tutor_availability_slots USING btree (tutor_id, day_of_week);


--
-- TOC entry 5076 (class 1259 OID 17710)
-- Name: idx_tutor_subjects_tutor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_subjects_tutor ON public.tutor_subjects USING btree (tutor_id);


--
-- TOC entry 5158 (class 2620 OID 26666)
-- Name: ai_chat_messages ai_chat_message_update_session; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ai_chat_message_update_session AFTER INSERT ON public.ai_chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_ai_chat_session_timestamp();


--
-- TOC entry 5156 (class 2620 OID 25915)
-- Name: tutoring_sessions update_tutor_performance_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tutor_performance_trigger AFTER UPDATE ON public.tutoring_sessions FOR EACH ROW EXECUTE FUNCTION public.update_tutor_performance_metrics();


--
-- TOC entry 5157 (class 2620 OID 17038)
-- Name: tutoring_sessions update_tutor_profile_stats_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tutor_profile_stats_trigger AFTER UPDATE ON public.tutoring_sessions FOR EACH ROW EXECUTE FUNCTION public.update_tutor_profile_stats();


--
-- TOC entry 5154 (class 2606 OID 26655)
-- Name: ai_chat_messages ai_chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 26660)
-- Name: ai_chat_messages ai_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5153 (class 2606 OID 26635)
-- Name: ai_chat_sessions ai_chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 25905)
-- Name: payments fk_payments_recipient; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_recipient FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 16957)
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 16952)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 16982)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 16967)
-- Name: payments payments_payer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 16962)
-- Name: payments payments_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 25916)
-- Name: session_reviews session_reviews_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 16947)
-- Name: session_reviews session_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 16942)
-- Name: session_reviews session_reviews_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_reviews
    ADD CONSTRAINT session_reviews_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 16907)
-- Name: student_profiles student_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 17022)
-- Name: student_progress_tracking student_progress_tracking_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 17027)
-- Name: student_progress_tracking student_progress_tracking_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 5152 (class 2606 OID 17032)
-- Name: student_progress_tracking student_progress_tracking_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress_tracking
    ADD CONSTRAINT student_progress_tracking_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5145 (class 2606 OID 16987)
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 17002)
-- Name: tutor_availability_slots tutor_availability_slots_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability_slots
    ADD CONSTRAINT tutor_availability_slots_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 17012)
-- Name: tutor_earnings tutor_earnings_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_earnings
    ADD CONSTRAINT tutor_earnings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 17007)
-- Name: tutor_earnings tutor_earnings_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_earnings
    ADD CONSTRAINT tutor_earnings_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 17017)
-- Name: tutor_performance_metrics tutor_performance_metrics_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_performance_metrics
    ADD CONSTRAINT tutor_performance_metrics_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 16912)
-- Name: tutor_profiles tutor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5131 (class 2606 OID 16922)
-- Name: tutor_subjects tutor_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 16917)
-- Name: tutor_subjects tutor_subjects_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_subjects
    ADD CONSTRAINT tutor_subjects_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 16927)
-- Name: tutoring_sessions tutoring_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 16937)
-- Name: tutoring_sessions tutoring_sessions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 16932)
-- Name: tutoring_sessions tutoring_sessions_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutoring_sessions
    ADD CONSTRAINT tutoring_sessions_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-11-20 13:11:25

--
-- PostgreSQL database dump complete
--

\unrestrict jqmAyIn85izSTQ1QQ6neOykzjAta7eZi9e5F3WSVC7Kojj2KlKJctkV0T1x1I1V

