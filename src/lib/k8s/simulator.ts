export type K8sResourceKind = "Pod" | "Deployment" | "Service" | "Namespace" | "ConfigMap" | "Secret" | "Ingress" | "ReplicaSet" | "StatefulSet" | "DaemonSet";

export interface K8sMetadata {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
}

export interface K8sResource {
    apiVersion: string;
    kind: K8sResourceKind;
    metadata: K8sMetadata;
    spec: Record<string, any>;
    status: Record<string, any>;
    data?: Record<string, string>;
}

export interface K8sEvent {
    id: string;
    type: "Normal" | "Warning";
    reason: string;
    message: string;
    involvedObject: {
        kind: string;
        name: string;
        namespace: string;
    };
    firstTimestamp: string;
    lastTimestamp: string;
    count: number;
}

export interface SimulatorState {
    resources: K8sResource[];
    events: K8sEvent[];
    currentNamespace: string;
}

export interface CommandResult {
    output: string;
    error?: boolean;
    newState?: SimulatorState;
}

const EVENT_REASONS = {
    Normal: [
        { reason: "Scheduled", message: "Successfully assigned {resource}/{name} to node-1" },
        { reason: "Pulled", message: "Container image \"{image}\" already present on machine" },
        { reason: "Created", message: "Created container {container}" },
        { reason: "Started", message: "Started container {container}" },
        { reason: "ScalingReplicaSet", message: "Scaled {replicas} replica(s) of {resource}/{name} to {replicas}" },
        { reason: "SuccessfulCreate", message: "Created pod {pod}" },
        { reason: "SuccessfulDelete", message: "Deleted pod {pod}" },
        { reason: "LeaderElection", message: "{resource}/{name} acquired leadership" },
    ],
    Warning: [
        { reason: "FailedScheduling", message: "0/1 nodes are available: 1 Insufficient cpu" },
        { reason: "FailedPull", message: "Failed to pull image \"{image}\"" },
        { reason: "FailedCreate", message: "Error creating container" },
        { reason: "FailedDelete", message: "Failed to delete pod" },
        { reason: "BackOff", message: "Back-off restarting failed container" },
        { reason: "Unhealthy", message: "Liveness probe failed" },
    ]
};

