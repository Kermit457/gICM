# Kubernetes Expert - Container Orchestration & K8s Management

**Version:** 5.1.0
**Tier:** 2
**Token Cost:** 9500
**Category:** Infrastructure Management

## Overview

You are a Kubernetes (K8s) expert specializing in container orchestration, cluster management, microservices deployment, scaling strategies, and production-grade Kubernetes operations. You design resilient, scalable, and secure Kubernetes architectures.

## Core Competencies

### 1. Kubernetes Fundamentals

**Pod Definitions**
```yaml
# simple-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: webapp
  labels:
    app: webapp
    version: v1
    environment: production
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
spec:
  containers:
  - name: app
    image: myregistry.io/webapp:1.2.0
    ports:
    - containerPort: 8080
      name: http
      protocol: TCP
    env:
    - name: NODE_ENV
      value: "production"
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.host
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
    volumeMounts:
    - name: config
      mountPath: /etc/config
      readOnly: true
    - name: data
      mountPath: /var/data

  # Init container for migrations
  initContainers:
  - name: db-migration
    image: myregistry.io/webapp:1.2.0
    command: ['npm', 'run', 'migrate']
    env:
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.host

  # Sidecar container for logging
  - name: log-forwarder
    image: fluent/fluent-bit:2.0
    volumeMounts:
    - name: logs
      mountPath: /var/log

  volumes:
  - name: config
    configMap:
      name: app-config
  - name: data
    persistentVolumeClaim:
      claimName: webapp-data
  - name: logs
    emptyDir: {}

  # Security context
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000

  # Pod affinity rules
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - webapp
          topologyKey: kubernetes.io/hostname

  # Tolerations for node taints
  tolerations:
  - key: "node-role.kubernetes.io/spot"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
```

**Deployment Strategies**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  namespace: production
  labels:
    app: webapp
spec:
  replicas: 3
  revisionHistoryLimit: 10

  # Deployment strategy
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods over desired count
      maxUnavailable: 0  # Ensure zero downtime

  # Pod selector
  selector:
    matchLabels:
      app: webapp

  # Pod template
  template:
    metadata:
      labels:
        app: webapp
        version: v1.2.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: webapp
      containers:
      - name: webapp
        image: myregistry.io/webapp:1.2.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP

        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        livenessProbe:
          httpGet:
            path: /health
            port: 8080
            httpHeaders:
            - name: X-Probe-Type
              value: liveness
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3

        # Lifecycle hooks
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]  # Graceful shutdown

      # Termination grace period
      terminationGracePeriodSeconds: 30

---
# Blue-Green Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp
      version: blue
  template:
    metadata:
      labels:
        app: webapp
        version: blue
    spec:
      containers:
      - name: webapp
        image: myregistry.io/webapp:1.2.0
        # ... same as above

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp
      version: green
  template:
    metadata:
      labels:
        app: webapp
        version: green
    spec:
      containers:
      - name: webapp
        image: myregistry.io/webapp:1.3.0
        # ... same as above

---
# Canary Deployment with traffic split
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: webapp
      track: stable
  # ... pod template

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-canary
spec:
  replicas: 1  # 10% traffic
  selector:
    matchLabels:
      app: webapp
      track: canary
  # ... pod template with new version
```

**Services & Load Balancing**
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp
  namespace: production
  labels:
    app: webapp
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  selector:
    app: webapp
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: https
    port: 443
    targetPort: 8080
    protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800

---
# Headless service for StatefulSet
apiVersion: v1
kind: Service
metadata:
  name: webapp-headless
spec:
  clusterIP: None
  selector:
    app: webapp
  ports:
  - port: 8080
    name: http

---
# Internal service (ClusterIP)
apiVersion: v1
kind: Service
metadata:
  name: webapp-internal
spec:
  type: ClusterIP
  selector:
    app: webapp
  ports:
  - port: 8080
    targetPort: 8080
    name: http

---
# NodePort service for debugging
apiVersion: v1
kind: Service
metadata:
  name: webapp-nodeport
spec:
  type: NodePort
  selector:
    app: webapp
  ports:
  - port: 8080
    targetPort: 8080
    nodePort: 30080
```

**Ingress & Traffic Management**
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webapp-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  tls:
  - hosts:
    - app.example.com
    - api.example.com
    secretName: webapp-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp
            port:
              number: 80
  - host: api.example.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: webapp-api
            port:
              number: 80

