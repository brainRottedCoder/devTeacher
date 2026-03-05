"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState, useRef, useEffect } from "react";
import {
    Terminal,
    Container,
    Cloud,
    GitBranch,
    Cpu,
    Server,
    ArrowRight,
    Lock,
    Clock,
    Code2,
    Play,
    CheckCircle2,
    Trash2,
    RefreshCw,
    FileCode,
    Copy,
    ChevronDown,
    X,
    Loader2,
    Box,
    Layers,
    Network,
} from "lucide-react";
import { useK8sLab, K8S_EXAMPLES, K8S_COMMANDS } from "@/hooks/useK8sLab";

const LABS = [
    {
        id: "docker",
        title: "Docker Fundamentals",
        description: "Learn containerization from scratch — build, run, and manage Docker containers",
        icon: <Container className="w-8 h-8" />,
        color: "from-blue-600 to-blue-800",
        borderColor: "border-blue-500/30",
        difficulty: "Beginner",
        duration: "2-3 hours",
        topics: ["Dockerfile", "Images", "Containers", "Volumes", "Networking", "Compose"],
        available: true,
    },
    {
        id: "kubernetes",
        title: "Kubernetes in Practice",
        description: "Deploy, scale, and manage containerized applications with K8s",
        icon: <Cpu className="w-8 h-8" />,
        color: "from-violet-600 to-violet-800",
        borderColor: "border-violet-500/30",
        difficulty: "Intermediate",
        duration: "4-5 hours",
        topics: ["Pods", "Deployments", "Services", "Ingress", "ConfigMaps", "Helm"],
        available: true,
    },
    {
        id: "cicd",
        title: "CI/CD Pipelines",
        description: "Build automated build, test, and deployment pipelines",
        icon: <GitBranch className="w-8 h-8" />,
        color: "from-green-600 to-green-800",
        borderColor: "border-green-500/30",
        difficulty: "Intermediate",
        duration: "3-4 hours",
        topics: ["GitHub Actions", "Testing", "Staging", "Production", "Rollbacks", "Monitoring"],
        available: true,
    },
    {
        id: "cloud",
        title: "Cloud Services Deep-Dive",
        description: "Hands-on with AWS, GCP, and Azure core services",
        icon: <Cloud className="w-8 h-8" />,
        color: "from-amber-600 to-amber-800",
        borderColor: "border-amber-500/30",
        difficulty: "Advanced",
        duration: "5-6 hours",
        topics: ["EC2/Compute", "S3/Storage", "Lambda/Functions", "RDS/Database", "VPC", "IAM"],
        available: true,
    },
    {
        id: "os-networking",
        title: "OS & Networking",
        description: "Learn operating system concepts and networking with interactive terminals",
        icon: <Server className="w-8 h-8" />,
        color: "from-cyan-600 to-cyan-800",
        borderColor: "border-cyan-500/30",
        difficulty: "Intermediate",
        duration: "3-4 hours",
        topics: ["Process Management", "Memory", "TCP/IP", "DNS", "HTTP", "Networking"],
        available: true,
    },
];

const DOCKER_RESPONSES: Record<string, string[]> = {
    "docker --version": ["Docker version 24.0.7, build afdd53b"],
    "docker ps": ["CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES", "(no running containers)"],
    "docker run": ["Unable to find image 'latest' locally", "Pulling from library...", "Status: Downloaded newer image for latest"],
    "docker images": ["REPOSITORY   TAG       IMAGE ID       CREATED       SIZE", "nginx         latest    a6bd71f48f68   2 weeks ago   187MB"],
    "docker-compose --version": ["Docker Compose version v2.20.0"],
    "docker build -t myapp .": ["Sending build context to Docker daemon  2.048kB", "Step 1/5 : FROM node:18-alpine", "Successfully built abc123"],
};

const CLOUD_RESPONSES: Record<string, string[]> = {
    "aws --version": ["aws-cli/2.0.0 Python/3.12.1"],
    "aws ec2 describe-instances": ["Reservations: []"],
    "aws s3 ls": ["2024-01-15 10:00   my-bucket"],
    "gcloud --version": ["Google Cloud SDK 400.0.0"],
    "gcloud compute instances list": ["NAME        ZONE        MACHINE_TYPE  STATUS", "my-instance us-central1-a n1-standard-1 RUNNING"],
    "az --version": ["azure-cli 2.50.0"],
    "az vm list": ["Name         ResourceGroup    Location    Status", "my-vm       my-rg          eastus      VM Running"],
};

