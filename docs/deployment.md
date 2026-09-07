# Deployment Documentation

## Overview

This document provides detailed instructions for deploying the Laboratory Equipment Management System with AI Integration (AI-LEMS) in various environments. The system is designed to be containerized for easy deployment and scalability.

## System Architecture

### Components

1. **Backend**: FastAPI application running on Python 3.12
2. **Frontend**: React/Vite application
3. **Database**: MySQL 8.4 (production) or SQLite (development)
4. **AI Service**: Ollama with qwen2.5:3b model
5. **Reverse Proxy**: Nginx (optional)

### Technology Stack

- **Backend**: FastAPI, SQLAlchemy, Pydantic, JWT
- **Frontend**: React, Vite, TailwindCSS, Axios
- **Database**: MySQL 8.4, SQLAlchemy ORM
- **AI**: Ollama, qwen2.5:3b model
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Optional Prometheus/Grafana

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or CentOS 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB (50GB recommended)
- **CPU**: 2 cores minimum (4 cores recommended)

### Software Dependencies

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git
- curl (for health checks)

### Network Requirements

- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 8000 (Backend API)
- Port 3000 (Frontend development)
- Port 11434 (Ollama)

## Development Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/cyberbount/AI-LEMS.git
cd AI-LEMS
```

### 2. Install Dependencies

```bash
# Install system dependencies
sudo apt update
sudo apt install -y python3.12 python3.12-venv npm docker.io docker-compose

# Create Python virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./local_lab_ai.db

# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

### 4. Initialize Database

```bash
python scripts/init_db.py
```

### 5. Start Development Environment

```bash
# Start Ollama
ollama pull qwen2.5:3b

# Start backend
python scripts/start-backend.sh

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in to apply group changes
```

### 2. Deploy with Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql+pymysql://root:${DB_PASSWORD}@db:3306/local_lab_ai
      - SECRET_KEY=${SECRET_KEY}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - OLLAMA_HOST=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5:3b
    depends_on:
      - db
      - ollama
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Database
  db:
    image: mysql:8.4
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=local_lab_ai
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  # Ollama
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  # Nginx (optional)
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  mysql_data:
  ollama_data:
```

Create a `.env` file for production:

```env
# Database Configuration
DB_PASSWORD=your-secure-password-here

# JWT Configuration
SECRET_KEY=your-very-secure-secret-key-here

# SSL Configuration (for Nginx)
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### 3. Build and Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs
```

### 4. Database Migration (if needed)

```bash
# Run migrations
docker-compose exec backend python scripts/migrate.py

# Initialize database if needed
docker-compose exec backend python scripts/init_db.py
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection URL | SQLite development DB | Yes |
| `SECRET_KEY` | JWT secret key | - | Yes |
| `ALGORITHM` | JWT algorithm | HS256 | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | 30 | No |
| `OLLAMA_HOST` | Ollama service URL | http://localhost:11434 | Yes |
| `OLLAMA_MODEL` | Ollama model name | qwen2.5:3b | Yes |

### Database Configuration

#### MySQL Configuration

```sql
-- Create database
CREATE DATABASE local_lab_ai;

-- Create user
CREATE USER 'lab_user'@'%' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON local_lab_ai.* TO 'lab_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;
```

#### Database Schema

The database schema is defined in `docs/schema.sql`. Run the initialization script:

```bash
mysql -u root -p < docs/schema.sql
```

## Monitoring and Logging

### Application Logs

```bash
# View backend logs
docker-compose logs backend

# View frontend logs
docker-compose logs frontend

# View database logs
docker-compose logs db

# View Ollama logs
docker-compose logs ollama
```

### Health Checks

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend health check
curl http://localhost/health

# Database health check
docker-compose exec db mysqladmin -u root -p ping

# Ollama health check
curl http://localhost:11434/api/tags
```

### Monitoring Setup (Optional)

1. **Prometheus**: For metrics collection
2. **Grafana**: For visualization
3. **ELK Stack**: For log aggregation

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec db mysqldump -u root -p local_lab_ai > backup.sql

# Restore backup
docker-compose exec db mysql -u root -p local_lab_ai < backup.sql
```

### File Backup

```bash
# Backup application files
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/app

# Backup database volume
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-data-$(date +%Y%m%d).tar.gz -C /data .
```

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec db mysqldump -u root -p local_lab_ai > $BACKUP_DIR/db-$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /path/to/app

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## Security Considerations

### 1. SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### 3. Environment Security

- Use strong passwords
- Store secrets in environment variables
- Regularly update dependencies
- Use HTTPS in production
- Implement proper CORS policies

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database service status
   - Verify credentials in `.env`
   - Check network connectivity

2. **Ollama Service Not Available**
   - Ensure Ollama is running
   - Check model is loaded
   - Verify port configuration

3. **Frontend Not Loading**
   - Check backend API availability
   - Verify environment variables
   - Check build logs

### Debug Mode

```bash
# Run in debug mode
docker-compose up -d --backend

# View detailed logs
docker-compose logs -f backend
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
  
  frontend:
    deploy:
      replicas: 2
```

### Load Balancing

```nginx
# nginx.conf
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

location /api {
    proxy_pass http://backend;
    proxy_set_header Host $host;
}
```

## Maintenance

### Regular Tasks

1. **Update System**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. **Clean Up**
   ```bash
   docker system prune -f
   docker volume prune -f
   ```

3. **Health Check**
   ```bash
   # Monitor service health
   docker-compose ps
   docker-compose exec backend python -c "import requests; requests.get('http://localhost:8000/health')"
   ```

### Update Procedure

1. Backup current system
2. Pull latest images
3. Update environment variables if needed
4. Deploy new version
5. Monitor for issues
6. Rollback if necessary

## Support

For technical support, please contact:
- Email: support@ai-lems.com
- Documentation: https://docs.ai-lems.com
- Issue Tracker: https://github.com/cyberbount/AI-LEMS/issues