import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    setDoc, 
    doc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyB_qaDsJY8aHpwULT5pphQ79QbbV0knO_k",
    authDomain: "alumni-association-60486.firebaseapp.com",
    projectId: "alumni-association-60486",
    storageBucket: "alumni-association-60486.appspot.com",
    messagingSenderId: "228371018445",
    appId: "1:228371018445:web:46ea6216db88631f3b6f84"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const searchType = document.getElementById('searchType');
const nameSearch = document.getElementById('nameSearch');
const yearSearch = document.getElementById('yearSearch');
const branchSearch = document.getElementById('branchSearch');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const backToDashboard = document.getElementById('backToDashboard');
const myConnectionsBtn = document.getElementById('myConnectionsBtn');

let currentUser = null;

// Show appropriate search input field based on search type selection
searchType.addEventListener('change', () => {
    nameSearch.style.display = 'none';
    yearSearch.style.display = 'none';
    branchSearch.style.display = 'none';

    if (searchType.value === 'name') nameSearch.style.display = 'block';
    if (searchType.value === 'year') yearSearch.style.display = 'block';
    if (searchType.value === 'branch') branchSearch.style.display = 'block';
});

// Search button click event
searchBtn.addEventListener('click', async () => {
    const searchTypeValue = searchType.value;
    searchResults.innerHTML = '';

    if (!searchTypeValue) {
        alert('Please select a search type');
        return;
    }

    let alumniQuery;

    if (searchTypeValue === 'name') {
        const searchName = document.getElementById('searchName').value.toLowerCase();
        if (!searchName) {
            alert('Please enter a name to search');
            return;
        }

        // Get all alumni and filter by name in JavaScript
        alumniQuery = query(collection(db, 'users'));
        try {
            const querySnapshot = await getDocs(alumniQuery);
            let foundResults = false;
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.name && userData.name.toLowerCase().includes(searchName)) {
                    displayAlumniCard(doc.id, userData);
                    foundResults = true;
                }
            });
            if (!foundResults) {
                searchResults.innerHTML = '<p>No alumni found matching your search.</p>';
            }
        } catch (error) {
            console.error('Error searching alumni:', error);
            searchResults.innerHTML = '<p>Error searching alumni. Please try again later.</p>';
        }
        return;
    }

    if (searchTypeValue === 'year') {
        const searchYear = document.getElementById('searchYear').value;
        if (!searchYear) {
            alert('Please enter a graduation year');
            return;
        }
        alumniQuery = query(collection(db, 'users'), where('gradYear', '==', searchYear));
    }

    if (searchTypeValue === 'branch') {
        const searchBranch = document.getElementById('searchBranch').value;
        if (!searchBranch) {
            alert('Please select a branch');
            return;
        }
        alumniQuery = query(collection(db, 'users'), where('department', '==', searchBranch));
    }

    try {
        const querySnapshot = await getDocs(alumniQuery);
        if (querySnapshot.empty) {
            searchResults.innerHTML = '<p>No alumni found.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                // Exclude current user from search results
                if (doc.id !== currentUser.uid) {
                    displayAlumniCard(doc.id, doc.data());
                }
            });
        }
    } catch (error) {
        console.error('Error searching alumni:', error);
        searchResults.innerHTML = '<p>Error searching alumni. Please try again later.</p>';
    }
});

// Ensure currentUser is set when a user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        alert("User not logged in. Redirecting to login page.");
        window.location.href = 'login.html';
    }
});

// Navigation Buttons
myConnectionsBtn.addEventListener('click', () => {
    window.location.href = 'connection.html';
});

backToDashboard.addEventListener('click', () => {
    window.location.href = 'login.html';
});

// Function to display an alumni card in the search results
function displayAlumniCard(docId, userData) {
    const card = document.createElement('div');
    card.className = 'alumni-card';
    
    card.innerHTML = `
        <h3>${userData.name || 'Anonymous Alumni'}</h3>
        <p>Graduation Year: ${userData.gradYear || 'N/A'}</p>
        <p>Department: ${userData.department || 'N/A'}</p>
        <button class="btn connect-btn" data-id="${docId}">Connect</button>
    `;

    card.querySelector('.connect-btn').addEventListener('click', () => sendConnectRequest(docId));
    searchResults.appendChild(card);
}

// Function to send connection request
async function sendConnectRequest(docId) {
    const currentUserId = currentUser.uid;
    const requestDocId = `${currentUserId}_${docId}`; // Unique request ID
    const requestRef = doc(db, 'connectRequests', requestDocId);
    const userRef = doc(db, 'users', currentUserId); // Reference to the sender's user document

    try {
        // Fetch sender details
        const userSnapshot = await getDoc(userRef);
        if (!userSnapshot.exists()) {
            alert("Your profile is incomplete. Please update your profile to send requests.");
            return;
        }
        const userData = userSnapshot.data();

        // Create request with sender details
        await setDoc(requestRef, {
            from: currentUserId,
            to: docId,
            status: 'pending',
            fromName: userData.name || 'Anonymous Alumni',
            fromGradYear: userData.gradYear || 'N/A',
            fromDepartment: userData.department || 'N/A',
            timestamp: new Date()
        });

        alert("Connection request sent!");
    } catch (error) {
        console.error("Error sending request:", error);
        alert("Failed to send request. Please try again.");
    }
}