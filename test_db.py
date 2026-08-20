import psycopg2
import sys

passwords = ["1234", "", "postgres", "admin"]
for pwd in passwords:
    try:
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password=pwd,
            dbname="postgres",
            port=5432
        )
        print(f"SUCCESS: Connected with password: '{pwd}'")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"FAILED with password '{pwd}': {e}")

sys.exit(1)
