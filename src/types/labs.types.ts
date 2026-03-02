/**
 * Container Lab Types
 * Defines types for hands-on container labs
 */

export interface LabExercise {
    id: string;
    title: string;
    description: string;
    initialCode: string;
    language: 'dockerfile' | 'yaml' | 'bash' | 'json';
    hints?: string[];
    solution?: string;
    testCases?: TestCase[];
}

export interface TestCase {
    id: string;
    name: string;
    command: string;
    expectedOutput?: string;
    shouldContain?: string[];
    shouldNotContain?: string[];
    points: number;
}

export interface LabProgress {
    exerciseId: string;
    completed: boolean;
    attempts: number;
    bestScore: number;
    lastAttempt: string;
}

export interface ContainerSession {
    id: string;
    labId: string;
    exerciseId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output: string[];
    startTime: number;
    endTime?: number;
}

export interface LabConfig {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    topics: string[];
    available: boolean;
    exercises: LabExercise[];
}

// Simulated container commands for labs
export const CONTAINER_COMMANDS = {
    docker: [
        { command: 'docker ps', description: 'List running containers' },
        { command: 'docker ps -a', description: 'List all containers' },
        { command: 'docker images', description: 'List local images' },
        { command: 'docker run <image>', description: 'Run a container' },
        { command: 'docker build -t <name> .', description: 'Build an image' },
        { command: 'docker exec -it <container> sh', description: 'Shell into container' },
        { command: 'docker logs <container>', description: 'View container logs' },
        { command: 'docker stop <container>', description: 'Stop a container' },
        { command: 'docker rm <container>', description: 'Remove a container' },
    ],
    kubernetes: [
        { command: 'kubectl get pods', description: 'List all pods' },
        { command: 'kubectl get services', description: 'List all services' },
        { command: 'kubectl get deployments', description: 'List all deployments' },
        { command: 'kubectl apply -f <file>', description: 'Apply a configuration' },
        { command: 'kubectl describe pod <name>', description: 'Get pod details' },
        { command: 'kubectl logs <pod>', description: 'Get pod logs' },
        { command: 'kubectl exec -it <pod> -- sh', description: 'Shell into pod' },
        { command: 'kubectl scale deployment <name> --replicas=N', description: 'Scale deployment' },
        { command: 'kubectl delete pod <name>', description: 'Delete a pod' },
    ],
    cicd: [
        { command: 'git status', description: 'Check git status' },
        { command: 'git add .', description: 'Stage all changes' },
        { command: 'git commit -m "message"', description: 'Commit changes' },
        { command: 'npm test', description: 'Run tests' },
        { command: 'npm run build', description: 'Build the project' },
    ],
};

// Simulated container output for demo purposes
export function simulateDockerOutput(code: string): string[] {
    const outputs: string[] = [];

    if (code.includes('docker build')) {
        outputs.push('Sending build context to Docker daemon  25.06kB');
        outputs.push('Step 1/10 : FROM node:18-alpine');
        outputs.push(' ---> Using cache');
        outputs.push('Step 2/10 : WORKDIR /app');
        outputs.push(' ---> Using cache');
        outputs.push('Step 3/10 : COPY package*.json ./');
        outputs.push(' ---> Using cache');
        outputs.push('Step 4/10 : RUN npm install');
        outputs.push(' ---> Using cache');
        outputs.push('Step 5/10 : COPY . .');
        outputs.push(' ---> Using cache');
        outputs.push('Step 6/10 : EXPOSE 3000');
        outputs.push(' ---> Using cache');
        outputs.push('Step 7/10 : ENV NODE_ENV=production');
        outputs.push(' ---> Using cache');
        outputs.push('Step 8/10 : USER node');
        outputs.push(' ---> Using cache');
        outputs.push('Step 9/10 : HEALTHCHECK --interval=30s --timeout=3s \\');
        outputs.push('  --start-period=40s --retries=3 \\');
        outputs.push('  ---> Using cache');
        outputs.push('Step 10/10 : CMD ["npm", "start"]');
        outputs.push(' ---> Using cache');
        outputs.push('Successfully built abc123def456');
        outputs.push('Successfully tagged myapp:latest');
    } else if (code.includes('docker run')) {
        outputs.push('Unable to find image \'myapp:latest\' locally');
        outputs.push('latest: Pulling from library/node');
        outputs.push('abc123: Pull complete');
        outputs.push('def456: Pull complete');
        outputs.push('Digest: sha256:789012345678901234567890');
        outputs.push('Status: Downloaded newer image for node:18-alpine');
        outputs.push('1234567890ab: Container created');
        outputs.push('Starting container...');
        outputs.push('Container started successfully!');
        outputs.push('Application running on http://localhost:3000');
    } else if (code.includes('docker-compose')) {
        outputs.push('Creating network "myapp_default" with the default driver');
        outputs.push('Creating volume "myapp_postgres_data" with the default driver');
        outputs.push('Building web...');
        outputs.push('Building redis...');
        outputs.push('Creating myapp_web_1   ... done');
        outputs.push('Creating myapp_redis_1  ... done');
        outputs.push('Creating myapp_db_1     ... done');
        outputs.push('Attaching to myapp_web_1, myapp_redis_1, myapp_db_1');
        outputs.push('web_1    | Database connected');
        outputs.push('web_1    | Server started on port 3000');
        outputs.push('redis_1  | Ready to accept connections');
        outputs.push('db_1     | Database system is ready to accept connections');
    } else if (code.includes('version:') || code.includes('services:')) {
        outputs.push('Creating network "app_default" with the default driver');
        outputs.push('Creating service "app_web"');
        outputs.push('Creating service "app_worker"');
        outputs.push('Creating service "app_redis"');
        outputs.push('Creating config "app_config"');
        outputs.push('Creating secret "app_secret"');
        outputs.push('Service created successfully');
    } else if (code.includes('apiVersion:') && code.includes('kind: Pod')) {
        outputs.push('pod/nginx-pod created');
        outputs.push('pod/nginx-pod configured');
        outputs.push('pod/nginx-pod typed');
        outputs.push('');
        outputs.push('NAME            READY   STATUS    RESTARTS   AGE');
        outputs.push('nginx-pod       1/1     Running   0          10s');
    } else if (code.includes('kind: Deployment')) {
        outputs.push('deployment.apps/nginx-deployment created');
        outputs.push('');
        outputs.push('NAME                   READY   UP-TO-DATE   AVAILABLE');
        outputs.push('nginx-deployment       3/3     3            3');
        outputs.push('');
        outputs.push('deployment.apps/nginx-deployment scaled');
    } else if (code.includes('kind: Service')) {
        outputs.push('service/nginx-service created');
        outputs.push('');
        outputs.push('NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)');
        outputs.push('nginx-service   ClusterIP   10.100.50.100   <none>        80/TCP');
    } else {
        outputs.push('Analyzing code...');
        outputs.push('No executable commands detected');
        outputs.push('This is a configuration file');
    }

    return outputs;
}

