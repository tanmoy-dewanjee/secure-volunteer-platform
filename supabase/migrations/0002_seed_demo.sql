-- Demo catalogue: accounts, events, applications, volunteers, shifts and audit.
-- Safe to re-run. Apply after 0001_init.sql in the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.seed_demo_auth_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_meta jsonb
) returns void
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
begin
  if exists (select 1 from auth.users where id = p_id or email = p_email) then
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    p_meta,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_email,
    now(),
    now(),
    now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Demo auth accounts (passwords below are for the educational prototype only)
-- Students: Volunteer1!    Admins: Coordinator1!
-- ---------------------------------------------------------------------------
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111111',
  'a1991246@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1991246","display_name":"Alex Nguyen"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111112',
  'a1882201@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1882201","display_name":"Priya Shah"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111113',
  'a1773344@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1773344","display_name":"Chris Adeyemi"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111114',
  'a1664488@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1664488","display_name":"Jamie Cole"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111115',
  'a1556677@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1556677","display_name":"Sam Okonkwo"}'::jsonb
);
select public.seed_demo_auth_user(
  '22222222-2222-4222-8222-222222222221',
  'super.admin@clubs.example.edu.au',
  'Coordinator1!',
  '{"portal":"admin","role":"super_admin","username":"super.admin","display_name":"Maya Chen"}'::jsonb
);
select public.seed_demo_auth_user(
  '22222222-2222-4222-8222-222222222222',
  'rotaract.admin@clubs.example.edu.au',
  'Coordinator1!',
  '{"portal":"admin","role":"event_coordinator","username":"rotaract.admin","display_name":"Jordan Blake"}'::jsonb
);
select public.seed_demo_auth_user(
  '22222222-2222-4222-8222-222222222223',
  'viewer.admin@clubs.example.edu.au',
  'Coordinator1!',
  '{"portal":"admin","role":"viewer","username":"viewer.admin","display_name":"Sam Okonkwo"}'::jsonb
);

insert into public.profiles (
  id, username, display_name, email, portal, role, campus, phone, bio, skills,
  availability, hours, events_attended, points, profile_data
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'a1991246', 'Alex Nguyen', 'a1991246@adelaide.edu.au', 'student', 'student',
    'Adelaide City', '0412 334 721',
    'Engineering student who likes visitor-facing roles, STEM showcases and practical community builds.',
    ARRAY['Welcome desk','Crowd flow','First aid awareness']::text[],
    'Weekday afternoons and most Saturdays.', 24, 6, 320,
    '{"hours":24,"eventsAttended":6,"points":320}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111112',
    'a1882201', 'Priya Shah', 'a1882201@adelaide.edu.au', 'student', 'student',
    'Mawson Lakes', '0433 891 004',
    'Health student interested in welcome desks and wellbeing events.',
    ARRAY['Wellbeing','Support']::text[],
    'Weekends and Wednesday afternoons.', 18, 4, 210,
    '{}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111113',
    'a1773344', 'Chris Adeyemi', 'a1773344@adelaide.edu.au', 'student', 'student',
    'Adelaide City', '0408 112 993',
    'Hands-on volunteer for community builds and outdoor roles.',
    ARRAY['Community','Outdoors']::text[],
    'Saturdays.', 31, 8, 410,
    '{}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111114',
    'a1664488', 'Jamie Cole', 'a1664488@adelaide.edu.au', 'student', 'student',
    'Magill', '0491 570 006',
    'Peer mentoring interest. Reliability needs review.',
    ARRAY['Mentoring']::text[],
    'Afternoons.', 6, 1, 40,
    '{}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111115',
    'a1556677', 'Sam Okonkwo', 'a1556677@adelaide.edu.au', 'student', 'student',
    'Roseworthy', '0422 776 310',
    'Sports and welcome roles across regional campuses.',
    ARRAY['Sport','Welcome']::text[],
    'Most Saturdays.', 12, 3, 160,
    '{}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222221',
    'super.admin', 'Maya Chen', 'super.admin@clubs.example.edu.au', 'admin', 'super_admin',
    'Adelaide City', null, 'University clubs office super admin (demo).',
    '{}'::text[], null, 0, 0, 0, '{}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'rotaract.admin', 'Jordan Blake', 'rotaract.admin@clubs.example.edu.au', 'admin', 'event_coordinator',
    'Adelaide City', null, 'Rotaract event coordinator (demo).',
    '{}'::text[], null, 0, 0, 0, '{}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222223',
    'viewer.admin', 'Sam Okonkwo', 'viewer.admin@clubs.example.edu.au', 'admin', 'viewer',
    'Adelaide City', null, 'Read-only coordinator (demo).',
    '{}'::text[], null, 0, 0, 0, '{}'::jsonb
  )
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  email = excluded.email,
  portal = excluded.portal,
  role = excluded.role,
  campus = excluded.campus,
  phone = excluded.phone,
  bio = excluded.bio,
  skills = excluded.skills,
  availability = excluded.availability,
  hours = excluded.hours,
  events_attended = excluded.events_attended,
  points = excluded.points,
  profile_data = excluded.profile_data,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Events from the student/admin catalogue
