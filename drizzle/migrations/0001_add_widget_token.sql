ALTER TABLE public.preferences ADD COLUMN widget_token TEXT;

CREATE UNIQUE INDEX preferences_widget_token_key
  ON public.preferences (widget_token)
  WHERE widget_token IS NOT NULL;