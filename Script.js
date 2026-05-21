document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById('search-btn');
    const keywordInput = document.getElementById('keyword');
    const resultsList = document.getElementById('results');
    const errorMsg = document.getElementById('error-msg');
    const loading = document.getElementById('loading');

    // Функція з рекурсивними спробами (retry) 
    async function fetchWithRetry(url, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.warn(`Спроба ${i + 1} не вдалася. Чекаємо ${delay} мс...`);
                if (i === retries - 1) throw error; // Якщо це остання спроба — прокидаємо помилку далі
                await new Promise(res => setTimeout(res, delay)); // Затримка перед новою спробою
            }
        }
    }

    searchBtn.addEventListener('click', async () => {
        const keyword = keywordInput.value.trim();
        if (!keyword) return;

        // Очищаємо інтерфейс перед новим запитом
        resultsList.innerHTML = '';
        errorMsg.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            // Робимо AJAX запит до нашого локального Python-сервера [cite: 508]
            const data = await fetchWithRetry(`/api?keyword=${encodeURIComponent(keyword)}`);

            loading.classList.add('hidden');

            // Відображення результатів [cite: 509]
            if (data.results && data.results.length > 0) {
                data.results.forEach(launch => {
                    const li = document.createElement('li');
                    li.className = "p-5 border border-gray-100 rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition";

                    // Формуємо красивий блок для кожного запуску
                    const statusName = launch.status ? launch.status.name : 'Статус невідомий';
                    const provider = launch.lsp_name || 'Невідомий провайдер';

                    li.innerHTML = `
                        <h2 class="font-bold text-xl text-indigo-800 mb-2">${launch.name}</h2>
                        <p class="text-sm text-gray-700"><span class="font-semibold">Статус:</span> ${statusName}</p>
                        <p class="text-sm text-gray-700"><span class="font-semibold">Організація:</span> ${provider}</p>
                    `;
                    resultsList.appendChild(li);
                });
            } else {
                // Якщо результатів немає
                errorMsg.textContent = "За вашим запитом не знайдено жодного запуску.";
                errorMsg.classList.remove('hidden');
            }

        } catch (error) {
            // Якщо всі спроби (retry) вичерпано [cite: 512, 513]
            loading.classList.add('hidden');
            errorMsg.innerHTML = `<strong>Мережева помилка:</strong> Не вдалося отримати дані після декількох спроб. Перевірте з'єднання або спробуйте пізніше.`;
            errorMsg.classList.remove('hidden');
            console.error("Остаточна помилка запиту:", error);
        }
    });
});