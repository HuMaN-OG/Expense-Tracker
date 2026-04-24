const CONFIG = {
    // When running locally, it uses localhost. 
    // When deployed, it will use your production URL.
    API_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : 'https://expense-tracker-me8g.onrender.com/api'
};

window.CONFIG = CONFIG;