-- ---------------------------------------------------------------------------
insert into public.events (
  id, title, tagline, category, tags, description, date, start_time, end_time,
  campus, location, organisation_id, contact_email, capacity, places_available,
  status, requirements, roles, shifts, banner_image, poster_image, featured,
  trending_score, application_deadline, accessibility_notes, lat, lng,
  ask_resume, custom_fields
) values
(
    'ingenuity-2026',
    'Ingenuity 2026',
    'Showcase student innovation across STEM.',
    'STEM',
    ARRAY['STEM', 'Visitors', 'Innovation', 'City']::text[],
    'Support a flagship university event showcasing student innovation, technology and engineering projects. Volunteers welcome visitors, staff registration points and help the event team deliver a smooth experience.',
    '11 November 2026',
    '9:00 AM',
    '5:00 PM',
    'Adelaide City',
    'Adelaide Convention Centre, North Terrace, Adelaide SA',
    'engineering-society',
    'events@example.edu.au',
    30,
    12,
    'Open',
    ARRAY['Current Adelaide University student or approved volunteer', 'Available for the allocated volunteer shift', 'Complete the volunteer briefing before the event']::text[],
    '[{"id":"registration","title":"Registration Support","description":"Welcome attendees, assist with registration and direct visitors.","placesAvailable":4},{"id":"visitor-support","title":"Visitor Support","description":"Help attendees locate exhibits, facilities and information.","placesAvailable":5},{"id":"event-support","title":"Event Support","description":"Assist coordinators with general event operations.","placesAvailable":3}]'::jsonb,
    '[{"id":"ing-am","label":"Morning","startTime":"9:00 AM","endTime":"1:00 PM","placesAvailable":6},{"id":"ing-pm","label":"Afternoon","startTime":"1:00 PM","endTime":"5:00 PM","placesAvailable":6}]'::jsonb,
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
    true,
    98,
    '1 November 2026',
    'Step-free access, quiet room available, seated rest points.',
    -34.9206,
    138.5986,
    false,
    '[]'::jsonb
  ),
