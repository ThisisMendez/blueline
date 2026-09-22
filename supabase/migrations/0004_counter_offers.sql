-- Legacy rows remain null and require a new analysis; no draft is invented.
alter table public.review_flags
  add column counter_offer text,
  add column residual_risk text,
  add constraint counter_offer_not_blank check (counter_offer is null or length(btrim(counter_offer)) > 0),
  add constraint residual_risk_not_blank check (residual_risk is null or length(btrim(residual_risk)) > 0),
  add constraint counter_offer_has_residual_risk check ((counter_offer is null) = (residual_risk is null));
