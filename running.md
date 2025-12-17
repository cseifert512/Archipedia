# FOR BACKEND
#IN 1 Terminal:
cd navigator

#if venv is not yet configured
python -m venv .venv

#activate venv
.\.venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt

#Run the API
.\scripts\run_backend.ps1
#or directly
uvicorn app.main:app --reload --port 8000

#confirm it is live
#open http://localhost:8000/healthz -- it should return { "ok": true }

# then to run the frontend
cd frontend
#if dependencies are not yet installed
npm install

npm run dev