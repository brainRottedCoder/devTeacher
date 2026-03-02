-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'beginner',
  estimated_minutes INTEGER DEFAULT 30,
  order_index INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 15,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, slug)
);

-- Progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB DEFAULT '[]',
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  answers JSONB DEFAULT '{}',
  passed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Modules policies (readable by all, writable by authenticated)
CREATE POLICY "Anyone can view published modules" ON public.modules FOR SELECT USING (is_published = true);
CREATE POLICY "Auth users can view all modules" ON public.modules FOR SELECT USING (auth.role() = 'authenticated');

-- Lessons policies
CREATE POLICY "Anyone can view published lessons" ON public.lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Auth users can view all lessons" ON public.lessons FOR SELECT USING (auth.role() = 'authenticated');

-- User progress policies
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Quizzes policies
CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT USING (true);

-- Quiz attempts policies
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample modules
INSERT INTO public.modules (title, slug, description, icon, category, difficulty, estimated_minutes, order_index, is_premium, is_published) VALUES
('Introduction to System Design', 'intro-system-design', 'Learn the fundamentals of designing scalable systems', '🚀', 'system-design', 'beginner', 45, 1, false, true),
('Scalability Basics', 'scalability-basics', 'Understanding how systems scale from 100 to 100M users', '📈', 'system-design', 'intermediate', 60, 2, false, true),
('Database Design Patterns', 'database-design', 'Learn database patterns, indexing, and optimization', '🗄️', 'system-design', 'intermediate', 90, 3, false, true),
('Caching Strategies', 'caching-strategies', 'Master caching at every layer of your architecture', '⚡', 'system-design', 'intermediate', 60, 4, false, true),
('Load Balancing & CDN', 'load-balancing-cdn', 'Distribute traffic globally for performance', '🌐', 'system-design', 'intermediate', 45, 5, false, true);

-- Insert sample lessons for Introduction to System Design
INSERT INTO public.lessons (module_id, title, slug, content, order_index, estimated_minutes, is_published)
SELECT 
  m.id,
  'What is System Design?',
  'what-is-system-design',
  '## What is System Design?

System Design is the process of defining the architecture, components, modules, interfaces, and data flow of a system to satisfy specified requirements.

### Why is System Design Important?

- **Scalability**: Designing systems that can handle growth
- **Reliability**: Building systems that fail gracefully
- **Maintainability**: Creating systems that are easy to modify
- **Cost-effectiveness**: Optimizing resource usage

### Key Concepts

1. **Horizontal vs Vertical Scaling**
   - Vertical: Adding more power to existing machine (CPU, RAM)
   - Horizontal: Adding more machines to the system

2. **Load Balancing**
   - Distributes traffic across multiple servers
   - Ensures no single server is overwhelmed

3. **Caching**
   - Stores frequently accessed data in memory
   - Reduces database load and improves response times

4. **Database Sharding**
   - Splits data across multiple databases
   - Improves write performance and scalability

### Real-World Example

Think of a restaurant:
- **Single server** = One person taking orders, cooking, and serving
- **Load balancer** = Host distributing customers to different servers
- **Caching** = Prepped ingredients ready to cook
- **Database** = The recipe book

In the next lesson, we will explore scalability in detail.',
  1, 15, true
FROM public.modules m WHERE m.slug = 'intro-system-design';

INSERT INTO public.lessons (module_id, title, slug, content, order_index, estimated_minutes, is_published)
SELECT 
  m.id,
  'Scalability Fundamentals',
  'scalability-fundamentals',
  '## Scalability Fundamentals

Scalability is the capability of a system to handle a growing amount of work by adding resources.

### Types of Scaling

#### Vertical Scaling (Scale Up)
- Adding more resources to a single node
- Simpler to implement
- Has hardware limits
- Example: Upgrading from 4GB to 16GB RAM

#### Horizontal Scaling (Scale Out)
- Adding more nodes to the system
- More complex but virtually unlimited
- Requires load balancing
- Example: Adding more servers to a cluster

### Measuring Scalability

Key metrics to consider:
- **Throughput**: Requests per second the system can handle
- **Latency**: Time taken to process a request
- **Capacity**: Maximum load the system can handle
- **Cost**: Resources required to handle the load

### The Scalability Triangle

```
         Performance
            /\
           /  \
          /    \
         /      \
        /________\
       Cost   Features
```

You can optimize two of three: Cost, Features, or Performance.

### Practice Scenario

Consider a blog that starts with 100 daily visitors:
- Single server might work
- As it grows to 10,000 visitors:
  - Need caching
  - Consider CDN for static assets
  - Database optimization needed
- At 1,000,000 visitors:
  - Multiple database servers
  - Multiple application servers
  - Global CDN
  - Sophisticated caching strategy',
  2, 20, true
FROM public.modules m WHERE m.slug = 'intro-system-design';

