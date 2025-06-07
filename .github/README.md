# GitHub Actions CI/CD Pipeline

This repository includes a comprehensive CI/CD pipeline that automatically builds, tests, and deploys the BDGAD Auth application.

## Pipeline Overview

The pipeline consists of three main jobs:

1. **Build and Push**: Builds the Docker image and pushes it to Docker Hub
2. **Database Operations**: Runs database migrations and initializes the system admin
3. **Deploy**: Deploys the application to your VM instance

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Docker Hub Credentials

-   `DOCKER_HUB_USERNAME`: Your Docker Hub username
-   `DOCKER_HUB_ACCESS_TOKEN`: Your Docker Hub access token (not password)

### Database Credentials

-   `DATABASE_URL`: Complete database connection string (e.g., `postgresql://user:password@host:port/database`)

### System Admin Credentials

-   `SYSTEM_ADMIN_EMAIL`: Email for the default system administrator
-   `SYSTEM_ADMIN_PASSWORD`: Password for the default system administrator

### VM Deployment Credentials

-   `VM_HOST`: IP address or hostname of your VM instance
-   `VM_USER`: Username for SSH access to the VM
-   `VM_PRIVATE_KEY`: Private SSH key for accessing the VM (entire key content)
-   `VM_ENV_PATH`: Absolute path to the environment file on the VM (e.g., `/home/user/app/.env`)

## Setup Instructions

### 1. Docker Hub Setup

1. Create a Docker Hub account if you don't have one
2. Generate an access token in Docker Hub settings
3. Add the username and access token to GitHub secrets

### 2. Database Setup

1. Ensure your database is accessible from GitHub Actions runners
2. Add all database connection details to GitHub secrets

### 3. VM Setup

1. Ensure Docker is installed on your VM
2. Create an environment file at the specified path with all required environment variables
3. Generate SSH key pair and add the public key to your VM's `~/.ssh/authorized_keys`
4. Add the private key to GitHub secrets

### 4. Environment File on VM

Create an environment file (e.g., `/home/user/app/.env`) on your VM with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Auth
AUTH_SECRET=your-nextauth-secret
AUTH_URL=http://your-domain.com

# System Admin (optional, for runtime)
SYSTEM_ADMIN_EMAIL=admin@example.com
SYSTEM_ADMIN_PASSWORD=secure-password

# Other app-specific variables
NODE_ENV=production
```

## Pipeline Triggers

The pipeline runs on:

-   Push to `main` or `master` branch (full deployment)
-   Pull requests to `main` or `master` branch (build and test only)

## Pipeline Features

-   **Multi-platform builds**: Supports both AMD64 and ARM64 architectures
-   **Docker layer caching**: Speeds up subsequent builds
-   **Zero-downtime deployment**: Gracefully stops old containers before starting new ones
-   **Health checks**: Verifies deployment success
-   **Cleanup**: Removes old Docker images to save space
-   **Detailed logging**: Provides comprehensive logs for troubleshooting

## Troubleshooting

### Common Issues

1. **Database connection fails**: Ensure your database is accessible from GitHub Actions runners
2. **SSH connection fails**: Verify VM credentials and network accessibility
3. **Docker pull fails**: Check Docker Hub credentials and image permissions
4. **Container fails to start**: Check environment file path and content on VM

### Debugging

-   Check the Actions tab in your GitHub repository for detailed logs
-   SSH into your VM to check Docker logs: `docker logs bdgad-auth`
-   Verify environment file exists and has correct permissions on VM

## Security Notes

-   Never commit secrets to your repository
-   Use GitHub's encrypted secrets for all sensitive data
-   Regularly rotate access tokens and SSH keys
-   Ensure your VM has proper firewall rules configured
