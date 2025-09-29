document.addEventListener('DOMContentLoaded', () => {
      const searchInput = document.getElementById('searchInput');
      const searchButton = document.getElementById('searchButton');
      const clearButton = document.getElementById('clearButton');
      const sortOrder = document.getElementById('sortOrder');
      const resultsGrid = document.getElementById('resultsGrid');
      const statusMessage = document.getElementById('statusMessage');
      const favoritesGrid = document.getElementById('favoritesGrid');
      const favoritesPlaceholder = document.getElementById('favoritesPlaceholder');
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      const bookModal = document.getElementById('bookModal');
      const modalContent = document.getElementById('modalContent');
      const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
      const downloadFavoritesBtn = document.getElementById('downloadFavoritesBtn');
      const darkModeToggle = document.getElementById('darkModeToggle');
      const moonIcon = document.getElementById('moonIcon');
      const sunIcon = document.getElementById('sunIcon');

      let favorites = JSON.parse(localStorage.getItem('bookFinderFavorites') || '[]');
      let startIndex = 0;
      let currentQuery = '';

      const fetchBooks = async () => {
        if (!currentQuery) return;

        if (startIndex === 0) {
            resultsGrid.innerHTML = '';
            statusMessage.textContent = 'Searching...';
            statusMessage.style.display = 'block';
        } else {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
        }

        const order = sortOrder.value;
        const API_URL = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(currentQuery)}&startIndex=${startIndex}&maxResults=12&orderBy=${order}`;

        try {
          const response = await fetch(API_URL);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          
          if (startIndex === 0) {
              resultsGrid.innerHTML = ''; 
          }

          if (data.items && data.items.length > 0) {
            statusMessage.style.display = 'none';
            data.items.forEach(book => renderBookCard(book, resultsGrid));
            if (data.items.length === 12) {
                loadMoreBtn.style.display = 'inline-block';
            } else {
                loadMoreBtn.style.display = 'none';
            }
          } else if (startIndex === 0) {
            statusMessage.textContent = 'No books found. Try a different search term.';
            loadMoreBtn.style.display = 'none';
          } else {
            loadMoreBtn.style.display = 'none';
          }
        } catch (error) {
          console.error('Fetch error:', error);
          statusMessage.textContent = 'Failed to fetch books. Please check your connection and try again.';
        } finally {
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.disabled = false;
        }
      };

      const renderBookCard = (book, container) => {
        const { id, volumeInfo } = book;
        const title = volumeInfo.title || 'Title not available';
        const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author';
        const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/128x192/667eea/ffffff?text=No+Image';
        const isFav = isFavorite(id);

        const card = document.createElement('div');
        card.className = 'card bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md flex flex-col';
        card.innerHTML = `
          <img src="${thumbnail}" alt="Cover of ${title}" class="w-full h-48 object-cover">
          <div class="p-4 flex flex-col flex-grow">
            <h3 class="font-bold text-md mb-2 flex-grow">${title}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">${authors}</p>
            <div class="mt-auto flex gap-2">
              <button class="details-btn w-1/2 bg-gray-200 dark:bg-gray-600 text-sm font-semibold p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" data-book-id="${id}">Details</button>
              <button class="save-btn w-1/2 ${isFav ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white text-sm font-semibold p-2 rounded transition-colors" data-book-id="${id}">${isFav ? 'Unsave' : 'Save'}</button>
            </div>
          </div>
        `;

        card.querySelector('.details-btn').addEventListener('click', () => showDetails(book));
        card.querySelector('.save-btn').addEventListener('click', (e) => toggleFavorite(book, e.target));
        
        container.appendChild(card);
      };

      const renderFavorites = () => {
        favoritesGrid.innerHTML = '';
        if (favorites.length > 0) {
            favorites.forEach(book => renderBookCard(book, favoritesGrid));
            favoritesPlaceholder.style.display = 'none';
            clearFavoritesBtn.style.display = 'inline-block';
            downloadFavoritesBtn.style.display = 'inline-block';
        } else {
            favoritesPlaceholder.style.display = 'block';
            clearFavoritesBtn.style.display = 'none';
            downloadFavoritesBtn.style.display = 'none';
        }
      };

      const showDetails = (book) => {
        const { volumeInfo } = book;
        const title = volumeInfo.title || 'No Title';
        const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown';
        const publisher = volumeInfo.publisher || 'N/A';
        const publishedDate = volumeInfo.publishedDate || 'N/A';
        const description = volumeInfo.description || 'No description available.';
        const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/128x192/667eea/ffffff?text=No+Image';
        const infoLink = volumeInfo.infoLink;

        modalContent.innerHTML = `
            <div class="p-6 flex-grow overflow-y-auto">
                <div class="flex flex-col sm:flex-row gap-6">
                    <img src="${thumbnail}" alt="Cover of ${title}" class="w-32 h-48 object-cover rounded-md shadow-lg self-center sm:self-start">
                    <div class="flex-1">
                        <h3 class="text-2xl font-bold mb-2">${title}</h3>
                        <p class="text-lg text-gray-600 dark:text-gray-300 mb-4">${authors}</p>
                        <p class="text-sm mb-1"><strong>Publisher:</strong> ${publisher}</p>
                        <p class="text-sm mb-4"><strong>Published:</strong> ${publishedDate}</p>
                    </div>
                </div>
                <p class="mt-4 text-gray-700 dark:text-gray-300">${description}</p>
            </div>
            <div class="p-4 bg-gray-100 dark:bg-gray-700 flex justify-end items-center gap-4 flex-wrap">
                ${infoLink ? `<a href="${infoLink}" target="_blank" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View on Google Books</a>` : ''}
                <button id="closeModalBtn" class="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Close</button>
            </div>
        `;
        bookModal.classList.remove('hidden');
        document.getElementById('closeModalBtn').addEventListener('click', closeModal);
      };

      const closeModal = () => {
        bookModal.classList.add('hidden');
        modalContent.innerHTML = '';
      };

      const toggleFavorite = (book, buttonElement) => {
        const index = favorites.findIndex(b => b.id === book.id);
        if (index >= 0) {
          favorites.splice(index, 1);
        } else {
          favorites.push(book);
        }
        localStorage.setItem('bookFinderFavorites', JSON.stringify(favorites));
       
        const isFav = isFavorite(book.id);
        buttonElement.textContent = isFav ? 'Unsave' : 'Save';
        buttonElement.classList.toggle('bg-red-500', isFav);
        buttonElement.classList.toggle('hover:bg-red-600', isFav);
        buttonElement.classList.toggle('bg-green-500', !isFav);
        buttonElement.classList.toggle('hover:bg-green-600', !isFav);

        renderFavorites();
      };
      
      const isFavorite = (id) => favorites.some(b => b.id === id);

      
      const handleSearch = () => {
          const query = searchInput.value.trim();
          if (!query) {
              statusMessage.textContent = 'Please enter a search term.';
              statusMessage.style.display = 'block';
              resultsGrid.innerHTML = '';
              return;
          }
          currentQuery = query;
          startIndex = 0;
          loadMoreBtn.style.display = 'none';
          fetchBooks();
      };

      const clearResults = () => {
          searchInput.value = '';
          currentQuery = '';
          resultsGrid.innerHTML = '';
          loadMoreBtn.style.display = 'none';
          statusMessage.textContent = 'Start by searching for a book.';
          statusMessage.style.display = 'block';
      };
      
      const handleClearFavorites = () => {
          if(confirm('Are you sure you want to clear all your favorites?')) {
              favorites = [];
              localStorage.removeItem('bookFinderFavorites');
              renderFavorites();
              if (currentQuery) handleSearch();
          }
      };

      const downloadFavorites = () => {
          if (favorites.length === 0) return;
          const blob = new Blob([JSON.stringify(favorites, null, 2)], {type: "application/json"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "my-favorite-books.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      };

      const applyTheme = (isDark) => {
        if(isDark) {
            document.documentElement.classList.add('dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
      };
      
      const handleThemeToggle = () => {
          const isDark = document.documentElement.classList.contains('dark');
          localStorage.setItem('bookFinderTheme', !isDark ? 'dark' : 'light');
          applyTheme(!isDark);
      };

      searchButton.addEventListener('click', handleSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
      loadMoreBtn.addEventListener('click', () => {
        startIndex += 12;
        fetchBooks();
      });
      clearButton.addEventListener('click', clearResults);
      clearFavoritesBtn.addEventListener('click', handleClearFavorites);
      downloadFavoritesBtn.addEventListener('click', downloadFavorites);
      darkModeToggle.addEventListener('click', handleThemeToggle);

      bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) closeModal();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !bookModal.classList.contains('hidden')) {
          closeModal();
        }
      });

      const savedTheme = localStorage.getItem('bookFinderTheme');
      applyTheme(savedTheme === 'dark');
      renderFavorites();
    });