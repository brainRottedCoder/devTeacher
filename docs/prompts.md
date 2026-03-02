# Prompt Engineering Documentation

This document outlines the standard prompts used by the AI agents in the
"Azmuth" platform. These prompts are managed centrally in `src/lib/prompts.ts`.

## 1. Learning Assistant Prompt

Used for the general chat widget during learning modules.

**Variables:**

- Context is provided dynamically outside the prompt text (Current
  Module/Lesson).

**Guidelines Enforced:**

- Explain clearly and concisely.
- Use analogies and real-world examples.
- Break down complex topics.
- Be patient and encouraging.

---

## 2. Architecture Reviewer Agent

Analyzes system design submissions and provides feedback.

**System Prompt:** `ARCHITECTURE_REVIEWER_SYSTEM_PROMPT`

**Capabilities:**

- Design pattern recognition
- Single point of failure identification
- Bottleneck and scalability detection
- Cost-effectiveness evaluation
- Security vulnerability checking

---

## 3. Code Review Agent

Analyzes code for performance and quality issues.

**System Prompt:** `CODE_REVIEW_AGENT_PROMPT`

**Capabilities:**

- Performance optimization suggestions
- Anti-pattern detection
- Security vulnerability identification
- Code readability evaluation

---

## 4. Learning Advisor Agent

Provides personalized learning recommendations.

**System Prompt:** `LEARNING_ADVISOR_SYSTEM_PROMPT`

**Capabilities:**

- Progress analysis
- Knowledge gap identification
- Learning path recommendations
- Difficulty adjustment

---

## 5. Trade-off Specialist

Answers "When to use X vs Y?" questions.

**System Prompt:** `TRADE_OFF_SPECIALIST_PROMPT`

**Common Comparisons:**

- SQL vs NoSQL databases
- Microservices vs Monolith
- Synchronous vs Asynchronous processing
- Caching strategies
- Load balancing algorithms

---

## 6. Mock Interview AI Prompts

The Mock Interview AI uses several prompts for different stages of the
interview.

### 6.1 Analyze Answer

**Purpose:** Analyzes a candidate's answer and returns a score and feedback.
**Variables:** `question`, `answer` **Expected Output:** JSON with `score`
(number 1-10) and `feedback` (string).

### 6.2 Follow-up Question

**Purpose:** Generates a follow-up question based on the candidate's previous
answer. **Variables:** `question`, `answer` **Expected Output:** Raw text of the
follow-up question.

### 6.3 Generate Questions

**Purpose:** Generates 3-5 interview questions based on company, type, and
difficulty. **Variables:** `companyId`, `interviewType`, `difficulty` **Expected
Output:** Numbered list of questions as text.

### 6.4 Overall Feedback

**Purpose:** Provides a comprehensive summary at the end of an interview
session. **Variables:** `sessions` (Array of question/answer pairs) **Expected
Output:** Formatted text outlining overall impression, strengths, and areas for
improvement.

---

## 7. RAG Pipeline Prompts

Used for context-aware AI responses.

### 7.1 Context Prompt

**Purpose:** Grounds AI responses in provided documentation. **Variables:**
`query`, `context`

### 7.2 Summarize Context

**Purpose:** Summarizes multiple documents for efficient retrieval.
**Variables:** `documents` (array)

---

## 8. Quiz Generation

**Purpose:** Generates quiz questions on any topic. **Variables:** `topic`,
`difficulty`, `count` **Output:** JSON array with question, options, correct
answer, explanation

---

## 9. Concept Explanation

**Purpose:** Explains technical concepts at appropriate difficulty level.
**Variables:** `concept`, `userLevel` (beginner/intermediate/advanced)

**Level-Specific Guidelines:**

- **Beginner:** Simple terms, everyday analogies, avoid jargon
- **Intermediate:** Technical background assumed, proper terminology
- **Advanced:** Expert knowledge, deep nuances, edge cases
