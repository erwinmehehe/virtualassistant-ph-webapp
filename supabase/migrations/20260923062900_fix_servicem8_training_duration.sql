-- Keep course metadata equal to the eight 26-minute ServiceM8 lessons.
update public.training_courses
set estimated_minutes = 208,
    updated_at = now()
where slug = 'servicem8-for-virtual-assistants';
