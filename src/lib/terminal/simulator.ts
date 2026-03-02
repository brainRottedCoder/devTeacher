// Terminal simulator for Docker, Kubernetes, and Cloud labs
// This provides a safe, sandboxed way to learn CLI commands

export interface TerminalSession {
    id: string;
    type: 'docker' | 'kubernetes' | 'cloud' | 'bash';
    workingDir: string;
    history: TerminalLine[];
    variables: Record<string, string>;
}

export interface TerminalLine {
    type: 'input' | 'output' | 'error' | 'system';
    content: string;
    timestamp: number;
}

export interface CommandResult {
    output: string;
    error?: string;
    success: boolean;
}

// Docker simulation
const dockerCommands: Record<string, (args: string[], session: TerminalSession) => CommandResult> = {
    // Docker run commands
    'docker run': (args, session) => {
        const hasFlag = (flag: string) => args.includes(flag);
        const getArg = (flag: string) => {
            const idx = args.indexOf(flag);
            return idx >= 0 && args[idx + 1];
        };

        if (args.length === 0) {
            return { output: 'docker run requires at least one argument', success: false, error: 'Usage: docker run [OPTIONS] IMAGE [COMMAND] [ARG...]' };
        }

        const image = args[0];
        const name = getArg('--name') || `container-${Math.random().toString(36).substr(2, 9)}`;
        const detached = hasFlag('-d');
        const ports = getArg('-p');

        session.variables[`LAST_CONTAINER`] = name;

        return {
            success: true,
            output: detached
                ? `Unable to find image '${image}' locally\nPulling from registry... Done\n${name}`
                : `Hello from Docker!\nThis message shows that your installation appears to be working correctly.`
        };
    },

    'docker ps': (args) => {
        const all = args.includes('-a');
        const header = 'CONTAINER ID   IMAGE       COMMAND    CREATED    STATUS    PORTS   NAMES';
        if (all) {
            return { success: true, output: header };
        }
        return { success: true, output: header };
    },

    'docker images': () => {
        return {
            success: true,
            output: 'REPOSITORY   TAG       IMAGE ID       CREATED       SIZE\nnode         18        f5509e45c60a   2 days ago    1.1GB\nnginx        latest    a6bd71f48f68   3 days ago    142MB'
        };
    },

    'docker pull': (args) => {
        if (args.length === 0) {
            return { success: false, output: '', error: 'docker pull requires at least one argument' };
        }
        const image = args[0];
        return {
            success: true,
            output: `Pulling from library/${image}...\nDigest: sha256:${Math.random().toString(36).substr(2, 64)}\nStatus: Downloaded newer image for ${image}:latest`
        };
    },

    'docker build': (args) => {
        const tag = args.find(a => a.startsWith('-t'))?.split(':')[1] || 'myapp:latest';
        return {
            success: true,
            output: `Sending build context to Docker daemon  2.048kB\nStep 1/5 : FROM node:18-alpine\n ---> f5509e45c60a\nStep 2/5 : WORKDIR /app\n ---> Using cache\n ---> abc123\nStep 3/5 : COPY package*.json ./\n ---> Using cache\nStep 4/5 : RUN npm install\n ---> Running in def456\nremoved: 100 packages in 2s\nStep 5/5 : CMD ["node", "index.js"]\nSuccessfully built ${Math.random().toString(36).substr(2, 12)}\nSuccessfully tagged ${tag}`
        };
    },

    'docker exec': (args, session) => {
        const container = args[0] || session.variables.LAST_CONTAINER;
        const cmd = args.slice(2).join(' ');
        return {
            success: true,
            output: `Executing '${cmd}' in ${container}...\n(Interactive mode not available in simulator)`
        };
    },

    'docker logs': (args, session) => {
        const container = args[0] || session.variables.LAST_CONTAINER;
        return {
            success: true,
            output: `Container ${container} logs:\n2024-01-15T10:00:00.000Z Server started on port 3000\n2024-01-15T10:00:01.000Z Ready for connections`
        };
    },

    'docker-compose': (args) => {
        const subcmd = args[0];
        if (subcmd === 'up') {
            return {
                success: true,
                output: `[+] Running 2/2\n ⠿ Network app_default        Created\n ⠿ Container app-web-1         Started\n ⠿ Container app-db-1          Started`
            };
        }
        if (subcmd === 'down') {
            return {
                success: true,
                output: `[+] Running 2/2\n ⠿ Container app-db-1          Stopped\n ⠿ Container app-web-1         Stopped\n ⠿ Network app_default        Removed`
            };
        }
        return { success: true, output: 'docker-compose version 2.0.0' };
    },

    'docker --version': () => ({
        success: true,
        output: 'Docker version 24.0.7, build 311b9ff'
    }),

    'docker help': () => ({
        success: true,
        output: `Usage: docker [OPTIONS] COMMAND\n\nCommands:\n  build       Build an image from a Dockerfile\n  run         Run a command in a new container\n  ps          List containers\n  images      List images\n  pull        Pull an image from a registry\n  exec        Execute a command in a container\n  logs        Fetch the logs of a container\n  compose     Docker Compose\n\nRun 'docker help COMMAND' for more information.`
    }),
};

