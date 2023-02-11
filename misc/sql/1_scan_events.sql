-- public.scan_events definition

-- Drop table

-- DROP TABLE public.scan_events;

CREATE TABLE public.scan_events (
	id varchar NOT NULL, -- Unique of the table
	repository_name varchar NOT NULL, -- The repository name to 
	status varchar NOT NULL DEFAULT 'Queued'::character varying, -- The scan's status (one of "Queued", "In Progress", "Success", "Failure")
	status_code int4 NOT NULL DEFAULT 0, -- Status code ("Success" - 0 vulnerability,"Failure" - 1+ vulnerability)
	queued_at timestamp NULL, -- Timestamps that indicate when a scan was queued
	scan_started_at timestamp NULL, -- Timestamps that indicate when a scan was started
	scan_finished timestamp NULL, -- Timestamps that indicate when a scan was finished
	CONSTRAINT scan_events_pk PRIMARY KEY (id)
);
COMMENT ON TABLE public.scan_events IS 'Scan event information';

-- Column comments

COMMENT ON COLUMN public.scan_events.id IS 'Unique of the table';
COMMENT ON COLUMN public.scan_events.repository_name IS 'The repository name to ';
COMMENT ON COLUMN public.scan_events.status IS 'The scan''s status (one of "Queued", "In Progress", "Success", "Failure")';
COMMENT ON COLUMN public.scan_events.status_code IS 'Status code ("Success" - 0 vulnerability,"Failure" - 1+ vulnerability)';
COMMENT ON COLUMN public.scan_events.queued_at IS 'Timestamps that indicate when a scan was queued';
COMMENT ON COLUMN public.scan_events.scan_started_at IS 'Timestamps that indicate when a scan was started';
COMMENT ON COLUMN public.scan_events.scan_finished IS 'Timestamps that indicate when a scan was finished';