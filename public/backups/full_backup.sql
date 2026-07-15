--
-- PostgreSQL database dump
--

\restrict F9jLSAyUNCZgK2LdcsnfekW3Vfr4YwDmhSJ2nbGxzH709aN3matVlv4s9xOhP1F

-- Dumped from database version 15.16 (Debian 15.16-0+deb12u1)
-- Dumped by pg_dump version 15.16 (Debian 15.16-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    personnel_id integer NOT NULL,
    attendance_date date NOT NULL,
    check_in timestamp without time zone,
    check_out timestamp without time zone,
    status character varying(30) DEFAULT 'present'::character varying NOT NULL,
    work_minutes integer,
    late_minutes integer DEFAULT 0,
    early_leave_minutes integer DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklists (
    id integer NOT NULL,
    title character varying(300) NOT NULL,
    equipment_type_id integer,
    equipment_id integer,
    description text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    frequency character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.checklists_id_seq OWNED BY public.checklists.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id integer NOT NULL,
    equipment_code character varying(100),
    pm_code character varying(100),
    fe_code character varying(100),
    name character varying(300) NOT NULL,
    model character varying(200),
    serial_number character varying(200),
    manufacturer character varying(200),
    country character varying(100),
    location character varying(300),
    installation_date date,
    manufacture_year character varying(20),
    capacity character varying(200),
    power character varying(200),
    voltage character varying(200),
    parent_id integer,
    level integer DEFAULT 0 NOT NULL,
    node_type character varying(50) DEFAULT 'machine'::character varying NOT NULL,
    authorized_personnel text,
    has_pm boolean DEFAULT true,
    pc_required boolean DEFAULT false,
    ncr_required boolean DEFAULT false,
    cbu_required boolean DEFAULT false,
    calibration_period character varying(100),
    calibration_type character varying(100),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    is_leaf boolean DEFAULT false NOT NULL,
    icon_name character varying(50),
    custom_fields jsonb DEFAULT '{}'::jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer
);


--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: equipment_spare_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_spare_parts (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    part_id integer NOT NULL,
    quantity real DEFAULT 1,
    is_critical boolean DEFAULT false
);


--
-- Name: equipment_spare_parts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_spare_parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_spare_parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_spare_parts_id_seq OWNED BY public.equipment_spare_parts.id;


--
-- Name: file_repository; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_repository (
    id integer NOT NULL,
    original_name character varying(400) NOT NULL,
    stored_name character varying(400),
    mime_type character varying(200),
    size_bytes integer,
    category character varying(100),
    related_equipment_id integer,
    related_wo_id integer,
    uploaded_by integer,
    analysis_result jsonb,
    ai_detected_fields jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: file_repository_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.file_repository_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_repository_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.file_repository_id_seq OWNED BY public.file_repository.id;


--
-- Name: leaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaves (
    id integer NOT NULL,
    personnel_id integer NOT NULL,
    leave_type character varying(50) NOT NULL,
    from_date date NOT NULL,
    to_date date NOT NULL,
    days real NOT NULL,
    reason text,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    approved_by character varying(200),
    approved_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leaves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leaves_id_seq OWNED BY public.leaves.id;


--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_requests (
    id integer NOT NULL,
    mr_number character varying(100) NOT NULL,
    requester_full_name character varying(300) NOT NULL,
    department character varying(200),
    phone character varying(30),
    title character varying(400) NOT NULL,
    description text NOT NULL,
    equipment_id integer,
    location character varying(300),
    priority character varying(30) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(40) DEFAULT 'pending'::character varying NOT NULL,
    converted_to_wo_id integer,
    reviewed_by integer,
    review_notes text,
    requested_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_requests_id_seq OWNED BY public.maintenance_requests.id;


--
-- Name: mapping_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mapping_templates (
    id integer NOT NULL,
    name character varying(300) NOT NULL,
    target_module character varying(100) NOT NULL,
    sheet_name character varying(200),
    header_row_index integer DEFAULT 0,
    column_mappings jsonb NOT NULL,
    learned_from jsonb DEFAULT '[]'::jsonb,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mapping_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mapping_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mapping_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mapping_templates_id_seq OWNED BY public.mapping_templates.id;


--
-- Name: message_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_conversations (
    id integer NOT NULL,
    title character varying(300),
    type character varying(20) DEFAULT 'private'::character varying NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_message_at timestamp without time zone
);


--
-- Name: message_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_conversations_id_seq OWNED BY public.message_conversations.id;


--
-- Name: message_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_participants (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    is_admin boolean DEFAULT false,
    joined_at timestamp without time zone DEFAULT now() NOT NULL,
    last_read_at timestamp without time zone
);


--
-- Name: message_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_participants_id_seq OWNED BY public.message_participants.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnel (
    id integer NOT NULL,
    personnel_code character varying(50),
    full_name character varying(300) NOT NULL,
    national_id character varying(20),
    job_title character varying(200),
    department character varying(200),
    shift character varying(50),
    phone character varying(30),
    email character varying(200),
    hire_date date,
    is_active boolean DEFAULT true NOT NULL,
    skills jsonb DEFAULT '[]'::jsonb,
    notes text,
    avatar_color character varying(20) DEFAULT '#3B82F6'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personnel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personnel_id_seq OWNED BY public.personnel.id;


--
-- Name: pm_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_plans (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    title character varying(300) NOT NULL,
    frequency character varying(50) NOT NULL,
    interval_days integer,
    assignee_id integer,
    description text,
    checklist jsonb DEFAULT '[]'::jsonb,
    estimated_duration integer,
    is_active boolean DEFAULT true NOT NULL,
    last_done date,
    next_due date,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pm_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pm_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pm_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pm_plans_id_seq OWNED BY public.pm_plans.id;


--
-- Name: spare_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spare_parts (
    id integer NOT NULL,
    part_number character varying(100),
    name character varying(300) NOT NULL,
    description text,
    category character varying(100),
    unit character varying(50) DEFAULT 'عدد'::character varying,
    current_stock real DEFAULT 0,
    min_stock real DEFAULT 0,
    max_stock real,
    unit_cost real DEFAULT 0,
    supplier_id integer,
    location character varying(200),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: spare_parts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.spare_parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: spare_parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.spare_parts_id_seq OWNED BY public.spare_parts.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(300) NOT NULL,
    contact_person character varying(200),
    phone character varying(50),
    email character varying(200),
    address text,
    category character varying(100),
    tax_id character varying(50),
    notes text,
    rating real DEFAULT 5,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    full_name character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying NOT NULL,
    email character varying(200),
    phone character varying(20),
    department character varying(100),
    job_title character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    avatar_color character varying(20) DEFAULT '#D4A555'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_order_consultations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_consultations (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    consultant_name character varying(200) NOT NULL,
    consultation_date date NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_order_consultations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_consultations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_consultations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_consultations_id_seq OWNED BY public.work_order_consultations.id;


--
-- Name: work_order_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_history (
    id integer NOT NULL,
    work_order_id integer,
    equipment_id integer,
    activity_type character varying(50) NOT NULL,
    title character varying(300) NOT NULL,
    description text,
    performed_by character varying(200),
    performed_date date NOT NULL,
    duration_minutes integer,
    cost real DEFAULT 0,
    parts_used jsonb DEFAULT '[]'::jsonb,
    outcome character varying(50),
    notes text,
    is_mock_data boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_order_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_history_id_seq OWNED BY public.work_order_history.id;


--
-- Name: work_order_parts_used; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_parts_used (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    part_id integer,
    part_name character varying(300),
    quantity real DEFAULT 1,
    unit_cost real DEFAULT 0,
    total_cost real DEFAULT 0
);


--
-- Name: work_order_parts_used_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_parts_used_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_parts_used_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_parts_used_id_seq OWNED BY public.work_order_parts_used.id;


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_orders (
    id integer NOT NULL,
    wo_number character varying(100) NOT NULL,
    title character varying(400) NOT NULL,
    description text,
    type character varying(50) DEFAULT 'corrective'::character varying NOT NULL,
    priority character varying(30) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(40) DEFAULT 'open'::character varying NOT NULL,
    equipment_id integer,
    requested_by integer,
    assigned_to integer,
    supervisor_id integer,
    requester_name character varying(200),
    source_request_id integer,
    scheduled_date date,
    due_date date,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    estimated_hours real,
    actual_hours real,
    labor_cost real DEFAULT 0,
    parts_cost real DEFAULT 0,
    total_cost real DEFAULT 0,
    failure_type character varying(100),
    root_cause text,
    solution text,
    downtime_minutes integer DEFAULT 0,
    ai_analysis text,
    image_urls jsonb DEFAULT '[]'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_orders_id_seq OWNED BY public.work_orders.id;


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: checklists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists ALTER COLUMN id SET DEFAULT nextval('public.checklists_id_seq'::regclass);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: equipment_spare_parts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_spare_parts ALTER COLUMN id SET DEFAULT nextval('public.equipment_spare_parts_id_seq'::regclass);


--
-- Name: file_repository id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_repository ALTER COLUMN id SET DEFAULT nextval('public.file_repository_id_seq'::regclass);


--
-- Name: leaves id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves ALTER COLUMN id SET DEFAULT nextval('public.leaves_id_seq'::regclass);


--
-- Name: maintenance_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests ALTER COLUMN id SET DEFAULT nextval('public.maintenance_requests_id_seq'::regclass);


--
-- Name: mapping_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapping_templates ALTER COLUMN id SET DEFAULT nextval('public.mapping_templates_id_seq'::regclass);


--
-- Name: message_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_conversations ALTER COLUMN id SET DEFAULT nextval('public.message_conversations_id_seq'::regclass);


--
-- Name: message_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_participants ALTER COLUMN id SET DEFAULT nextval('public.message_participants_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: personnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel ALTER COLUMN id SET DEFAULT nextval('public.personnel_id_seq'::regclass);


--
-- Name: pm_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans ALTER COLUMN id SET DEFAULT nextval('public.pm_plans_id_seq'::regclass);


--
-- Name: spare_parts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts ALTER COLUMN id SET DEFAULT nextval('public.spare_parts_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_order_consultations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_consultations ALTER COLUMN id SET DEFAULT nextval('public.work_order_consultations_id_seq'::regclass);


--
-- Name: work_order_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_history ALTER COLUMN id SET DEFAULT nextval('public.work_order_history_id_seq'::regclass);


--
-- Name: work_order_parts_used id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_used ALTER COLUMN id SET DEFAULT nextval('public.work_order_parts_used_id_seq'::regclass);


--
-- Name: work_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN id SET DEFAULT nextval('public.work_orders_id_seq'::regclass);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, personnel_id, attendance_date, check_in, check_out, status, work_minutes, late_minutes, early_leave_minutes, notes, created_at) FROM stdin;
\.


--
-- Data for Name: checklists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklists (id, title, equipment_type_id, equipment_id, description, items, frequency, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment (id, equipment_code, pm_code, fe_code, name, model, serial_number, manufacturer, country, location, installation_date, manufacture_year, capacity, power, voltage, parent_id, level, node_type, authorized_personnel, has_pm, pc_required, ncr_required, cbu_required, calibration_period, calibration_type, status, is_leaf, icon_name, custom_fields, notes, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: equipment_spare_parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_spare_parts (id, equipment_id, part_id, quantity, is_critical) FROM stdin;
\.


--
-- Data for Name: file_repository; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_repository (id, original_name, stored_name, mime_type, size_bytes, category, related_equipment_id, related_wo_id, uploaded_by, analysis_result, ai_detected_fields, created_at) FROM stdin;
\.


--
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leaves (id, personnel_id, leave_type, from_date, to_date, days, reason, status, approved_by, approved_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_requests (id, mr_number, requester_full_name, department, phone, title, description, equipment_id, location, priority, status, converted_to_wo_id, reviewed_by, review_notes, requested_date, created_at) FROM stdin;
\.


--
-- Data for Name: mapping_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mapping_templates (id, name, target_module, sheet_name, header_row_index, column_mappings, learned_from, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: message_conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_conversations (id, title, type, created_by, created_at, last_message_at) FROM stdin;
\.


--
-- Data for Name: message_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_participants (id, conversation_id, user_id, is_admin, joined_at, last_read_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, sender_id, content, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personnel (id, personnel_code, full_name, national_id, job_title, department, shift, phone, email, hire_date, is_active, skills, notes, avatar_color, created_at) FROM stdin;
\.


--
-- Data for Name: pm_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pm_plans (id, equipment_id, title, frequency, interval_days, assignee_id, description, checklist, estimated_duration, is_active, last_done, next_due, created_at) FROM stdin;
\.


--
-- Data for Name: spare_parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spare_parts (id, part_number, name, description, category, unit, current_stock, min_stock, max_stock, unit_cost, supplier_id, location, created_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, contact_person, phone, email, address, category, tax_id, notes, rating, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, full_name, password_hash, role, email, phone, department, job_title, is_active, avatar_color, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: work_order_consultations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_consultations (id, work_order_id, consultant_name, consultation_date, content, created_at) FROM stdin;
\.


--
-- Data for Name: work_order_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_history (id, work_order_id, equipment_id, activity_type, title, description, performed_by, performed_date, duration_minutes, cost, parts_used, outcome, notes, is_mock_data, created_at) FROM stdin;
\.


--
-- Data for Name: work_order_parts_used; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_parts_used (id, work_order_id, part_id, part_name, quantity, unit_cost, total_cost) FROM stdin;
\.


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_orders (id, wo_number, title, description, type, priority, status, equipment_id, requested_by, assigned_to, supervisor_id, requester_name, source_request_id, scheduled_date, due_date, started_at, completed_at, estimated_hours, actual_hours, labor_cost, parts_cost, total_cost, failure_type, root_cause, solution, downtime_minutes, ai_analysis, image_urls, attachments, tags, created_at, updated_at) FROM stdin;
\.


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: checklists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.checklists_id_seq', 1, false);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_id_seq', 1, false);


--
-- Name: equipment_spare_parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_spare_parts_id_seq', 1, false);


--
-- Name: file_repository_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.file_repository_id_seq', 1, false);


--
-- Name: leaves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leaves_id_seq', 1, false);


--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_requests_id_seq', 1, false);


--
-- Name: mapping_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mapping_templates_id_seq', 1, false);


--
-- Name: message_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.message_conversations_id_seq', 1, false);


--
-- Name: message_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.message_participants_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: personnel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personnel_id_seq', 1, false);


--
-- Name: pm_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pm_plans_id_seq', 1, false);


--
-- Name: spare_parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.spare_parts_id_seq', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: work_order_consultations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_consultations_id_seq', 1, false);


--
-- Name: work_order_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_history_id_seq', 1, false);


--
-- Name: work_order_parts_used_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_parts_used_id_seq', 1, false);


--
-- Name: work_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_orders_id_seq', 1, false);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: checklists checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: equipment_spare_parts equipment_spare_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_spare_parts
    ADD CONSTRAINT equipment_spare_parts_pkey PRIMARY KEY (id);


--
-- Name: file_repository file_repository_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_repository
    ADD CONSTRAINT file_repository_pkey PRIMARY KEY (id);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_mr_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_mr_number_unique UNIQUE (mr_number);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: mapping_templates mapping_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapping_templates
    ADD CONSTRAINT mapping_templates_pkey PRIMARY KEY (id);


--
-- Name: message_conversations message_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_conversations
    ADD CONSTRAINT message_conversations_pkey PRIMARY KEY (id);


--
-- Name: message_participants message_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_participants
    ADD CONSTRAINT message_participants_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: personnel personnel_personnel_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_personnel_code_unique UNIQUE (personnel_code);


--
-- Name: personnel personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_pkey PRIMARY KEY (id);


--
-- Name: pm_plans pm_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_pkey PRIMARY KEY (id);


--
-- Name: spare_parts spare_parts_part_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_part_number_unique UNIQUE (part_number);


--
-- Name: spare_parts spare_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: work_order_consultations work_order_consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_consultations
    ADD CONSTRAINT work_order_consultations_pkey PRIMARY KEY (id);


--
-- Name: work_order_history work_order_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_history
    ADD CONSTRAINT work_order_history_pkey PRIMARY KEY (id);


--
-- Name: work_order_parts_used work_order_parts_used_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_used
    ADD CONSTRAINT work_order_parts_used_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_wo_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_wo_number_unique UNIQUE (wo_number);


--
-- Name: attendance attendance_personnel_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_personnel_id_personnel_id_fk FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE CASCADE;


--
-- Name: checklists checklists_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: equipment_spare_parts equipment_spare_parts_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_spare_parts
    ADD CONSTRAINT equipment_spare_parts_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: equipment_spare_parts equipment_spare_parts_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_spare_parts
    ADD CONSTRAINT equipment_spare_parts_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id) ON DELETE CASCADE;


--
-- Name: file_repository file_repository_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_repository
    ADD CONSTRAINT file_repository_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: leaves leaves_personnel_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_personnel_id_personnel_id_fk FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: maintenance_requests maintenance_requests_reviewed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: message_conversations message_conversations_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_conversations
    ADD CONSTRAINT message_conversations_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: message_participants message_participants_conversation_id_message_conversations_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_participants
    ADD CONSTRAINT message_participants_conversation_id_message_conversations_id_f FOREIGN KEY (conversation_id) REFERENCES public.message_conversations(id) ON DELETE CASCADE;


--
-- Name: message_participants message_participants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_participants
    ADD CONSTRAINT message_participants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_message_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_message_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.message_conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pm_plans pm_plans_assignee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_assignee_id_users_id_fk FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: pm_plans pm_plans_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: spare_parts spare_parts_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: work_order_consultations work_order_consultations_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_consultations
    ADD CONSTRAINT work_order_consultations_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_history work_order_history_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_history
    ADD CONSTRAINT work_order_history_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: work_order_history work_order_history_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_history
    ADD CONSTRAINT work_order_history_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_parts_used work_order_parts_used_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_used
    ADD CONSTRAINT work_order_parts_used_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id);


--
-- Name: work_order_parts_used work_order_parts_used_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_used
    ADD CONSTRAINT work_order_parts_used_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_orders work_orders_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: work_orders work_orders_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_requested_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: work_orders work_orders_supervisor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_supervisor_id_users_id_fk FOREIGN KEY (supervisor_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict F9jLSAyUNCZgK2LdcsnfekW3Vfr4YwDmhSJ2nbGxzH709aN3matVlv4s9xOhP1F

