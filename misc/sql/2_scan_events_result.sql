-- public.scan_events_result definition

-- Drop table

-- DROP TABLE public.scan_events_result;

CREATE TABLE public.scan_events_result (
	id varchar NOT NULL, -- Unique Id of the table
	scan_event_id varchar NOT NULL, -- Scan ID foreign key
	findings json NULL, -- The findings
	scan_result bool NULL, -- Whether or not the scan can finish the process. true - the process finished. false - there is an error cuasing the process to stop half way through, null - the process has not started yet
	failed_remark varchar NULL, -- Error remark when the process failed to finish
	created_at timestamp NOT NULL, -- Date and time when the record is created.
	CONSTRAINT scan_events_result_pk PRIMARY KEY (id)
);

-- Column comments

COMMENT ON COLUMN public.scan_events_result.id IS 'Unique Id of the table';
COMMENT ON COLUMN public.scan_events_result.scan_event_id IS 'Scan ID foreign key';
COMMENT ON COLUMN public.scan_events_result.findings IS 'The findings';
COMMENT ON COLUMN public.scan_events_result.scan_result IS 'Whether or not the scan can finish the process. true - the process finished. false - there is an error cuasing the process to stop half way through, null - the process has not started yet';
COMMENT ON COLUMN public.scan_events_result.failed_remark IS 'Error remark when the process failed to finish';
COMMENT ON COLUMN public.scan_events_result.created_at IS 'Date and time when the record is created.';


-- public.scan_events_result foreign keys

ALTER TABLE public.scan_events_result ADD CONSTRAINT scan_events_result_fk FOREIGN KEY (scan_event_id) REFERENCES public.scan_events(id);