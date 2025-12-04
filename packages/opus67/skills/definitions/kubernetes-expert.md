# Kubernetes Expert

> **ID:** `kubernetes-expert`
> **Tier:** 2
> **Token Cost:** 9500
> **MCP Connections:** github

## 🎯 What This Skill Does

Master Kubernetes orchestration, from cluster architecture to production deployment strategies. This skill covers everything from basic pod management to advanced service mesh integration, GitOps with ArgoCD/Flux, and enterprise-grade cluster operations.

**Core Expertise:**
- K8s cluster design, management and multi-cluster orchestration
- Deployment strategies (rolling, blue-green, canary, progressive delivery)
- Helm charts, Kustomize overlays, and package management
- Service mesh configuration (Istio, Linkerd) with traffic management
- Horizontal and vertical pod autoscaling with custom metrics
- StatefulSets, persistent storage, and volume management
- Ingress controllers, load balancing, and DNS integration
- RBAC, Pod Security Standards, and security policies
- ConfigMaps, Secrets, and external secrets operators
- Observability with Prometheus, Grafana, Jaeger
- GitOps workflows with ArgoCD and Flux CD
- Cluster upgrades, disaster recovery, and backup strategies

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** kubernetes, k8s, helm, cluster, pod, deployment, service, ingress, container orchestration, scale, hpa, statefulset, configmap, secret, namespace, kubectl, gitops, argocd, flux
- **File Types:** `.yaml`, `.yml`, `Dockerfile`, `Helmfile`
- **Directories:** `k8s/`, `kubernetes/`, `charts/`, `manifests/`, `.argocd/`, `flux/`

## 🚀 Core Capabilities

### 1. K8s Cluster Management and Architecture

**Production-Grade Cluster Design:**

Kubernetes clusters require careful architecture planning for production workloads. Consider multi-zone deployment, control plane high availability, worker node sizing, and networking design.

**Cluster Bootstrap with kubeadm:**

```bash
# Initialize control plane
kubeadm init --pod-network-cidr=10.244.0.0/16 \
  --control-plane-endpoint="k8s-lb.example.com:6443" \
  --upload-certs

# Install CNI (Calico)
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# Join worker nodes
kubeadm join k8s-lb.example.com:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash>
```

**Managed Cluster Setup (EKS):**

```bash
# Create EKS cluster with eksctl
eksctl create cluster \
  --name production-cluster \
  --version 1.28 \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed \
  --enable-ssm \
  --asg-access

# Enable IRSA (IAM Roles for Service Accounts)
eksctl utils associate-iam-oidc-provider \
  --cluster production-cluster \
  --approve
```

**GKE Cluster with Autopilot:**

```bash
gcloud container clusters create-auto production-cluster \
  --region=us-central1 \
  --release-channel=stable \
  --network=vpc-network \
  --subnetwork=gke-subnet \
  --enable-stackdriver-kubernetes
```

**Multi-Cluster Management:**

```yaml
# ClusterAPI for declarative cluster management
apiVersion: cluster.x-k8s.io/v1beta1
kind: Cluster
metadata:
  name: workload-cluster-1
  namespace: default
spec:
  clusterNetwork:
    pods:
      cidrBlocks: ["192.168.0.0/16"]
  infrastructureRef:
    apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
    kind: AWSCluster
    name: workload-cluster-1
  controlPlaneRef:
    kind: KubeadmControlPlane
    apiVersion: controlplane.cluster.x-k8s.io/v1beta1
    name: workload-cluster-1-control-plane
```

**Best Practices:**
- Use managed Kubernetes services (EKS, GKE, AKS) for production unless you have dedicated infrastructure team
- Implement multi-zone deployments for control plane and worker nodes
- Separate workload types: compute-intensive, memory-intensive, GPU workloads
- Use node pools/groups for different workload requirements
- Enable cluster autoscaler for dynamic scaling
- Configure PodDisruptionBudgets for all critical workloads
- Implement network policies from day one
- Use separate namespaces for environments (dev, staging, production)
- Enable audit logging and ship logs to external storage
- Regular cluster upgrades with testing on non-production clusters first