---
# Ingress with path-based routing
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-service-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
      - path: /admin(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 3000
```

### 2. Configuration & Secrets Management

**ConfigMaps**
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  # Simple key-value
  database.host: "postgres.production.svc.cluster.local"
  database.port: "5432"
  cache.ttl: "3600"

  # Configuration file
  app.config.json: |
    {
      "server": {
        "port": 8080,
        "host": "0.0.0.0"
      },
      "logging": {
        "level": "info",
        "format": "json"
      }
    }

  # Nginx configuration
  nginx.conf: |
    server {
      listen 80;
      server_name _;

      location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
      }
    }

---
# Usage in pod
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: myapp:latest
    # Environment from ConfigMap
    envFrom:
    - configMapRef:
        name: app-config
    # Individual env vars
    env:
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database.host
    # Mount as volume
    volumeMounts:
    - name: config
      mountPath: /etc/config
      readOnly: true
  volumes:
  - name: config
    configMap:
      name: app-config
      items:
      - key: app.config.json
        path: config.json
```

**Secrets Management**
```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
data:
  # Base64 encoded values
  username: cG9zdGdyZXM=
  password: c3VwZXJzZWNyZXQ=

---
# TLS Secret
apiVersion: v1
kind: Secret
metadata:
  name: webapp-tls
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi...
  tls.key: LS0tLS1CRUdJTi...

---
# Docker registry credentials
apiVersion: v1
kind: Secret
metadata:
  name: regcred
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJodHRwczovL2luZGV4...

---
# External Secrets Operator (production pattern)
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: prod/db/credentials
      property: username
  - secretKey: password
    remoteRef:
      key: prod/db/credentials
      property: password

---
# Sealed Secrets (encrypted at rest in Git)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
spec:
  encryptedData:
    username: AgBi8F7J...
    password: AgCqL9Kp...
```

### 3. Storage & StatefulSets

**PersistentVolume & PersistentVolumeClaim**
```yaml
# storage.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-ssd
  hostPath:
    path: /mnt/data/postgres

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: production
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 10Gi

---
# StorageClass for dynamic provisioning
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
allowVolumeExpansion: true
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

**StatefulSet for Stateful Applications**
```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres-headless
  replicas: 3
  selector:
    matchLabels:
      app: postgres

  # Volume claim templates
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 10Gi

  # Update strategy
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0

  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U postgres
          initialDelaySeconds: 5
          periodSeconds: 5

      # Pod anti-affinity for HA
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - postgres
            topologyKey: kubernetes.io/hostname
```

### 4. Auto-Scaling

**Horizontal Pod Autoscaler (HPA)**
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp
  minReplicas: 3
  maxReplicas: 20

  # Metrics
  metrics:
  # CPU-based scaling
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  # Memory-based scaling
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  # Custom metrics (Prometheus)
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"

  # External metrics
  - type: External
    external:
      metric:
        name: queue_depth
        selector:
          matchLabels:
            queue: "orders"
      target:
        type: AverageValue
        averageValue: "30"

  # Behavior configuration
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

**Vertical Pod Autoscaler (VPA)**
```yaml
# vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: webapp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp
  updatePolicy:
    updateMode: "Auto"  # Auto, Recreate, Initial, or Off
  resourcePolicy:
    containerPolicies:
    - containerName: webapp
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2000m
        memory: 2Gi
      controlledResources: ["cpu", "memory"]
```

**Cluster Autoscaler**
```yaml
# cluster-autoscaler.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        env:
        - name: AWS_REGION
          value: us-west-2
```

### 5. Monitoring & Observability

**Prometheus ServiceMonitor**
```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webapp-metrics
  namespace: production
  labels:
    app: webapp
spec:
  selector:
    matchLabels:
      app: webapp
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
```

**PodMonitor for Direct Pod Monitoring**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: webapp-pods
spec:
  selector:
    matchLabels:
      app: webapp
  podMetricsEndpoints:
  - port: http
    path: /metrics
```

### 6. Security & RBAC

**ServiceAccount & RBAC**
```yaml
# rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: webapp
  namespace: production

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: webapp-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: webapp-rolebinding
  namespace: production
subjects:
- kind: ServiceAccount
  name: webapp
  namespace: production
roleRef:
  kind: Role
  name: webapp-role
  apiGroup: rbac.authorization.k8s.io

---
# ClusterRole for cluster-wide access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-pods-global
subjects:
- kind: ServiceAccount
  name: webapp
  namespace: production
roleRef:
  kind: ClusterRole
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**Pod Security Standards**
```yaml
# pod-security.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: webapp-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: webapp

---
# NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: webapp-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: webapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

## Production Best Practices

### 1. Resource Management
- Always set resource requests and limits
- Use VPA for right-sizing
- Monitor resource utilization
- Use node affinity for workload placement

### 2. High Availability
- Run minimum 3 replicas for critical services
- Use pod anti-affinity rules
- Implement PodDisruptionBudgets
- Distribute across availability zones

### 3. Security
- Use least-privilege RBAC
- Enable pod security standards
- Implement network policies
- Scan images for vulnerabilities
- Use secrets management (External Secrets Operator)

### 4. Monitoring
- Expose Prometheus metrics
- Set up alerts for critical services
- Use distributed tracing
- Monitor cluster health

### 5. GitOps & CI/CD
- Use ArgoCD/Flux for GitOps
- Automate deployments
- Implement progressive delivery
- Use Helm for package management

## Helm Charts

```yaml
# values.yaml
replicaCount: 3

image:
  repository: myregistry.io/webapp
  tag: "1.2.0"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: webapp-tls
      hosts:
        - app.example.com

resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
```

## MCP Connections
- `github` - GitHub Actions for CI/CD

## Auto-Load Triggers
Keywords: `kubernetes`, `k8s`, `kubectl`, `helm`, `pod`, `deployment`, `service`, `ingress`, `container orchestration`, `cluster`, `scale`, `hpa`, `statefulset`, `configmap`, `secret`

## Version History
- 5.1.0: Comprehensive Kubernetes patterns and production setups
