import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor


# ==========================================
# DATABASE CONFIGURATION
# ==========================================

DATABASE_URL = os.getenv("DATABASE_URL")

SQLITE_DATABASE = "vigil.db"


# ==========================================
# GET DATABASE CONNECTION
# ==========================================

def get_connection():

    # --------------------------------------
    # DEPLOYMENT → SUPABASE POSTGRESQL
    # --------------------------------------

    if DATABASE_URL:

        return psycopg2.connect(
            DATABASE_URL,
            sslmode="require"
        )

    # --------------------------------------
    # LOCAL DEVELOPMENT → SQLITE
    # --------------------------------------

    connection = sqlite3.connect(
        SQLITE_DATABASE
    )

    connection.row_factory = sqlite3.Row

    return connection


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def init_database():

    connection = get_connection()
    cursor = connection.cursor()

    if DATABASE_URL:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decision_history (

                id BIGSERIAL PRIMARY KEY,

                location TEXT NOT NULL,

                risk INTEGER,

                recommendation TEXT,

                active_sensitivity TEXT,

                weather_source TEXT,

                wind DOUBLE PRECISION,

                rain DOUBLE PRECISION,

                humidity DOUBLE PRECISION,

                timestamp TEXT NOT NULL

            )
        """)

    else:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decision_history (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                location TEXT NOT NULL,

                risk INTEGER,

                recommendation TEXT,

                active_sensitivity TEXT,

                weather_source TEXT,

                wind REAL,

                rain REAL,

                humidity REAL,

                timestamp TEXT NOT NULL

            )
        """)

    connection.commit()
    connection.close()


# ==========================================
# SAVE DECISION
# ==========================================

def save_decision(decision):

    connection = get_connection()

    if DATABASE_URL:

        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO decision_history (
                location,
                risk,
                recommendation,
                active_sensitivity,
                weather_source,
                wind,
                rain,
                humidity,
                timestamp
            )

            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)

            RETURNING id
        """, (
            decision["location"],
            decision["risk"],
            decision["recommendation"],
            decision["active_sensitivity"],
            decision["weather_source"],
            decision["wind"],
            decision["rain"],
            decision["humidity"],
            decision["timestamp"]
        ))

        new_id = cursor.fetchone()[0]

    else:

        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO decision_history (
                location,
                risk,
                recommendation,
                active_sensitivity,
                weather_source,
                wind,
                rain,
                humidity,
                timestamp
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            decision["location"],
            decision["risk"],
            decision["recommendation"],
            decision["active_sensitivity"],
            decision["weather_source"],
            decision["wind"],
            decision["rain"],
            decision["humidity"],
            decision["timestamp"]
        ))

        new_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return new_id


# ==========================================
# GET ALL HISTORY
# ==========================================

def get_all_history():

    connection = get_connection()

    if DATABASE_URL:

        cursor = connection.cursor(
            cursor_factory=RealDictCursor
        )

        cursor.execute("""
            SELECT
                id,
                location,
                risk,
                recommendation,
                active_sensitivity,
                weather_source,
                wind,
                rain,
                humidity,
                timestamp

            FROM decision_history

            ORDER BY id DESC
        """)

        rows = cursor.fetchall()

        history = [
            dict(row)
            for row in rows
        ]

    else:

        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id,
                location,
                risk,
                recommendation,
                active_sensitivity,
                weather_source,
                wind,
                rain,
                humidity,
                timestamp

            FROM decision_history

            ORDER BY id DESC
        """)

        rows = cursor.fetchall()

        history = [
            dict(row)
            for row in rows
        ]

    connection.close()

    return history


# ==========================================
# DELETE ONE HISTORY RECORD
# ==========================================

def delete_history(history_id):

    connection = get_connection()

    cursor = connection.cursor()

    if DATABASE_URL:

        cursor.execute("""
            DELETE FROM decision_history
            WHERE id = %s
        """, (history_id,))

    else:

        cursor.execute("""
            DELETE FROM decision_history
            WHERE id = ?
        """, (history_id,))

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    return deleted > 0


# ==========================================
# DELETE ALL HISTORY
# ==========================================

def clear_all_history():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM decision_history
    """)

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    return deleted