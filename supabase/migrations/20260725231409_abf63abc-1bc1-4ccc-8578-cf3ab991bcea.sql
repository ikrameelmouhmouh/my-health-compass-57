INSERT INTO public.exercise_frame_jobs (exercise_id, status, error, updated_at) VALUES
('bottoms-up-clean','review',NULL,now()),
('box-jump','review',NULL,now()),
('bulgarian-split-squat-band','review',NULL,now()),
('bulgarian-split-squat-barbell','review',NULL,now()),
('bulgarian-split-squat-dumbbell','review',NULL,now()),
('burpee','review',NULL,now()),
('burpee-trx','review',NULL,now()),
('butt-blaster','review',NULL,now())
ON CONFLICT (exercise_id) DO UPDATE SET status='review', error=NULL, updated_at=now();