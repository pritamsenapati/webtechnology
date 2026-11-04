from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
from dotenv import load_dotenv
import mysql.connector

app = Flask(__name__)
load_dotenv()


DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

print(f"DB_HOST: {DB_HOST}")
print(f"DB_USER: {DB_USER}")
print(f"DB_PASSWORD: {DB_PASSWORD}")
print(f"DB_NAME: {DB_NAME}")

def get_db_connection():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    print("Database connection established")
    return conn


@app.route('/')
def index():
    print("Rendering index.html")
    return render_template('index.html')

@app.route('/issue', methods=['POST'])
def issue_book():
    data = request.json
    student_id = data['studentId']
    student_name = data['studentName']
    book_id = data['bookId']
    book_name = data['bookName']

    conn = get_db_connection()
    cursor = conn.cursor()
    

    cursor.execute("SELECT * FROM Books WHERE BookId = %s AND IsAvailable = %s", (book_id, True))
    book = cursor.fetchone()
    
    if not book:
        print("Book is not available")
        return jsonify({'message': 'Book is not available'}), 404


    cursor.execute("INSERT INTO IssuedBooks (StudentId, StudentName, BookId, BookName, IssueDate) VALUES (%s, %s, %s, %s, NOW())", (student_id, 
student_name, book_id, book_name))
    conn.commit()
    

    cursor.execute("UPDATE Books SET IsAvailable = %s WHERE BookId = %s", (False, book_id))
    conn.commit()
    
    conn.close()
    
    print("Book issued successfully")
    return jsonify({'message': 'Book issued successfully'}), 200

@app.route('/return', methods=['POST'])
def return_book():
    data = request.json
    issue_id = data['issueId']

    conn = get_db_connection()
    cursor = conn.cursor()
    
 
    cursor.execute("SELECT * FROM IssuedBooks WHERE IssueId = %s", (issue_id,))
    issue_record = cursor.fetchone()
    
    if not issue_record:
        print("Issue record not found")
        return jsonify({'message': 'Issue record not found'}), 404


    cursor.execute("UPDATE Books SET IsAvailable = %s WHERE BookId = %s", (True, issue_record[2]))
    conn.commit()
    

    cursor.execute("UPDATE IssuedBooks SET ReturnDate = NOW() WHERE IssueId = %s", (issue_id,))
    conn.commit()
    
    conn.close()
    
    print("Book returned successfully")
    return jsonify({'message': 'Book returned successfully'}), 200

@app.route('/issued', methods=['GET'])
def issued_books():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM IssuedBooks")
    issued_books = cursor.fetchall()
    
    conn.close()
    
    print("Issued books retrieved")
    return jsonify(issued_books)

if __name__ == '__main__':
    print("Starting Flask application")
    app.run(debug=True)