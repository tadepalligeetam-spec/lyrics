// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

// --- State & Logic ---
const FavState = {
    songs: [],
    favoriteIds: [],
    currentSong: null,
    currentLang: 'te',
    theme: localStorage.getItem('theme') || 'dark',

    async init() {
        // Apply Initial Theme
        document.documentElement.setAttribute('data-theme', this.theme);
        this.setupThemeToggle();

        // Load favorites from local storage
        const stored = localStorage.getItem('favoriteSongs');
        this.favoriteIds = stored ? JSON.parse(stored) : [];

        if (this.favoriteIds.length === 0) {
            this.renderEmpty();
            return;
        }

        // Fetch all songs (Optimization: In a real app with many songs, fetch only by IDs or use a structured query)
        // For now, fetching all is okay since dataset is likely small.
        try {
            const snapshot = await getDocs(songsCollection);
            const allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            this.songs = allSongs.filter(s => this.favoriteIds.includes(s.id));
            this.renderSongs();
        } catch (e) {
            console.error("Error loading songs:", e);
            document.getElementById('favorites-grid').innerHTML = '<div style="color:red">Error loading favorites.</div>';
        }
    },

    renderEmpty() {
        const container = document.getElementById('favorites-grid');
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-secondary);">
                <h2>No favorites yet</h2>
                <p>Go back and add some songs to your library!</p>
                <br>
                <a href="index.html" class="btn-primary" style="text-decoration:none;">Browse Songs</a>
            </div>
        `;
    },

    renderSongs() {
        const container = document.getElementById('favorites-grid');
        container.innerHTML = '';

        if (this.songs.length === 0) {
            this.renderEmpty();
            return;
        }

        this.songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card glass-card';

            // Heart Icon (Red because we are in favorites)
            const heartBtn = document.createElement('button');
            heartBtn.innerHTML = '❤️';
            heartBtn.className = 'fav-btn active';
            heartBtn.title = 'Remove from Favorites';
            heartBtn.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 10;
                transition: transform 0.2s;
            `;

            heartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFavorite(song.id);
            });

            const content = document.createElement('div');
            content.className = 'card-info';
            content.innerHTML = `
                <div class="card-title">${song.title}</div>
                <div class="card-artist">${song.artist}</div>
            `;

            card.appendChild(heartBtn);
            card.appendChild(content);

            card.addEventListener('click', () => {
                this.openLyrics(song);
            });
            container.appendChild(card);
        });
    },

    removeFavorite(id) {
        this.favoriteIds = this.favoriteIds.filter(fid => fid !== id);
        this.songs = this.songs.filter(s => s.id !== id);
        localStorage.setItem('favoriteSongs', JSON.stringify(this.favoriteIds));
        showToast("Removed from favorites");
        this.renderSongs();
    },

    openLyrics(song) {
        this.currentSong = song;
        const lyricsView = document.getElementById('lyrics-view');
        const favView = document.getElementById('favorites-view');

        document.getElementById('fp-title').textContent = song.title;
        document.getElementById('fp-artist').textContent = song.artist;

        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            const newBtn = shareBtn.cloneNode(true);
            shareBtn.parentNode.replaceChild(newBtn, shareBtn);
            newBtn.addEventListener('click', () => this.handleShare(song));
        }

        this.updateLyricsDisplay();

        favView.classList.add('hidden');
        lyricsView.classList.remove('hidden');
        window.scrollTo(0, 0);
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

    updateLyricsDisplay() {
        const langEnBtn = document.getElementById('lang-en');
        const langTeBtn = document.getElementById('lang-te');
        const fpLyrics = document.getElementById('fp-lyrics');

        if (this.currentLang === 'en') {
            langEnBtn.classList.add('active');
            langTeBtn.classList.remove('active');
            fpLyrics.textContent = this.currentSong.lyrics.en || "No English lyrics.";
        } else {
            langTeBtn.classList.add('active');
            langEnBtn.classList.remove('active');
            fpLyrics.textContent = this.currentSong.lyrics.te || "No Telugu lyrics.";
        }
    },

    async handleShare(song) {
        showToast("Generating image...");

        let captureArea = document.getElementById('share-capture-area');
        if (!captureArea) {
            captureArea = document.createElement('div');
            captureArea.id = 'share-capture-area';
            document.body.appendChild(captureArea);
        }

        const lyricsText = this.currentLang === 'en' ? (song.lyrics.en || "") : (song.lyrics.te || "");

        captureArea.innerHTML = `
            <div class="share-header">
                <h1>${song.title}</h1>
                <p>${song.artist}</p>
            </div>
            <div class="share-body">
                ${lyricsText.substring(0, 1500) + (lyricsText.length > 1500 ? "..." : "")}
            </div>
            <div class="share-footer">
                <div class="share-logo">
                    <span>✨</span> Lines of the Song
                </div>
                <div class="watermark-text">lines of the song</div>
            </div>
        `;

        try {
            const canvas = await html2canvas(captureArea, {
                backgroundColor: null,
                scale: 2
            });

            const link = document.createElement('a');
            link.download = `${song.title}-lyrics.png`;
            link.href = canvas.toDataURL();
            link.click();
            showToast("Image downloaded!");
        } catch (err) {
            console.error(err);
            showToast("Error generating image.");
        }
    }
};

// --- Events ---
document.addEventListener('DOMContentLoaded', () => {
    FavState.init();

    // Menu Logic
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const userMenu = document.getElementById('user-menu');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }

    const logoutBtn = document.getElementById('menu-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            window.location.href = 'index.html';
        });
    }

    // Nav
    const backBtn = document.getElementById('back-from-lyrics-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('lyrics-view').classList.add('hidden');
            document.getElementById('favorites-view').classList.remove('hidden');
        });
    }

    // Language Toggles
    document.getElementById('lang-en').addEventListener('click', () => {
        FavState.currentLang = 'en';
        FavState.updateLyricsDisplay();
    });
    document.getElementById('lang-te').addEventListener('click', () => {
        FavState.currentLang = 'te';
        FavState.updateLyricsDisplay();
    });
});

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
