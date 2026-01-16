// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-06kUut1K8pyozRnPKcewxzc1VzcsdN0",
    authDomain: "lyrics-840cc.firebaseapp.com",
    projectId: "lyrics-840cc",
    storageBucket: "lyrics-840cc.firebasestorage.app",
    messagingSenderId: "601157650076",
    appId: "1:601157650076:web:6f0c1f09eebd850b0b0f59",
    measurementId: "G-5496QS24N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const songsCollection = collection(db, "songs");

// --- State Management ---
const AppState = {
    songs: [],
    currentSong: null,
    currentLang: 'te', // Default to Telugu 'te'
    currentLang: 'te', // Default to Telugu 'te'
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
    theme: localStorage.getItem('theme') || 'dark',

    init() {
        // Apply Initial Theme
        document.documentElement.setAttribute('data-theme', this.theme);
        this.setupThemeToggle();

        // Real-time listener
        // Orders by 'createdAt' if you add that field, or just default.
        // Let's rely on default order or add a timestamp later. 
        // For now, simpler is better.
        const q = query(songsCollection);

        onSnapshot(q, (snapshot) => {
            console.log("Firebase Connected! Songs loaded:", snapshot.size);
            // Optional: Show toast only on first load if empty to confirm connection? 
            // Better to just rely on data appearing.

            this.songs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderSongs(this.songs);
        }, (error) => {
            console.error("Error getting songs: ", error);
            showToast("Error connecting to database. Check console.");
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

    async addSong(song) {
        // song object structure: { title, artist, art, lyrics: { en, te } }
        try {
            await addDoc(songsCollection, {
                ...song,
                createdAt: Date.now()
            });
            showToast("Song added to cloud successfully!");
        } catch (e) {
            console.error("Error adding document: ", e);
            showToast("Error saving song.");
        }
    },

    search(query) {
        const lowerQ = query.toLowerCase();
        const filtered = this.songs.filter(s =>
            s.title.toLowerCase().includes(lowerQ) ||
            s.artist.toLowerCase().includes(lowerQ) ||
            (s.lyrics.en && s.lyrics.en.toLowerCase().includes(lowerQ)) ||
            (s.lyrics.te && s.lyrics.te.toLowerCase().includes(lowerQ))
        );
        this.renderSongs(filtered);
    },

    renderSongs(list) {
        const container = document.getElementById('songs-grid');
        container.innerHTML = '';

        // Load current favorites
        const storedFavs = localStorage.getItem('favoriteSongs');
        const favIds = storedFavs ? JSON.parse(storedFavs) : [];

        if (list.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary); text-align:center; grid-column:1/-1; padding:40px;">No songs found.</div>';
            return;
        }

        list.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card glass-card';
            card.style.position = 'relative'; // For absolute positioning of heart

            // Check if favored
            const isFav = favIds.includes(song.id);
            const heartIcon = isFav ? '❤️' : '🤍';

            // Heart Button
            const heartBtn = document.createElement('button');
            heartBtn.innerHTML = heartIcon;
            heartBtn.className = 'fav-btn';
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
                opacity: 0.8;
            `;

            // Hover effect logic handled by CSS or inline for simplicity
            heartBtn.onmouseover = () => heartBtn.style.transform = 'scale(1.2)';
            heartBtn.onmouseout = () => heartBtn.style.transform = 'scale(1)';

            heartBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                this.toggleFavorite(song.id, heartBtn);
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
                this.currentSong = song;
                this.currentLang = 'te'; // Default to Telugu when opening
                openLyricsView(song);
            });
            container.appendChild(card);
        });
    },

    toggleFavorite(id, btn) {
        let storedFavs = localStorage.getItem('favoriteSongs');
        let favIds = storedFavs ? JSON.parse(storedFavs) : [];

        if (favIds.includes(id)) {
            // Remove
            favIds = favIds.filter(fid => fid !== id);
            btn.innerHTML = '🤍';
            showToast("Removed from favorites");
        } else {
            // Add
            favIds.push(id);
            btn.innerHTML = '❤️';
            showToast("Added to favorites");
        }
        localStorage.setItem('favoriteSongs', JSON.stringify(favIds));
    },
};

// --- DOM Elements & Events ---
// --- DOM Elements & Events ---
const searchView = document.getElementById('search-view');
const adminView = document.getElementById('admin-view');
const lyricsView = document.getElementById('lyrics-view');
// loginView removed from index.html

const searchInput = document.getElementById('search-input');
// Initial Load
AppState.init();

// Navigation/Auth Logic
// Navigation/Auth Logic
const loginBtn = document.getElementById('login-btn');
const userMenu = document.getElementById('user-menu');
const hamburgerBtn = document.getElementById('hamburger-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const menuAdminLink = document.getElementById('menu-admin-link');
const menuLogoutBtn = document.getElementById('menu-logout-btn');

const userRole = localStorage.getItem('userRole');

// UI State based on Auth
if (AppState.isAuthenticated && searchView) {
    // Hide default login button
    if (loginBtn) loginBtn.classList.add('hidden');

    // Show User Menu
    if (userMenu) {
        userMenu.classList.remove('hidden');

        // Handle Menu Toggles
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent closing immediately
                dropdownMenu.classList.toggle('hidden');
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });

        // Admin Link
        if (userRole === 'admin' && menuAdminLink) {
            menuAdminLink.classList.remove('hidden');
            menuAdminLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'adminpanel.html';
            });
        }

        // Logout Logic
        if (menuLogoutBtn) {
            menuLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    }
} else {
    // Not Authenticated
    if (loginBtn) {
        loginBtn.classList.remove('hidden');
        // Ensure defaults
        loginBtn.textContent = "Log In";
        loginBtn.href = "login.html";
        loginBtn.setAttribute('style', 'text-decoration:none;');
        loginBtn.classList.remove('btn-primary');
        loginBtn.classList.add('btn-secondary');
    }
    if (userMenu) userMenu.classList.add('hidden');
}

function handleLogout() {
    AppState.isAuthenticated = false;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    showToast("Logged out successfully");

    // Switch view if on admin page or similar, or just reload
    if (adminView && !adminView.classList.contains('hidden')) {
        switchView(searchView);
    }

    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

const backFromLyricsBtn = document.getElementById('back-from-lyrics-btn');
if (backFromLyricsBtn) {
    backFromLyricsBtn.addEventListener('click', () => {
        switchView(searchView);
        AppState.currentSong = null;
    });
}

function switchView(targetView) {
    // Filter out nulls in case we are on a page where some views don't exist
    [searchView, adminView, lyricsView].filter(Boolean).forEach(v => v.classList.add('hidden'));
    if (targetView) targetView.classList.remove('hidden');
    window.scrollTo(0, 0);
}

// Search
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        AppState.search(e.target.value);
    });
}

// Login Logic
// Login Logic removed from here as it is now in login.html

// Admin Form
// Admin Form
const addSongForm = document.getElementById('add-song-form');
if (addSongForm) {
    addSongForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const artist = document.getElementById('artist').value;
        const art = document.getElementById('album-art').value;
        const lyrics_en = document.getElementById('lyrics_en').value;
        const lyrics_te = document.getElementById('lyrics_te').value;

        AppState.addSong({
            title,
            artist,
            art,
            lyrics: {
                en: lyrics_en,
                te: lyrics_te
            }
        });

        e.target.reset();
        switchView(searchView);
    });
}

// Lyrics View Logic
const langEnBtn = document.getElementById('lang-en');
const langTeBtn = document.getElementById('lang-te');
const fpLyrics = document.getElementById('fp-lyrics');
const shareBtn = document.getElementById('share-btn');

function openLyricsView(song) {
    document.getElementById('fp-title').textContent = song.title;
    document.getElementById('fp-artist').textContent = song.artist;

    if (shareBtn) {
        // Clone/Replace to remove old listeners
        const newBtn = shareBtn.cloneNode(true);
        shareBtn.parentNode.replaceChild(newBtn, shareBtn);
        newBtn.addEventListener('click', () => handleShare(song));
    }

    updateLyricsDisplay();
    switchView(lyricsView);
}

function updateLyricsDisplay() {
    if (!AppState.currentSong) return;

    // Toggle Button Styles
    if (AppState.currentLang === 'en') {
        if (langEnBtn) langEnBtn.classList.add('active');
        if (langTeBtn) langTeBtn.classList.remove('active');
        if (fpLyrics) fpLyrics.textContent = AppState.currentSong.lyrics.en || "Lyrics not available in English.";
    } else {
        if (langTeBtn) langTeBtn.classList.add('active');
        if (langEnBtn) langEnBtn.classList.remove('active');
        if (fpLyrics) fpLyrics.textContent = AppState.currentSong.lyrics.te || "Lyrics not available in Telugu.";
    }
}

if (langEnBtn) {
    langEnBtn.addEventListener('click', () => {
        AppState.currentLang = 'en';
        updateLyricsDisplay();
    });
}

if (langTeBtn) {
    langTeBtn.addEventListener('click', () => {
        AppState.currentLang = 'te';
        updateLyricsDisplay();
    });
}

async function handleShare(song) {
    showToast("Generating image...");

    // Create hidden elements if not exist
    let captureArea = document.getElementById('share-capture-area');
    if (!captureArea) {
        captureArea = document.createElement('div');
        captureArea.id = 'share-capture-area';
        document.body.appendChild(captureArea);
    }

    const lyricsText = AppState.currentLang === 'en' ? (song.lyrics.en || "") : (song.lyrics.te || "");

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
            backgroundColor: null, // Transparent handled by CSS gradient
            scale: 2 // High Res
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

// Toast Helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
