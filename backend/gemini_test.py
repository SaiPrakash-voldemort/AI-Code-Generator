
from google import genai

client = genai.Client(api_key="AIzaSyA2WdMoDZD05CQciBv1D43mk-soCU6k48Q")

response = client.models.generate_content(
    model="gemini-2.0-flash", contents="Explain how AI works in a few words"
)
print(response.text)