(
    'wellbeing-expo',
    'Student Wellbeing Expo',
    'Help students find support across campus.',
    'Wellbeing',
    ARRAY['Wellbeing', 'Welcome', 'Support']::text[],
    'Help deliver a student wellbeing event and support attendees throughout the day. Volunteers guide students to services, activities and information booths.',
    '18 November 2026',
    '10:00 AM',
    '3:00 PM',
    'Mawson Lakes',
    'Mawson Lakes Campus, Building C Atrium',
    'mental-health-collective',
    'wellbeing@example.edu.au',
    20,
    8,
    'Open',
    ARRAY['Available during the allocated shift', 'Attend the volunteer briefing']::text[],
    '[{"id":"welcome","title":"Welcome Volunteer","description":"Welcome students and help them find their way around.","placesAvailable":4},{"id":"activity-support","title":"Activity Support","description":"Help staff with activities and information booths.","placesAvailable":4}]'::jsonb,
    '[{"id":"wb-full","label":"Full day","startTime":"10:00 AM","endTime":"3:00 PM","placesAvailable":8}]'::jsonb,
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    false,
    84,
    '10 November 2026',
    'Indoor venue with lift access and quiet space.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'peer-mentor',
    'Peer Mentor Welcome Day',
    'Welcome new students into campus life.',
    'Mentoring',
    ARRAY['Mentoring', 'Orientation', 'Welcome']::text[],
    'Help welcome new students and support peer connection and orientation activities across Magill campus.',
    '25 November 2026',
    '9:30 AM',
    '2:30 PM',
    'Magill',
    'Magill Campus, Hartley Building',
    'peer-mentors',
    'mentoring@example.edu.au',
    16,
    0,
    'Coming soon',
    ARRAY['Current student mentor or approved volunteer', 'Attend the briefing once applications open']::text[],
    '[{"id":"orientation-support","title":"Orientation Support","description":"Guide new students through welcome activities.","placesAvailable":0}]'::jsonb,
    '[{"id":"pm-day","label":"Welcome session","startTime":"9:30 AM","endTime":"2:30 PM","placesAvailable":0}]'::jsonb,
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80',
    false,
    76,
    '18 November 2026',
    'Outdoor and indoor mix; shaded rest areas available.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'open-day-city',
    'City Campus Open Day',
    'Help future students explore the city campus.',
    'Community',
    ARRAY['Visitors', 'Campus', 'Welcome', 'City']::text[],
    'Support campus tours, information tents and wayfinding for prospective students and families during Open Day.',
    '5 December 2026',
    '8:30 AM',
    '4:00 PM',
    'Adelaide City',
    'North Terrace Campus, Hub Central',
    'ausa',
    'openday@example.edu.au',
    40,
    18,
    'Open',
    ARRAY['Comfortable being on your feet for a shift', 'Complete the Open Day briefing']::text[],
    '[{"id":"tour-guide","title":"Campus Tour Support","description":"Help tour leaders keep groups together and on time.","placesAvailable":8},{"id":"info-tent","title":"Information Tent","description":"Answer basic wayfinding questions and hand out maps.","placesAvailable":10}]'::jsonb,
    '[{"id":"od-am","label":"Morning","startTime":"8:30 AM","endTime":"12:30 PM","placesAvailable":9},{"id":"od-pm","label":"Afternoon","startTime":"12:30 PM","endTime":"4:00 PM","placesAvailable":9}]'::jsonb,
    'https://images.unsplash.com/photo-1541339906-3ea1bd3d1560?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1541339906-3ea1bd3d1560?auto=format&fit=crop&w=900&q=80',
    true,
    91,
    '20 November 2026',
    'Multiple step-free routes; maps include accessible paths.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'ewb-community-build',
    'EWB Community Build Day',
    'Hands-on engineering with a community partner.',
    'STEM',
    ARRAY['STEM', 'Community', 'Hands-on']::text[],
    'Join Engineers Without Borders for a practical community build. Volunteers help with materials, safety marshalling and visitor briefings.',
    '14 November 2026',
    '8:00 AM',
    '3:00 PM',
    'Mawson Lakes',
    'Mawson Lakes Campus, Engineering Yard',
    'ewb',
    'ewb@example.edu.au',
    22,
    9,
    'Open',
    ARRAY['Closed-toe shoes', 'Safety briefing on the day']::text[],
    '[{"id":"build-crew","title":"Build Crew","description":"Support the practical build under supervisor direction.","placesAvailable":6},{"id":"safety-marshal","title":"Safety Marshal","description":"Help keep walkways clear and visitors in safe zones.","placesAvailable":3}]'::jsonb,
    '[{"id":"ewb-day","label":"Build day","startTime":"8:00 AM","endTime":"3:00 PM","placesAvailable":9}]'::jsonb,
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
    false,
    80,
    '7 November 2026',
    'Outdoor site; please tell us about access needs in advance.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'ausa-orientation-crew',
    'AUSA Orientation Crew',
    'Shape the first-week student experience.',
    'Mentoring',
    ARRAY['Orientation', 'Welcome', 'Campus life']::text[],
    'Volunteer with AUSA Crew during orientation. Help with events, student programmes and behind-the-scenes setup.',
    '16 February 2027',
    '10:00 AM',
    '6:00 PM',
    'Adelaide City',
    'Union House and Barr Smith Lawns',
    'ausa',
    'crew@example.edu.au',
    28,
    14,
    'Open',
    ARRAY['Available for at least one full orientation shift', 'Complete Crew induction']::text[],
    '[{"id":"event-crew","title":"Event Crew","description":"Support student events, queues and activity rotations.","placesAvailable":8},{"id":"setup-crew","title":"Setup and Pack Down","description":"Help set spaces, move equipment and close venues.","placesAvailable":6}]'::jsonb,
    '[{"id":"ausa-day","label":"Day crew","startTime":"10:00 AM","endTime":"3:00 PM","placesAvailable":8},{"id":"ausa-eve","label":"Evening crew","startTime":"3:00 PM","endTime":"6:00 PM","placesAvailable":6}]'::jsonb,
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
    false,
    88,
    '20 January 2027',
    'Mix of indoor and outdoor venues; rest breaks rostered.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'foodbank-packing',
    'Foodbank Packing Morning',
    'Pack food hampers with a community partner.',
    'Community',
    ARRAY['Community', 'Hands-on', 'Service']::text[],
    'A verified community-partner shift packing hampers and sorting donations with Foodbank SA. Suitable for volunteers who want a practical off-campus contribution.',
    '12 October 2026',
    '9:00 AM',
    '12:30 PM',
    'Adelaide City',
    'Foodbank SA, 1-3 Churchill Road North, Dry Creek SA',
    'rotaract',
    'partners@example.edu.au',
    15,
    6,
    'In progress',
    ARRAY['Closed-toe shoes', 'Ability to stand for the shift or request a seated role']::text[],
    '[{"id":"packing","title":"Hamper Packing","description":"Pack and label food hampers in a warehouse team.","placesAvailable":4},{"id":"sorting","title":"Donation Sorting","description":"Sort incoming donations into storage categories.","placesAvailable":2}]'::jsonb,
    '[{"id":"fb-am","label":"Morning packing","startTime":"9:00 AM","endTime":"12:30 PM","placesAvailable":6}]'::jsonb,
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80',
    false,
    73,
    '1 October 2026',
    'Warehouse environment; seated sorting roles available.',
    -34.8334,
    138.6115,
    true,
    '[]'::jsonb
  ),