**Common Patterns:**

```yaml
# Node affinity for specialized workloads
apiVersion: v1
kind: Pod
metadata:
  name: gpu-workload
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: node.kubernetes.io/instance-type
            operator: In
            values:
            - p3.2xlarge
  containers:
  - name: gpu-app
    image: tensorflow/tensorflow:latest-gpu
    resources:
      limits:
        nvidia.com/gpu: 1
```

**Gotchas:**
- Control plane components can become bottleneck - monitor etcd carefully
- Node pressure can cause cascading failures - set appropriate resource requests/limits
- Certificate rotation must be automated
- DNS resolution issues are common - ensure CoreDNS has sufficient resources
- Watch for etcd database size - clean up old data
- Node NotReady status can take minutes to detect - tune controller settings

### 2. Deployment Strategies and Workload Management

**Rolling Update Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        version: v2.1.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
      - name: app
        image: myapp:v2.1.0
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
---
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: production
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

**Blue-Green Deployment:**

```yaml
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-blue
  labels:
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: blue
  template:
    metadata:
      labels:
        app: web-app
        version: blue
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0
---
# Green deployment (new)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-green
  labels:
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: green
  template:
    metadata:
      labels:
        app: web-app
        version: green
    spec:
      containers:
      - name: app
        image: myapp:v2.0.0
---
# Service switching between blue and green
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
    version: blue  # Switch to 'green' to cutover
  ports:
  - port: 80
    targetPort: 8080
```

**Canary Deployment with Argo Rollouts:**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-app
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {duration: 5m}
      - setWeight: 40
      - pause: {duration: 5m}
      - setWeight: 60
      - pause: {duration: 5m}
      - setWeight: 80
      - pause: {duration: 5m}
      canaryService: web-app-canary
      stableService: web-app-stable
      trafficRouting:
        istio:
          virtualService:
            name: web-app-vsvc
            routes:
            - primary
      analysis:
        templates:
        - templateName: success-rate
        startingStep: 2
        args:
        - name: service-name
          value: web-app-canary
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: app
        image: myapp:latest
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
  - name: service-name
  metrics:
  - name: success-rate
    interval: 1m
    successCondition: result[0] >= 0.95
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(
            http_requests_total{service="{{args.service-name}}",status=~"2.."}[1m]
          )) /
          sum(rate(
            http_requests_total{service="{{args.service-name}}"}[1m]
          ))
```

**StatefulSet for Stateful Applications:**

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  serviceName: postgresql
  replicas: 3
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:15
        ports:
        - containerPort: 5432
          name: postgresql
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgresql-secret
              key: password
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi
```

**Best Practices:**
- Always set resource requests and limits
- Use readiness probes to prevent traffic to unhealthy pods
- Use liveness probes to restart crashed containers
- Implement PodDisruptionBudgets for high availability
- Use init containers for pre-start setup
- Leverage pod anti-affinity for spreading replicas
- Use HPA for automatic scaling based on metrics
- Set appropriate terminationGracePeriodSeconds
- Use preStop hooks for graceful shutdown
- Tag images with specific versions, never use `:latest` in production

**Gotchas:**
- Rolling updates can fail if readiness probe is too aggressive
- Resource limits can cause OOMKilled - monitor actual usage
- StatefulSets don't automatically update on ConfigMap/Secret changes
- PVC deletion requires manual intervention in StatefulSets
- Probes running too frequently can increase load
- DaemonSets ignore PodDisruptionBudgets

### 3. Helm Charts and Package Management

**Helm Chart Structure:**

```
mychart/
├── Chart.yaml           # Chart metadata
├── values.yaml          # Default values
├── values-dev.yaml      # Environment-specific values
├── values-prod.yaml
├── charts/              # Dependent charts
├── templates/           # Kubernetes manifests templates
│   ├── NOTES.txt
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   └── tests/
│       └── test-connection.yaml
└── README.md
```

