import './style.css';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

function loadDefaultContent(attempt = 0) {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  appContainer.innerHTML = '<p>loading...</p>';

  fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (!data || data.title === undefined || data.explanation === undefined) {
        if (attempt < 3) {
          setTimeout(() => loadDefaultContent(attempt + 1), 2000);
        } else {
          appContainer.innerHTML = '<p>Could not load today\'s astronomy picture. Try again later.</p>';
        }
        return;
      }

      let media;
      if (data.media_type === 'image') {
        media = `<img src="${data.url}" alt="${data.title}" />`;
      } else {
        media = `<video src="${data.url}" controls></video>`;
      }

      appContainer.innerHTML = `
        <h1>${data.title}</h1>
        ${media}
        <p>${data.explanation}</p>
      `;
    })
    .catch(err => {
      if (attempt < 3) {
        setTimeout(() => loadDefaultContent(attempt + 1), 2000);
      } else {
        appContainer.innerHTML = `<p>Error: ${err.message}</p>`;
      }
    });
}

document.addEventListener('DOMContentLoaded', () => {
  loadDefaultContent();

  const form = document.getElementById('smart-search-form');
  const input = document.getElementById('search-input');
  const clearBtn = document.querySelector('.clear-btn');
  const voiceBtn = document.querySelector('.voice-btn');
  const defaultBox = document.getElementById('default-content-box');
  const resultsContainer = document.getElementById('results-container');

  if (!form || !input || !defaultBox || !resultsContainer) {
    return;
  }

  input.addEventListener('input', () => {
    if (clearBtn) {
      clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();

      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';

      defaultBox.style.display = 'block';
      loadDefaultContent();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();

    if (!query) return;

    const isURL = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(query);

    if (isURL) {
      const url = query.startsWith('http') ? query : `https://${query}`;
      window.location.href = url;
    } else {
      defaultBox.style.display = 'none';
      resultsContainer.style.display = 'flex';
      resultsContainer.innerHTML = '<div class="result-glass-box"><p>Searching...</p></div>';
      resultsContainer.scrollTop = 0;

      try {
        const response = await fetch(`https://cosmospark-backend.onrender.com/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        renderResults(data.results);
      } catch (error) {
        resultsContainer.innerHTML = '<div class="result-glass-box"><p>Failed to load search results. Ensure the backend server is running.</p></div>';
      }
    }
  });

  function renderResults(results) {
    if (!results || results.length === 0) {
      resultsContainer.innerHTML = '<div class="result-glass-box"><p>No results found.</p></div>';
      return;
    }

    resultsContainer.innerHTML = results.map(r => `
      <div class="result-glass-box">
        <a href="${r.url}" target="_blank" class="result-title">${r.title}</a>
        <p class="result-snippet">${r.snippet}</p>
      </div>
    `).join('');
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Voice search is not supported in your browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      voiceBtn.style.color = '#e74c3c';
      voiceBtn.style.transform = 'scale(1.1)';

      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        if (clearBtn) clearBtn.style.display = 'flex';
        form.requestSubmit();
      };

      recognition.onerror = () => {
        alert('Voice recognition failed.');
      };

      recognition.onend = () => {
        voiceBtn.style.color = '';
        voiceBtn.style.transform = '';
      };
    });
  }
});