-- Insert lessons for Scalability Basics
INSERT INTO public.lessons (module_id, title, slug, content, order_index, estimated_minutes, is_published)
SELECT 
  m.id,
  'From 100 to 1 Million Users',
  '100-to-1m-users',
  '## From 100 to 1 Million Users

As your user base grows, your architecture must evolve. Let''s explore each stage.

### Stage 1: 100 Users (Single Server)

```
┌─────────────────┐
│   Web Server    │
│   + Database    │
└─────────────────┘
```

- Single server handles everything
- Simple setup, lowest cost
- Single point of failure

### Stage 2: 1,000 Users (Database Optimization)

```
┌─────────────────┐     ┌─────────────┐
│   Web Server    │────▶│  Database   │
└─────────────────┘     └─────────────┘
         │
         ▼
  ┌─────────────┐
  │   Cache     │
  └─────────────┘
```

- Add caching layer
- Optimize database queries
- Add indexes

### Stage 3: 10,000 Users (Load Balancing)

```
       ┌─────────────┐
       │ Load Balancer│
       └──────┬──────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│Server1│ │Server2│ │Server3│
└───┬───┘ └───┬───┘ └───┬───┘
    └─────────┼─────────┘
              ▼
       ┌─────────────┐
       │  Database  │
       │  + Replica │
       └─────────────┘
```

- Multiple application servers
- Read replicas for database
- Session management

### Stage 4: 100,000 Users (Database Sharding)

- Shard database across multiple servers
- CDN for static content
- Message queue for async processing

### Stage 5: 1 Million Users (Global Scale)

- Multi-region deployment
- Geographic load balancing
- Sophisticated caching strategies
- Microservices architecture',
  1, 25, true
FROM public.modules m WHERE m.slug = 'scalability-basics';

INSERT INTO public.lessons (module_id, title, slug, content, order_index, estimated_minutes, is_published)
SELECT 
  m.id,
  'Common Bottlenecks',
  'common-bottlenecks',
  '## Common Bottlenecks

Understanding where systems slow down is crucial for optimization.

### Database Bottlenecks

1. **Slow Queries**
   - Missing indexes
   - N+1 query problems
   - Large table scans

2. **Connection Limits**
   - Database connection pool exhaustion
   - Too many concurrent connections

3. **Lock Contention**
   - Write-heavy workloads
   - Long-running transactions

### Application Bottlenecks

1. **CPU Intensive Operations**
   - Complex calculations
   - Serialization/Deserialization

2. **Memory Issues**
   - Memory leaks
   - Insufficient caching
   - Large data in memory

3. **Network Latency**
   - Too many API calls
   - Large payloads
   - Geographic distance

### Identifying Bottlenecks

Tools and techniques:
- **APM Tools**: New Relic, Datadog, CloudWatch
- **Database Profiling**: EXPLAIN queries, slow query log
- **Profiling**: Node.js profiler, Python cProfile
- **Load Testing**: k6, JMeter, Locust

### Solutions by Bottleneck Type

| Bottleneck | Solution |
|------------|----------|
| Slow queries | Add indexes, optimize queries |
| Connection limits | Connection pooling, read replicas |
| CPU intensive | Async processing, caching |
| Memory issues | Memory profiling, optimization |
| Network latency | CDN, compression, pagination |',
  2, 20, true
FROM public.modules m WHERE m.slug = 'scalability-basics';

-- Insert sample quiz
INSERT INTO public.quizzes (lesson_id, title, questions, passing_score)
SELECT 
  l.id,
  'System Design Basics Quiz',
  '[
    {
      "id": "q1",
      "question": "What is horizontal scaling?",
      "options": [
        "Adding more power to existing machine",
        "Adding more machines to the system",
        "Reducing the number of features",
        "Decreasing the database size"
      ],
      "correctAnswer": 1,
      "explanation": "Horizontal scaling (scale out) means adding more machines to handle increased load, as opposed to vertical scaling which adds resources to a single machine."
    },
    {
      "id": "q2",
      "question": "What is the primary purpose of a load balancer?",
      "options": [
        "Store data permanently",
        "Distribute traffic across multiple servers",
        "Encrypt network traffic",
        "Cache frequently accessed data"
      ],
      "correctAnswer": 1,
      "explanation": "A load balancer distributes incoming network traffic across multiple servers to ensure no single server becomes overwhelmed."
    },
    {
      "id": "q3",
      "question": "Which of the following is a benefit of caching?",
      "options": [
        "Increases database writes",
        "Reduces database load and improves response times",
        "Makes the system more complex",
        "Requires more storage space"
      ],
      "correctAnswer": 1,
      "explanation": "Caching stores frequently accessed data in memory, reducing the need to query the database and improving response times."
    }
  ]'::jsonb,
  70
FROM public.lessons l WHERE l.slug = 'what-is-system-design';
