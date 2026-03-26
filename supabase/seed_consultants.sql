-- ============================================================
-- Seed data for Consultants Marketplace
-- ============================================================

-- ── Consultants ──

INSERT INTO consultants (id, user_id, name, title, description, hourly_rate, rating, review_count, session_count, country, industry, availability) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'clerk_consultant_001', 'Dr. Lisa Park', 'Tech & Innovation Advisor',
   'I help early-stage startups validate their ideas, build scalable business models, and secure funding. With over 10 years of experience in tech innovation and venture building, I provide structured feedback and actionable strategies tailored to your goals.',
   180.00, 4.9, 98, 190, 'United States', 'Technology', 'available'),

  ('c1000000-0000-0000-0000-000000000002', 'clerk_consultant_002', 'Michael Turner', 'Startup Strategy & Fundraising Advisor',
   'Specializing in go-to-market strategy and investor readiness, I work with founders to sharpen their pitch, refine their financial models, and navigate the fundraising landscape with confidence.',
   90.00, 4.9, 98, 190, 'United Kingdom', 'Finance', 'available'),

  ('c1000000-0000-0000-0000-000000000003', 'clerk_consultant_003', 'Camila Verdandi', 'Sustainability & Impact Consultant',
   'I guide purpose-driven startups through impact measurement, ESG compliance, and sustainable business model design. My background in environmental science and social enterprise gives me a unique lens on building businesses that do well by doing good.',
   120.00, 4.8, 64, 145, 'Italy', 'Sustainability', 'available'),

  ('c1000000-0000-0000-0000-000000000004', 'clerk_consultant_004', 'Sarah Johnson', 'Business Operations Specialist',
   'I help startups streamline operations, set up scalable processes, and build the internal systems needed to grow from early traction to sustained scale. My focus is on making your day-to-day run smoother so you can focus on the big picture.',
   95.00, 4.7, 52, 110, 'United States', 'Operations', 'available'),

  ('c1000000-0000-0000-0000-000000000005', 'clerk_consultant_005', 'Olivia Johnson', 'Startup Marketing Strategist',
   'From brand positioning to growth loops, I help startups find product-market fit through smart, resource-efficient marketing. I have launched campaigns for 30+ early-stage companies across B2B and B2C.',
   85.00, 4.9, 73, 160, 'Canada', 'Marketing', 'available'),

  ('c1000000-0000-0000-0000-000000000006', 'clerk_consultant_006', 'Ethan Silva', 'Growth Marketing Consultant',
   'I specialize in paid acquisition, conversion optimization, and data-driven growth strategies. Whether you are pre-revenue or scaling, I help you find the channels that move the needle.',
   140.00, 4.9, 88, 175, 'Brazil', 'Marketing', 'busy'),

  ('c1000000-0000-0000-0000-000000000007', 'clerk_consultant_007', 'Natalie Brown', 'Digital Branding Expert',
   'I craft brand identities that resonate with your target audience. From visual identity systems to messaging frameworks, I help startups stand out in crowded markets.',
   110.00, 4.8, 45, 95, 'Australia', 'Design', 'available');


-- ── Consultant Skills ──

-- Dr. Lisa Park
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Education', 'Chartered Accountant (5+ yrs)', 0),
  ('c1000000-0000-0000-0000-000000000001', 'Education', 'Registered Innovation Manager', 1),
  ('c1000000-0000-0000-0000-000000000001', 'Education', 'PhD in Innovation / Entrepreneurship', 2),
  ('c1000000-0000-0000-0000-000000000001', 'Education', 'MBA – Business Administration', 3),
  ('c1000000-0000-0000-0000-000000000001', 'Subsidized Finance and Tenders', 'Invitalia Tender Applications', 0),
  ('c1000000-0000-0000-0000-000000000001', 'Subsidized Finance and Tenders', 'Regional Tender Preparation', 1),
  ('c1000000-0000-0000-0000-000000000001', 'Subsidized Finance and Tenders', 'EU Funding Programs', 2),
  ('c1000000-0000-0000-0000-000000000001', 'Startup & Venture Building', 'Early-Stage Startup Support', 0),
  ('c1000000-0000-0000-0000-000000000001', 'Startup & Venture Building', 'Startup Mentoring', 1),
  ('c1000000-0000-0000-0000-000000000001', 'Startup & Venture Building', 'Startup Valuation', 2),
  ('c1000000-0000-0000-0000-000000000001', 'Startup & Venture Building', 'Investment Consulting', 3),
  ('c1000000-0000-0000-0000-000000000001', 'Professional Services & Skills', 'Administrative & Tax Consulting', 0),
  ('c1000000-0000-0000-0000-000000000001', 'Professional Services & Skills', 'Product Prototyping', 1),
  ('c1000000-0000-0000-0000-000000000001', 'Professional Services & Skills', 'Product & Tech Development', 2),
  ('c1000000-0000-0000-0000-000000000001', 'Professional Services & Skills', 'Market Research & Analysis', 3),
  ('c1000000-0000-0000-0000-000000000001', 'Specialization Sectors', 'Finance & Insurance', 0),
  ('c1000000-0000-0000-0000-000000000001', 'Specialization Sectors', 'Art, Entertainment & Education', 1),
  ('c1000000-0000-0000-0000-000000000001', 'Specialization Sectors', 'Health & Social Impact', 2);