const OS_RESPONSES: Record<string, string[]> = {
    "ps aux": ["USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND", "root         1  0.0  0.0  12345  6789 ?        Ss   10:00   0:05 /sbin/init"],
    "top": ["top - 10:00:00 up 5 days,  1:23,  1 user,  load average: 0.52, 0.58, 0.59"],
    "free -h": ["              total        used        free      shared  buff/cache   available", "Mem:           16Gi       4.5Gi       8.5Gi       123Mi       3.0Gi        11Gi"],
    "ip addr": ["1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN"],
    "curl -v https://example.com": ["* Connected to example.com (93.184.216.34) port 443", "< HTTP/1.1 200 OK"],
};

export default function LabsPage() {
    const [activeLab, setActiveLab] = useState<string | null>(null);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([
        "$ Welcome to the Interactive Lab Terminal",
        "$ Type commands to interact with your lab environment",
        "$ Try: kubectl get pods",
    ]);
    const [terminalInput, setTerminalInput] = useState("");
    const [showExamples, setShowExamples] = useState(false);
    const [showYamlEditor, setShowYamlEditor] = useState(false);
    const [yamlInput, setYamlInput] = useState("");
    const terminalContainerRef = useRef<HTMLDivElement>(null);
    
    const {
        state: k8sState,
        executeCommand,
        applyYaml,
        resetLab,
        clearHistory,
        getPods,
        getDeployments,
        getServices,
    } = useK8sLab();

    useEffect(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
        }
    }, [terminalOutput]);

    const selectedLab = LABS.find((l) => l.id === activeLab);

    const handleCommand = async (cmd: string) => {
        const trimmedCmd = cmd.trim().toLowerCase();
        
        if (trimmedCmd === "clear") {
            setTerminalOutput([]);
            if (activeLab === "kubernetes") {
                clearHistory();
            }
            return;
        }

        let output: string[];

        if (activeLab === "kubernetes") {
            const result = await executeCommand(cmd);
            setTerminalOutput((prev) => [...prev, `$ ${cmd}`, result.output]);
            return;
        }

        if (activeLab === "docker") {
            output = DOCKER_RESPONSES[trimmedCmd] || [`Command not found: ${cmd}`, "Type 'help' for available commands"];
        } else if (activeLab === "cloud") {
            output = CLOUD_RESPONSES[trimmedCmd] || [`Command not found: ${cmd}`, "Type 'help' for available commands"];
        } else if (activeLab === "os-networking") {
            output = OS_RESPONSES[trimmedCmd] || [`Command not found: ${cmd}`, "Type 'help' for available commands"];
        } else {
            output = [`Command not found: ${cmd}`, "Type 'help' for available commands"];
        }

        setTerminalOutput((prev) => [...prev, `$ ${cmd}`, ...output]);
    };

    const handleYamlApply = async () => {
        if (!yamlInput.trim()) return;
        
        const result = await applyYaml(yamlInput);
        setTerminalOutput((prev) => [...prev, `$ kubectl apply -f -`, result.output]);
        setShowYamlEditor(false);
        setYamlInput("");
    };

    const getQuickCommands = () => {
        if (activeLab === "kubernetes") {
            return [
                "kubectl get pods",
                "kubectl get services", 
                "kubectl get deployments",
                "kubectl describe pod nginx-pod",
                "kubectl run my-pod --image=nginx",
                "kubectl delete pod nginx-pod",
            ];
        }
        if (activeLab === "docker") {
            return ["docker --version", "docker ps", "docker images", "docker build -t myapp ."];
        }
        if (activeLab === "cloud") {
            return ["aws --version", "gcloud --version", "az --version"];
        }
        return ["ps aux", "free -h", "ip addr", "curl"];
    };

    const getResourceCounts = () => {
        if (activeLab !== "kubernetes") return null;
        return {
            pods: getPods().length,
            deployments: getDeployments().length,
            services: getServices().length,
        };
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="pt-12 pb-8 px-4 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Terminal className="w-8 h-8 text-green-400" />
                        <h1 className="text-3xl font-bold text-white">Technology Deep-Dive Labs</h1>
                    </div>
                    <p className="text-gray-400">Hands-on labs with interactive terminals for Docker, Kubernetes, CI/CD, and Cloud</p>
                </div>

                <div className="max-w-6xl mx-auto px-4 pb-20">
                    {!activeLab ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {LABS.map((lab) => (
                                <div
                                    key={lab.id}
                                    onClick={() => setActiveLab(lab.id)}
                                    className={`group rounded-2xl border ${lab.borderColor} bg-gray-900/80 p-6 cursor-pointer hover:shadow-xl hover:shadow-violet-500/5 transition-all`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${lab.color} text-white`}>
                                            {lab.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                                                {lab.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">{lab.description}</p>

                                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                                <span className={`px-2 py-0.5 rounded-full ${
                                                    lab.difficulty === "Beginner" ? "bg-green-500/20 text-green-400" :
                                                    lab.difficulty === "Intermediate" ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-red-500/20 text-red-400"
                                                }`}>
                                                    {lab.difficulty}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {lab.duration}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {lab.topics.map((topic) => (
                                                    <span key={topic} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={() => setActiveLab(null)}
                                className="mb-6 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                ← Back to Labs
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-1 space-y-4">
                                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                                        <h2 className="text-xl font-bold text-white mb-2">{selectedLab?.title}</h2>
                                        <p className="text-sm text-gray-400 mb-4">{selectedLab?.description}</p>
                                        
                                        {activeLab === "kubernetes" && getResourceCounts() && (
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-400">
                                                        <Box className="w-4 h-4" /> Pods
                                                    </span>
                                                    <span className="text-white font-medium">{getResourceCounts()?.pods}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-400">
                                                        <Layers className="w-4 h-4" /> Deployments
                                                    </span>
                                                    <span className="text-white font-medium">{getResourceCounts()?.deployments}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-400">
                                                        <Network className="w-4 h-4" /> Services
                                                    </span>
                                                    <span className="text-white font-medium">{getResourceCounts()?.services}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => resetLab()}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Reset
                                            </button>
                                            {activeLab === "kubernetes" && (
                                                <button
                                                    onClick={() => setShowYamlEditor(true)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm transition-colors"
                                                >
                                                    <FileCode className="w-4 h-4" />
                                                    YAML
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                                        <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Commands</h3>
                                        <div className="space-y-1">
                                            {getQuickCommands().map((cmd) => (
                                                <button
                                                    key={cmd}
                                                    onClick={() => {
                                                        setTerminalInput(cmd);
                                                        handleCommand(cmd);
                                                        setTerminalInput("");
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors font-mono truncate"
                                                >
                                                    {cmd}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {activeLab === "kubernetes" && (
                                        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                                            <h3 className="text-sm font-medium text-gray-300 mb-3">Examples</h3>
                                            <div className="space-y-2">
                                                {K8S_EXAMPLES.pods.slice(0, 2).map((example) => (
                                                    <button
                                                        key={example.name}
                                                        onClick={() => setYamlInput(example.yaml)}
                                                        className="w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                                                    >
                                                        {example.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-3 space-y-4">
                                    {showYamlEditor && (
                                        <div className="rounded-xl border border-violet-500/30 bg-gray-900/80 p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <FileCode className="w-4 h-4 text-violet-400" />
                                                    YAML Editor
                                                </h3>
                                                <button
                                                    onClick={() => setShowYamlEditor(false)}
                                                    className="text-gray-400 hover:text-white"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={yamlInput}
                                                onChange={(e) => setYamlInput(e.target.value)}
                                                placeholder="apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21"
                                                className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm font-mono text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500"
                                            />
                                            <div className="flex justify-end gap-2 mt-3">
                                                <button
                                                    onClick={() => setYamlInput("")}
                                                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    onClick={handleYamlApply}
                                                    disabled={!yamlInput.trim()}
                                                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Play className="w-3 h-3" />
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-gray-800 bg-black overflow-hidden">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono ml-2">
                                                {selectedLab?.title} — Interactive Terminal
                                            </span>
                                            <div className="ml-auto flex items-center gap-2">
                                                {activeLab === "kubernetes" && (
                                                    <span className="text-xs text-gray-500">
                                                        namespace: {k8sState.currentNamespace}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div ref={terminalContainerRef} className="p-4 h-[450px] overflow-auto font-mono text-sm flex flex-col">
                                            <div className="flex-1">
                                                {terminalOutput.map((line, i) => (
                                                    <div key={i} className={line.startsWith("$") ? "text-green-400 mb-1 leading-relaxed" : "text-gray-300 mb-1 leading-relaxed"}>
                                                        {line}
                                                    </div>
                                                ))}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-green-400 shrink-0">$</span>
                                                    <input
                                                        type="text"
                                                        value={terminalInput}
                                                        onChange={(e) => setTerminalInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                if (terminalInput.trim()) {
                                                                    handleCommand(terminalInput.trim());
                                                                    setTerminalInput("");
                                                                }
                                                            }
                                                        }}
                                                        className="flex-1 bg-transparent text-white outline-none focus:outline-none focus:ring-0 border-0 p-0 font-mono text-sm min-w-0"
                                                        placeholder="Type a command..."
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Type &apos;help&apos; for available commands</span>
                                        <span>Type &apos;clear&apos; to clear terminal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