**Chart.yaml:**

```yaml
apiVersion: v2
name: web-app
description: Production-grade web application
type: application
version: 1.5.0
appVersion: "2.1.0"
keywords:
  - web
  - nodejs
  - microservice
maintainers:
  - name: DevOps Team
    email: devops@example.com
dependencies:
  - name: postgresql
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

**values.yaml:**

```yaml
replicaCount: 3

image:
  repository: myapp
  pullPolicy: IfNotPresent
  tag: ""  # Defaults to appVersion

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

securityContext:
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls
      hosts:
        - app.example.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}
tolerations: []
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - web-app
        topologyKey: kubernetes.io/hostname

postgresql:
  enabled: true
  auth:
    username: appuser
    database: appdb
  primary:
    persistence:
      size: 10Gi

redis:
  enabled: true
  auth:
    enabled: true
  master:
    persistence:
      size: 2Gi
```

**templates/deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "web-app.fullname" . }}
  labels:
    {{- include "web-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "web-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "web-app.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "web-app.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
      - name: {{ .Chart.Name }}
        securityContext:
          {{- toYaml .Values.securityContext | nindent 12 }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "web-app.fullname" . }}-db
              key: connection-string
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "web-app.fullname" . }}-redis
              key: connection-string
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

**Helm Operations:**

```bash
# Install chart
helm install my-app ./mychart \
  --namespace production \
  --create-namespace \
  --values values-prod.yaml \
  --wait

# Upgrade release
helm upgrade my-app ./mychart \
  --namespace production \
  --values values-prod.yaml \
  --atomic \
  --timeout 5m

# Rollback
helm rollback my-app 3 --namespace production

# Template rendering (dry-run)
helm template my-app ./mychart \
  --values values-prod.yaml \
  --debug

# Package and push to registry
helm package mychart/
helm push mychart-1.5.0.tgz oci://registry.example.com/charts
```

**Helmfile for Multi-Chart Management:**

```yaml
# helmfile.yaml
repositories:
  - name: bitnami
    url: https://charts.bitnami.com/bitnami
  - name: ingress-nginx
    url: https://kubernetes.github.io/ingress-nginx

releases:
  - name: ingress-nginx
    namespace: ingress-nginx
    chart: ingress-nginx/ingress-nginx
    version: 4.8.x
    values:
      - controller:
          service:
            type: LoadBalancer

  - name: cert-manager
    namespace: cert-manager
    chart: jetstack/cert-manager
    version: 1.13.x
    values:
      - installCRDs: true

  - name: web-app
    namespace: production
    chart: ./charts/web-app
    values:
      - values-prod.yaml
    needs:
      - ingress-nginx/ingress-nginx
      - cert-manager/cert-manager
```

**Best Practices:**
- Use semantic versioning for charts
- Include comprehensive values.yaml with comments
- Create _helpers.tpl for reusable template snippets
- Use `helm lint` and `helm test` in CI
- Store secrets externally (Sealed Secrets, External Secrets Operator)
- Pin dependency versions
- Use `.helmignore` to exclude unnecessary files
- Document chart in README with usage examples
- Use hooks for pre/post install/upgrade actions
- Version lock dependencies with `helm dependency update`

**Gotchas:**
- Helm doesn't wait for CRDs to be ready
- Helm secrets in values.yaml are visible in history
- Chart dependencies must be explicit
- Helm doesn't delete CRDs on uninstall
- Large templates can cause timeout issues
- Values file merging order matters

### 4. Service Mesh Integration

**Istio Installation:**

```bash
# Install Istio with istioctl
istioctl install --set profile=production \
  --set meshConfig.accessLogFile=/dev/stdout \
  --set meshConfig.accessLogFormat='[%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%" %RESPONSE_CODE% %RESPONSE_FLAGS% %BYTES_RECEIVED% %BYTES_SENT% %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)% "%REQ(X-FORWARDED-FOR)%" "%REQ(USER-AGENT)%" "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%"'