(
    'science-open-night',
    'Science Open Night',
    'Bring public science to campus after dark.',
    'STEM',
    ARRAY['STEM', 'Visitors', 'Research']::text[],
    'Support a faculty public science night with exhibit stewards, queue management and family-friendly activity helpers.',
    '21 November 2026',
    '5:00 PM',
    '9:00 PM',
    'Adelaide City',
    'The Braggs and adjacent science precinct',
    'engineering-society',
    'science@example.edu.au',
    24,
    11,
    'Open',
    ARRAY['Available for an evening shift', 'Complete the exhibit briefing']::text[],
    '[{"id":"exhibit-steward","title":"Exhibit Steward","description":"Help researchers explain exhibits to visiting families.","placesAvailable":7},{"id":"queue-support","title":"Queue and Flow","description":"Keep popular exhibits moving safely.","placesAvailable":4}]'::jsonb,
    '[{"id":"sci-eve","label":"Evening","startTime":"5:00 PM","endTime":"9:00 PM","placesAvailable":11}]'::jsonb,
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80',
    false,
    86,
    '12 November 2026',
    'Lift access to all public exhibit floors.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'harmony-week',
    'Harmony Week Festival',
    'Celebrate culture, food and student community.',
    'Wellbeing',
    ARRAY['Wellbeing', 'Culture', 'Campus life']::text[],
    'Volunteer at a campus festival celebrating cultural diversity. Roles include welcome, stall support and crowd flow.',
    '17 March 2027',
    '11:00 AM',
    '4:00 PM',
    'Adelaide City',
    'Barr Smith Lawns',
    'international-students',
    'culture@example.edu.au',
    20,
    10,
    'Open',
    ARRAY['Sun protection for outdoor work', 'Briefing on the morning']::text[],
    '[{"id":"festival-welcome","title":"Festival Welcome","description":"Greet visitors and share the programme.","placesAvailable":5},{"id":"stall-support","title":"Stall Support","description":"Help student groups run cultural stalls.","placesAvailable":5}]'::jsonb,
    '[{"id":"hw-day","label":"Festival day","startTime":"11:00 AM","endTime":"4:00 PM","placesAvailable":10}]'::jsonb,
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80',
    false,
    79,
    '1 March 2027',
    'Outdoor lawns; accessible viewing and seating nearby.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'rotaract-cleanup',
    'Rotaract River Cleanup',
    'Local service with a student club.',
    'Community',
    ARRAY['Community', 'Outdoors', 'Service']::text[],
    'Join Rotaract for a Torrens-side cleanup and community stall. Volunteers collect, sort and speak with passers-by about the project.',
    '29 November 2026',
    '8:00 AM',
    '12:00 PM',
    'Adelaide City',
    'Elder Park / River Torrens edge',
    'rotaract',
    'rotaract@example.edu.au',
    18,
    7,
    'Open',
    ARRAY['Sun protection', 'Comfortable outdoor clothing']::text[],
    '[{"id":"cleanup-crew","title":"Cleanup Crew","description":"Collect and sort litter in assigned zones.","placesAvailable":5},{"id":"community-stall","title":"Community Stall","description":"Talk with the public about the cleanup.","placesAvailable":2}]'::jsonb,
    '[{"id":"rc-am","label":"Morning","startTime":"8:00 AM","endTime":"12:00 PM","placesAvailable":7}]'::jsonb,
    'https://images.unsplash.com/photo-1618477388954-7852f72348ae?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1618477388954-7852f72348ae?auto=format&fit=crop&w=900&q=80',
    false,
    70,
    '22 November 2026',
    'Uneven riverside paths; alternative stall role available.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'roseworthy-open',
    'Roseworthy Animal Open Day',
    'Welcome families to the Roseworthy campus.',
    'Community',
    ARRAY['Campus', 'Families', 'Regional']::text[],
    'Help families move between animal exhibits, information tents and campus tours at Roseworthy.',
    '12 December 2026',
    '9:00 AM',
    '3:00 PM',
    'Roseworthy',
    'Roseworthy Campus, Main Precinct',
    'sports-rec',
    'roseworthy@example.edu.au',
    16,
    5,
    'Open',
    ARRAY['Closed-toe shoes', 'Outdoor briefing on arrival']::text[],
    '[{"id":"exhibit-help","title":"Exhibit Helper","description":"Support animal exhibit teams with visitor flow.","placesAvailable":3},{"id":"family-welcome","title":"Family Welcome","description":"Help families with maps, times and facilities.","placesAvailable":2}]'::jsonb,
    '[{"id":"rw-day","label":"Open day","startTime":"9:00 AM","endTime":"3:00 PM","placesAvailable":5}]'::jsonb,
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80',
    false,
    67,
    '28 November 2026',
    'Mostly outdoor; shuttle drop-off near the main precinct.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'whyalla-outreach',
    'Whyalla Community Outreach Day',
    'Regional volunteering with the Enviro Collective.',
    'Community',
    ARRAY['Regional', 'Community', 'Outreach']::text[],
    'Support a regional engagement day in Whyalla. Volunteers help with welcome, activity stations and family information.',
    '6 February 2027',
    '10:00 AM',
    '3:00 PM',
    'Whyalla',
    'Whyalla Campus and community marquee',
    'enviro-collective',
    'regional@example.edu.au',
    12,
    4,
    'Open',
    ARRAY['Able to travel to Whyalla campus or already based regionally', 'Complete partner induction']::text[],
    '[{"id":"outreach-welcome","title":"Outreach Welcome","description":"Meet families and direct them to activities.","placesAvailable":2},{"id":"activity-station","title":"Activity Station","description":"Help run a family activity station.","placesAvailable":2}]'::jsonb,
    '[{"id":"wh-day","label":"Outreach day","startTime":"10:00 AM","endTime":"3:00 PM","placesAvailable":4}]'::jsonb,
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
    false,
    62,
    '15 January 2027',
    'Marquee and indoor backup if weather is severe.',
    null,
    null,
    false,
    '[]'::jsonb
  ),
