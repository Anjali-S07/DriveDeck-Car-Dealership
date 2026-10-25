# DriveDeck — Car Dealership Inventory System

A full-stack TDD kata implementation: FastAPI REST API, persistent SQLite database, JWT authentication, React single-page frontend, and pytest tests.

## Features
- User registration and login; passwords are hashed and API sessions use JWT bearer tokens.
- Authenticated users can list, search, filter, and purchase vehicles.
- Administrator-only add, edit, delete, and restock operations.
- Each vehicle has a unique database ID, make, model, category, price, and quantity.
- Purchase is rejected when stock is zero; quantity is decremented after a successful purchase.
- Responsive React UI with Tailwind CSS configuration, dashboard, filters, and admin forms.
- Test suite for authentication, access control, CRUD basics, and inventory purchasing.

## Requirements
- Python 3.10+
- Node.js 20+ and npm
- Git

## Run locally
### 1. Start the backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API: http://127.0.0.1:8000 · Interactive API docs: http://127.0.0.1:8000/docs

The SQLite database is created as `backend/dealership.db` when the API starts. Set `DATABASE_URL` to use another persistent database. For production, set a strong random `JWT_SECRET_KEY`; do not use the development default.

### 2. Start the frontend (second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (normally http://localhost:5173). To point the frontend to another backend, create `frontend/.env` with `VITE_API_URL=http://127.0.0.1:8000/api`.

### 3. Create an administrator
For safety, public registration creates a normal customer account. After registering the first account, stop the backend and run the following from `backend` with the virtual environment active:
```bash
python -c "from app.database import SessionLocal; from app.models import User; db=SessionLocal(); u=db.query(User).filter_by(email='YOUR_EMAIL_HERE').first(); u.is_admin=True; db.commit(); db.close(); print('Admin enabled')"
```
Replace `YOUR_EMAIL_HERE` with the registered email, restart the backend, then sign in again. In a production application, replace this manual bootstrap with a secure admin provisioning command or role-management workflow.

## Run tests
From `backend` with the virtual environment active:
```bash
pytest -q
```
The tests use a separate SQLite test database. Record the actual output in `TEST_REPORT.md` after running them in your environment; do not claim tests passed until you have run them.

## API endpoint summary
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create customer account |
| POST | `/api/auth/login` | Public | Receive JWT token |
| GET | `/api/vehicles` | Logged in | List all vehicles |
| GET | `/api/vehicles/search` | Logged in | Filter by make, model, category, min/max price |
| POST | `/api/vehicles` | Admin | Add vehicle |
| PUT | `/api/vehicles/{id}` | Admin | Update vehicle |
| DELETE | `/api/vehicles/{id}` | Admin | Delete vehicle |
| POST | `/api/vehicles/{id}/purchase` | Logged in | Purchase one unit; reduce stock |
| POST | `/api/vehicles/{id}/restock?amount=3` | Admin | Increase stock |
| GET | `/api/health` | Public | Health check |

## TDD workflow
For each feature, write a failing test first (Red), implement the smallest code change to pass it (Green), and refactor while keeping tests green. Use focused commits, for example:
```bash
git add backend/tests/test_auth.py
git commit -m "test: define registration and login behavior"
git add backend/app
 git commit -m "feat: implement token-based authentication"
```
Keep test and implementation commits truthful to the work actually done. The supplied tests are a starting suite; add tests for invalid input, update/delete behavior, search filters, expired tokens, and concurrent purchases before submission.

## Design and security notes
- SQLite is persistent storage, not an in-memory database.
- The default JWT secret is for local development only.
- Public registration deliberately cannot set `is_admin`.
- Before production use, configure secrets, CORS, HTTPS, logging, migrations, rate limiting, and stronger transaction/concurrency handling. Review price and currency presentation for your intended locale.
- The frontend search bar currently submits the text as a make filter; if you want a combined make/model search, add a dedicated `q` parameter to the API and test it.

## Screenshots
After running the app, add screenshots of registration/login, inventory, filters, purchase/zero-stock behavior, and administrator CRUD to `docs/screenshots/` and reference them here.

## My AI Usage
See [`MY_AI_USAGE.md`](MY_AI_USAGE.md) for a transparent summary of AI assistance, verification responsibilities, and limitations.

## Raw AI chat logs
See [`PROMPTS.md`](PROMPTS.md). Replace or supplement the starter prompts with the actual, unedited public chat links or raw logs required by your assignment. This file is a prompt index, not a substitute for raw logs.
