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

# Project page links
Homepage: http://localhost:5173/
Enterprise page: http://localhost:5173/enterprise
Canvas (same as ResultsPage component): http://localhost:5173/canvas
Text search: http://localhost:5173/search/text
Image search: http://localhost:5173/search/image
Results: http://localhost:5173/results
Empty results: http://localhost:5173/empty
Project detail (dynamic): http://localhost:5173/project/1 (you can swap 1 for other ids like 2, 3, etc.)