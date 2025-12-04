# Infrastructure Skills - Production-Ready Patterns

This directory contains comprehensive infrastructure skills for production deployment, monitoring, and scaling.

## Completed Skills (800-1000+ lines each)

### ✅ kubernetes-expert.md (1,150 lines, 24KB)
**Complete Kubernetes patterns:**
- Production-grade deployments with security contexts
- Services, Ingress, and NetworkPolicy configurations
- ConfigMaps, Secrets, and SealedSecrets
- Horizontal Pod Autoscaling (HPA) with custom metrics
- StatefulSets for stateful workloads
- Jobs and CronJobs for batch processing
- RBAC, ServiceAccounts, and Pod Security Policies
- ServiceMonitor and PrometheusRule for monitoring
- Blue-Green deployment patterns
- Complete microservice stack examples

**Keywords:** kubernetes, k8s, deployment, pod, service, ingress, helm

---

### ✅ prometheus-expert.md (830 lines, 24KB)
**Complete Prometheus patterns:**
- Production prometheus.yml with all scrape configs
- Kubernetes service discovery (pods, nodes, API server)
- Recording rules for efficient pre-aggregation
- Comprehensive alert rules (infrastructure, application, K8s, database)
- Remote write/read for long-term storage
- Metric relabeling and filtering
- High-cardinality metric handling
- Blackbox exporter for HTTP probes
- cAdvisor for container metrics

**Keywords:** prometheus, monitoring, metrics, alerting, promql

---

### ✅ grafana-expert.md (944 lines, 20KB)
**Complete Grafana patterns:**
- Dashboard JSON models with templating
- Panel types (time series, bar gauge, stat, table)
- PromQL query patterns
- Alert rules and notification channels
- Dashboard provisioning
- Data source configuration
- Variable templating
- Dashboard sharing and snapshots

**Keywords:** grafana, dashboard, visualization, alerting

---

### ✅ nginx-expert.md (858 lines, 24KB)
**Complete NGINX patterns:**
- Reverse proxy configuration
- Load balancing (round-robin, least connections, IP hash)
- SSL/TLS termination with Let's Encrypt
- WebSocket proxying
- Rate limiting and DDoS protection
- Caching strategies
- Compression (gzip, brotli)
- Security headers
- Access control
- URL rewriting

**Keywords:** nginx, reverse-proxy, load-balancer, web-server

---

### ✅ db-commander.md (928 lines, 24KB)
**Complete database patterns:**
- PostgreSQL optimization and tuning
- Connection pooling (PgBouncer)
- Replication and high availability
- Backup and restore strategies
- Query optimization
- Index management
- Monitoring and alerting

**Keywords:** postgres, database, sql, optimization

---

## Infrastructure Skills Needing Expansion

These stub files exist but need expansion to 800-1000 lines:

### 🔨 websocket-expert.md (113 lines) → Target: 800+ lines
**Should include:**
- Production WebSocket server (Node.js with ws)
- Client-side implementation with React hooks
- Reconnection strategies with exponential backoff
- Heartbeat/ping-pong patterns
- Room/channel management
- Redis Pub/Sub for horizontal scaling
- NGINX load balancing for WebSockets
- Kubernetes deployment with sticky sessions
- Authentication and authorization
- Message broadcasting patterns

**Current location:** `skills/definitions/websocket-expert.md`
**Target location:** `skills/definitions/infrastructure/websocket-expert.md`

---

### 🔨 queue-expert.md (113 lines) → Target: 800+ lines
**Should include:**
- BullMQ/Bull queue patterns
- RabbitMQ configuration and patterns
- AWS SQS integration
- Kafka producer/consumer patterns
- Queue priority and delays
- Job retry strategies
- Dead letter queues
- Worker scaling patterns
- Monitoring and metrics
- Error handling and recovery

**Current location:** `skills/definitions/queue-expert.md`
**Target location:** `skills/definitions/infrastructure/queue-expert.md`

---

### 🔨 caching-expert.md (113 lines) → Target: 800+ lines
**Should include:**
- Redis caching patterns (cache-aside, write-through, write-behind)
- Cache invalidation strategies
- Session management
- Distributed locking
- Redis data structures (strings, hashes, lists, sets, sorted sets)
- Redis Cluster configuration
- Redis Sentinel for high availability
- Cache warming strategies
- TTL and eviction policies
- Monitoring and metrics
- Memory optimization

**Current location:** `skills/definitions/caching-expert.md`
**Target location:** `skills/definitions/infrastructure/caching-expert.md`

---

### 🔨 search-expert.md (113 lines) → Target: 800+ lines
**Should include:**
- Meilisearch configuration and indexing
- Typesense setup and usage
- Full-text search patterns
- Faceted search implementation
- Filtering and sorting strategies
- Typo tolerance configuration
- Synonyms and stop words
- Ranking and relevance tuning
- Geo-search implementation
- Multi-tenant search
- Search analytics
- Performance optimization

**Current location:** `skills/definitions/search-expert.md`
**Target location:** `skills/definitions/infrastructure/search-expert.md`

---

## Infrastructure Skills Summary

**Status:** 5/8 Complete (62.5%)

### Completed (5)
1. ✅ kubernetes-expert.md - 1,150 lines
2. ✅ prometheus-expert.md - 830 lines
3. ✅ grafana-expert.md - 944 lines
4. ✅ nginx-expert.md - 858 lines
5. ✅ db-commander.md - 928 lines

### Needs Expansion (3)
6. 🔨 websocket-expert.md - 113 → 800+ lines
7. 🔨 queue-expert.md - 113 → 800+ lines
8. 🔨 caching-expert.md - 113 → 800+ lines
9. 🔨 search-expert.md - 113 → 800+ lines

### Total Content
- **Completed:** 4,710 lines (118 KB)
- **Average:** 942 lines per skill
- **Remaining:** ~2,800 lines needed (4 skills × 700 lines average)

---

## Next Steps

1. **Expand websocket-expert.md**
   - Add production WebSocket server implementation
   - Include client-side patterns
   - Add scaling strategies with Redis
   - Document load balancing and deployment

2. **Expand queue-expert.md**
   - Add BullMQ/RabbitMQ/Kafka patterns
   - Include job processing strategies
   - Document retry and error handling
   - Add monitoring and scaling

3. **Expand caching-expert.md**
   - Add Redis patterns and configurations
   - Include cache strategies
   - Document cluster and sentinel
   - Add performance tuning

4. **Expand search-expert.md**
   - Add Meilisearch/Typesense configs
   - Include indexing strategies
   - Document search optimization
   - Add analytics and monitoring

---

*Generated on 2025-12-04 - OPUS 67 v5.1.0*
