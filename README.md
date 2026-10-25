# ReleaseBoard — Release Checklist

ReleaseBoard is a full-stack web application for managing software releases, tracking checklist progress, and storing release notes.

## Live Demo

- **Frontend:** https://release-checklist-black.vercel.app/
- **GraphQL API:** https://release-checklist-1-4rqm.onrender.com/graphql
- **GitHub Repository:** https://github.com/vicky848/release-checklist

## Features

- Create releases with a name, date, and additional information.
- View all releases and their current status.
- Track progress across eight checklist steps per release.
- Mark checklist steps as completed or incomplete.
- Update additional release information.
- Delete releases.
- Store release and checklist data in PostgreSQL.
- Access backend operations through a GraphQL API.

## Tech Stack

**Frontend**
- React
- Vite
- CSS

**Backend**
- Node.js
- Express
- Apollo Server
- GraphQL

**Database and Deployment**
- PostgreSQL (Neon)
- Render (backend)
- Vercel (frontend)

## Project Structure

```text
release-checklist/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── db.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── docker-compose.yaml
├── .gitignore
└── README.md
```

## Run Locally

### Prerequisites

- Node.js and npm
- A PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/vicky848/release-checklist.git
cd release-checklist
```

### 2. Configure the backend

Create a `.env` file inside the `backend` directory:

```env
PORT=4000
DATABASE_URL=your_postgresql_connection_string
```

Replace the placeholder with your PostgreSQL connection string. Do not commit secrets or `.env` files to GitHub.

### 3. Start the backend

```bash
cd backend
npm install
npm start
```

The GraphQL endpoint will be available at:

`http://localhost:4000/graphql`

### 4. Configure the frontend

Create a `.env` file inside `frontend`:

```env
VITE_API_URL=http://localhost:4000/graphql
```

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite in your terminal.

## GraphQL API

The API supports these operations:

**Queries**
- `releases` — retrieve all releases.
- `release(id)` — retrieve a release by ID.

**Mutations**
- `createRelease` — create a release.
- `updateStep` — update checklist completion.
- `updateAdditionalInfo` — update release notes.
- `deleteRelease` — delete a release.

## Testing

The backend includes Jest tests. Run them from the backend directory:

```bash
npm test
```

## Deployment

- The React frontend is deployed on Vercel.
- The Express and GraphQL backend is deployed on Render.
- PostgreSQL data is stored using Neon.
- The frontend uses the `VITE_API_URL` environment variable to communicate with the backend.

## Author

Vicky Kumar Chowrasia
