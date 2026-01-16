// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-06kUut1K8pyozRnPKcewxzc1VzcsdN0",
    authDomain: "lyrics-840cc.firebaseapp.com",
    projectId: "lyrics-840cc",
    storageBucket: "lyrics-840cc.firebasestorage.app",
    messagingSenderId: "601157650076",
    appId: "1:601157650076:web:6f0c1f09eebd850b0b0f59",
    measurementId: "G-5496QS24N9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const songsCollection = collection(db, "songs");

// --- Admin Logic ---
const AdminApp = {
    songs: [],
    theme: localStorage.getItem('theme') || 'dark',

    init() {
        console.log("Admin App Initializing...");
        // Apply Initial Theme
        document.documentElement.setAttribute('data-theme', this.theme);
        this.setupThemeToggle();

        this.loadSongs();
        this.setupListeners();
    },

    loadSongs() {
        const q = query(songsCollection);
        onSnapshot(q, (snapshot) => {
            console.log("Admin Panel: Firebase Connected! Songs found:", snapshot.size);

            this.songs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderDashboard();
            this.renderSongsTable();
        }, (error) => {
            console.error("Error loading songs:", error);
            showToast("Error connecting to database.");
        });
    },

    setupThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.theme = this.theme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', this.theme);
                localStorage.setItem('theme', this.theme);
            });
        }
    },

    async addSong(songData) {
        console.log("Attempting to add song:", songData);
        try {
            const docRef = await addDoc(songsCollection, {
                ...songData,
                createdAt: Date.now()
            });
            console.log("Document written with ID: ", docRef.id);
            showToast("Song added successfully!");
            // Switch back to songs list logic if needed
            if (window.showSection) window.showSection('songs');
        } catch (e) {
            console.error("Error adding document: ", e);
            // Alert the user with the specific error to help debug
            alert("Error publishing song:\n" + e.message + "\n\nMake sure you enabled 'Test Mode' in Firebase Rules!");
            showToast("Failed to add song.");
        }
    },

    async deleteSong(id) {
        if (!confirm("Are you sure you want to delete this song?")) return;
        try {
            await deleteDoc(doc(db, "songs", id));
            showToast("Song deleted.");
        } catch (e) {
            console.error("Error deleting song:", e);
            showToast("Failed to delete song.");
        }
    },

    renderDashboard() {
        document.getElementById('stat-total-songs').textContent = this.songs.length;
    },

    renderSongsTable() {
        const tbody = document.getElementById('admin-songs-table');
        tbody.innerHTML = '';

        if (this.songs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No songs found.</td></tr>';
            return;
        }

        this.songs.forEach(song => {
            const tr = document.createElement('tr');
            const date = song.createdAt ? new Date(song.createdAt).toLocaleDateString() : 'N/A';

            tr.innerHTML = `
                <td><strong>${song.title}</strong></td>
                <td>${song.artist}</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn" onclick="alert('Edit feature coming soon!')">Edit</button>
                    <button class="action-btn delete-btn" data-id="${song.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bind delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.deleteSong(id);
            });
        });
    },

    setupListeners() {
        // Add Song Form
        const form = document.getElementById('admin-add-song-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('title').value;
                const artist = document.getElementById('artist').value;
                const art = document.getElementById('album-art').value;
                const lyrics_en = document.getElementById('lyrics_en').value;
                const lyrics_te = document.getElementById('lyrics_te').value;

                this.addSong({
                    title, artist, art,
                    lyrics: { en: lyrics_en, te: lyrics_te }
                });
                e.target.reset();
            });
        }

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('isAuthenticated');
            window.location.href = 'index.html';
        });
    }
};

// Utils
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Global scope access for some if needed (though avoiding if possible, module scope is safer)
// But 'showSection' is defined in HTML script tag.

AdminApp.init();
