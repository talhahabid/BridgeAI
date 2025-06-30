# ImmigrantJobFinder API - Production Deployment Guide

## Prerequisites

- Python 3.8+
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Environment Setup

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Configure required environment variables:**
   ```bash
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   
   # Security (REQUIRED)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # CORS (configure for your domain)
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # Optional API Keys (services will be disabled if not provided)
   GROQ_API_KEY=your-groq-api-key
   GEMINI_API_KEY=your-gemini-api-key
   HUGGINGFACE_API_TOKEN=your-huggingface-token
   RAPIDAPI_KEY=your-rapidapi-key
   ```

## Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create necessary directories:**
   ```bash
   mkdir -p resumes
   mkdir -p logs
   ```

## Production Deployment Options

### Option 1: Using start.py (Simple)

```bash
python start.py
```

### Option 2: Using uvicorn directly

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Option 3: Using Gunicorn (Recommended for production)

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 4: Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "start.py"]
```

## Security Checklist

- [ ] JWT_SECRET is set to a strong, random value
- [ ] MONGODB_URI uses proper authentication
- [ ] ALLOWED_ORIGINS is configured for your domain only
- [ ] HTTPS is enabled (use reverse proxy like nginx)
- [ ] Debug mode is disabled (DEBUG=false)
- [ ] API keys are properly secured
- [ ] File upload limits are configured
- [ ] Rate limiting is implemented (consider adding)

## Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

## Monitoring and Logging

1. **Enable logging:**
   ```bash
   # Logs will be written to stdout/stderr
   # Consider using a log management service
   ```

2. **Health check endpoint:**
   ```bash
   curl https://yourdomain.com/health
   ```

3. **Monitor key metrics:**
   - API response times
   - Error rates
   - Database connection status
   - Memory usage

## Backup Strategy

1. **Database backups:**
   - Enable MongoDB Atlas automated backups
   - Or set up regular mongodump scripts

2. **File backups:**
   - Backup the `resumes/` directory
   - Consider using cloud storage (AWS S3, Google Cloud Storage)

## Scaling Considerations

1. **Horizontal scaling:**
   - Use multiple workers/instances
   - Implement load balancing
   - Use Redis for session storage (if needed)

2. **Database scaling:**
   - Monitor MongoDB performance
   - Consider read replicas for heavy read workloads

3. **File storage:**
   - Move resume files to cloud storage
   - Implement CDN for static assets

## Troubleshooting

### Common Issues

1. **MongoDB connection failed:**
   - Check MONGODB_URI format
   - Verify network connectivity
   - Check MongoDB Atlas IP whitelist

2. **JWT errors:**
   - Ensure JWT_SECRET is set
   - Check token expiration settings

3. **CORS errors:**
   - Verify ALLOWED_ORIGINS includes your frontend domain
   - Check for trailing slashes in URLs

4. **File upload issues:**
   - Check directory permissions
   - Verify file size limits
   - Ensure disk space is available

### Logs

Check application logs for detailed error information:
```bash
tail -f logs/app.log  # If logging to file
```

## Performance Optimization

1. **Database indexes:**
   - Ensure proper indexes on frequently queried fields
   - Monitor query performance

2. **Caching:**
   - Consider implementing Redis for caching
   - Cache frequently accessed data

3. **API optimization:**
   - Implement pagination for large datasets
   - Use async operations where possible
   - Optimize database queries

## Security Best Practices

1. **Regular updates:**
   - Keep dependencies updated
   - Monitor security advisories

2. **Access control:**
   - Implement proper authentication
   - Use role-based access control if needed

3. **Data protection:**
   - Encrypt sensitive data
   - Implement proper data retention policies

4. **API security:**
   - Rate limiting
   - Input validation
   - SQL injection prevention (MongoDB is generally safe)

## Support

For issues and questions:
1. Check the logs for error details
2. Verify environment configuration
3. Test endpoints individually
4. Monitor system resources 