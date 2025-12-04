/**
 * Kubernetes utilities
 * Helpers for generating K8s manifests
 */

import { z } from "zod";

// Common metadata
export const MetadataSchema = z.object({
  name: z.string(),
  namespace: z.string().optional(),
  labels: z.record(z.string()).optional(),
  annotations: z.record(z.string()).optional(),
});

export type Metadata = z.infer<typeof MetadataSchema>;

// Container spec
export const ContainerSchema = z.object({
  name: z.string(),
  image: z.string(),
  ports: z.array(z.object({
    containerPort: z.number(),
    name: z.string().optional(),
    protocol: z.enum(["TCP", "UDP"]).optional(),
  })).optional(),
  env: z.array(z.object({
    name: z.string(),
    value: z.string().optional(),
    valueFrom: z.object({
      secretKeyRef: z.object({
        name: z.string(),
        key: z.string(),
      }).optional(),
      configMapKeyRef: z.object({
        name: z.string(),
        key: z.string(),
      }).optional(),
    }).optional(),
  })).optional(),
  envFrom: z.array(z.object({
    configMapRef: z.object({ name: z.string() }).optional(),
    secretRef: z.object({ name: z.string() }).optional(),
  })).optional(),
  resources: z.object({
    requests: z.object({
      memory: z.string().optional(),
      cpu: z.string().optional(),
    }).optional(),
    limits: z.object({
      memory: z.string().optional(),
      cpu: z.string().optional(),
    }).optional(),
  }).optional(),
  livenessProbe: z.object({
    httpGet: z.object({
      path: z.string(),
      port: z.union([z.number(), z.string()]),
    }).optional(),
    initialDelaySeconds: z.number().optional(),
    periodSeconds: z.number().optional(),
  }).optional(),
  readinessProbe: z.object({
    httpGet: z.object({
      path: z.string(),
      port: z.union([z.number(), z.string()]),
    }).optional(),
    initialDelaySeconds: z.number().optional(),
    periodSeconds: z.number().optional(),
  }).optional(),
  volumeMounts: z.array(z.object({
    name: z.string(),
    mountPath: z.string(),
    readOnly: z.boolean().optional(),
  })).optional(),
});

export type Container = z.infer<typeof ContainerSchema>;

// Deployment
export interface Deployment {
  apiVersion: "apps/v1";
  kind: "Deployment";
  metadata: Metadata;
  spec: {
    replicas: number;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: Container[];
        volumes?: Array<{
          name: string;
          configMap?: { name: string };
          secret?: { secretName: string };
          persistentVolumeClaim?: { claimName: string };
        }>;
        serviceAccountName?: string;
      };
    };
  };
}

// Service
export interface Service {
  apiVersion: "v1";
  kind: "Service";
  metadata: Metadata;
  spec: {
    type: "ClusterIP" | "NodePort" | "LoadBalancer";
    ports: Array<{
      port: number;
      targetPort: number | string;
      name?: string;
      nodePort?: number;
    }>;
    selector: Record<string, string>;
  };
}

// Ingress
export interface Ingress {
  apiVersion: "networking.k8s.io/v1";
  kind: "Ingress";
  metadata: Metadata;
  spec: {
    ingressClassName?: string;
    tls?: Array<{
      hosts: string[];
      secretName: string;
    }>;
    rules: Array<{
      host: string;
      http: {
        paths: Array<{
          path: string;
          pathType: "Prefix" | "Exact" | "ImplementationSpecific";
          backend: {
            service: {
              name: string;
              port: { number: number } | { name: string };
            };
          };
        }>;
      };
    }>;
  };
}

// ConfigMap
export interface ConfigMap {
  apiVersion: "v1";
  kind: "ConfigMap";
  metadata: Metadata;
  data: Record<string, string>;
}

// Secret
export interface Secret {
  apiVersion: "v1";
  kind: "Secret";
  metadata: Metadata;
  type: "Opaque" | "kubernetes.io/tls" | "kubernetes.io/dockerconfigjson";
  data?: Record<string, string>;
  stringData?: Record<string, string>;
}

// Generate manifests
export function createDeployment(params: {
  name: string;
  namespace?: string;
  image: string;
  replicas?: number;
  port: number;
  env?: Record<string, string>;
  resources?: Container["resources"];
  labels?: Record<string, string>;
}): Deployment {
  const labels = { app: params.name, ...params.labels };

  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: params.name,
      namespace: params.namespace,
      labels,
    },
    spec: {
      replicas: params.replicas ?? 1,
      selector: { matchLabels: { app: params.name } },
      template: {
        metadata: { labels },
        spec: {
          containers: [{
            name: params.name,
            image: params.image,
            ports: [{ containerPort: params.port }],
            env: params.env
              ? Object.entries(params.env).map(([name, value]) => ({ name, value }))
              : undefined,
            resources: params.resources,
            livenessProbe: {
              httpGet: { path: "/health", port: params.port },
              initialDelaySeconds: 10,
              periodSeconds: 10,
            },
            readinessProbe: {
              httpGet: { path: "/ready", port: params.port },
              initialDelaySeconds: 5,
              periodSeconds: 5,
            },
          }],
        },
      },
    },
  };
}

export function createService(params: {
  name: string;
  namespace?: string;
  port: number;
  targetPort?: number;
  type?: "ClusterIP" | "NodePort" | "LoadBalancer";
}): Service {
  return {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: params.name,
      namespace: params.namespace,
    },
    spec: {
      type: params.type ?? "ClusterIP",
      ports: [{
        port: params.port,
        targetPort: params.targetPort ?? params.port,
      }],
      selector: { app: params.name },
    },
  };
}

export function createIngress(params: {
  name: string;
  namespace?: string;
  host: string;
  serviceName: string;
  servicePort: number;
  tls?: boolean;
  ingressClass?: string;
}): Ingress {
  return {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name: params.name,
      namespace: params.namespace,
      annotations: params.tls
        ? { "cert-manager.io/cluster-issuer": "letsencrypt-prod" }
        : undefined,
    },
    spec: {
      ingressClassName: params.ingressClass ?? "nginx",
      tls: params.tls
        ? [{ hosts: [params.host], secretName: `${params.name}-tls` }]
        : undefined,
      rules: [{
        host: params.host,
        http: {
          paths: [{
            path: "/",
            pathType: "Prefix",
            backend: {
              service: {
                name: params.serviceName,
                port: { number: params.servicePort },
              },
            },
          }],
        },
      }],
    },
  };
}

// Generate YAML
export function toYaml(manifest: unknown): string {
  const yaml = require("yaml");
  return yaml.stringify(manifest);
}

// Generate multi-document YAML
export function toMultiYaml(manifests: unknown[]): string {
  return manifests.map(toYaml).join("---\n");
}
