# Secure File Vault - AI Coding Agent Instructions

This document provides guidance for AI coding agents working on the Secure File Vault application.

## 1. Big Picture Architecture

The application is a multi-container system managed by Docker Compose, consisting of a Laravel backend, a React frontend, an NGINX reverse proxy, and a MySQL database.

- **`docker-compose.yml`**: Defines the services. For development, it uses `-dev` Dockerfiles which mount local source code for hot-reloading.
- **NGINX (`nginx.conf`)**: Acts as a reverse proxy, directing requests to the appropriate service. It handles SSL termination.
- **Laravel Backend (`/backend`)**: A standard Laravel application serving a JSON API.
- **React Frontend (`/frontend`)**: A Create React App (CRA) application that consumes the Laravel API.
- **MySQL Database**: The primary data store.
- **File Storage**: Encrypted files are stored in a Docker volume (`vault_storage`) mounted at `backend/storage/app/files`.

## 2. Key Components & Data Flow

### Backend (`/backend`)

- **API Routes (`routes/api.php`)**: All API endpoints are defined here. Routes are grouped into public, authenticated, and admin-only.
- **Models (`app/Models`)**:
    - `User.php`: Manages users and roles (admin, staff, user). Contains authorization logic like `canAccessFile()`.
    - `File.php`: Represents uploaded files and their metadata.
    - `AuditLog.php`: Tracks significant events.
- **Encryption (`app/Services/EncryptionService.php`)**: This service is critical. It handles:
    - Generating RSA key pairs for users.
    - Generating AES keys for file encryption.
    - Encrypting/decrypting files using a hybrid approach (AES for file content, RSA for the AES key).
- **Controllers (`app/Http/Controllers`)**:
    - `FileController.php`: Manages file uploads, downloads, sharing, and deletion.
    - `AuthController.php`: Handles user registration and login.

### Frontend (`/frontend`)

- **API Interaction**: The frontend communicates with the backend via the API endpoints defined in `backend/routes/api.php`. `axios` is used for making HTTP requests. The base URL is configured in components like `src/components/FileList.js`.
- **Components (`src/components`)**: Reusable UI elements. `FileList.js` is a central component for managing files.
- **Authentication (`src/contexts/AuthContext.js`)**: Manages the authenticated user's state and JWT token.

## 3. Developer Workflows

### Getting Started

1.  **Start the environment**:
    ```bash
    docker-compose up -d --build
    ```
2.  **Run database migrations**:
    ```bash
    docker-compose exec laravel php artisan migrate
    ```

### Common Commands

- **Run Laravel tests**:
  ```bash
  docker-compose exec laravel php artisan test
  ```
- **Run frontend tests**:
  ```bash
  docker-compose exec react npm test
  ```
- **Access the Laravel container's shell**:
  ```bash
  docker-compose exec laravel bash
  ```
- **Access the React container's shell**:
  ```bash
  docker-compose exec react sh
  ```
- **View logs**:
  ```bash
  docker-compose logs -f <service_name>  # e.g., laravel, nginx
  ```

## 4. Project-Specific Conventions

- **Encryption is paramount**: Any file handling logic must go through the `EncryptionService`. Files are encrypted at rest.
- **Role-based access control**: Check the `User` model's `canAccessFile()` method for authorization logic before implementing new features related to file access.
- **API Prefix**: All API routes are prefixed with `/api`. The NGINX configuration proxies `https://localhost/api` to the Laravel container.
- **Environment Variables**: Backend configuration is managed via `.env` file inside the `backend` directory (which is not checked into git). Frontend configuration is handled by React's environment variables.
- **Error Handling**: The frontend often uses `window.alert` for displaying errors. For new features, consider a more robust notification system.
