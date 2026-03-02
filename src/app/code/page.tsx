"use client";

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { CodeEditor } from "@/components/code/CodeEditor";
import { Code2, FileText, Copy, Check } from "lucide-react";

export default function CodePlaygroundPage() {
  const [activeTab, setActiveTab] = useState<"editor" | "examples">("editor");

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        <div className="relative z-10">
          {/* Header */}
          <div className="border-b border-white/[0.04] bg-surface-deep/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-indigo flex items-center justify-center shadow-lg shadow-accent-cyan/20">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Code <span className="text-gradient-cool">Playground</span>
                  </h1>
                  <p className="text-slate-500 text-sm">
                    Write, run, and experiment with code
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/[0.04]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex gap-1">
                <TabButton
                  active={activeTab === "editor"}
                  onClick={() => setActiveTab("editor")}
                  icon={<Code2 className="w-3.5 h-3.5" />}
                >
                  Editor
                </TabButton>
                <TabButton
                  active={activeTab === "examples"}
                  onClick={() => setActiveTab("examples")}
                  icon={<FileText className="w-3.5 h-3.5" />}
                >
                  Examples
                </TabButton>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {activeTab === "editor" ? (
              <div className="h-[700px]">
                <CodeEditor />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                <ExampleCard
                  title="Array Manipulation"
                  description="Learn how to work with arrays in JavaScript"
                  language="javascript"
                  code={`// Array methods example
const numbers = [1, 2, 3, 4, 5];

// map - transform each element
const squared = numbers.map(n => n * n);
console.log("Squared:", squared);

// filter - select elements
const evens = numbers.filter(n => n % 2 === 0);
console.log("Evens:", evens);

// reduce - accumulate values
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log("Sum:", sum);`}
                />
                <ExampleCard
                  title="String Processing"
                  description="Practice string operations in Python"
                  language="python"
                  code={`# String methods in Python
text = "Hello, World!"

# Basic operations
print(text.upper())
print(text.lower())
print(text.replace("World", "Python"))

# String formatting
name = "Alice"
age = 25
print(f"My name is {name} and I am {age} years old")`}
                />
                <ExampleCard
                  title="Async/Await"
                  description="Learn asynchronous programming"
                  language="javascript"
                  code={`// Async/Await example
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log("Starting...");
  await delay(1000);
  console.log("After 1 second");
  await delay(1000);
  console.log("After 2 seconds");
  return "Done!";
}

demo().then(result => console.log(result));`}
                />
                <ExampleCard
                  title="Class Definition"
                  description="Object-oriented programming in Java"
                  language="java"
                  code={`// Class and objects
class Person {
    private String name;
    private int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public void greet() {
        System.out.println("Hello, I'm " + name);
    }
    
    public static void main(String[] args) {
        Person p = new Person("Alice", 25);
        p.greet();
    }
}`}
                />
                <ExampleCard
                  title="HTTP Server"
                  description="Simple HTTP server in Go"
                  language="go"
                  code={`// Simple HTTP server in Go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    fmt.Println("Server running on :8080")
    http.ListenAndServe(":8080", nil)
}`}
                />
                <ExampleCard
                  title="Error Handling"
                  description="Try-catch in TypeScript"
                  language="typescript"
                  code={`// Error handling in TypeScript
try {
  const result = riskyOperation();
  console.log("Success:", result);
} catch (error) {
  if (error instanceof TypeError) {
    console.log("Type error:", error.message);
  } else {
    console.log("Unknown error:", error);
  }
} finally {
  console.log("Cleanup complete");
}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 ${
        active ? "text-white" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {children}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-indigo" />
      )}
    </button>
  );
}

function ExampleCard({
  title,
  description,
  language,
  code,
}: {
  title: string;
  description: string;
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const langColors: Record<string, string> = {
    javascript: "from-accent-amber to-orange-500",
    python: "from-accent-cyan to-blue-500",
    java: "from-accent-rose to-orange-500",
    typescript: "from-accent-indigo to-blue-400",
    go: "from-accent-cyan to-accent-indigo",
    rust: "from-orange-600 to-accent-rose",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card overflow-hidden group">
      <div className="p-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-bold text-sm text-white group-hover:text-accent-violet transition-colors">
            {title}
          </h3>
          <span
            className={`px-2 py-0.5 text-[10px] text-white rounded-full bg-gradient-to-r ${
              langColors[language] || "from-slate-500 to-slate-400"
            }`}
          >
            {language}
          </span>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="p-4 bg-surface-elevated relative">
        <pre className="text-xs text-slate-400 overflow-x-auto font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.04] text-slate-500 hover:text-accent-violet hover:bg-accent-violet/10 transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-accent-emerald" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