-- Michael Turner
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'Core Expertise', 'Business Model Strategy', 0),
  ('c1000000-0000-0000-0000-000000000002', 'Core Expertise', 'Pitch Deck Review', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Core Expertise', 'EU Funding Programs', 2),
  ('c1000000-0000-0000-0000-000000000002', 'Core Expertise', 'Financial Modeling', 3),
  ('c1000000-0000-0000-0000-000000000002', 'Fundraising', 'Investor Relations', 0),
  ('c1000000-0000-0000-0000-000000000002', 'Fundraising', 'Term Sheet Negotiation', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Fundraising', 'Due Diligence Preparation', 2),
  ('c1000000-0000-0000-0000-000000000002', 'Fundraising', 'Seed & Series A Strategy', 3);

-- Camila Verdandi
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'Sustainability', 'ESG Compliance', 0),
  ('c1000000-0000-0000-0000-000000000003', 'Sustainability', 'Impact Measurement', 1),
  ('c1000000-0000-0000-0000-000000000003', 'Sustainability', 'Circular Economy Models', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Sustainability', 'Carbon Footprint Analysis', 3),
  ('c1000000-0000-0000-0000-000000000003', 'Business Strategy', 'Social Enterprise Design', 0),
  ('c1000000-0000-0000-0000-000000000003', 'Business Strategy', 'Grant Writing', 1),
  ('c1000000-0000-0000-0000-000000000003', 'Business Strategy', 'Stakeholder Engagement', 2);

-- Sarah Johnson
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000004', 'Operations', 'Process Optimization', 0),
  ('c1000000-0000-0000-0000-000000000004', 'Operations', 'Team Scaling', 1),
  ('c1000000-0000-0000-0000-000000000004', 'Operations', 'OKR Frameworks', 2),
  ('c1000000-0000-0000-0000-000000000004', 'Operations', 'Vendor Management', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Tools & Systems', 'CRM Implementation', 0),
  ('c1000000-0000-0000-0000-000000000004', 'Tools & Systems', 'Project Management Setup', 1),
  ('c1000000-0000-0000-0000-000000000004', 'Tools & Systems', 'Workflow Automation', 2);

-- Olivia Johnson
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000005', 'Marketing', 'Brand Positioning', 0),
  ('c1000000-0000-0000-0000-000000000005', 'Marketing', 'Content Strategy', 1),
  ('c1000000-0000-0000-0000-000000000005', 'Marketing', 'Growth Loops', 2),
  ('c1000000-0000-0000-0000-000000000005', 'Marketing', 'Product-Market Fit Analysis', 3);

-- Ethan Silva
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000006', 'Growth', 'Paid Acquisition', 0),
  ('c1000000-0000-0000-0000-000000000006', 'Growth', 'Conversion Optimization', 1),
  ('c1000000-0000-0000-0000-000000000006', 'Growth', 'Analytics & Attribution', 2),
  ('c1000000-0000-0000-0000-000000000006', 'Growth', 'Retention Strategy', 3);

-- Natalie Brown
INSERT INTO consultant_skills (consultant_id, section_title, skill_name, order_index) VALUES
  ('c1000000-0000-0000-0000-000000000007', 'Branding', 'Visual Identity Systems', 0),
  ('c1000000-0000-0000-0000-000000000007', 'Branding', 'Messaging Frameworks', 1),
  ('c1000000-0000-0000-0000-000000000007', 'Branding', 'Brand Guidelines', 2),
  ('c1000000-0000-0000-0000-000000000007', 'Branding', 'Competitive Positioning', 3);


-- ── Service Packages ──

-- Dr. Lisa Park
INSERT INTO service_packages (id, consultant_id, name, price, description, consultation_content, duration_minutes, order_index) VALUES
  ('a0100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'Startup Strategy Consultation', 75.00,
   'A focused session to review your startup idea, clarify your business model, and identify the most effective next steps.',
   'Business model review, competitive landscape analysis, actionable next steps',
   60, 0),
  ('a0100000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'Pitch Deck Optimization', 90.00,
   'Get expert feedback on your pitch deck to make it investor-ready with clear storytelling and data presentation.',
   'Slide-by-slide review, narrative structure, investor expectations alignment',
   60, 1),
  ('a0100000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'Go-To-Market Strategy', 100.00,
   'Define your target market, positioning, and launch plan with a structured go-to-market framework.',
   'Market segmentation, channel strategy, launch timeline, KPI definition',
   90, 2),
  ('a0100000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001',
   'Financial Model & Forecast Review', 150.00,
   'Deep-dive into your financial projections to ensure they are realistic, well-structured, and investor-ready.',
   'Revenue model validation, cost structure review, cash flow projections, sensitivity analysis',
   90, 3);

-- Michael Turner
INSERT INTO service_packages (id, consultant_id, name, price, description, consultation_content, duration_minutes, order_index) VALUES
  ('a0100000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002',
   'Fundraising Readiness Assessment', 90.00,
   'Evaluate your startup''s readiness for fundraising and get a clear roadmap for approaching investors.',
   'Funding stage assessment, investor targeting, timeline planning',
   60, 0),
  ('a0100000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002',
   'Financial Model Workshop', 120.00,
   'Build or refine your financial model with guidance on assumptions, projections, and presentation.',
   'Assumption validation, revenue modeling, unit economics, investor-facing formatting',
   90, 1);

-- Camila Verdandi
INSERT INTO service_packages (id, consultant_id, name, price, description, consultation_content, duration_minutes, order_index) VALUES
  ('a0100000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003',
   'Impact Strategy Session', 120.00,
   'Define your impact thesis, measurement framework, and sustainability roadmap.',
   'Impact thesis development, KPI selection, reporting framework design',
   60, 0),
  ('a0100000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003',
   'ESG Compliance Review', 150.00,
   'Comprehensive review of your ESG practices with actionable recommendations for compliance.',
   'Current state assessment, gap analysis, implementation roadmap, reporting templates',
   90, 1);

-- Sarah Johnson
INSERT INTO service_packages (id, consultant_id, name, price, description, consultation_content, duration_minutes, order_index) VALUES
  ('a0100000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000004',
   'Operations Audit', 95.00,
   'A thorough review of your current operations to identify bottlenecks and improvement areas.',
   'Process mapping, bottleneck identification, tool assessment, improvement plan',
   60, 0),
  ('a0100000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000004',
   'Scaling Playbook Session', 130.00,
   'Build a playbook for scaling your team and operations from early stage to growth phase.',
   'Hiring plan, process documentation, delegation frameworks, milestone planning',
   90, 1);


-- ── Consultant Availability (next 2 weeks from 2026-03-26) ──

-- Dr. Lisa Park — weekdays Mar 27 – Apr 9
INSERT INTO consultant_availability (consultant_id, date, start_time, end_time) VALUES
  ('c1000000-0000-0000-0000-000000000001', '2026-03-27', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-27', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-27', '11:00', '12:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-27', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-27', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-30', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-30', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-30', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-30', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-30', '15:00', '16:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-31', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-31', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-31', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-31', '15:00', '16:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-03-31', '16:00', '17:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-01', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-01', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-01', '11:00', '12:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-01', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-02', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-02', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-02', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-02', '15:00', '16:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-03', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-03', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-03', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-03', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-06', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-06', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-06', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-07', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-07', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-07', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000001', '2026-04-07', '15:00', '16:00');

-- Michael Turner
INSERT INTO consultant_availability (consultant_id, date, start_time, end_time) VALUES
  ('c1000000-0000-0000-0000-000000000002', '2026-03-27', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-27', '11:00', '12:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-27', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-30', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-30', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-30', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-31', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-03-31', '11:00', '12:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-04-01', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-04-01', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-04-02', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000002', '2026-04-02', '14:00', '15:00');

-- Camila Verdandi
INSERT INTO consultant_availability (consultant_id, date, start_time, end_time) VALUES
  ('c1000000-0000-0000-0000-000000000003', '2026-03-27', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-27', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-27', '15:00', '16:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-30', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-30', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-30', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-31', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-03-31', '11:00', '12:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-04-01', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-04-01', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-04-02', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-04-02', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-04-03', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000003', '2026-04-03', '14:00', '15:00');

-- Sarah Johnson
INSERT INTO consultant_availability (consultant_id, date, start_time, end_time) VALUES
  ('c1000000-0000-0000-0000-000000000004', '2026-03-27', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-03-27', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-03-30', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-03-30', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-03-31', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-03-31', '10:00', '11:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-04-01', '13:00', '14:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-04-01', '14:00', '15:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-04-02', '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000004', '2026-04-02', '15:00', '16:00');


-- ── Bookings (for the current logged-in test user) ──

INSERT INTO bookings (id, user_id, consultant_id, service_package_id, status, booking_date, start_time, end_time, duration_minutes, cost, payment_status, user_comment) VALUES
  -- Camila Verdandi: 1 upcoming + 2 finished
  ('b1000000-0000-0000-0000-000000000001', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000003', 'a0100000-0000-0000-0000-000000000007',
   'upcoming', '2026-04-05', '13:00', '14:00', 60, 120.00, 'paid',
   'I would like your professional opinion on my tax situation'),
  ('b1000000-0000-0000-0000-000000000002', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000003', 'a0100000-0000-0000-0000-000000000007',
   'finished', '2026-03-10', '10:00', '11:00', 60, 120.00, 'paid',
   'Need help with impact measurement framework'),
  ('b1000000-0000-0000-0000-000000000003', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000003', 'a0100000-0000-0000-0000-000000000008',
   'finished', '2026-02-20', '14:00', '15:30', 90, 150.00, 'paid',
   'ESG compliance review for our annual report'),

  -- Sarah Johnson: 2 finished
  ('b1000000-0000-0000-0000-000000000004', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000004', 'a0100000-0000-0000-0000-000000000009',
   'finished', '2026-03-05', '13:00', '14:00', 60, 95.00, 'paid', ''),
  ('b1000000-0000-0000-0000-000000000005', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000004', 'a0100000-0000-0000-0000-000000000010',
   'finished', '2026-02-18', '10:00', '11:30', 90, 130.00, 'paid', ''),

  -- Dr. Lisa Park: 1 pending
  ('b1000000-0000-0000-0000-000000000006', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000001', 'a0100000-0000-0000-0000-000000000001',
   'pending', '2026-04-12', '10:00', '11:00', 60, 75.00, 'unpaid', ''),

  -- Michael Turner: 1 pending
  ('b1000000-0000-0000-0000-000000000007', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000002', 'a0100000-0000-0000-0000-000000000005',
   'pending', '2026-04-14', '15:00', '16:00', 60, 90.00, 'unpaid', ''),

  -- Olivia Johnson: 1 cancelled
  ('b1000000-0000-0000-0000-000000000008', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000005', 'a0100000-0000-0000-0000-000000000001',
   'cancelled', '2026-02-20', '09:00', '10:00', 60, 85.00, 'refunded', ''),

  -- Ethan Silva: 1 cancelled
  ('b1000000-0000-0000-0000-000000000009', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000006', 'a0100000-0000-0000-0000-000000000001',
   'cancelled', '2026-02-22', '14:00', '15:00', 60, 140.00, 'refunded', '');


-- ── Consultant Reviews ──

-- Dr. Lisa Park (4 reviews)
INSERT INTO consultant_reviews (consultant_id, user_id, booking_id, rating, text, user_name, user_country) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'clerk_reviewer_01', NULL, 4,
   'Dr. Park helped me completely rethink my digital strategy. Her structured approach to breaking down complex problems into actionable steps was exactly what I needed.',
   'Anna K.', 'United States'),
  ('c1000000-0000-0000-0000-000000000001', 'clerk_reviewer_02', NULL, 5,
   'Incredibly professional and knowledgeable. She reviewed my pitch deck and gave feedback that directly led to a successful seed round.',
   'Marco R.', 'Italy'),
  ('c1000000-0000-0000-0000-000000000001', 'clerk_reviewer_03', NULL, 5,
   'The financial model session was a game-changer. She identified gaps in my projections I had completely missed and showed me how to fix them.',
   'Sophie L.', 'France'),
  ('c1000000-0000-0000-0000-000000000001', 'clerk_reviewer_04', NULL, 4,
   'Great session on go-to-market strategy. Very practical advice that I could implement right away. Would definitely book again.',
   'James T.', 'United Kingdom');

-- Michael Turner (3 reviews)
INSERT INTO consultant_reviews (consultant_id, user_id, booking_id, rating, text, user_name, user_country) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'clerk_reviewer_05', NULL, 5,
   'Michael''s fundraising expertise is top-notch. He helped me prepare for investor meetings with confidence and clarity.',
   'Elena P.', 'Spain'),
  ('c1000000-0000-0000-0000-000000000002', 'clerk_reviewer_06', NULL, 5,
   'The financial model workshop was incredibly thorough. Michael has a rare talent for making complex financial concepts accessible.',
   'David W.', 'Germany'),
  ('c1000000-0000-0000-0000-000000000002', 'clerk_reviewer_07', NULL, 4,
   'Solid advice on our Series A strategy. He gave us a clear timeline and helped us prioritize which investors to approach first.',
   'Priya S.', 'India');

-- Camila Verdandi (2 reviews)
INSERT INTO consultant_reviews (consultant_id, user_id, booking_id, rating, text, user_name, user_country) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'clerk_reviewer_08', NULL, 5,
   'Camila helped us build an impact measurement framework that our investors love. Her deep knowledge of sustainability metrics is impressive.',
   'Lisa M.', 'Netherlands'),
  ('c1000000-0000-0000-0000-000000000003', 'clerk_reviewer_09', NULL, 4,
   'The ESG compliance review was exactly what we needed before our annual report. Very thorough and practical recommendations.',
   'Thomas H.', 'Sweden');


-- ── Message Threads & Messages ──

-- Thread: test user ↔ Dr. Lisa Park
INSERT INTO message_threads (id, user_id, consultant_id, last_message_at) VALUES
  ('da100000-0000-0000-0000-000000000001', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000001', '2026-03-26 10:05:00+00');

INSERT INTO messages (thread_id, sender_user_id, text, created_at) VALUES
  ('da100000-0000-0000-0000-000000000001', 'clerk_test_user',
   'Hi, thanks for joining. I''ve just finished my first business plan draft using SiliconPlan, but I''m not sure if the financial section looks realistic.',
   '2026-03-26 10:00:00+00'),
  ('da100000-0000-0000-0000-000000000001', 'clerk_consultant_001',
   'Great start! I reviewed your draft — the structure looks strong. The financial section just needs more detailed assumptions on your customer acquisition and retention rates.\nHave you used the AI Financial Calculator yet?',
   '2026-03-26 10:01:00+00'),
  ('da100000-0000-0000-0000-000000000001', 'clerk_test_user',
   'Not yet. I saw it mentioned in the dashboard, but I wasn''t sure how to link it to my plan.',
   '2026-03-26 10:03:00+00'),
  ('da100000-0000-0000-0000-000000000001', 'clerk_consultant_001',
   'No problem. Inside your workspace, open the AI Documents tab, then select Financial Forecast. The calculator will analyze your pricing model and projected growth rate. You can adjust variables like churn or customer lifetime value, and it''ll instantly update the revenue projections.',
   '2026-03-26 10:05:00+00');

-- Thread: test user ↔ Camila Verdandi
INSERT INTO message_threads (id, user_id, consultant_id, last_message_at) VALUES
  ('da100000-0000-0000-0000-000000000002', 'clerk_test_user', 'c1000000-0000-0000-0000-000000000003', '2026-03-25 14:12:00+00');

INSERT INTO messages (thread_id, sender_user_id, text, created_at) VALUES
  ('da100000-0000-0000-0000-000000000002', 'clerk_test_user',
   'Hi Camila, I have an upcoming session with you next week. I wanted to share some documents in advance — is there a preferred format?',
   '2026-03-25 14:10:00+00'),
  ('da100000-0000-0000-0000-000000000002', 'clerk_consultant_003',
   'Hi! Yes, PDF or Google Docs links work best. Feel free to share them here and I''ll review before our session. Looking forward to it!',
   '2026-03-25 14:12:00+00');
