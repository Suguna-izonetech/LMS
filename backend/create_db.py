import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    # Connect to the default 'postgres' database to create the new one
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="1234",
        dbname="postgres",
        port=5432
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database already exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'izone_lms'")
    exists = cursor.fetchone()
    
    if not exists:
        print("Database 'izone_lms' does not exist. Creating...")
        cursor.execute("CREATE DATABASE izone_lms")
        print("Database 'izone_lms' created successfully.")
    else:
        print("Database 'izone_lms' already exists.")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    create_database()
