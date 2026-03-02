-- Seed data for initial learning modules
-- Phase 1: System Design Basics

INSERT INTO public.modules (title, description, difficulty, category, content, "order") VALUES
(
  'System Design Fundamentals',
  'Learn the core concepts of distributed systems, scalability, and architecture patterns. Perfect for beginners starting their system design journey.',
  'beginner',
  'System Design',
  '{
    "sections": [
      {
        "id": "intro",
        "title": "Introduction to System Design",
        "lessons": [
          {
            "id": "what-is-system-design",
            "title": "What is System Design?",
            "duration": "10 min",
            "content": "System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements."
          },
          {
            "id": "scalability-basics",
            "title": "Scalability Basics",
            "duration": "15 min",
            "content": "Understanding horizontal vs vertical scaling, and when to apply each approach."
          }
        ]
      },
      {
        "id": "core-components",
        "title": "Core Components",
        "lessons": [
          {
            "id": "load-balancers",
            "title": "Load Balancers",
            "duration": "20 min",
            "content": "Learn how load balancers distribute traffic across multiple servers."
          },
          {
            "id": "caching-strategies",
            "title": "Caching Strategies",
            "duration": "25 min",
            "content": "Explore different caching patterns and when to use them."
          }
        ]
      }
    ]
  }'::jsonb,
  1
),
(
  'Database Design & Selection',
  'Master the art of choosing the right database, designing schemas, and optimizing queries for scale.',
  'intermediate',
  'Databases',
  '{
    "sections": [
      {
        "id": "sql-vs-nosql",
        "title": "SQL vs NoSQL",
        "lessons": [
          {
            "id": "relational-databases",
            "title": "Relational Databases",
            "duration": "30 min",
            "content": "Deep dive into SQL databases, ACID properties, and normalization."
          },
          {
            "id": "nosql-patterns",
            "title": "NoSQL Patterns",
            "duration": "25 min",
            "content": "When and why to use document, key-value, column-family, and graph databases."
          }
        ]
      }
    ]
  }'::jsonb,
  2
),
(
  'Caching & Performance Optimization',
  'Learn how to dramatically improve system performance through effective caching strategies.',
  'intermediate',
  'Performance',
  '{
    "sections": [
      {
        "id": "caching-fundamentals",
        "title": "Caching Fundamentals",
        "lessons": [
          {
            "id": "cache-strategies",
            "title": "Cache Eviction Strategies",
            "duration": "20 min",
            "content": "LRU, LFU, and other cache eviction policies."
          }
        ]
      }
    ]
  }'::jsonb,
  3
);
