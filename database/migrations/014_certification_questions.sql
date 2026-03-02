-- Migration: 014_certification_questions.sql
-- Description: Creates tables for certification exam questions

-- Certification Questions Table
CREATE TABLE IF NOT EXISTS public.certification_questions (
    id TEXT PRIMARY KEY,
    cert_id TEXT NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Kubernetes Fundamentals questions
INSERT INTO public.certification_questions (id, cert_id, question_text, question_type, options, correct_answer, explanation, points, order_index) VALUES
('k8s-q1', 'k8s-fundamentals', 'What is the smallest deployable unit in Kubernetes?', 'multiple_choice', 
 '["A Pod", "A Deployment", "A Service", "A ReplicaSet"]', 
 'A Pod', 
 'A Pod is the smallest and simplest Kubernetes object. It represents a single instance of a running process in your cluster.',
 10, 1),

('k8s-q2', 'k8s-fundamentals', 'Which component is responsible for maintaining the desired state of the cluster?', 'multiple_choice',
 '["kube-controller-manager", "kube-apiserver", "kubelet", "etcd"]',
 'kube-controller-manager',
 'The kube-controller-manager runs controller processes that regulate the state of the cluster.',
 10, 2),

('k8s-q3', 'k8s-fundamentals', 'What is a Kubernetes Service?', 'multiple_choice',
 '["A network abstraction that exposes an application running on a set of Pods", "A type of storage volume", "A method for auto-scaling", "A logging mechanism"]',
 'A network abstraction that exposes an application running on a set of Pods',
 'A Service is an abstraction which defines a logical set of Pods and a policy by which to access them.',
 10, 3),

('k8s-q4', 'k8s-fundamentals', 'Which kubectl command lists all pods in a namespace?', 'multiple_choice',
 '["kubectl get pods", "kubectl list pods", "kubectl show pods", "kubectl pods --list"]',
 'kubectl get pods',
 'kubectl get pods is the command to list all pods in the current namespace.',
 10, 4),

('k8s-q5', 'k8s-fundamentals', 'What is a Deployment in Kubernetes?', 'multiple_choice',
 '["A resource that provides declarative updates for Pods and ReplicaSets", "A network load balancer", "A persistent storage volume", "A container runtime"]',
 'A resource that provides declarative updates for Pods and ReplicaSets',
 'A Deployment provides declarative updates for Pods and ReplicaSets.',
 10, 5),

('k8s-q6', 'k8s-fundamentals', 'What is the default port for the Kubernetes API server?', 'multiple_choice',
 '["6443", "8080", "443", "8443"]',
 '6443',
 'The Kubernetes API server listens on port 6443 by default.',
 10, 6),

('k8s-q7', 'k8s-fundamentals', 'What is a ConfigMap used for?', 'multiple_choice',
 '["To store non-confidential configuration data", "To store secrets", "To store persistent data", "To manage network policies"]',
 'To store non-confidential configuration data',
 'ConfigMap is used to store non-confidential configuration data in key-value pairs.',
 10, 7),

('k8s-q8', 'k8s-fundamentals', 'What is the purpose of a liveness probe?', 'multiple_choice',
 '["To check if a container is running and restart it if not", "To check if a container is ready to receive traffic", "To monitor resource usage", "To log container events"]',
 'To check if a container is running and restart it if not',
 'Liveness probes let Kubernetes know when to restart a container that is stuck or unhealthy.',
 10, 8),

('k8s-q9', 'k8s-fundamentals', 'What is a PersistentVolume (PV)?', 'multiple_choice',
 '["A piece of storage in the cluster that has been provisioned by an administrator", "A temporary storage location", "A backup mechanism", "A type of container"]',
 'A piece of storage in the cluster that has been provisioned by an administrator',
 'A PersistentVolume is a piece of storage in the cluster that has been provisioned by an administrator.',
 10, 9),

('k8s-q10', 'k8s-fundamentals', 'What is the purpose of a ReplicaSet?', 'multiple_choice',
 '["To ensure a stable set of replica Pods are running at any given time", "To schedule pods on nodes", "To manage network policies", "To store configuration"]',
 'To ensure a stable set of replica Pods are running at any given time',
 'A ReplicaSet ensures a stable set of replica Pods are running at any given time.',
 10, 10);

-- Seed Docker Expert questions
INSERT INTO public.certification_questions (id, cert_id, question_text, question_type, options, correct_answer, explanation, points, order_index) VALUES
('docker-q1', 'docker-expert', 'What is a multi-stage Docker build?', 'multiple_choice',
 '["A build process that uses multiple FROM statements to create smaller final images", "A build that runs in parallel", "A build with multiple build contexts", "A build using multiple Dockerfiles"]',
 'A build process that uses multiple FROM statements to create smaller final images',
 'Multi-stage builds use multiple FROM statements in a single Dockerfile to create optimized final images.',
 10, 1),

('docker-q2', 'docker-expert', 'Which instruction in a Dockerfile is used to define environment variables?', 'multiple_choice',
 '["ENV", "SET", "VARIABLE", "EXPORT"]',
 'ENV',
 'The ENV instruction sets environment variables that persist when a container is run.',
 10, 2),

('docker-q3', 'docker-expert', 'What is the purpose of the .dockerignore file?', 'multiple_choice',
 '["To exclude files and directories from the build context", "To cache build layers", "To define network settings", "To set build arguments"]',
 'To exclude files and directories from the build context',
 '.dockerignore prevents files from being sent to the Docker daemon during build.',
 10, 3),

('docker-q4', 'docker-expert', 'What is the difference between CMD and ENTRYPOINT?', 'multiple_choice',
 '["CMD provides defaults for executing a container, ENTRYPOINT configures the container as executable", "They are identical", "CMD is for building, ENTRYPOINT is for running", "There is no difference"]',
 'CMD provides defaults for executing a container, ENTRYPOINT configures the container as executable',
 'CMD can be overridden while ENTRYPOINT configures the container to run as an executable.',
 10, 4),

('docker-q5', 'docker-expert', 'What is Docker Compose used for?', 'multiple_choice',
 '["Defining and running multi-container Docker applications", "Building single container images", "Managing Docker Swarm", "Creating Docker registries"]',
 'Defining and running multi-container Docker applications',
 'Docker Compose is a tool for defining and running multi-container applications.',
 10, 5);

-- Seed System Design Pro questions
INSERT INTO public.certification_questions (id, cert_id, question_text, question_type, options, correct_answer, explanation, points, order_index) VALUES
('sd-q1', 'system-design-pro', 'What is the primary purpose of a load balancer?', 'multiple_choice',
 '["Distribute incoming network traffic across multiple servers", "Store data persistently", "Cache API responses", "Encrypt network traffic"]',
 'Distribute incoming network traffic across multiple servers',
 'Load balancers distribute traffic across multiple servers to ensure no single server is overwhelmed.',
 10, 1),

('sd-q2', 'system-design-pro', 'What is eventual consistency?', 'multiple_choice',
 '["A consistency model where updates will propagate through all replicas eventually", "All updates must complete before any reads", "No consistency guarantees", "Strong consistency in distributed systems"]',
 'A consistency model where updates will propagate through all replicas eventually',
 'Eventual consistency guarantees that if no new updates are made, all replicas will eventually return the last written value.',
 10, 2),

('sd-q3', 'system-design-pro', 'What is horizontal scaling?', 'multiple_choice',
 '["Adding more machines to the system to handle increased load", "Adding more resources to a single machine", "Reducing the number of servers", "Optimizing code performance"]',
 'Adding more machines to the system to handle increased load',
 'Horizontal scaling adds more machines to distribute the load, as opposed to vertical scaling which adds resources to existing machines.',
 10, 3),

('sd-q4', 'system-design-pro', 'What is a CDN (Content Delivery Network)?', 'multiple_choice',
 '["A geographically distributed network of servers that delivers content", "A type of database", "A programming language", "A network protocol"]',
 'A geographically distributed network of servers that delivers content',
 'CDNs cache content at edge locations close to users for faster delivery.',
 10, 4),

('sd-q5', 'system-design-pro', 'What is the CAP theorem about?', 'multiple_choice',
 '["Trade-offs between Consistency, Availability, and Partition tolerance", "Container orchestration", "Code analysis and performance", "Cache allocation and partitioning"]',
 'Trade-offs between Consistency, Availability, and Partition tolerance',
 'CAP theorem states that a distributed system can only guarantee two of three: Consistency, Availability, and Partition Tolerance.',
 10, 5);

-- Enable RLS
ALTER TABLE public.certification_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read certification questions
CREATE POLICY "Anyone can read certification questions"
    ON public.certification_questions FOR SELECT
    USING (true);
