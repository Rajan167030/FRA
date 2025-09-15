# 🌳 Forest Rights Atlas & Decision Support System (FRA-Connect)

<div align="center">
  
![FRA-Connect](https://img.shields.io/badge/FRA-Connect-green?style=for-the-badge) 
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-5.x-47A248?style=for-the-badge&logo=mongodb)

</div>

<div align="center">
  <img src="https://via.placeholder.com/1200x400/0D47A1/FFFFFF?text=FRA-Connect:+Forest+Rights+Atlas" alt="FRA-Connect Banner" width="900px" />
  <p><em>Empowering tribal communities through digital forest rights management</em></p>
</div>

## 📋 Overview

**FRA-Connect** is a comprehensive solution for managing, monitoring, and enhancing the implementation of the **Forest Rights Act (FRA) 2006** through digital governance. This platform bridges the gap between tribal communities and government authorities by providing an intuitive, transparent, and efficient system for processing forest rights claims.

### 🌟 Key Benefits

- **Enhanced Transparency**: Real-time tracking of claim status for all stakeholders
- **Increased Efficiency**: Reduction in processing time from months to weeks
- **Digital Inclusion**: Accessible interface designed for tribal communities
- **Data-Driven Decisions**: Comprehensive analytics for policy makers
- **Scheme Integration**: Seamless connection with other government welfare programs

## 📑 Table of Contents