# Enable sidecar injection for namespace
kubectl label namespace production istio-injection=enabled
```

**VirtualService for Traffic Management:**

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: web-app
spec:
  hosts:
  - web-app.production.svc.cluster.local
  - app.example.com
  gateways:
  - web-gateway
  http:
  - match:
    - headers:
        user-type:
          exact: beta
    route:
    - destination:
        host: web-app
        subset: v2
      weight: 100
  - route:
    - destination:
        host: web-app
        subset: v1
      weight: 90
    - destination:
        host: web-app
        subset: v2
      weight: 10
  - match:
    - uri:
        prefix: /api
    rewrite:
      uri: /v2/api
    route:
    - destination:
        host: api-service
    timeout: 5s
    retries:
      attempts: 3
      perTryTimeout: 2s
```

**DestinationRule with Circuit Breaking:**

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: web-app
spec:
  host: web-app
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 40
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
    trafficPolicy:
      loadBalancer:
        consistentHash:
          httpCookie:
            name: user-session
            ttl: 3600s
```

**mTLS Configuration:**

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: web-app-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: web-app
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/api-gateway"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/*"]
```

**Best Practices:**
- Start with permissive mTLS, then move to strict
- Use Gateway for ingress, not LoadBalancer services
- Implement retry budgets to prevent cascade failures
- Monitor service mesh overhead (latency, CPU)
- Use Kiali for service mesh visualization
- Implement proper timeouts and circuit breakers
- Use traffic mirroring for testing
- Enable distributed tracing with Jaeger

**Gotchas:**
- Sidecar injection requires pod restart
- Mesh overhead is 10-30% CPU and memory
- Egress traffic requires ServiceEntry
- mTLS can break services expecting plain TCP
- Health checks must account for sidecar startup time
- Large meshes require tuning control plane resources

### 5. GitOps with ArgoCD and Flux

**ArgoCD Application:**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  source:
    repoURL: https://github.com/company/k8s-manifests
    targetRevision: main
    path: apps/web-app/overlays/production
    kustomize:
      version: v5.0.0
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas  # Ignore HPA-managed replicas
```

**ApplicationSet for Multi-Environment:**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: web-app-matrix
  namespace: argocd
spec:
  generators:
  - matrix:
      generators:
      - git:
          repoURL: https://github.com/company/k8s-manifests
          revision: HEAD
          directories:
          - path: apps/*
      - list:
          elements:
          - env: dev
            cluster: dev-cluster
          - env: staging
            cluster: staging-cluster
          - env: production
            cluster: prod-cluster
  template:
    metadata:
      name: '{{path.basename}}-{{env}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/company/k8s-manifests
        targetRevision: HEAD
        path: '{{path}}/overlays/{{env}}'
      destination:
        server: '{{cluster}}'
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

**Flux GitRepository and Kustomization:**

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/company/k8s-infrastructure
  ref:
    branch: main
  secretRef:
    name: git-credentials
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 5m
  sourceRef:
    kind: GitRepository
    name: infrastructure
  path: ./clusters/production
  prune: true
  wait: true
  timeout: 5m
  healthChecks:
  - apiVersion: apps/v1
    kind: Deployment
    name: nginx-ingress
    namespace: ingress-nginx
```

**Progressive Delivery with Flagger:**

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: web-app
  namespace: production
