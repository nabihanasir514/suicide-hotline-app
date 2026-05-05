# HopeConnect: Deployment Documentation

This document provides a comprehensive overview of the HopeConnect platform, its architecture, and the steps required to deploy it in a production-grade environment.

---

## 1. Application Overview
**What it does**: HopeConnect is a real-time peer support platform that allows users to share anonymous stories and receive AI-monitored mental health support.
**Problem it solves**: It bridges the gap between isolation and professional help by providing a safe, anonymous community space with immediate access to emergency resources.
**Target Users**: Students, university staff, and anyone experiencing emotional distress or loneliness.

### API Endpoints
| Method | URL | Purpose | Example Response |
| :--- | :--- | :--- | :--- |
| GET | `/health` | System health check | `{"status": "ok"}` |
| POST | `/api/posts` | Submit anonymous story | `{"status": "Success"}` |
| POST | `/api/apply` | Apply as a helper | `{"status": "Success"}` |
| GET | `/api/resources/helplines` | Get emergency numbers | `{"pakistan": [...], "global": [...]}` |

---

## 2. Architecture Diagram
The following ASCII diagram illustrates the data flow and system components:

```text
[ Browser ] --(HTTP/Port 5000)--> [ AWS EC2 Server (t3.micro, Mumbai) ]
                                           |
                                 [ Docker Container ]
                                           |
                                    [ Flask App ]
                                           |
                                 [ SQLite Database ]
```

---

## 3. Tools and Technologies
| Tool | Description |
| :--- | :--- |
| **Linux (Ubuntu 24.04 LTS)** | The reliable open-source OS used to host our EC2 production server. |
| **Python 3.11** | The core programming language used for backend logic and AI analysis. |
| **Flask** | A lightweight web framework used to build our RESTful API endpoints. |
| **Git** | Used for version control and collaborating on the source code. |
| **Docker** | Used to containerize the application for consistent behavior across all environments. |
| **GitHub Actions** | Automated our CI/CD pipeline to test and build code on every push. |
| **AWS EC2 (t3.micro)** | Provided the scalable cloud infrastructure for global hosting. |

---

## 4. Local Setup Instructions
To run this project on your own machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/nabihanasir514/suicide-hotline-app.git
    cd suicide-hotline-app
    ```
2.  **Initialize Database**:
    ```bash
    python init_db.py
    ```
3.  **Build with Docker**:
    ```bash
    docker build -t hotline-app:v1 .
    ```
4.  **Run the Container**:
    ```bash
    docker run -d -p 5000:5000 --name my-app hotline-app:v1
    ```
5.  **Access the App**: Open your browser and navigate to `http://localhost:5000`.

---

## 5. CI/CD Pipeline Explanation
Our GitHub Actions workflow is triggered on every **push** to the `main` branch.
*   **Job 1 (Test)**: Installs Python dependencies and runs `pytest`. If any test fails, the pipeline stops immediately to prevent broken code from being built.
*   **Job 2 (Build-Docker)**: Only runs if tests pass. It builds the Docker image and performs a **Health Check** by starting a temporary container and verifying the `/health` endpoint.

---

## 6. AWS Deployment Steps
The application is deployed on an **AWS EC2 t3.micro** instance running **Ubuntu 24.04 LTS** in the **Asia Pacific (Mumbai) ap-south-1** region.

### 6.1 EC2 Instance Details
| Property | Value |
| :--- | :--- |
| **Instance ID** | i-0ca77d7c5c7f50871 |
| **Instance Type** | t3.micro (Free Tier Eligible) |
| **Region** | ap-south-1 (Mumbai) |
| **Public IP** | 13.234.226.40 |
| **Public DNS** | ec2-65-2-30-184.ap-south-1.compute.amazonaws.com |
| **OS** | Ubuntu 24.04 LTS |

### 6.2 Security Group Configuration
| Protocol | Port | Source | Purpose |
| :--- | :--- | :--- | :--- |
| TCP | 22 | 0.0.0.0/0 | SSH access for server management |
| TCP | 80 | 0.0.0.0/0 | Standard HTTP web traffic |
| TCP | 5000 | 0.0.0.0/0 | Flask application port |

### 6.3 Deployment Commands
Commands run on the EC2 server to set up and deploy the application:

```bash
# Step 1: Update the server
sudo apt update && sudo apt upgrade -y

# Step 2: Install Docker
sudo apt install docker.io -y

# Step 3: Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Step 4: Pull and run the Docker container
sudo docker run -d -p 5000:5000 --name production-app --restart=always bihamalik/hotline-app:v1
```

### 6.4 Live Application URLs
| Page | URL |
| :--- | :--- |
| **Home** | http://13.234.226.40:5000/ |
| **Health Check** | http://13.234.226.40:5000/health |
| **Seeker Portal** | http://13.234.226.40:5000/seeker |
| **Volunteer Portal** | http://13.234.226.40:5000/volunteer |
| **Resources** | http://13.234.226.40:5000/resources |
| **Admin Panel** | http://13.234.226.40:5000/admin |

---

## 7. Testing Evidence
*   **Pytest Results**: All 4 tests passing (Health, Resources, AI Detection, 400 Errors).
*   **GitHub Actions**: Both "Run Pytest" and "Build Docker Image" jobs showing green checkmarks.
*   **Live App**: Responding at `http://13.234.226.40:5000/health` with `{"status": "ok"}`.

---

## 8. Challenges and Solutions
1.  **Challenge**: The AI detection wasn't triggering for certain variations of crisis words.
    *   **Solution**: Implemented a weighted lexicon scoring system in Python that aggregates risk points instead of simple matching.
2.  **Challenge**: Docker container would stop if the app crashed at night.
    *   **Solution**: Implemented the `--restart=always` flag in the deployment command to ensure the container self-heals.
3.  **Challenge**: AWS Security Group was blocking SSH connections on Port 22.
    *   **Solution**: Added a custom inbound rule to the Security Group to allow TCP traffic on Port 22 from `0.0.0.0/0`.

---

## 9. Lessons Learned
1.  The importance of **Container Health Checks** in a CI/CD pipeline to verify runtime stability.
2.  How to use **SQLite** as a portable, persistent database within a Docker environment.
3.  The critical role of **CORS** in allowing a frontend to communicate with a remote Flask API.
4.  How to design a **Sentiment Engine** that balances user privacy with urgent crisis intervention.
5.  The importance of correctly configuring **AWS Security Groups** to allow the right ports for both SSH management and application traffic.
