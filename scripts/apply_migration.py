import os
import psycopg
from dotenv import load_dotenv

def apply_migration():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    
    # Strip brackets from password if they exist
    db_url = db_url.replace("[", "").replace("]", "")
    
    # Connect using psycopg
    print("Connecting to database...")
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                print("Connected! Reading migration script...")
                with open("supabase/migrations/001_initial_schema.sql", "r") as f:
                    sql_script = f.read()
                
                print("Executing migration script...")
                cur.execute(sql_script)
                conn.commit()
                print("Migration applied successfully!")
    except Exception as e:
        print(f"Error applying migration: {e}")

if __name__ == "__main__":
    apply_migration()

