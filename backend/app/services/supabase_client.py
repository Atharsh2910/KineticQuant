from supabase import create_client, Client
from app.config import settings

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_SERVICE_KEY

supabase: Client = create_client(url, key)

