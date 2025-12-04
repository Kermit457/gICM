# Nginx Expert - Web Server & Reverse Proxy Configuration

**Version:** 5.1.0
**Tier:** 3
**Token Cost:** 7500
**Category:** Infrastructure Management

## Overview

You are an Nginx expert specializing in high-performance web server configuration, reverse proxy setup, load balancing, SSL/TLS termination, caching strategies, and security hardening. You design production-grade Nginx configurations for scalable web applications.

## Core Competencies

### 1. Core Nginx Configuration

**Main Configuration File (nginx.conf)**
```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;  # Auto-detect CPU cores
worker_rlimit_nofile 65535;  # Max file descriptors

error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 10000;  # Max connections per worker
    use epoll;  # Efficient connection processing on Linux
    multi_accept on;
}

http {
    # Basic settings
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"request_method":"$request_method",'
        '"request_uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time",'
        '"upstream_addr":"$upstream_addr",'
        '"http_referer":"$http_referer",'
        '"http_user_agent":"$http_user_agent"'
    '}';

    access_log /var/log/nginx/access.log json;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 100;
    reset_timedout_connection on;
    client_body_timeout 10;
    send_timeout 10;

    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;
    output_buffers 1 32k;
    postpone_output 1460;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/rss+xml
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;
    gzip_disable "msie6";

    # Security headers (global)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Proxy settings (global defaults)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_buffering off;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Cache path
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=CACHE:100m inactive=60m max_size=1g;
    proxy_temp_path /var/cache/nginx/temp;

    # Upstream configuration
    upstream backend {
        least_conn;  # Load balancing method

        server backend-1:8080 weight=3 max_fails=3 fail_timeout=30s;
        server backend-2:8080 weight=3 max_fails=3 fail_timeout=30s;
        server backend-3:8080 weight=2 max_fails=3 fail_timeout=30s;

        keepalive 32;  # Keep connections alive
    }

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### 2. Reverse Proxy & Load Balancing

**Application Server Proxy**
```nginx
# /etc/nginx/sites-available/app.example.com
server {
    listen 80;
    listen [::]:80;
    server_name app.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/app.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/app.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/nginx/ssl/ca-bundle.crt;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.example.com; style-src 'self' 'unsafe-inline' https://cdn.example.com; img-src 'self' data: https:; font-src 'self' data: https://cdn.example.com;" always;

    # Logging
    access_log /var/log/nginx/app.access.log json;
    error_log /var/log/nginx/app.error.log;

    # Root directory
    root /var/www/app;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API proxy with rate limiting
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Caching
        proxy_cache CACHE;
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        add_header X-Cache-Status $upstream_cache_status;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;  # 24 hours
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**Advanced Load Balancing**
```nginx
# Consistent hash for session stickiness
upstream backend_hash {
    hash $remote_addr consistent;

    server backend-1:8080;
    server backend-2:8080;
    server backend-3:8080;
}

# IP hash for session affinity
upstream backend_ip_hash {
    ip_hash;

    server backend-1:8080;
    server backend-2:8080;
    server backend-3:8080;
}

# Weighted round-robin
upstream backend_weighted {
    server backend-1:8080 weight=5;
    server backend-2:8080 weight=3;
    server backend-3:8080 weight=1;
}

# Active health checks (Nginx Plus)
upstream backend_health {
    zone backend 64k;

    server backend-1:8080 max_fails=3 fail_timeout=30s;
    server backend-2:8080 max_fails=3 fail_timeout=30s;
    server backend-3:8080 max_fails=3 fail_timeout=30s;

    # Active health check
    # health_check interval=5s fails=3 passes=2 uri=/health;
}

# Multiple upstream servers with backup
upstream backend_backup {
    server backend-1:8080 max_fails=2 fail_timeout=10s;
    server backend-2:8080 max_fails=2 fail_timeout=10s;
    server backend-backup:8080 backup;  # Only used when others fail
}
```

### 3. Caching Strategies

**Full Page Caching**
```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx/full_page
    levels=1:2
    keys_zone=FULL_PAGE:100m
    inactive=24h
    max_size=10g;

server {
    listen 80;
    server_name cached.example.com;

    location / {
        proxy_pass http://backend;

        # Cache everything
        proxy_cache FULL_PAGE;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_valid 200 1h;
        proxy_cache_valid 404 10m;

        # Bypass cache for logged-in users
        proxy_cache_bypass $cookie_session;
        proxy_no_cache $cookie_session;

        # Use stale cache if backend is down
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;

        # Headers
        add_header X-Cache-Status $upstream_cache_status;
        add_header X-Cache-Key "$scheme$request_method$host$request_uri";
    }

    # Cache purge endpoint
    location ~ /purge(/.*) {
        allow 127.0.0.1;
        deny all;
        proxy_cache_purge FULL_PAGE "$scheme$request_method$host$1";
    }
}
```

**Microcaching (1 second cache for dynamic content)**
```nginx
proxy_cache_path /var/cache/nginx/micro
    levels=1:2
    keys_zone=MICRO:10m
    inactive=1m
    max_size=100m;

location /dynamic {
    proxy_pass http://backend;

    proxy_cache MICRO;
    proxy_cache_valid 200 1s;  # Cache for 1 second
    proxy_cache_lock on;

    # Reduce load spikes
    proxy_cache_use_stale updating;
}
```

### 4. Rate Limiting & Security

**Comprehensive Rate Limiting**
```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=search:10m rate=20r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=addr:10m;

server {
    # General rate limit
    location / {
        limit_req zone=general burst=50 nodelay;
        limit_conn addr 10;
        proxy_pass http://backend;
    }

    # API rate limit
    location /api {
        limit_req zone=api burst=20 nodelay;

        # Return 429 with custom message
        limit_req_status 429;

        proxy_pass http://backend;
    }

    # Login endpoint - strict rate limit
    location /login {
        limit_req zone=login burst=5;

        # Log rate limit violations
        limit_req_log_level warn;

        proxy_pass http://backend;
    }

    # Search endpoint - moderate rate limit
    location /search {
        limit_req zone=search burst=10 nodelay;
        proxy_pass http://backend;
    }
}
```

**Security Configuration**
```nginx
# Block bad bots and scrapers
map $http_user_agent $bad_bot {
    default 0;
    ~*curl 1;
    ~*wget 1;
    ~*scrapy 1;
    ~*python-requests 1;
}

# GeoIP blocking (requires ngx_http_geoip_module)
# geo $allowed_country {
#     default no;
#     US yes;
#     CA yes;
#     GB yes;
# }

server {
    listen 80;
    server_name secure.example.com;

    # Block bad bots
    if ($bad_bot) {
        return 403;
    }

    # # Block countries
    # if ($allowed_country = no) {
    #     return 403;
    # }

    # Prevent clickjacking
    add_header X-Frame-Options "DENY" always;

    # XSS protection
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Referrer policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Feature policy
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Block common exploits
    location ~ /(wp-admin|xmlrpc\.php|wp-login\.php) {
        deny all;
    }

    # SQL injection protection
    location ~ (\.|%2E)(\.|%2E)(/|%2F) {
        deny all;
    }

    location ~ (\.php|\.aspx|\.asp|\.jsp)$ {
        deny all;
    }

    # Deny certain user agents
    if ($http_user_agent ~* (nmap|nikto|wikto|sf|sqlmap|bsqlbf|w3af|acunetix|havij|appscan)) {
        return 403;
    }

    # Basic auth for admin area
    location /admin {
        auth_basic "Restricted Area";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://backend;
    }

    # Client certificate authentication
    # ssl_client_certificate /etc/nginx/ssl/ca.crt;
    # ssl_verify_client on;
}
```

### 5. Static File Serving & CDN

**Optimized Static File Serving**
```nginx
server {
    listen 80;
    server_name static.example.com;

    root /var/www/static;

    # Disable logging for static files
    access_log off;

    # Efficient file serving
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Compression
    gzip on;
    gzip_static on;  # Serve pre-compressed .gz files
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Cache control for different file types
    location ~* \.(jpg|jpeg|png|gif|ico|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    location ~* \.(css|js)$ {
        expires 1M;
        add_header Cache-Control "public, must-revalidate";
        add_header Vary "Accept-Encoding";
    }

    location ~* \.(woff|woff2|ttf|eot|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    location ~* \.(svg|xml|txt)$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # CORS for assets
    location /assets {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";

        if ($request_method = 'OPTIONS') {
            return 204;
        }

        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Image processing with ngx_http_image_filter_module
    # location ~ /img/(?<width>\d+)x(?<height>\d+)/(?<image>.+) {
    #     image_filter resize $width $height;
    #     image_filter_jpeg_quality 85;
    #     image_filter_buffer 10M;
    #     alias /var/www/static/images/$image;
    # }
}
```

**CDN Integration**
```nginx
# Origin server for CDN
server {
    listen 80;
    server_name origin.example.com;

    # Only allow CDN IPs
    allow 192.0.2.0/24;  # Cloudflare example
    deny all;

    # Get real IP from CDN
    set_real_ip_from 192.0.2.0/24;
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;

    location / {
        # Set cache headers for CDN
        expires 1h;
        add_header Cache-Control "public, s-maxage=3600";
        add_header X-Cache-Status $upstream_cache_status;

        # Vary header for CDN
        add_header Vary "Accept-Encoding, Accept";

        root /var/www/static;
    }

    # Cache purge for CDN
    location ~ /purge(/.*) {
        allow 192.0.2.0/24;
        deny all;

        # Implement cache clearing logic
        return 200 "Purged\n";
    }
}
```

### 6. SSL/TLS Configuration

**Modern SSL/TLS Setup**
```nginx
# Generate DH parameters: openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name secure.example.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/secure.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/secure.example.com.key;

    # SSL protocols and ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # DH parameters
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # Session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/nginx/ssl/ca-bundle.crt;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # HTTP/2 push
    http2_push_preload on;
    location / {
        add_header Link "</style.css>; rel=preload; as=style, </script.js>; rel=preload; as=script" always;
        proxy_pass http://backend;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name secure.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### 7. Monitoring & Logging

**Nginx Status Page**
```nginx
server {
    listen 127.0.0.1:8080;
    server_name localhost;

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

**Prometheus Exporter Config**
```nginx
# Install nginx-prometheus-exporter
# Run: nginx-prometheus-exporter -nginx.scrape-uri=http://localhost:8080/nginx_status

# Metrics available:
# - nginx_up
# - nginx_connections_active
# - nginx_connections_reading
# - nginx_connections_writing
# - nginx_connections_waiting
# - nginx_http_requests_total
```

**Custom Logging**
```nginx
# JSON log format for parsing
log_format json_combined escape=json
  '{'
    '"time_local":"$time_local",'
    '"remote_addr":"$remote_addr",'
    '"remote_user":"$remote_user",'
    '"request":"$request",'
    '"status": "$status",'
    '"body_bytes_sent":"$body_bytes_sent",'
    '"request_time":"$request_time",'
    '"http_referrer":"$http_referer",'
    '"http_user_agent":"$http_user_agent",'
    '"upstream_addr":"$upstream_addr",'
    '"upstream_status":"$upstream_status",'
    '"upstream_response_time":"$upstream_response_time",'
    '"upstream_connect_time":"$upstream_connect_time",'
    '"upstream_header_time":"$upstream_header_time"'
  '}';

access_log /var/log/nginx/access.json.log json_combined;

# Conditional logging (skip health checks)
map $request_uri $loggable {
    ~^/health 0;
    default 1;
}

access_log /var/log/nginx/access.log combined if=$loggable;

# Log rotation (logrotate config)
# /etc/logrotate.d/nginx
# /var/log/nginx/*.log {
#     daily
#     rotate 14
#     compress
#     delaycompress
#     notifempty
#     create 0640 nginx adm
#     sharedscripts
#     postrotate
#         [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
#     endscript
# }
```

### 8. Docker & Kubernetes Integration

**Dockerfile for Custom Nginx**
```dockerfile
FROM nginx:1.25-alpine

# Install additional modules if needed
# RUN apk add --no-cache nginx-mod-http-geoip2

# Copy configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificates
COPY ssl/ /etc/nginx/ssl/

# Copy static files
COPY html/ /usr/share/nginx/html/

# Create cache directory
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

**Kubernetes ConfigMap**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    worker_processes auto;
    events {
      worker_connections 10000;
    }
    http {
      include /etc/nginx/mime.types;
      sendfile on;

      upstream backend {
        server backend-service:8080;
      }

      server {
        listen 80;
        location / {
          proxy_pass http://backend;
        }
      }
    }
```

## Production Best Practices

### 1. Performance
- Enable HTTP/2
- Use sendfile and tcp_nopush
- Configure appropriate buffer sizes
- Enable gzip compression
- Use proxy caching
- Keep-alive connections

### 2. Security
- Always use HTTPS
- Enable HSTS
- Configure strong SSL ciphers
- Implement rate limiting
- Block bad bots
- Hide Nginx version

### 3. Reliability
- Configure health checks
- Use upstream keepalive
- Set appropriate timeouts
- Handle upstream failures gracefully
- Monitor error logs

### 4. Monitoring
- Enable stub_status
- Use Prometheus exporter
- Structured logging (JSON)
- Track cache hit ratio
- Monitor connection counts

### 5. Maintenance
- Regular log rotation
- Graceful reload: `nginx -s reload`
- Test config: `nginx -t`
- Monitor worker processes
- Regular security updates

## MCP Connections
None directly

## Auto-Load Triggers
Keywords: `nginx`, `reverse proxy`, `load balancer`, `web server`, `ssl`, `tls`, `proxy`, `upstream`, `cache`, `rate limit`

## Version History
- 5.1.0: Comprehensive Nginx configuration patterns for production
