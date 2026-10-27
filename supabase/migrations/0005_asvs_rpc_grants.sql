-- ASVS 5.0 V8: admin-only RPCs must not be executable by anon.
revoke execute on function public.list_all_applications() from anon, public;
revoke execute on function public.update_application_status(text, text, text) from anon, public;

grant execute on function public.list_all_applications() to authenticated;
grant execute on function public.update_application_status(text, text, text) to authenticated;

revoke execute on function public.submit_volunteer_application(jsonb) from anon, public;
revoke execute on function public.list_volunteer_applications(text) from anon, public;

grant execute on function public.submit_volunteer_application(jsonb) to authenticated;
grant execute on function public.list_volunteer_applications(text) to authenticated;