// Kubernetes simulation
const k8sCommands: Record<string, (args: string[], session: TerminalSession) => CommandResult> = {
    'kubectl get pods': () => ({
        success: true,
        output: 'NAME                        READY   STATUS    RESTARTS   AGE\nnginx-deployment-7fb96c846b-abc12   1/1     Running   0          5d\nnginx-deployment-7fb96c846b-def34   1/1     Running   0          5d\nweb-app-5f9d8c7b4-ghi56        1/1     Running   0          3d'
    }),

    'kubectl get services': () => ({
        success: true,
        output: 'NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE\nkubernetes     ClusterIP      10.96.0.1       <none>        443/TCP        30d\nnginx-service  LoadBalancer   10.96.45.123    1.2.3.4      80:30080/TCP   5d'
    }),

    'kubectl get deployments': () => ({
        success: true,
        output: 'NAME               READY   UP-TO-DATE   AVAILABLE   AGE\nnginx-deployment   2/2     2            2           5d\nweb-app            3/3     3            3           10d'
    }),

    'kubectl apply': (args) => {
        return {
            success: true,
            output: `deployment.apps/nginx-deployment created\nservice/nginx-service created`
        };
    },

    'kubectl delete': (args) => {
        const resource = args[1] || args[0];
        return {
            success: true,
            output: `${resource} "${resource}" deleted`
        };
    },

    'kubectl describe': (args) => {
        const resource = args[0];
        const name = args[1];
        return {
            success: true,
            output: `Name:         ${name}\nNamespace:    default\nPriority:    0\nNode:        minikube/10.0.0.1\nStatus:      Running\nContainers:\n  nginx:\n    Container ID:   docker://abc123\n    Image:          nginx:latest\n    State:          Running\n    Ready:          True\n    Restart Count:  0`
        };
    },

    'kubectl logs': (args) => {
        const pod = args[0];
        return {
            success: true,
            output: `Logs from ${pod}:\n2024-01-15T10:00:00.000Z Server listening on port 80\n2024-01-15T10:00:01.000Z Ready to handle requests`
        };
    },

    'kubectl exec': (args) => {
        const pod = args[0];
        const cmd = args.slice(2).join(' ');
        return {
            success: true,
            output: `$ ${cmd}\n(Interactive execution not available in simulator)`
        };
    },

    'kubectl scale': (args) => {
        const replicas = args.find(a => !a.startsWith('-'))?.split('=')[1] || args[1];
        return {
            success: true,
            output: `deployment.apps/web-app scaled to ${replicas}`
        };
    },

    'kubectl version': () => ({
        success: true,
        output: `Client Version: v1.28.0\nServer Version: v1.28.0`
    }),

    'kubectl cluster-info': () => ({
        success: true,
        output: `Kubernetes control plane is running at https://192.168.49.2:8443\nCoreDNS is running at https://192.168.49.2:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy`
    }),

    'kubectl get nodes': () => ({
        success: true,
        output: 'NAME       STATUS   ROLES           AGE   VERSION\nminikube   Ready    control-plane   30d   v1.28.0'
    }),
};

