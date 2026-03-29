--
-- PostgreSQL database dump
--

\restrict 1iPMVQrRGATijxSvIbheUWXK5gGWn23XjvyeBHFzUsgfZtPjGNCu27KGgYbTeab

-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flights; Type: TABLE; Schema: public; Owner: idilbalandi
--

CREATE TABLE public.flights (
    id integer NOT NULL,
    flight_number character varying(50),
    airport_from character varying(50),
    airport_to character varying(50),
    date_from date,
    date_to date,
    duration integer,
    capacity integer
);


ALTER TABLE public.flights OWNER TO idilbalandi;

--
-- Name: flights_id_seq; Type: SEQUENCE; Schema: public; Owner: idilbalandi
--

CREATE SEQUENCE public.flights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flights_id_seq OWNER TO idilbalandi;

--
-- Name: flights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: idilbalandi
--

ALTER SEQUENCE public.flights_id_seq OWNED BY public.flights.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: idilbalandi
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    flight_id integer,
    full_name character varying(150),
    date date,
    ticket_number character varying(50),
    seat_number integer,
    is_checked_in boolean DEFAULT false
);


ALTER TABLE public.tickets OWNER TO idilbalandi;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: idilbalandi
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO idilbalandi;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: idilbalandi
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: flights id; Type: DEFAULT; Schema: public; Owner: idilbalandi
--

ALTER TABLE ONLY public.flights ALTER COLUMN id SET DEFAULT nextval('public.flights_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: idilbalandi
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Data for Name: flights; Type: TABLE DATA; Schema: public; Owner: idilbalandi
--

COPY public.flights (id, flight_number, airport_from, airport_to, date_from, date_to, duration, capacity) FROM stdin;
1	\N	\N	\N	\N	\N	\N	\N
2	\N	BER	CDG	2026-04-03	2026-04-03	\N	\N
4	XQ408	BER	ADB	2026-04-08	2026-04-08	180	2
5	TK108	IST	BER	2026-04-01	2026-04-02	180	100
6	TK109	BER	CDG	2026-04-03	2026-04-03	120	80
7	TK110	CDG	AMS	2026-04-05	2026-04-05	90	60
8	TK111	AMS	IST	2026-04-06	2026-04-06	200	150
9	TK112	IST	DXB	2026-04-07	2026-04-07	240	200
3	TK103	IST	ORY	2026-04-04	2026-04-04	180	8
10	LH456	FRA	JFK	2026-03-29	2026-03-29	510	3
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: idilbalandi
--

COPY public.tickets (id, flight_id, full_name, date, ticket_number, seat_number, is_checked_in) FROM stdin;
1	3	İdil Balandı	2026-04-04	TCK-1774547568493	1	t
\.


--
-- Name: flights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: idilbalandi
--

SELECT pg_catalog.setval('public.flights_id_seq', 10, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: idilbalandi
--

SELECT pg_catalog.setval('public.tickets_id_seq', 1, true);


--
-- Name: flights flights_pkey; Type: CONSTRAINT; Schema: public; Owner: idilbalandi
--

ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: idilbalandi
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_flight_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: idilbalandi
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_flight_id_fkey FOREIGN KEY (flight_id) REFERENCES public.flights(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 1iPMVQrRGATijxSvIbheUWXK5gGWn23XjvyeBHFzUsgfZtPjGNCu27KGgYbTeab

