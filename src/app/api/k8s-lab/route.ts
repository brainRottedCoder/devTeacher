import { NextRequest, NextResponse } from "next/server";
import { K8sSimulator, K8sResource, SimulatorState } from "@/lib/k8s/simulator";

const simulatorInstances: Record<string, K8sSimulator> = {};

function getSimulator(sessionId: string): K8sSimulator {
    if (!simulatorInstances[sessionId]) {
        const initialResources: K8sResource[] = [
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
                metadata: { name: "nginx-deployment", namespace: "default" },
                spec: { replicas: 2, selector: { matchLabels: { app: "nginx" } } },
                status: { readyReplicas: 2, replicas: 2 }
            }
        ];
        
        simulatorInstances[sessionId] = new K8sSimulator({
            resources: initialResources,
            currentNamespace: "default"
        });
    }
    return simulatorInstances[sessionId];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId") || "default";
        const action = searchParams.get("action");
        
        const simulator = getSimulator(sessionId);
        
        if (action === "state") {
            return NextResponse.json(simulator.getState());
        }
        
        if (action === "resources") {
            const state = simulator.getState();
            return NextResponse.json({
                resources: state.resources,
                namespace: state.currentNamespace
            });
        }
        
        return NextResponse.json({ 
            message: "K8s Lab API",
            actions: ["state", "resources", "execute"],
            sessionId
        });
    } catch (error: any) {
        console.error("Error in K8s lab API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId") || "default";
        
        const simulator = getSimulator(sessionId);
        const body = await request.json();
        
        const { command, yaml } = body;
        
        if (command) {
            const result = simulator.execute(command);
            return NextResponse.json({
                command,
                ...result,
                state: simulator.getState()
            });
        }
        
        if (yaml) {
            const result = simulator.applyYaml(yaml);
            return NextResponse.json({
                action: "apply",
                ...result,
                state: simulator.getState()
            });
        }
        
        return NextResponse.json({ error: "Command or YAML required" }, { status: 400 });
    } catch (error: any) {
        console.error("Error executing K8s command:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId") || "default";
        
        const simulator = getSimulator(sessionId);
        const body = await request.json();
        
        const { namespace } = body;
        
        if (namespace) {
            const state = simulator.getState();
            (state as any).currentNamespace = namespace;
            return NextResponse.json({ 
                success: true, 
                namespace,
                state: simulator.getState()
            });
        }
        
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error: any) {
        console.error("Error updating K8s lab:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        
        if (sessionId && simulatorInstances[sessionId]) {
            delete simulatorInstances[sessionId];
            return NextResponse.json({ success: true, message: "Lab session reset" });
        }
        
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    } catch (error: any) {
        console.error("Error resetting K8s lab:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