// Cloud CLI simulation
const cloudCommands: Record<string, (args: string[], session: TerminalSession) => CommandResult> = {
    // AWS CLI
    'aws': (args) => {
        const subcmd = args[0];
        if (subcmd === 's3') {
            const s3cmd = args[1];
            if (s3cmd === 'ls') {
                return { success: true, output: '2024-01-15 10:00   my-bucket/\n2024-01-15 11:00   another-bucket/' };
            }
            if (s3cmd === 'mb') {
                return { success: true, output: `make_bucket: ${args[2]}` };
            }
        }
        if (subcmd === 'ec2') {
            return { success: true, output: 'Instances:\ni-0abc123  t3.micro  running  10.0.1.10' };
        }
        return { success: true, output: 'AWS CLI version 2.0.0' };
    },

    // GCP CLI
    'gcloud': (args) => {
        const subcmd = args[0];
        if (subcmd === 'compute') {
            return { success: true, output: 'Instances:\nNAME        ZONE        MACHINE_TYPE  STATUS\nmy-instance us-central1-a n1-standard-1 RUNNING' };
        }
        if (subcmd === 'projects') {
            return { success: true, output: 'PROJECT_ID              PROJECT_NUMBER\nmy-project-123        123456789012' };
        }
        return { success: true, output: 'Google Cloud SDK 400.0.0' };
    },

    // Azure CLI
    'az': (args) => {
        const subcmd = args[0];
        if (subcmd === 'vm') {
            return { success: true, output: 'Name         ResourceGroup    Location    Status\nmy-vm       my-rg          eastus      VM Running' };
        }
        if (subcmd === 'account') {
            return { success: true, output: 'Account: user@example.com\nSubscription: Free Trial' };
        }
        return { success: true, output: 'Azure CLI version 2.50.0' };
    },

    // Terraform
    'terraform': (args) => {
        const subcmd = args[0];
        if (subcmd === 'init') {
            return { success: true, output: 'Terraform initialized!\n\nProvider plugins downloaded and verified.' };
        }
        if (subcmd === 'plan') {
            return {
                success: true, output: `Terraform will perform the following actions:

  # aws_instance.example will be created
  + resource "aws_instance" "example" {
      + ami           = "ami-0c55b159cbfafe1f0"
      + instance_type = "t2.micro"
    }

Plan: 1 to add, 0 to change, 0 to destroy.` };
        }
        if (subcmd === 'apply') {
            return { success: true, output: 'Apply complete! Resources: 1 added, 0 changed, 0 destroyed.' };
        }
        return { success: true, output: 'Terraform v1.6.0' };
    },
};

// General bash commands
const bashCommands: Record<string, (args: string[], session: TerminalSession) => CommandResult> = {
    'ls': (args) => {
        const showAll = args.includes('-a');
        const long = args.includes('-l');
        let output = showAll
            ? '.\n..\n.dockerignore\nDockerfile\npackage.json\nsrc\nnode_modules'
            : 'Dockerfile\npackage.json\nsrc\nnode_modules';

        if (long) {
            output = output.split('\n').map(line => {
                const isDir = line.endsWith('/') || ['src', 'node_modules'].includes(line);
                return `${isDir ? 'drwxr-xr-x' : '-rw-r--r--'}  1 user staff  4096 Jan 15 10:00 ${line}`;
            }).join('\n');
        }

        return { success: true, output };
    },

    'cd': (args, session) => {
        const dir = args[0] || '~';
        if (dir === '~') {
            session.workingDir = '/home/user';
        } else if (dir === '..') {
            const parts = session.workingDir.split('/');
            parts.pop();
            session.workingDir = parts.join('/') || '/';
        } else if (dir.startsWith('/')) {
            session.workingDir = dir;
        } else {
            session.workingDir = `${session.workingDir}/${dir}`;
        }
        return { success: true, output: '' };
    },

    'pwd': (_, session) => ({
        success: true,
        output: session.workingDir
    }),

    'echo': (args) => ({
        success: true,
        output: args.join(' ')
    }),

    'cat': (args) => {
        const file = args[0];
        if (file === 'package.json') {
            return { success: true, output: '{\n  "name": "my-app",\n  "version": "1.0.0"\n}' };
        }
        if (file === 'Dockerfile') {
            return { success: true, output: 'FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]' };
        }
        return { success: false, output: '', error: `cat: ${file}: No such file or directory` };
    },

    'mkdir': (args) => ({
        success: true,
        output: ''
    }),

    'touch': (args) => ({
        success: true,
        output: ''
    }),

    'rm': (args) => ({
        success: true,
        output: ''
    }),

    'cp': (args) => ({
        success: true,
        output: ''
    }),

    'mv': (args) => ({
        success: true,
        output: ''
    }),

    'grep': (args) => ({
        success: true,
        output: 'matching line here'
    }),

    'npm': (args) => {
        const subcmd = args[0];
        if (subcmd === 'install') {
            return { success: true, output: 'added 1423 packages in 15s' };
        }
        if (subcmd === 'start') {
            return { success: true, output: 'Server running at http://localhost:3000' };
        }
        if (subcmd === 'test') {
            return { success: true, output: 'PASS tests/app.test.ts\nTests: 2 passed' };
        }
        return { success: true, output: 'npm version 10.0.0' };
    },

    'git': (args) => {
        const subcmd = args[0];
        if (subcmd === 'status') {
            return { success: true, output: 'On branch main\nYour branch is up to date.\n\nnothing to commit, working tree clean' };
        }
        if (subcmd === 'clone') {
            return { success: true, output: 'Cloning into \'repo\'...\nremote: Enumerating objects: 100\nReceiving objects: 100%' };
        }
        if (subcmd === 'commit') {
            return { success: true, output: '[main abc1234] Commit message\n 1 file changed, 10 insertions(+)' };
        }
        if (subcmd === 'push') {
            return { success: true, output: 'Enumerating objects: 5\nPushing to main' };
        }
        if (subcmd === 'pull') {
            return { success: true, output: 'Already up to date.' };
        }
        return { success: true, output: 'git version 2.40.0' };
    },

    'curl': (args) => {
        return { success: true, output: '<!DOCTYPE html>\n<html>\n<head><title>Hello</title></head>\n<body>Hello World</body>\n</html>' };
    },

    'wget': (args) => {
        return { success: true, output: 'Saving to: index.html\nindex.html 100% |***| 100%  0:00:00' };
    },

    'help': () => ({
        success: true,
        output: `Available commands:
- ls, cd, pwd, mkdir, touch, rm, cp, mv
- cat, echo, grep
- npm, git, docker, kubectl, terraform
- aws, gcloud, az

Use 'command --help' for more information.`
    }),
};

