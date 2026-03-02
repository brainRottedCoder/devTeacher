export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  content: any;
  order: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  progress_percentage: number;
  last_accessed: string;
}

export interface SimulationConfig {
  initialUsers: number;
  targetUsers: number;
  architecture: ArchitectureComponent[];
}

export interface ArchitectureComponent {
  id: string;
  type: 'server' | 'database' | 'cache' | 'load_balancer' | 'cdn' | 'queue';
  name: string;
  specs: {
    cpu?: number;
    memory?: number;
    storage?: number;
  };
  connections: string[];
}

export interface SimulationResult {
  timestamp: number;
  users: number;
  latency: number;
  throughput: number;
  cost: number;
  bottlenecks: string[];
  recommendations: string[];
}
