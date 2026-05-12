# EC2 Deployment Guide

## 1. Connecting with SSH
Replace `YOUR_PUBLIC_IP` with the Public IPv4 address from the EC2 dashboard. The default username for Ubuntu AMIs is `ubuntu`.

```bash
# Connect to your EC2 instance 
ssh -i ~/.ssh/devops-key.pem ubuntu@YOUR_PUBLIC_IP 
 
# Example: 
# ssh -i ~/.ssh/devops-key.pem ubuntu@54.123.45.67 
```
*(First connection: type 'yes' to accept the host fingerprint)*

---

## 2. Setting Up the Server
Always update the package list and upgrade installed packages on a fresh server before installing anything. This ensures you have the latest security patches.

**Run these on the EC2 instance (after SSH connection):**
```bash
sudo apt update && sudo apt upgrade -y 
 
# Verify the OS 
lsb_release -a 
 
# Check available disk and memory 
df -h 
free -h 
```

---

## 3. Install Docker on the EC2 Instance
The EC2 instance is a fresh Ubuntu server, Docker is not installed. 

**Run these on the EC2 instance:**
```bash
sudo apt install -y ca-certificates curl gnupg 
sudo install -m 0755 -d /etc/apt/keyrings 
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin 

# Add ubuntu user to the docker group so you don't need to use sudo for docker commands
sudo usermod -aG docker ubuntu 
newgrp docker 

# Verify installation
docker --version 
```

---

## 4. Transfer Project Files to the Server
You have two ways to get your Flask project onto the EC2 server. Choose one:

### Method 1: Clone from GitHub (Recommended)
**Run these on the EC2 instance:**
```bash
sudo apt install -y git 
git clone https://github.com/your-username/flask-api.git 
cd flask-api 
ls   # Verify app.py, Dockerfile, requirements.txt are present 
```

### Method 2: Copy files using scp
**Run this on your LOCAL machine, not on EC2:**
```bash
# scp = secure copy (uses SSH to transfer files) 
# -r = recursive (copy entire directory) 
scp -i ~/.ssh/devops-key.pem -r ~/devops/week5/ ubuntu@YOUR_PUBLIC_IP:~/flask-api/ 
```

---

## 5. Build and Run the Docker Container on EC2
On the EC2 instance, navigate to your project directory and build the Docker image.

**Run these on the EC2 instance:**
```bash
cd ~/flask-api 
 
# Build the Docker image 
docker build -t flask-api:v1 . 
 
# Run the container 
# -d = detached (background) 
# -p 5000:5000 = map port 5000 on the server to port 5000 in the container 
# --restart=always = restart automatically if the server reboots 
docker run -d -p 5000:5000 --restart=always --name flask-api flask-api:v1 
 
# Verify the container is running 
docker ps 
 
# Check logs
docker logs flask-api 
```

---

## 6. Testing the Deployment
Your application is now running on the internet. Test it from your local machine to confirm it is publicly accessible. 

**Run these on YOUR LOCAL MACHINE** (Replace `YOUR_PUBLIC_IP` with the EC2 public IP address):

```bash
# Test the health endpoint 
curl http://YOUR_PUBLIC_IP:5000/api/health 
 
# Test get all students 
curl http://YOUR_PUBLIC_IP:5000/api/students 
 
# Add a new student from your local machine 
curl -X POST http://YOUR_PUBLIC_IP:5000/api/students \
     -H 'Content-Type: application/json' \
     -d '{"name": "Memoona", "grade": "A"}' 
```

**Also open in your browser:**
`http://YOUR_PUBLIC_IP:5000/api/students`
