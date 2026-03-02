import { useState, useCallback, useEffect, useRef } from "react";
import { K8sSimulator, K8sResource, SimulatorState } from "@/lib/k8s/simulator";

export interface K8sLabState {
    resources: K8sResource[];
    currentNamespace: string;
    history: Array<{ command: string; output: string; error?: boolean; timestamp: number }>;
    isLoading: boolean;
    error: string | null;
}

const DEFAULT_RESOURCES: K8sResource[] = [
    {
        apiVersion: "v1",
        kind: "Service",
        metadata: { name: "kubernetes", namespace: "default" },
        spec: { type: "ClusterIP", ports: [{ port: 443 }] },
        status: {}
    },
    {
        apiVersion: "v1",
        kind: "Pod",
        metadata: { name: "nginx-pod", namespace: "default", labels: { app: "nginx" } },
        spec: { containers: [{ name: "nginx", image: "nginx:1.21" }] },
        status: { phase: "Running" }
    },
    {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: { name: "nginx-deployment", namespace: "default", labels: { app: "nginx" } },
        spec: { replicas: 2, selector: { matchLabels: { app: "nginx" } } },
        status: { readyReplicas: 2, replicas: 2 }
    },
    {
        apiVersion: "v1",
        kind: "Pod",
        metadata: { name: "redis-pod", namespace: "default", labels: { app: "redis" } },
        spec: { containers: [{ name: "redis", image: "redis:7-alpine" }] },
        status: { phase: "Running" }
    },
    {
        apiVersion: "v1",
        kind: "Service",
        metadata: { name: "nginx-service", namespace: "default" },
        spec: { type: "ClusterIP", selector: { app: "nginx" }, ports: [{ port: 80, targetPort: 80 }] },
        status: {}
    }
];

export function useK8sLab(sessionId?: string) {
    const [state, setState] = useState<K8sLabState>({
        resources: DEFAULT_RESOURCES,
        currentNamespace: "default",
        history: [],
        isLoading: false,
        error: null
    });
    
    const simulatorRef = useRef<K8sSimulator | null>(null);
    
    useEffect(() => {
        if (!simulatorRef.current) {
            simulatorRef.current = new K8sSimulator({
                resources: DEFAULT_RESOURCES,
                currentNamespace: "default"
            });
        }
    }, []);

    const executeCommand = useCallback(async (command: string) => {
        if (!simulatorRef.current) {
            simulatorRef.current = new K8sSimulator({
                resources: DEFAULT_RESOURCES,
                currentNamespace: "default"
            });
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = simulatorRef.current.execute(command);
            const simulatorState = simulatorRef.current.getState();

            setState(prev => ({
                ...prev,
                resources: simulatorState.resources,
                currentNamespace: simulatorState.currentNamespace,
                history: [
                    ...prev.history,
                    {
                        command,
                        output: result.output,
                        error: result.error,
                        timestamp: Date.now()
                    }
                ],
                isLoading: false
            }));

            return result;
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message,
                isLoading: false,
                history: [
                    ...prev.history,
                    {
                        command,
                        output: `Error: ${error.message}`,
                        error: true,
                        timestamp: Date.now()
                    }
                ]
            }));
            return { output: `Error: ${error.message}`, error: true };
        }
    }, []);

    const applyYaml = useCallback(async (yaml: string) => {
        if (!simulatorRef.current) {
            simulatorRef.current = new K8sSimulator({
                resources: DEFAULT_RESOURCES,
                currentNamespace: "default"
            });
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = simulatorRef.current.applyYaml(yaml);
            const simulatorState = simulatorRef.current.getState();

            setState(prev => ({
                ...prev,
                resources: simulatorState.resources,
                currentNamespace: simulatorState.currentNamespace,
                history: [
                    ...prev.history,
                    {
                        command: `kubectl apply -f -`,
                        output: result.output,
                        error: result.error,
                        timestamp: Date.now()
                    }
                ],
                isLoading: false
            }));

            return result;
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message,
                isLoading: false
            }));
            return { output: `Error: ${error.message}`, error: true };
        }
    }, []);

    const setNamespace = useCallback((namespace: string) => {
        if (simulatorRef.current) {
            const state = simulatorRef.current.getState();
            (state as any).currentNamespace = namespace;
            setState(prev => ({
                ...prev,
                currentNamespace: namespace
            }));
        }
    }, []);

    const resetLab = useCallback(() => {
        simulatorRef.current = new K8sSimulator({
            resources: DEFAULT_RESOURCES,
            currentNamespace: "default"
        });
        
        setState({
            resources: DEFAULT_RESOURCES,
            currentNamespace: "default",
            history: [],
            isLoading: false,
            error: null
        });
    }, []);

    const clearHistory = useCallback(() => {
        setState(prev => ({ ...prev, history: [] }));
    }, []);

    const getResourceByKind = useCallback((kind: string) => {
        return state.resources.filter(r => r.kind.toLowerCase() === kind.toLowerCase());
    }, [state.resources]);

    const getPods = useCallback(() => getResourceByKind("pod"), [getResourceByKind]);
    const getDeployments = useCallback(() => getResourceByKind("deployment"), [getResourceByKind]);
    const getServices = useCallback(() => getResourceByKind("service"), [getResourceByKind]);

    return {
        state,
        executeCommand,
        applyYaml,
        setNamespace,
        resetLab,
        clearHistory,
        getResourceByKind,
        getPods,
        getDeployments,
        getServices,
    };
}

export const K8S_EXAMPLES = {
    pods: [
        {
            name: "my-pod",
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21`
        },
        {
            name: "redis-pod", 
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: redis-pod
  labels:
    app: redis
spec:
  containers:
  - name: redis
    image: redis:7-alpine`
        }
    ],
    deployments: [
        {
            name: "my-deployment",
            yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80`
        }
    ],
    services: [
        {
            name: "my-service",
            yaml: `apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP`
        }
    ]
};

export const K8S_COMMANDS = {
    basics: [
        { command: "kubectl get pods", description: "List all pods in current namespace" },
        { command: "kubectl get pods -A", description: "List pods in all namespaces" },
        { command: "kubectl get nodes", description: "List cluster nodes" },
        { command: "kubectl get namespaces", description: "List all namespaces" },
        { command: "kubectl get services", description: "List all services" },
        { command: "kubectl get deployments", description: "List all deployments" },
    ],
    describe: [
        { command: "kubectl describe pod nginx-pod", description: "Show details of a specific pod" },
        { command: "kubectl describe service kubernetes", description: "Show service details" },
    ],
    create: [
        { command: "kubectl run nginx --image=nginx", description: "Create a pod from image" },
        { command: "kubectl create deployment nginx --image=nginx", description: "Create a deployment" },
    ],
    delete: [
        { command: "kubectl delete pod nginx-pod", description: "Delete a pod" },
        { command: "kubectl delete deployment nginx-deployment", description: "Delete a deployment" },
    ],
    logs: [
        { command: "kubectl logs nginx-pod", description: "Get pod logs" },
        { command: "kubectl logs -f nginx-pod", description: "Follow pod logs" },
    ],
    exec: [
        { command: "kubectl exec -it nginx-pod -- /bin/sh", description: "Execute command in pod" },
    ],
    help: [
        { command: "kubectl --help", description: "Show kubectl help" },
    ]
};