- [📋 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
  - [📋 Prerequisites](#-prerequisites)
  - [⚙️ Installation](#️-installation)
  - [🔐 Environment Variables](#-environment-variables)
- [💻 Development](#-development)
  - [🔧 Backend Setup](#-backend-setup)
  - [🎨 Frontend Setup](#-frontend-setup)
- [📚 API Documentation](#-api-documentation)
- [👥 User Roles & Access Control](#-user-roles--access-control)
- [📁 Project Structure](#-project-structure)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Support & Contact](#-support--contact)

## ✨ Features

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <img src="https://via.placeholder.com/150/2E7D32/FFFFFF?text=Atlas" width="100px" /><br />
        <b>🗺️ Forest Rights Atlas</b>
      </td>
      <td align="center" width="33%">
        <img src="https://via.placeholder.com/150/1565C0/FFFFFF?text=Claims" width="100px" /><br />
        <b>📝 Case Management</b>
      </td>
      <td align="center" width="33%">
        <img src="https://via.placeholder.com/150/6A1B9A/FFFFFF?text=OCR" width="100px" /><br />
        <b>🔍 OCR Processing</b>
      </td>
    </tr>
  </table>
</div>

### 🗺️ Forest Rights Atlas
Advanced geospatial mapping platform featuring:
- Interactive visualization of tribal lands and forest boundaries
- Satellite imagery integration with historical comparison
- GPS-based field verification tools for officials
- Overlap analysis with protected areas and reserve forests

### 📝 Case Management System
End-to-end tracking system for forest rights claims:
- Digital application forms with offline capability
- Automated workflow management across multiple departments
- Document repository with version control
- Timeline visualization for each claim's journey

### 🔍 OCR Document Processing
Intelligent document processing system:
- Automated extraction from handwritten applications
- Multi-language support for tribal dialects
- Document validation and error correction
- Integration with digital signature verification

### 📊 Real-time Analytics
Comprehensive dashboards for monitoring implementation:
- District and state-level performance metrics
- Claim processing time analytics
- Approval/rejection rate analysis
- Predictive models for resource allocation

### 🔄 Scheme Integration
Seamless connection with government welfare schemes:
- Automatic eligibility verification for MGNREGA, PM-KISAN
- Benefits tracking and notification system
- Integrated financial assistance application process
- Cross-scheme data synchronization

### 👥 Role-based Access Control
Tailored interfaces for different stakeholders:
- Custom dashboards for officials at various levels
- Hierarchical permission system
- Audit trails for all administrative actions
- Multi-factor authentication for sensitive operations

### 📱 Mobile Responsive Design
Accessible interface across devices:
- Progressive Web App capabilities
- Offline-first approach for remote area usage
- Low-bandwidth optimized interface
- Voice-assisted navigation for improved accessibility

## 🏗️ System Architecture

FRA-Connect implements a modern, scalable architecture designed for government-scale operations and security.

<div align="center">
  <img src="https://via.placeholder.com/800x400/ECEFF1/263238?text=FRA-Connect+Architecture+Diagram" alt="System Architecture Diagram" width="700px" />
</div>

### Three-Tier Architecture

#### 🖥️ Frontend (Presentation Layer)
- **React.js** with Tailwind CSS for responsive and accessible interfaces
- Component-based architecture with shadcn/ui for consistent design
- Client-side state management with context API
- Progressive Web App capabilities for offline functionality

#### ⚙️ Backend (Application Layer)
- **FastAPI** for high-performance, asynchronous API development
- JWT-based authentication and authorization
- Modular service architecture for maintainability
- Comprehensive request validation with Pydantic
- Asynchronous task processing for long-running operations

#### 🗄️ Database (Data Layer)
- **MongoDB** for flexible document storage and geospatial capabilities
- Geospatial indexing for efficient location-based queries
- Sharding strategy for horizontal scaling
- Regular automated backups with point-in-time recovery

### Integration Architecture

The system seamlessly integrates with multiple external services:

- **Geospatial Services**: Integration with Bhuvan, Forest Survey of India APIs
- **OCR & ML Pipeline**: Custom OCR processing pipeline for document digitization
- **Government Scheme APIs**: Secure API connections with MGNREGA, PM-KISAN
- **SMS/Email Gateway**: For notifications and alerts to beneficiaries
- **Payment Gateway**: For scheme disbursement tracking

## 🛠️ Technology Stack

<div align="center">
  <table>
    <tr>
      <th>Frontend</th>
      <th>Backend</th>
      <th>Database</th>
      <th>DevOps</th>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /><br />
        <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /><br />
        <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" /><br />
        <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
      </td>
      <td>
        <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /><br />
        <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /><br />
        <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT" /><br />
        <img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic" />
      </td>
      <td>
        <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /><br />
        <img src="https://img.shields.io/badge/Motor-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="Motor" /><br />
        <img src="https://img.shields.io/badge/GeoJSON-323330?style=for-the-badge&logo=json&logoColor=white" alt="GeoJSON" />
      </td>
      <td>
        <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /><br />
        <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions" /><br />
        <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
      </td>
    </tr>
  </table>
</div>

### 🎨 Frontend Technologies
- **React.js**: Component-based UI library for building interactive interfaces
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: High-quality reusable component system
- **React Router**: Client-side routing for single-page application
- **Axios**: Promise-based HTTP client for API requests
- **Lucide React**: Beautiful, consistent icon set
- **React Hook Form**: Performant, flexible forms with easy validation
- **next-themes**: Theme management for light/dark mode support

### ⚙️ Backend Technologies
- **FastAPI**: Modern, high-performance web framework for building APIs
- **Python 3.9+**: Latest language features for robust development
- **Motor**: Asynchronous MongoDB driver for Python
- **Pydantic**: Data validation and settings management
- **JWT**: Secure authentication with JSON Web Tokens
- **CORS Middleware**: Cross-Origin Resource Sharing support
- **Uvicorn**: ASGI server for Python web applications

### 🗄️ Database Technologies
- **MongoDB**: NoSQL database with excellent geospatial capabilities
- **Geospatial Indexes**: Fast spatial queries for mapping features
- **Aggregation Pipeline**: Advanced data processing and analytics

### 🔧 DevOps & Infrastructure
- **Docker**: Containerization for consistent environments
- **Docker Compose**: Multi-container deployment management
- **GitHub Actions**: CI/CD pipeline automation
- **Nginx**: High-performance web server and reverse proxy
- **Certbot**: Automated SSL certificate management

## 🚀 Getting Started

<div align="center">
  <img src="https://via.placeholder.com/800x250/E3F2FD/0D47A1?text=Getting+Started+with+FRA-Connect" alt="Getting Started" width="700px" />
</div>

### 📋 Prerequisites

Before setting up FRA-Connect, ensure your system meets the following requirements:

| Requirement | Version | Description |
|-------------|---------|-------------|
| Node.js     | v16+    | JavaScript runtime for building the frontend |
| Python      | v3.9+   | Programming language for the backend |
| MongoDB     | v5+     | NoSQL database for storing application data |
| Git         | Latest  | Version control system |
| Docker      | Latest  | *(Optional)* For containerized deployment |

### ⚙️ Installation

Follow these steps to get FRA-Connect up and running on your local development environment:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Rajan167030/FRA.git
   cd FRA
   ```

2. **Set up project structure:**

   ```bash
   # Create any necessary directories
   mkdir -p backend/logs frontend/public/uploads
   ```

3. **Install dependencies for frontend and backend:**

   ```bash
   # Frontend dependencies
   cd frontend
   npm install
   
   # Backend dependencies
   cd ../backend
   pip install -r requirements.txt
   ```

### 🔐 Environment Variables

Create `.env` files in both the frontend and backend directories with the following configurations:

<details>
<summary><b>Backend Environment Variables (.env)</b></summary>

```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=fra_db

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

# API Configuration
API_PREFIX=/api
DEBUG=True
ENVIRONMENT=development

# External Services (Optional)
OCR_API_KEY=your_ocr_api_key
GEOSPATIAL_API_URL=https://example.com/geo-api
SMS_GATEWAY_KEY=your_sms_gateway_key
```
</details>

<details>
<summary><b>Frontend Environment Variables (.env)</b></summary>

```env
# API Configuration
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_MAPS=true
REACT_APP_ENABLE_OCR=true

# Analytics (Optional)
REACT_APP_ANALYTICS_ID=your_analytics_id

# Theme Configuration
REACT_APP_DEFAULT_THEME=light
```
</details>

## 💻 Development

<div align="center">
  <img src="https://via.placeholder.com/800x200/E8F5E9/2E7D32?text=Development+Workflow" alt="Development Workflow" width="700px" />
</div>

### 🔧 Backend Setup

Follow these steps to set up and run the FastAPI backend server:

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the development server with auto-reload
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Development Features:**
- Auto-reload on code changes
- Interactive API documentation at `/docs`
- Detailed error messages and stack traces
- Debug mode with enhanced logging

### 🎨 Frontend Setup

Follow these steps to set up and run the React frontend development server:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at `http://localhost:3000`.

**Development Features:**
- Hot Module Replacement for instant UI updates
- ESLint integration for code quality
- React DevTools compatibility
- Network request inspection

### 📱 Mobile Development

For testing the responsive design on mobile devices:

1. Ensure your development machine and mobile device are on the same network
2. Find your development machine's IP address (e.g., 192.168.1.100)
3. Access the application from your mobile device at `http://192.168.1.100:3000`

### 🧪 Testing

```bash
# Run backend tests
cd backend
pytest

# Run frontend tests
cd frontend
npm test
```

## API Documentation

Once the backend server is running, API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Key API endpoints:

- `/api/dashboard/stats` - Dashboard statistics
- `/api/villages` - Village management
- `/api/claims` - Forest claims management

## User Roles

FRA-Connect supports multiple user roles:

- **Admin**: System management, user administration
- **Forest Official**: Claim verification, field inspection
- **Revenue Official**: Land record verification
- **Tribal Department**: Application processing, beneficiary support
- **District Collector**: Approval authority
- **Data Analyst**: Analytics and reporting access

## Project Structure

```
FRA/
│
├── backend/                # FastAPI backend
│   ├── requirements.txt    # Python dependencies
│   └── server.py           # Main API server
│
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── auth/           # Authentication logic
│       ├── components/     # React components
│       │   └── ui/         # UI components
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utility functions
│
└── tests/                  # Test suite
```

## Deployment

### Production Build

For frontend:

```bash
cd frontend
npm run build
```

For backend:

```bash
cd backend
pip install gunicorn
gunicorn -k uvicorn.workers.UvicornWorker server:app
```

### Docker Deployment

A Docker Compose configuration is available for containerized deployment:

```bash
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions to FRA-Connect! Your involvement helps improve this platform for tribal communities across India.

<div align="center">
  <img src="https://via.placeholder.com/800x200/E8EAF6/3F51B5?text=Join+Our+Community" alt="Contributing" width="700px" />
</div>

### Contribution Guidelines

1. **Fork the repository** to your GitHub account
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**, following our coding standards
4. **Add tests** for your changes when applicable
5. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request** with a detailed description of your changes

### Development Standards

- Follow the existing code style and formatting
- Write clear, documented, and maintainable code
- Include appropriate tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting a pull request

### Issue Reporting

Found a bug or have a feature request? Please [open an issue](https://github.com/Rajan167030/FRA/issues/new/choose) using one of our templates:

- 🐞 **Bug Report**: Describe the issue, steps to reproduce, and expected behavior
- ✨ **Feature Request**: Explain the new feature and its potential benefits
- 📝 **Documentation Improvement**: Suggest improvements to our documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 FRA-Connect Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support & Contact

Need help with FRA-Connect? Contact us through any of these channels:

- **Email**: [support@fra-connect.gov.in](mailto:support@fra-connect.gov.in)
- **Phone**: +91-11-XXXXXXXX (Mon-Fri, 9:00 AM - 5:00 PM IST)
- **GitHub Issues**: For technical questions and bug reports

---

<div align="center">
  <p>Developed with ❤️ for India's Tribal Communities</p>
  <p>FRA-Connect Team © 2025</p>
  <p>
    <img src="https://via.placeholder.com/40/FFF/000?text=GOI" alt="Government of India" />
    &nbsp;&nbsp;
    <small>A Digital India Initiative</small>
    &nbsp;&nbsp;
    <img src="https://via.placeholder.com/40/FFF/000?text=MTA" alt="Ministry of Tribal Affairs" />
  </p>
</div>## 🌐 Deployment

FRA-Connect supports multiple deployment options to suit different infrastructure requirements, from simple production builds to containerized deployments.

<div align="center">
  <img src="https://via.placeholder.com/800x300/FFEBEE/C62828?text=Deployment+Options" alt="Deployment Options" width="700px" />
</div>

### 🚀 Production Build

#### Frontend Deployment

Build an optimized production version of the React application:

```bash
cd frontend

# Install dependencies
npm ci --production

# Build for production
npm run build

# The build artifacts will be in the 'build' directory
# Ready to be served by a web server like Nginx or Apache
```

#### Backend Deployment

Set up the FastAPI backend for production:

```bash
cd backend

# Install production dependencies
pip install -r requirements.txt gunicorn uvicorn

# Run with Gunicorn for better performance
gunicorn -k uvicorn.workers.UvicornWorker \
         --workers 4 \
         --bind 0.0.0.0:8000 \
         --log-level warning \
         server:app
```

### 🐳 Docker Deployment

For containerized deployment using Docker and Docker Compose:

```bash
# Build and start all services
docker-compose up -d --build

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The Docker Compose configuration includes:
- Frontend container with Nginx
- Backend container with Gunicorn+Uvicorn
- MongoDB container with persistent volume
- Automated SSL certificate setup with Let's Encrypt

### ☁️ Cloud Deployment

FRA-Connect can be deployed to various cloud platforms:

<details>
<summary><b>AWS Deployment</b></summary>

1. **EC2 Instances**:
   - t3.medium for backend (2 vCPU, 4GB RAM)
   - t3.small for frontend (2 vCPU, 2GB RAM)

2. **MongoDB Atlas** for database:
   - M10 cluster with 3 nodes for high availability

3. **Load Balancing**:
   - Application Load Balancer for the backend
   - CloudFront for frontend static assets

4. **CI/CD**:
   - AWS CodePipeline connected to GitHub repository
</details>

<details>
<summary><b>Azure Deployment</b></summary>

1. **Azure App Service**:
   - Standard S1 tier for backend
   - Standard S1 tier for frontend

2. **Azure Cosmos DB** with MongoDB API:
   - Standard tier with 400 RUs

3. **Azure DevOps**:
   - CI/CD pipelines for automated deployment
</details>

### 🔒 Security Considerations

- All production deployments use HTTPS with TLS 1.2+
- API keys and secrets are stored in environment variables
- Regular security updates are applied to all dependencies
- Database access is restricted to application servers only
