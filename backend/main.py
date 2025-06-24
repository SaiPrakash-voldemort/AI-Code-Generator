from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import subprocess
from google import generativeai as genai  # ✅ correct import

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Correct Gemini client setup
genai.configure(api_key="AIzaSyA2WdMoDZD05CQciBv1D43mk-soCU6k48Q")
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            response = await get_gemini_response(data)
            await websocket.send_text(response)
        except Exception as e:
            await websocket.send_text(f"Error: {str(e)}")
            break

async def get_gemini_response(prompt: str) -> str:
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error generating response: {str(e)}"

@app.get("/run")
def run_command():
    result = subprocess.run(["ls"], stdout=subprocess.PIPE)
    return {"output": result.stdout.decode()}
