
-- Obriši test feedback koji sam dodao
DELETE FROM public.votes 
WHERE feedback_id = (
  SELECT id FROM public.feedbacks 
  WHERE title = 'Odličan je ovaj feedback sistem!' 
  LIMIT 1
);

DELETE FROM public.feedbacks 
WHERE title = 'Odličan je ovaj feedback sistem!';