// Main execute function
let sessionCounter = 0;

export function createSession(type: TerminalSession['type'] = 'bash'): TerminalSession {
    return {
        id: `session-${++sessionCounter}`,
        type,
        workingDir: '/home/user',
        history: [{
            type: 'system',
            content: `Welcome to ${type === 'bash' ? 'Terminal' : type.toUpperCase()} Simulator!\nType 'help' for available commands.`,
            timestamp: Date.now()
        }],
        variables: {}
    };
}

export function executeCommand(session: TerminalSession, input: string): CommandResult {
    const trimmed = input.trim();
    if (!trimmed) {
        return { success: true, output: '' };
    }

    // Parse command and args
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Add to history
    session.history.push({
        type: 'input',
        content: trimmed,
        timestamp: Date.now()
    });

    let result: CommandResult | undefined;

    // Try different command dictionaries based on session type
    const commandSets: Record<string, (args: string[], session: TerminalSession) => CommandResult>[] = [];

    if (session.type === 'docker' || cmd.startsWith('docker')) {
        commandSets.push(dockerCommands);
    }
    if (session.type === 'kubernetes' || cmd.startsWith('kubectl')) {
        commandSets.push(k8sCommands);
    }
    if (session.type === 'cloud' || ['aws', 'gcloud', 'az', 'terraform'].includes(cmd)) {
        commandSets.push(cloudCommands);
    }
    commandSets.push(bashCommands);

    // Find matching command
    for (const commands of commandSets) {
        // Try exact match first
        if (commands[trimmed]) {
            result = commands[trimmed](args, session);
            break;
        }
        // Try partial match (for commands with flags)
        const partialMatch = Object.keys(commands).find(c => trimmed.startsWith(c));
        if (partialMatch) {
            result = commands[partialMatch](args, session);
            break;
        }
    }

    if (!result) {
        result = {
            success: false,
            output: '',
            error: `Command not found: ${cmd}`
        };
    }

    // Add output to history
    if (result.output) {
        session.history.push({
            type: result.success ? 'output' : 'error',
            content: result.output,
            timestamp: Date.now()
        });
    }
    if (result.error) {
        session.history.push({
            type: 'error',
            content: result.error,
            timestamp: Date.now()
        });
    }

    return result;
}

export function getCommandSuggestions(session: TerminalSession, partial: string): string[] {
    const allCommands = [
        ...Object.keys(bashCommands),
        ...(session.type === 'docker' ? Object.keys(dockerCommands) : []),
        ...(session.type === 'kubernetes' ? Object.keys(k8sCommands) : []),
        ...(session.type === 'cloud' ? Object.keys(cloudCommands) : []),
    ];

    return allCommands
        .filter(cmd => cmd.startsWith(partial))
        .slice(0, 10);
}
