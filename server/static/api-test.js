document.addEventListener('DOMContentLoaded', function() {
    const citySelect = document.getElementById('cityId');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const sendButton = document.getElementById('sendRequest');
    const resetButton = document.getElementById('resetForm');
    const loadingIndicator = document.getElementById('loading');
    const requestUrlDiv = document.getElementById('requestUrl');
    const responseDiv = document.getElementById('response');
    
    // Function to format JSON nicely
    function formatJSON(json) {
        return JSON.stringify(json, null, 2);
    }
    
    // Function to make API requests
    async function makeRequest(url) {
        loadingIndicator.style.display = 'block';
        requestUrlDiv.textContent = url;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            responseDiv.textContent = formatJSON(data);
        } catch (error) {
            responseDiv.textContent = `Error: ${error.message}`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Load cities on page load
    async function loadCities() {
        loadingIndicator.style.display = 'block';
        requestUrlDiv.textContent = '/cities';
        
        try {
            const response = await fetch('/cities');
            const cities = await response.json();
            
            // Display the initial cities response
            responseDiv.textContent = formatJSON(cities);
            
            // Populate the dropdown
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.ParentId || city.cityId;
                option.textContent = city.MADINA_NAME;
                citySelect.appendChild(option);
            });
        } catch (error) {
            responseDiv.textContent = `Error loading cities: ${error.message}`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Reset form function
    function resetForm() {
        citySelect.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        requestUrlDiv.textContent = 'No request made yet';
        responseDiv.textContent = 'No response yet';
    }
    
    // Send request button click handler
    sendButton.addEventListener('click', function() {
        const cityId = citySelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Build the URL with parameters
        let url = '/prayerTimes';
        const params = [];
        
        if (cityId) {
            params.push(`cityId=${encodeURIComponent(cityId)}`);
        }
        
        if (startDate) {
            params.push(`startDate=${encodeURIComponent(startDate)}`);
        }
        
        if (endDate) {
            params.push(`endDate=${encodeURIComponent(endDate)}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        makeRequest(url);
    });
    
    // Reset button click handler
    resetButton.addEventListener('click', resetForm);
    
    // Load cities when the page loads
    loadCities();
});