(
    'city-sports-carnival',
    'City Sports Carnival',
    'Keep game day running for student sport.',
    'Sport',
    ARRAY['Sport', 'Outdoors', 'Campus life', 'City']::text[],
    'Volunteer with Sports and Recreation on carnival day. Help with check-in, marshalling, water stations and spectator flow.',
    '4 March 2027',
    '8:30 AM',
    '4:00 PM',
    'Adelaide City',
    'Park 10 / University sports precinct',
    'sports-rec',
    'sport@example.edu.au',
    20,
    9,
    'Open',
    ARRAY['Comfortable outdoors for a full shift', 'Sun protection']::text[],
    '[{"id":"game-day-checkin","title":"Team Check-in","description":"Check teams in and direct them to courts and fields.","placesAvailable":4},{"id":"marshal","title":"Field Marshal","description":"Keep spectator areas and walkways clear.","placesAvailable":5}]'::jsonb,
    '[{"id":"sc-am","label":"Morning","startTime":"8:30 AM","endTime":"12:30 PM","placesAvailable":5},{"id":"sc-pm","label":"Afternoon","startTime":"12:30 PM","endTime":"4:00 PM","placesAvailable":4}]'::jsonb,
    'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1800&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=900&q=80',
    false,
    74,
    '15 February 2027',
    'Mostly outdoor grass and paths; seated roles at check-in.',
    null,
    null,
    false,
    '[]'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  category = excluded.category,
  tags = excluded.tags,
  description = excluded.description,
  date = excluded.date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  campus = excluded.campus,
  location = excluded.location,
  organisation_id = excluded.organisation_id,
  contact_email = excluded.contact_email,
  capacity = excluded.capacity,
  places_available = excluded.places_available,
  status = excluded.status,
  requirements = excluded.requirements,
  roles = excluded.roles,
  shifts = excluded.shifts,
  banner_image = excluded.banner_image,
  poster_image = excluded.poster_image,
  featured = excluded.featured,
  trending_score = excluded.trending_score,
  application_deadline = excluded.application_deadline,
  accessibility_notes = excluded.accessibility_notes,
  lat = excluded.lat,
  lng = excluded.lng,
  ask_resume = excluded.ask_resume,
  custom_fields = excluded.custom_fields,
  deleted_at = null,
  updated_at = now();

insert into public.volunteer_directory (
  id, name, student_username, email, phone, student_id, campus, skills, hours,
  events_attended, no_shows, reliability, status, notes
) values
  ('vol-alex', 'Alex Nguyen', 'a1991246', 'a1991246@adelaide.edu.au', '0412 334 721', 'a1991246', 'Adelaide City', ARRAY['Welcome','STEM']::text[], 24, 6, 0, 98, 'Active', ''),
  ('vol-priya', 'Priya Shah', 'a1882201', 'a1882201@adelaide.edu.au', '0433 891 004', 'a1882201', 'Mawson Lakes', ARRAY['Wellbeing','Support']::text[], 18, 4, 1, 86, 'Active', 'Late once at Wellbeing Expo briefing.'),
  ('vol-chris', 'Chris Adeyemi', 'a1773344', 'a1773344@adelaide.edu.au', '0408 112 993', 'a1773344', 'Adelaide City', ARRAY['Community','Outdoors']::text[], 31, 8, 0, 99, 'Active', ''),
  ('vol-jamie', 'Jamie Cole', 'a1664488', 'a1664488@adelaide.edu.au', '0491 570 006', 'a1664488', 'Magill', ARRAY['Mentoring']::text[], 6, 1, 2, 54, 'Suspended', 'Two no-shows. Review before approving again.'),
  ('vol-sam', 'Sam Okonkwo', 'a1556677', 'a1556677@adelaide.edu.au', '0422 776 310', 'a1556677', 'Roseworthy', ARRAY['Sport','Welcome']::text[], 12, 3, 0, 92, 'Active', '')
on conflict (id) do update set
  name = excluded.name,
  student_username = excluded.student_username,
  email = excluded.email,
  phone = excluded.phone,
  campus = excluded.campus,
  skills = excluded.skills,
  hours = excluded.hours,
  events_attended = excluded.events_attended,
  no_shows = excluded.no_shows,
  reliability = excluded.reliability,
  status = excluded.status,
  notes = excluded.notes;

insert into public.applications (
  id, event_id, event_title, volunteer_username, volunteer_name, volunteer_id,
  role, campus, event_date, submitted_date, status, availability, preferred_shifts,
  extra_answers, skills, notes, history
) values
  (
    'app-1', 'ingenuity-2026', 'Ingenuity 2026', 'a1991246', 'Alex Nguyen', 'vol-alex',
    'Registration Support', 'Adelaide City', '11 November 2026', '10 October 2026',
    'Pending', 'Morning and afternoon', '["Morning registration (9:00 AM – 1:00 PM)"]'::jsonb,
    '{"shirt":"M","dietary":"Vegetarian"}'::jsonb, ARRAY['Welcome','STEM']::text[], '',
    '[{"at":"10 Oct 2026","from":null,"to":"Pending","by":"system"}]'::jsonb
  ),
  (
    'app-2', 'wellbeing-expo', 'Student Wellbeing Expo', 'a1882201', 'Priya Shah', 'vol-priya',
    'Welcome Volunteer', 'Mawson Lakes', '18 November 2026', '7 October 2026',
    'Shortlisted', 'Full day', '["Full day (10:00 AM – 3:00 PM)"]'::jsonb,
    '{"confidentiality":"Yes"}'::jsonb, ARRAY['Wellbeing']::text[], 'Strong fit for welcome role.',
    '[{"at":"7 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"11 Oct 2026","from":"Pending","to":"Shortlisted","by":"rotaract.admin"}]'::jsonb
  ),
  (
    'app-3', 'ewb-community-build', 'EWB Community Build Day', 'a1773344', 'Chris Adeyemi', 'vol-chris',
    'Site Support', 'Mawson Lakes', '14 November 2026', '2 October 2026',
    'Approved', 'Morning', '["Build day (8:30 AM – 3:30 PM)"]'::jsonb,
    '{"shoes":"Yes","experience":"Some DIY"}'::jsonb, ARRAY['STEM','Hands-on']::text[], '',
    '[{"at":"2 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"8 Oct 2026","from":"Pending","to":"Approved","by":"super.admin"}]'::jsonb
  ),
  (
    'app-4', 'peer-mentor', 'Peer Mentor Welcome Day', 'a1664488', 'Jamie Cole', 'vol-jamie',
    'Orientation Support', 'Magill', '25 November 2026', '9 October 2026',
    'Pending', 'Afternoon', '[]'::jsonb, '{}'::jsonb, ARRAY['Mentoring']::text[],
    'Reliability is low.',
    '[{"at":"9 Oct 2026","from":null,"to":"Pending","by":"system"}]'::jsonb
  ),
  (
    'app-5', 'foodbank-packing', 'Foodbank Packing Morning', 'a1556677', 'Sam Okonkwo', 'vol-sam',
    'Packing Volunteer', 'Adelaide City', '12 October 2026', '1 October 2026',
    'Approved', 'Morning', '["Packing morning (9:00 AM – 12:30 PM)"]'::jsonb,
    '{"seated":"Happy to stand or sit"}'::jsonb, ARRAY['Community']::text[], '',
    '[{"at":"1 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"3 Oct 2026","from":"Pending","to":"Approved","by":"rotaract.admin"}]'::jsonb
  ),
  (
    'app-6', 'open-day-city', 'City Campus Open Day', 'a1991246', 'Alex Nguyen', 'vol-alex',
    'Tour Guide', 'Adelaide City', '5 December 2026', '8 October 2026',
    'Approved', 'Morning', '["Morning tours"]'::jsonb, '{}'::jsonb, ARRAY['Welcome']::text[], '',
    '[{"at":"8 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"12 Oct 2026","from":"Pending","to":"Approved","by":"rotaract.admin"}]'::jsonb
  ),
  (
    'app-7', 'harmony-week', 'Harmony Week Festival', 'a1882201', 'Priya Shah', 'vol-priya',
    'Festival Welcome', 'Adelaide City', '17 March 2027', '11 October 2026',
    'Pending', 'Full day', '[]'::jsonb, '{}'::jsonb, ARRAY['Wellbeing']::text[], '',
    '[{"at":"11 Oct 2026","from":null,"to":"Pending","by":"system"}]'::jsonb
  )
on conflict (id) do update set
  event_id = excluded.event_id,
  event_title = excluded.event_title,
  volunteer_username = excluded.volunteer_username,
  volunteer_name = excluded.volunteer_name,
  volunteer_id = excluded.volunteer_id,
  role = excluded.role,
  campus = excluded.campus,
  event_date = excluded.event_date,
  submitted_date = excluded.submitted_date,
  status = excluded.status,
  availability = excluded.availability,
  preferred_shifts = excluded.preferred_shifts,
  extra_answers = excluded.extra_answers,
  skills = excluded.skills,
  notes = excluded.notes,
  history = excluded.history,
  updated_at = now();

insert into public.shift_assignments (
  id, event_id, event_title, club_name, role, campus, location, date,
  start_time, end_time, meeting_point, notes, volunteer_username, status
) values
  (
    'shift-wellbeing', 'wellbeing-expo', 'Student Wellbeing Expo', 'SMHC',
    'Welcome Volunteer', 'Mawson Lakes', 'Mawson Lakes Campus, Building C Atrium',
    '18 November 2026', '10:00 AM', '3:00 PM', 'Building C foyer from 9:40 AM',
    'Wear closed shoes and collect your lanyard at briefing.', 'a1882201', 'Upcoming'
  ),
  (
    'shift-ingenuity', 'ingenuity-2026', 'Ingenuity 2026', 'AUES',
    'Registration Support', 'Adelaide City', 'Adelaide Convention Centre, North Terrace',
    '11 November 2026', '9:00 AM', '1:00 PM', 'North Terrace registration desk',
    'Coordinator briefing starts at 8:40 AM.', 'a1991246', 'Upcoming'
  ),
  (
    'shift-foodbank', 'foodbank-packing', 'Foodbank Packing Morning', 'Rotaract',
    'Hamper Packing', 'Adelaide City', 'Foodbank SA, Pooraka',
    '8 March 2026', '9:00 AM', '12:30 PM', 'Warehouse reception',
    'Completed demo shift.', 'a1556677', 'Completed'
  ),
  (
    'shift-open-day', 'open-day-city', 'City Campus Open Day', 'AUSA Crew',
    'Tour Guide', 'Adelaide City', 'North Terrace Campus, Hub Central',
    '5 December 2026', '9:00 AM', '1:00 PM', 'Hub Central information desk',
    'Collect a radio at check-in.', 'a1991246', 'Upcoming'
  )
on conflict (id) do update set
  event_id = excluded.event_id,
  event_title = excluded.event_title,
  volunteer_username = excluded.volunteer_username,
  status = excluded.status,
  notes = excluded.notes;

insert into public.announcements (id, subject, audience, at, status) values
  ('ann-1', 'Shift reminder: Foodbank Packing Morning', 'Foodbank Packing Morning', '11 Oct 2026', 'Sent'),
  ('ann-2', 'Ingenuity briefing pack is ready', 'Ingenuity 2026 volunteers', '12 Oct 2026', 'Sent'),
  ('ann-3', 'Open Day tour-guide briefing', 'City Campus Open Day', '20 Nov 2026', 'Scheduled')
on conflict (id) do update set
  subject = excluded.subject,
  audience = excluded.audience,
  at = excluded.at,
  status = excluded.status;

insert into public.shift_swaps (id, volunteer_name, shift, kind, status) values
  ('swap-1', 'Priya Shah', 'Wellbeing Expo · Full day', 'Drop', 'Pending')
on conflict (id) do update set
  volunteer_name = excluded.volunteer_name,
  shift = excluded.shift,
  kind = excluded.kind,
  status = excluded.status;

insert into public.audit_logs (id, at, who, action, target, ip, metadata) values
  ('aud-1', '12 Oct 2026 16:02', 'rotaract.admin', 'application.status', 'Alex Nguyen', '127.0.0.1', '{}'::jsonb),
  ('aud-2', '12 Oct 2026 14:18', 'super.admin', 'event.update', 'EWB Community Build Day', '127.0.0.1', '{}'::jsonb),
  ('aud-3', '11 Oct 2026 09:40', 'rotaract.admin', 'volunteer.pii_reveal', 'Priya Shah', '127.0.0.1', '{}'::jsonb),
  ('aud-4', '13 Oct 2026 10:12', 'super.admin', 'event.publish', 'Ingenuity 2026', '127.0.0.1', '{}'::jsonb)
on conflict (id) do update set
  at = excluded.at,
  who = excluded.who,
  action = excluded.action,
  target = excluded.target;

-- Keep the helper around so the seed can be re-run; coordinators can drop it later if desired.