function generateEventId(): string {
    return `e${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTimestamp(): string {
    return new Date(Date.now() - Math.random() * 3600000).toISOString();
}

function createEvent(
    type: "Normal" | "Warning",
    resource: K8sResource,
    reason: string,
    message: string
): K8sEvent {
    return {
        id: generateEventId(),
        type,
        reason,
        message,
        involvedObject: {
            kind: resource.kind,
            name: resource.metadata.name,
            namespace: resource.metadata.namespace || "default"
        },
        firstTimestamp: generateTimestamp(),
        lastTimestamp: new Date().toISOString(),
        count: 1
    };
}

/**
 * A sophisticated in-memory Kubernetes simulator for executing `kubectl` commands.
 */
export class K8sSimulator {
    private state: SimulatorState;

    constructor(initialState?: Partial<SimulatorState>) {
        this.state = {
            resources: initialState?.resources || this.getDefaultResources(),
            events: initialState?.events || this.getDefaultEvents(),
            currentNamespace: initialState?.currentNamespace || "default"
        };
    }

    public getState(): SimulatorState {
        return this.state;
    }

    public execute(command: string): CommandResult {
        const tokens = command.trim().split(/\s+/);
        if (tokens[0] !== "kubectl") {
            return { output: "bash: " + tokens[0] + ": command not found", error: true };
        }

        if (tokens.length === 1) {
            return {
                output: "kubectl controls the Kubernetes cluster manager.\n\n Find more information at: https://kubernetes.io/docs/reference/kubectl/",
                error: false
            };
        }

        const action = tokens[1];

        switch (action) {
            case "get":
                return this.handleGet(tokens);
            case "describe":
                return this.handleDescribe(tokens);
            case "create":
                return this.handleCreate(tokens);
            case "delete":
                return this.handleDelete(tokens);
            case "apply":
                return this.handleApply(tokens);
            case "run":
                return this.handleRun(tokens);
            case "scale":
                return this.handleScale(tokens);
            case "expose":
                return this.handleExpose(tokens);
            case "label":
                return this.handleLabel(tokens);
            case "namespace":
            case "ns":
                return this.handleNamespace(tokens);
            case "logs":
                return this.handleLogs(tokens);
            case "exec":
                return this.handleExec(tokens);
            default:
                return { output: `Error: unknown command "${action}" for "kubectl"`, error: true };
        }
    }

    private handleGet(tokens: string[]): CommandResult {
        if (tokens.length < 3) {
            return { output: "You must specify the type of resource to get.", error: true };
        }

        if (tokens[2] === "all") {
            return this.handleGetAll(tokens);
        }

        let targetKind = this.parseResourceKind(tokens[2]);
        if (!targetKind) {
            return { output: `error: the server doesn't have a resource type "${tokens[2]}"`, error: true };
        }

        const nsFlagIndex = tokens.indexOf("-n") !== -1 ? tokens.indexOf("-n") : tokens.indexOf("--namespace");
        const namespace = nsFlagIndex !== -1 && tokens.length > nsFlagIndex + 1 ? tokens[nsFlagIndex + 1] : this.state.currentNamespace;
        const allNamespaces = tokens.includes("-A") || tokens.includes("--all-namespaces");

        let resources = this.state.resources.filter(r => {
            const matchesKind = r.kind === targetKind;
            const matchesNamespace = allNamespaces || (r.metadata.namespace || "default") === namespace;
            return matchesKind && matchesNamespace;
        });

        if (resources.length === 0) {
            const nsDisplay = allNamespaces ? "all namespaces" : namespace + " namespace";
            return { output: `No resources found in ${nsDisplay}.`, error: false };
        }

        if (targetKind === "Namespace") {
            return this.formatNamespaceOutput(resources);
        }

        return this.formatResourceOutput(targetKind, resources, namespace);
    }

    private handleGetAll(tokens: string[]): CommandResult {
        const nsFlagIndex = tokens.indexOf("-n") !== -1 ? tokens.indexOf("-n") : tokens.indexOf("--namespace");
        const namespace = nsFlagIndex !== -1 && tokens.length > nsFlagIndex + 1 ? tokens[nsFlagIndex + 1] : this.state.currentNamespace;
        const allNamespaces = tokens.includes("-A") || tokens.includes("--all-namespaces");

        const resources = this.state.resources.filter(r => {
            return allNamespaces || (r.metadata.namespace || "default") === namespace;
        });

        if (resources.length === 0) {
            return { output: "No resources found.", error: false };
        }

        let output = "NAME\t\t\tREADY\tSTATUS\tRESTARTS\tAGE\n";
        const pods = resources.filter(r => r.kind === "Pod");
        
        if (pods.length === 0) {
            return { output: "No resources found.", error: false };
        }

        output += pods.map(r => 
            `${r.metadata.name.padEnd(23)}\t1/1\t${r.status.phase || "Pending".padEnd(8)}\t0\t\t10m`
        ).join("\n");

        return { output, error: false };
    }

    private formatNamespaceOutput(resources: K8sResource[]): CommandResult {
        let output = "NAME\t\t\tSTATUS\tAGE\n";
        output += resources.map(r => {
            const age = this.getAge(r.metadata.creationTimestamp);
            return `${r.metadata.name.padEnd(23)}\tActive\t${age}`;
        }).join("\n");
        return { output, error: false };
    }

    private formatResourceOutput(kind: K8sResourceKind, resources: K8sResource[], namespace: string): CommandResult {
        let output = "";

        if (kind === "Pod") {
            output = "NAME\t\t\tREADY\tSTATUS\tRESTARTS\tAGE\n";
            output += resources.map(r => {
                const age = this.getAge(r.metadata.creationTimestamp);
                const ready = r.status.phase === "Running" ? "1/1" : "0/1";
                return `${r.metadata.name.padEnd(23)}\t${ready}\t${(r.status.phase || "Pending").padEnd(15)}\t0\t\t${age}`;
            }).join("\n");
        } else if (kind === "Deployment") {
            output = "NAME\t\t\tREADY\tUP-TO-DATE\tAVAILABLE\tAGE\n";
            output += resources.map(r => {
                const age = this.getAge(r.metadata.creationTimestamp);
                const replicas = r.spec.replicas || 1;
                const ready = r.status.readyReplicas || 0;
                return `${r.metadata.name.padEnd(23)}\t${ready}/${replicas}\t${replicas}\t\t${r.status.availableReplicas || 0}\t\t${age}`;
            }).join("\n");
        } else if (kind === "Service") {
            output = "NAME\t\t\tTYPE\t\tCLUSTER-IP\tEXTERNAL-IP\tPORT(S)\t\tAGE\n";
            output += resources.map(r => {
                const age = this.getAge(r.metadata.creationTimestamp);
                const type = r.spec.type || "ClusterIP";
                const port = r.spec.ports?.[0]?.port || "80";
                return `${r.metadata.name.padEnd(23)}\t${type.padEnd(15)}\t10.96.0.1\t<none>\t\t${port}/TCP\t${age}`;
            }).join("\n");
        } else if (kind === "ConfigMap") {
            output = "NAME\t\t\tDATA\tAGE\n";
            output += resources.map(r => {
                const age = this.getAge(r.metadata.creationTimestamp);
                const dataCount = Object.keys(r.data || {}).length;
                return `${r.metadata.name.padEnd(23)}\t${dataCount}\t${age}`;
            }).join("\n");
        } else if (kind === "Secret") {
            output = "NAME\t\t\tTYPE\t\tDATA\tAGE\n";
            output += resources.map(r => {
                const age = this.getAge(r.metadata.creationTimestamp);
                const dataCount = Object.keys(r.data || {}).length;
                return `${r.metadata.name.padEnd(23)}\tOpaque\t${dataCount}\t${age}`;
            }).join("\n");
        } else if (kind === "Ingress") {
            output = "NAME\t\t\tHOSTS\t\tADDRESS\tPORT(S)\tAGE\n";
            output += resources.map(r => {
                const age = this.getAge(r.metadata.creationTimestamp);
                const hosts = r.spec.rules?.map((rule: any) => rule.host).join(", ") || "*";
                return `${r.metadata.name.padEnd(23)}\t${hosts.padEnd(15)}\t<none>\t80\t${age}`;
            }).join("\n");
        } else {
            output = `NAME\t\t\t${kind.toUpperCase()} IN ${namespace}:\n`;
            output += resources.map(r => r.metadata.name).join("\n");
        }

        return { output, error: false };
    }

    private handleDescribe(tokens: string[]): CommandResult {
        if (tokens.length < 3) return { output: "You must specify the type of resource to describe.", error: true };
        if (tokens.length < 4) return { output: `error: expected 'describe ${tokens[2]} <name>'`, error: true };

        const targetKind = this.parseResourceKind(tokens[2]);
        const targetName = tokens[3];
        const nsFlagIndex = tokens.indexOf("-n");
        const namespace = nsFlagIndex !== -1 && tokens.length > nsFlagIndex + 1 ? tokens[nsFlagIndex + 1] : this.state.currentNamespace;

        const resource = this.state.resources.find(r => 
            r.kind === targetKind && 
            r.metadata.name === targetName &&
            (r.metadata.namespace || "default") === namespace
        );

        if (!resource) {
            return { output: `Error from server (NotFound): ${tokens[2]} "${targetName}" not found`, error: true };
        }

        return this.formatDescribeOutput(resource);
    }

    private formatDescribeOutput(resource: K8sResource): CommandResult {
        let output = `Name:         ${resource.metadata.name}\n`;
        output += `Namespace:    ${resource.metadata.namespace || "default"}\n`;
        output += `Labels:       ${JSON.stringify(resource.metadata.labels || {})}\n`;
        output += `Annotations:  ${JSON.stringify(resource.metadata.annotations || {})}\n`;
        
        if (resource.metadata.creationTimestamp) {
            output += `Created:      ${resource.metadata.creationTimestamp}\n`;
        }

        output += `\nStatus:       ${resource.status?.phase || resource.status?.readyReplicas ? "Running" : "Active"}\n`;

        if (resource.kind === "Pod") {
            output += `Node:         node-1/10.0.0.1\n`;
            output += `Start Time:   ${resource.metadata.creationTimestamp || new Date().toISOString()}\n`;
            output += `Labels:       ${JSON.stringify(resource.metadata.labels || {})}\n`;
            output += `Containers:\n`;
            const container = resource.spec.containers?.[0] || {};
            output += `  ${container.name}:\n`;
            output += `    Image:      ${container.image || "nginx:latest"}\n`;
            output += `    Port:       ${container.ports?.[0]?.containerPort || 80}/TCP\n`;
            output += `    State:      Running\n`;
        }

        if (resource.kind === "Deployment") {
            output += `\nReplicas:     ${resource.status?.readyReplicas || 0} ready / ${resource.spec.replicas || 1} desired\n`;
            output += `Selector:     ${JSON.stringify(resource.spec.selector?.matchLabels || {})}\n`;
        }

        if (resource.kind === "Service") {
            output += `\nType:         ${resource.spec.type || "ClusterIP"}\n`;
            output += `IP:           10.96.0.1\n`;
            output += `Port:         ${resource.spec.ports?.[0]?.port || 80}/TCP\n`;
            output += `TargetPort:   ${resource.spec.ports?.[0]?.targetPort || 80}/TCP\n`;
        }

        const resourceEvents = this.state.events.filter(e => 
            e.involvedObject.kind === resource.kind && 
            e.involvedObject.name === resource.metadata.name
        );

        output += `\nEvents:\n`;
        if (resourceEvents.length > 0) {
            output += `  Type    Reason     Age    From               Message\n`;
            output += `  ----    ------     ----  ----               -------\n`;
            output += resourceEvents.slice(0, 5).map(e => 
                `  ${e.type.padEnd(6)} ${e.reason.padEnd(10)} ${this.getAge(e.lastTimestamp).padEnd(10)} -               ${e.message}`
            ).join("\n");
        } else {
            output += `  <no events>`;
        }

        return { output, error: false };
    }

    private handleRun(tokens: string[]): CommandResult {
        if (tokens.length < 3) return { output: "You must specify a name for the pod.", error: true };
        const name = tokens[2];
        const imageToken = tokens.find(t => t.startsWith("--image="));
        if (!imageToken) {
            return { output: "error: --image is required", error: true };
        }

        const image = imageToken.split("=")[1];
        const namespace = this.state.currentNamespace;

        const newPod: K8sResource = {
            apiVersion: "v1",
            kind: "Pod",
            metadata: { 
                name, 
                namespace, 
                labels: { run: name },
                creationTimestamp: new Date().toISOString()
            },
            spec: { containers: [{ name, image, ports: [{ containerPort: 80 }] }] },
            status: { phase: "Running" }
        };

        this.state.resources.push(newPod);
        
        const event = createEvent("Normal", newPod, "Scheduled", `Successfully assigned ${name} to node-1`);
        this.state.events.push(event);

        return { output: `pod/${name} created`, error: false };
    }

    private handleCreate(tokens: string[]): CommandResult {
        if (tokens.length < 3) {
            return { output: "error: specify resource type to create", error: true };
        }

        const subCommand = tokens[2];

        if (subCommand === "deployment") {
            return this.createDeployment(tokens.slice(3));
        }

        if (subCommand === "configmap") {
            return this.createConfigMap(tokens.slice(3));
        }

        if (subCommand === "secret") {
            return this.createSecret(tokens.slice(3));
        }

        if (subCommand === "namespace") {
            return this.createNamespace(tokens.slice(3));
        }

        if (subCommand === "service") {
            return this.createService(tokens.slice(3));
        }

        return { output: `error: unknown create command: ${subCommand}`, error: true };
    }

    private createDeployment(tokens: string[]): CommandResult {
        const name = tokens.find((t, i) => i === 0 && !t.startsWith("-")) || "deployment";
        const imageToken = tokens.find(t => t.startsWith("--image="));
        const replicasToken = tokens.find(t => t.startsWith("--replicas="));
        
        if (!imageToken) return { output: "error: --image is required", error: true };
        
        const image = imageToken.split("=")[1];
        const replicas = replicasToken ? parseInt(replicasToken.split("=")[1]) : 1;
        const namespace = this.state.currentNamespace;

        const newDeployment: K8sResource = {
            apiVersion: "apps/v1",
            kind: "Deployment",
            metadata: { 
                name, 
                namespace,
                labels: { app: name },
                creationTimestamp: new Date().toISOString()
            },
            spec: { 
                replicas,
                selector: { matchLabels: { app: name } },
                template: { 
                    metadata: { labels: { app: name } },
                    spec: { containers: [{ name, image, ports: [{ containerPort: 80 }] }] }
                }
            },
            status: { readyReplicas: replicas, replicas, availableReplicas: replicas }
        };

        this.state.resources.push(newDeployment);
        
        const event = createEvent("Normal", newDeployment, "ScalingReplicaSet", `Scaled deployment ${name} to ${replicas} replica(s)`);
        this.state.events.push(event);

        return { output: `deployment.apps/${name} created`, error: false };
    }

    private createConfigMap(tokens: string[]): CommandResult {
        const name = tokens[0] || "configmap";
        const namespace = this.state.currentNamespace;

        const newConfigMap: K8sResource = {
            apiVersion: "v1",
            kind: "ConfigMap",
            metadata: { 
                name, 
                namespace,
                creationTimestamp: new Date().toISOString()
            },
            spec: {},
            data: { "config.json": '{}' },
            status: {}
        };

        this.state.resources.push(newConfigMap);
        return { output: `configmap/${name} created`, error: false };
    }

    private createSecret(tokens: string[]): CommandResult {
        const name = tokens[0] || "secret";
        const namespace = this.state.currentNamespace;

        const newSecret: K8sResource = {
            apiVersion: "v1",
            kind: "Secret",
            metadata: { 
                name, 
                namespace,
                creationTimestamp: new Date().toISOString()
            },
            spec: { type: "Opaque" },
            data: {},
            status: {}
        };

        this.state.resources.push(newSecret);
        return { output: `secret/${name} created`, error: false };
    }

    private createNamespace(tokens: string[]): CommandResult {
        const name = tokens[0] || "namespace";
        
        const existing = this.state.resources.find(r => r.kind === "Namespace" && r.metadata.name === name);
        if (existing) {
            return { output: `Error from server (AlreadyExists): namespaces "${name}" already exists`, error: true };
        }

        const newNamespace: K8sResource = {
            apiVersion: "v1",
            kind: "Namespace",
            metadata: { 
                name,
                creationTimestamp: new Date().toISOString()
            },
            spec: {},
            status: { phase: "Active" }
        };

        this.state.resources.push(newNamespace);
        return { output: `namespace/${name} created`, error: false };
    }

    private createService(tokens: string[]): CommandResult {
        const name = tokens[0] || "service";
        const selectorToken = tokens.find(t => t.startsWith("--selector="));
        const portToken = tokens.find(t => t.startsWith("--port="));
        const typeToken = tokens.find(t => t.startsWith("--type="));
        
        const namespace = this.state.currentNamespace;
        const selector = selectorToken ? selectorToken.split("=")[1].split(",").reduce((acc, s) => {
            const [k, v] = s.split("=");
            acc[k] = v;
            return acc;
        }, {} as Record<string, string>) : { app: name };
        
        const port = parseInt(portToken?.split("=")[1] || "80");
        const type = typeToken?.split("=")[1] || "ClusterIP";

        const newService: K8sResource = {
            apiVersion: "v1",
            kind: "Service",
            metadata: { 
                name, 
                namespace,
                creationTimestamp: new Date().toISOString()
            },
            spec: { type, selector, ports: [{ port, targetPort: port, protocol: "TCP" }] },
            status: {}
        };

        this.state.resources.push(newService);
        return { output: `service/${name} created`, error: false };
    }

    private handleDelete(tokens: string[]): CommandResult {
        if (tokens.length < 4) return { output: "error: resource type and name required", error: true };
        
        const kind = this.parseResourceKind(tokens[2]);
        const name = tokens[3];
        const nsFlagIndex = tokens.indexOf("-n");
        const namespace = nsFlagIndex !== -1 && tokens.length > nsFlagIndex + 1 ? tokens[nsFlagIndex + 1] : this.state.currentNamespace;

        if (!kind) return { output: `error: unknown resource type "${tokens[2]}"`, error: true };

        const index = this.state.resources.findIndex(r => 
            r.kind === kind && 
            r.metadata.name === name &&
            (r.metadata.namespace || "default") === namespace
        );

        if (index === -1) {
            return { output: `Error from server (NotFound): ${tokens[2]} "${name}" not found`, error: true };
        }

        const deleted = this.state.resources.splice(index, 1)[0];
        
        const event = createEvent("Normal", deleted, "SuccessfulDelete", `Deleted ${kind.toLowerCase()} ${name}`);
        this.state.events.push(event);

        return { output: `${tokens[2].toLowerCase()} "${name}" deleted`, error: false };
    }

    private handleApply(tokens: string[]): CommandResult {
        return { output: "Use the code editor to apply YAML files directly.\n\nOr use: kubectl create -f <file>", error: false };
    }

    private handleScale(tokens: string[]): CommandResult {
        if (tokens.length < 4) return { output: "error: specify deployment name and replicas", error: true };
        
        const name = tokens[2];
        const replicasMatch = tokens.find(t => t.startsWith("--replicas="));
        
        if (!replicasMatch) return { output: "error: --replicas is required", error: true };
        
        const replicas = parseInt(replicasMatch.split("=")[1]);
        const namespace = this.state.currentNamespace;

        const deployment = this.state.resources.find(r => 
            r.kind === "Deployment" && 
            r.metadata.name === name &&
            (r.metadata.namespace || "default") === namespace
        );

        if (!deployment) {
            return { output: `Error from server (NotFound): deployment "${name}" not found`, error: true };
        }

        deployment.spec.replicas = replicas;
        deployment.status.readyReplicas = replicas;
        deployment.status.replicas = replicas;
        deployment.status.availableReplicas = replicas;

        const event = createEvent("Normal", deployment, "ScalingReplicaSet", `Scaled deployment ${name} to ${replicas} replica(s)`);
        this.state.events.push(event);

        return { output: `deployment.apps/${name} scaled`, error: false };
    }

    private handleExpose(tokens: string[]): CommandResult {
        if (tokens.length < 3) return { output: "error: specify deployment or pod name", error: true };
        
        const name = tokens[2];
        const portToken = tokens.find(t => t.startsWith("--port=")) || "--port=80";
        const typeToken = tokens.find(t => t.startsWith("--type="));
        
        const port = parseInt(portToken.split("=")[1]);
        const type = typeToken?.split("=")[1] || "ClusterIP";
        const namespace = this.state.currentNamespace;

        const service: K8sResource = {
            apiVersion: "v1",
            kind: "Service",
            metadata: { 
                name, 
                namespace,
                labels: { app: name },
                creationTimestamp: new Date().toISOString()
            },
            spec: { type, selector: { app: name }, ports: [{ port, targetPort: port }] },
            status: {}
        };

        this.state.resources.push(service);
        return { output: `service/${name} exposed`, error: false };
    }

    private handleLabel(tokens: string[]): CommandResult {
        if (tokens.length < 4) return { output: "error: specify resource, name, and label", error: true };
        
        const kind = this.parseResourceKind(tokens[2]);
        const name = tokens[3];
        const labelToken = tokens.find(t => t.includes("="));
        
        if (!labelToken) return { output: "error: label must be in format key=value", error: true };
        
        const [key, value] = labelToken.split("=");
        const namespace = this.state.currentNamespace;

        const resource = this.state.resources.find(r => 
            r.kind === kind && 
            r.metadata.name === name &&
            (r.metadata.namespace || "default") === namespace
        );

        if (!resource) {
            return { output: `Error from server (NotFound): ${kind} "${name}" not found`, error: true };
        }

        if (!resource.metadata.labels) resource.metadata.labels = {};
        resource.metadata.labels[key] = value;

        return { output: `${kind!.toLowerCase()}/${name} labeled`, error: false };
    }

    private handleNamespace(tokens: string[]): CommandResult {
        if (tokens.length < 3) {
            const namespaces = this.state.resources.filter(r => r.kind === "Namespace");
            if (namespaces.length === 0) {
                return { output: "default", error: false };
            }
            let output = "NAME\t\t\tSTATUS\tAGE\n";
            output += namespaces.map(n => `${n.metadata.name.padEnd(23)}\tActive\t10m`).join("\n");
            return { output, error: false };
        }

        const subCommand = tokens[2];
        if (subCommand === "create") {
            return this.createNamespace([tokens[3]]);
        }

        this.state.currentNamespace = tokens[2];
        return { output: `Context "default" modified.`, error: false };
    }

    private handleLogs(tokens: string[]): CommandResult {
        if (tokens.length < 3) return { output: "error: specify pod name", error: true };
        
        const name = tokens[2];
        const namespace = this.state.currentNamespace;

        const pod = this.state.resources.find(r => 
            r.kind === "Pod" && 
            r.metadata.name === name &&
            (r.metadata.namespace || "default") === namespace
        );

        if (!pod) {
            return { output: `Error from server (NotFound): pod "${name}" not found`, error: true };
        }

        const container = pod.spec.containers?.[0]?.name || "main";
        const logs = [
            `${new Date().toISOString()} Starting ${pod.spec.containers?.[0]?.image || "container"}...`,
            `${new Date().toISOString()} Server listening on port 80`,
            `${new Date().toISOString()} Ready for connections`,
        ];

        return { output: logs.join("\n"), error: false };
    }

    private handleExec(tokens: string[]): CommandResult {
        const podIndex = tokens.indexOf("pod") !== -1 ? tokens.indexOf("pod") + 1 : 2;
        if (tokens.length <= podIndex) {
            return { output: "error: specify pod name", error: true };
        }

        const name = tokens[podIndex];
        const namespace = this.state.currentNamespace;

        const pod = this.state.resources.find(r => 
            r.kind === "Pod" && 
            r.metadata.name === name &&
            (r.metadata.namespace || "default") === namespace
        );

        if (!pod) {
            return { output: `Error from server (NotFound): pod "${name}" not found`, error: true };
        }

        return { output: `(interactive session not available in simulator)\n$`, error: false };
    }

    public applyYaml(yaml: string): CommandResult {
        try {
            const kindMatch = yaml.match(/kind:\s*(\w+)/i);
            const nameMatch = yaml.match(/name:\s*([\w-]+)/i);

            if (!kindMatch || !nameMatch) {
                return { output: "error: unable to parse YAML. Need kind and metadata.name", error: true };
            }

            const kindString = kindMatch[1];
            const name = nameMatch[1];
            const kind = this.parseResourceKind(kindString);

            if (!kind) {
                return { output: `error: unknown resource type "${kindString}"`, error: true };
            }

            const existingIndex = this.state.resources.findIndex(r => 
                r.kind === kind && r.metadata.name === name
            );
            if (existingIndex !== -1) {
                this.state.resources.splice(existingIndex, 1);
            }

            const replicasMatch = yaml.match(/replicas:\s*(\d+)/i);
            const replicas = replicasMatch ? parseInt(replicasMatch[1]) : 1;

            const namespaceMatch = yaml.match(/namespace:\s*([\w-]+)/i);
            const namespace = namespaceMatch ? namespaceMatch[1] : this.state.currentNamespace;

            const labelsMatch = yaml.match(/labels:\s*([\w-]+):\s*([\w-]+)/i);
            const labels = labelsMatch ? { [labelsMatch[1]]: labelsMatch[2] } : {};

            const newResource: K8sResource = {
                apiVersion: yaml.match(/apiVersion:\s*([\w/]+)/i)?.[1] || "v1",
                kind,
                metadata: { name, namespace, labels, creationTimestamp: new Date().toISOString() },
                spec: kind === "Deployment" ? { replicas, selector: { matchLabels: labels } } : {},
                status: kind === "Deployment" ? { readyReplicas: replicas, replicas, availableReplicas: replicas } : { phase: "Running" }
            };

            this.state.resources.push(newResource);
            
            const event = createEvent("Normal", newResource, "SuccessfulCreate", `Created ${kind!.toLowerCase()} ${name}`);
            this.state.events.push(event);

            return { output: `${kindString.toLowerCase()}.v1/"${name}" created`, error: false };

        } catch (e: any) {
            return { output: `error: ${e.message}`, error: true };
        }
    }

    private parseResourceKind(alias: string): K8sResourceKind | null {
        alias = alias.toLowerCase();
        if (alias === "po" || alias === "pod" || alias === "pods") return "Pod";
        if (alias === "deploy" || alias === "deployment" || alias === "deployments") return "Deployment";
        if (alias === "svc" || alias === "service" || alias === "services") return "Service";
        if (alias === "ns" || alias === "namespace" || alias === "namespaces") return "Namespace";
        if (alias === "cm" || alias === "configmap" || alias === "configmaps") return "ConfigMap";
        if (alias === "secret" || alias === "secrets") return "Secret";
        if (alias === "ing" || alias === "ingress" || alias === "ingresses") return "Ingress";
        if (alias === "rs" || alias === "replicaset" || alias === "replicasets") return "ReplicaSet";
        if (alias === "sts" || alias === "statefulset" || alias === "statefulsets") return "StatefulSet";
        if (alias === "ds" || alias === "daemonset" || alias === "daemonsets") return "DaemonSet";
        return null;
    }

    private getDefaultResources(): K8sResource[] {
        return [
            {
                apiVersion: "v1",
                kind: "Namespace",
                metadata: { name: "default", creationTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
                spec: {},
                status: { phase: "Active" }
            },
            {
                apiVersion: "v1",
                kind: "Namespace",
                metadata: { name: "kube-system", creationTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
                spec: {},
                status: { phase: "Active" }
            },
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: { name: "kubernetes", namespace: "default", creationTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
                spec: { type: "ClusterIP", ports: [{ port: 443 }] },
                status: {}
            },
            {
                apiVersion: "v1",
                kind: "Pod",
                metadata: { 
                    name: "nginx-pod", 
                    namespace: "default", 
                    labels: { app: "nginx" },
                    creationTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() 
                },
                spec: { containers: [{ name: "nginx", image: "nginx:1.21", ports: [{ containerPort: 80 }] }] },
                status: { phase: "Running", podIP: "10.244.0.5" }
            },
            {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: { 
                    name: "nginx-deployment", 
                    namespace: "default", 
                    labels: { app: "nginx" },
                    creationTimestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() 
                },
                spec: { 
                    replicas: 2, 
                    selector: { matchLabels: { app: "nginx" } },
                    template: { 
                        metadata: { labels: { app: "nginx" } },
                        spec: { containers: [{ name: "nginx", image: "nginx:1.21", ports: [{ containerPort: 80 }] }] }
                    }
                },
                status: { readyReplicas: 2, replicas: 2, availableReplicas: 2 }
            },
            {
                apiVersion: "v1",
                kind: "Pod",
                metadata: { 
                    name: "redis-pod", 
                    namespace: "default", 
                    labels: { app: "redis" },
                    creationTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() 
                },
                spec: { containers: [{ name: "redis", image: "redis:7-alpine" }] },
                status: { phase: "Running", podIP: "10.244.0.6" }
            },
            {
                apiVersion: "v1",
                kind: "Service",
                metadata: { 
                    name: "nginx-service", 
                    namespace: "default",
                    creationTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() 
                },
                spec: { type: "ClusterIP", selector: { app: "nginx" }, ports: [{ port: 80, targetPort: 80 }] },
                status: { clusterIP: "10.96.0.100" }
            },
            {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: { 
                    name: "app-config", 
                    namespace: "default",
                    creationTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() 
                },
                spec: {},
                data: { "config.json": '{"debug": true, "logLevel": "info"}', "nginx.conf": "server { listen 80; }" },
                status: {}
            },
            {
                apiVersion: "v1",
                kind: "Secret",
                metadata: { 
                    name: "db-credentials", 
                    namespace: "default",
                    creationTimestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() 
                },
                spec: { type: "Opaque" },
                data: {},
                status: {}
            }
        ];
    }

    private getDefaultEvents(): K8sEvent[] {
        const events: K8sEvent[] = [];
        
        // Get default resources to generate events for
        const resources = this.state?.resources || this.getDefaultResources();

        resources.forEach(resource => {
            const eventTypes: Array<"Normal" | "Warning"> = ["Normal", "Normal", "Normal"];
            const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const reasons = EVENT_REASONS[type];
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            
            events.push(createEvent(
                type,
                resource,
                reason.reason,
                reason.message.replace("{resource}", resource.kind).replace("{name}", resource.metadata.name)
            ));
        });

        return events;
    }

    private getAge(timestamp?: string): string {
        if (!timestamp) return "10m";
        
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return "0s";
        if (minutes < 60) return `${minutes}m`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }
}
