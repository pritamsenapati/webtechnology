function validateForm() {
    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    const bookId = document.getElementById('bookId').value;
    const bookName = document.getElementById('bookName').value;

    if (!studentId || !studentName || !bookId || !bookName) {
        alert('All fields are required');
        return false;
    }

    return true;
}
function issueBook() {
    if (!validateForm()) return;

    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    const bookId = document.getElementById('bookId').value;
    const bookName = document.getElementById('bookName').value;

    fetch('/issue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId, studentName, bookId, bookName })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('studentId').value = '';
        document.getElementById('studentName').value = '';
        document.getElementById('bookId').value = '';
        document.getElementById('bookName').value = '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to issue book');
    });
}

function returnBook() {
    const issueId = document.getElementById('issueId').value;

    if (!issueId) {
        alert('Issue ID is required');
        return;
    }

    fetch('/return', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ issueId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('issueId').value = '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to return book');
    });
}