spec:
  provider: istio
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  progressDeadlineSeconds: 600
  service:
    port: 80
    targetPort: 8080
    gateways:
    - web-gateway
    hosts:
    - app.example.com
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    webhooks:
    - name: load-test
      url: http://flagger-loadtester/
      timeout: 5s
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://web-app-canary/"
```

**Best Practices:**
- Use separate Git repos for app code and K8s manifests
- Implement branch protection and pull request reviews
- Use Kustomize or Helm for environment variations
- Enable automatic syncing only after testing
- Monitor ArgoCD/Flux health metrics
- Use image update automation carefully
- Implement proper RBAC for GitOps tools
- Use Git tags or specific commits for production
- Enable notifications to Slack/Teams
- Backup ArgoCD/Flux configurations

**Gotchas:**
- Large repos can cause sync slowness
- Circular dependencies between applications
- Credential management requires care
- Pruning can delete unexpected resources
- Application of order matters for CRDs
- Webhooks require accessible endpoints

## 💡 Real-World Examples

### Example 1: Complete Microservices Platform with Istio

Full production setup with multiple microservices, Istio service mesh, observability stack, and GitOps.

```yaml
# Platform namespace with Istio injection
apiVersion: v1
kind: Namespace
metadata:
  name: platform
  labels:
    istio-injection: enabled
---
# API Gateway Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
        version: v1
    spec:
      serviceAccountName: api-gateway
      containers:
      - name: gateway
        image: api-gateway:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: AUTH_SERVICE_URL
          value: http://auth-service:8080
        - name: USER_SERVICE_URL
          value: http://user-service:8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
# Gateway Service
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: platform
spec:
  selector:
    app: api-gateway
  ports:
  - port: 8080
    name: http
---
# Istio Gateway
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: platform-gateway
  namespace: platform
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: platform-tls
    hosts:
    - "api.example.com"
---
# Virtual Service with Routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: platform-routes
  namespace: platform
spec:
  hosts:
  - "api.example.com"
  gateways:
  - platform-gateway
  http:
  - match:
    - uri:
        prefix: /auth
    route:
    - destination:
        host: auth-service
        port:
          number: 8080
  - match:
    - uri:
        prefix: /users
    route:
    - destination:
        host: user-service
        port:
          number: 8080
  - match:
    - uri:
        prefix: /
    route:
    - destination:
        host: api-gateway
        port:
          number: 8080
---
# Circuit Breaker Configuration
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: auth-service
  namespace: platform
spec:
  host: auth-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

### Example 2: Multi-Tenant SaaS Platform with Namespace Isolation

```yaml
# Tenant namespace template
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-{{TENANT_ID}}
  labels:
    tenant: "{{TENANT_ID}}"
---
# Resource Quota per Tenant
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-{{TENANT_ID}}
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "5"
    services.loadbalancers: "2"
---
# Limit Range for Default Requests/Limits
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-limits
  namespace: tenant-{{TENANT_ID}}
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    type: Container
---
# Network Policy for Tenant Isolation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-isolation
  namespace: tenant-{{TENANT_ID}}
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          tenant: "{{TENANT_ID}}"
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          tenant: "{{TENANT_ID}}"
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

## 🔗 Related Skills

- **container-chief** - Docker and container management
- **devops-engineer** - CI/CD pipelines and deployment automation
- **prometheus-expert** - Metrics collection and monitoring
- **grafana-expert** - Dashboard creation and visualization
- **github-manager** - Git repository and workflow management

## 📖 Further Reading

**Official Documentation:**
- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Flux Documentation](https://fluxcd.io/docs/)

**Best Practices:**
- [Kubernetes Best Practices by Google](https://cloud.google.com/architecture/best-practices-for-running-kubernetes)
- [Production Best Practices by Kubernetes](https://kubernetes.io/docs/setup/best-practices/)
- [12 Factor App](https://12factor.net/)

**Books:**
- "Kubernetes in Action" by Marko Lukša
- "Kubernetes Patterns" by Bilgin Ibryam
- "Production Kubernetes" by Josh Rosso

**Tools:**
- kubectl plugins: kubectx, kubens, stern
- k9s - Terminal UI for Kubernetes
- Lens - Kubernetes IDE
- Krew - kubectl plugin manager

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master Kubernetes orchestration from cluster architecture to production GitOps workflows*
