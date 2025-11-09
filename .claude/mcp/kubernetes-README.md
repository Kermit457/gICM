# Kubernetes MCP Server

Native Kubernetes API interaction for cluster management.

## Installation

```bash
npx gicm-stack add mcp/kubernetes
```

## Environment Variables

```bash
KUBECONFIG=/path/to/kubeconfig
K8S_CLUSTER_URL=https://kubernetes.cluster.url
```

## Features

- Direct API server interaction (not kubectl wrapper)
- Pod management
- Deployment configuration
- Service discovery
- OpenShift support

## Tools

- `k8s_get_pods` - List pods
- `k8s_deploy` - Create deployments
- `k8s_scale` - Scale replicas
- `k8s_logs` - Stream logs

## GitHub

https://github.com/containers/kubernetes-mcp-server (Red Hat)
https://github.com/Azure/mcp-kubernetes (Microsoft)

---

**Version:** 1.0.0