export function simulateKubectlOutput(code: string): string[] {
    const outputs: string[] = [];

    if (code.includes('get pods')) {
        outputs.push('NAME                          READY   STATUS    RESTARTS   AGE');
        outputs.push('nginx-deployment-abc123def   1/1     Running   0          5m');
        outputs.push('nginx-deployment-ghi456jkl    1/1     Running   0          5m');
        outputs.push('redis-master-789xyz012        1/1     Running   0          10m');
    } else if (code.includes('get services')) {
        outputs.push('NAME            TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)');
        outputs.push('kubernetes       ClusterIP   10.96.0.1     <none>        443/TCP');
        outputs.push('nginx-service    ClusterIP   10.100.50.1   <none>        80/TCP');
        outputs.push('redis-master     ClusterIP   10.100.50.2   <none>        6379/TCP');
    } else if (code.includes('get deployments')) {
        outputs.push('NAME               READY   UP-TO-DATE   AVAILABLE');
        outputs.push('nginx-deployment   3/3     3            3');
        outputs.push('worker-deployment  2/2     2            2');
    } else if (code.includes('apply -f')) {
        outputs.push('deployment.apps/nginx-deployment created');
        outputs.push('service/nginx-service created');
        outputs.push('configmap/app-config created');
    } else if (code.includes('scale deployment')) {
        outputs.push('deployment.apps/nginx-deployment scaled');
    } else {
        outputs.push('Analyzing kubectl command...');
        outputs.push('Command executed successfully');
    }

    return outputs;
}

export function simulateGitHubActionsOutput(code: string): string[] {
    const outputs: string[] = [];

    if (code.includes('on:')) {
        outputs.push('Starting workflow...');
        outputs.push('Trigger: push to main branch');
        outputs.push('');
        outputs.push('Jobs:');
        outputs.push('  build:');
        outputs.push('    Running on: ubuntu-latest');
        outputs.push('    Step: Checkout code');
        outputs.push('    Step: Setup Node.js');
        outputs.push('    Step: Install dependencies');
        outputs.push('    Step: Lint code');
        outputs.push('    Step: Run tests');
        outputs.push('');
        outputs.push('  test:');
        outputs.push('    Running on: ubuntu-latest');
        outputs.push('    Step: Checkout code');
        outputs.push('    Step: Setup Node.js');
        outputs.push('    Step: Run unit tests');
        outputs.push('    Step: Run integration tests');
        outputs.push('');
        outputs.push('  deploy:');
        outputs.push('    Running on: ubuntu-latest');
        outputs.push('    Step: Checkout code');
        outputs.push('    Step: Configure AWS credentials');
        outputs.push('    Step: Deploy to S3');
        outputs.push('    Step: Invalidate CloudFront cache');
        outputs.push('');
        outputs.push('✅ All jobs completed successfully');
        outputs.push('Workflow completed in 2m 34s');
    } else {
        outputs.push('Analyzing GitHub Actions workflow...');
        outputs.push('Workflow syntax validated');
        outputs.push('No execution needed');
    }

    return outputs;
}
