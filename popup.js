document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var currentTab = tabs[0];
        var actionButton = document.getElementById('actionButton');
        var downloadCsvButton = document.getElementById('downloadCsvButton');
        var resultsTable = document.getElementById('resultsTable');
        var filenameInput = document.getElementById('filenameInput');

        if (currentTab && currentTab.url.includes("://www.google.com/maps/search")) {
            document.getElementById('message').textContent = "Fetch those leads!";
            actionButton.disabled = false;
            actionButton.classList.add('enabled');
        } else {
            var messageElement = document.getElementById('message');
            messageElement.innerHTML = '';
            var linkElement = document.createElement('a');
            linkElement.href = 'https://www.google.com/maps/search/';
            linkElement.textContent = "Go to Google Maps Search.";
            linkElement.target = '_blank'; 
            messageElement.appendChild(linkElement);

            actionButton.style.display = 'none'; 
            downloadCsvButton.style.display = 'none';
            filenameInput.style.display = 'none'; 
        }

        actionButton.addEventListener('click', function() {
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                function: scrapeData
            }, function(results) {
                while (resultsTable.firstChild) {
                    resultsTable.removeChild(resultsTable.firstChild);
                }

                // Define and add headers to the table
                const headers = ['Title', 'Rating', 'Reviews', 'Phone', 'Industry', 'Address', 'Website', 'Google Maps Link'];
                const headerRow = document.createElement('tr');
                headers.forEach(headerText => {
                    const header = document.createElement('th');
                    header.textContent = headerText;
                    headerRow.appendChild(header);
                });
                resultsTable.appendChild(headerRow);

                // Add new results to the table
                if (!results || !results[0] || !results[0].result) return;
                results[0].result.forEach(function(item) {
                    var row = document.createElement('tr');
                    ['title', 'rating', 'reviewCount', 'phone', 'industry', 'address', 'companyUrl', 'href'].forEach(function(key) {
                        var cell = document.createElement('td');
                        
                        if (key === 'reviewCount' && item[key]) {
                            item[key] = item[key].replace(/\(|\)/g, ''); 
                        }
                        
                        cell.textContent = item[key] || ''; 
                        row.appendChild(cell);
                    });
                    resultsTable.appendChild(row);
                });

                if (results && results[0] && results[0].result && results[0].result.length > 0) {
                    downloadCsvButton.disabled = false;
                }
            });
        });

        downloadCsvButton.addEventListener('click', function() {
            var csv = tableToCsv(resultsTable); 
            var filename = filenameInput.value.trim();
            if (!filename) {
                filename = 'google-maps-data.csv'; 
            } else {
                filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.csv';
            }
            downloadCsv(csv, filename); 
        });

    });
});


async function scrapeData() {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const randomDelay = () => Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;

    let results = [];
    let seen = new Set();
    const scrollContainer = document.querySelector('.m6QErb[aria-label]');
    if (!scrollContainer) return [];

    let lastHeight = 0;
    let sameHeightCount = 0; // to detect stuck scroll

    while (true) {
        // Scrape visible items
        let links = Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place"]'));
        for (let link of links) {
            if (seen.has(link.href)) continue;
            seen.add(link.href);

            let container = link.closest('[jsaction*="mouseover:pane"]');
            if (!container) continue;

            let titleText = container.querySelector('.fontHeadlineSmall')?.textContent || '';
            let rating = '';
            let reviewCount = '';
            let phone = '';
            let industry = '';
            let address = '';
            let companyUrl = '';

            // Extract rating & reviews
            let roleImgContainer = container.querySelector('[role="img"]');
            if (roleImgContainer) {
                let ariaLabel = roleImgContainer.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes("stars")) {
                    let parts = ariaLabel.split(' ');
                    rating = parts[0];
                    reviewCount = '(' + parts[2] + ')'; 
                }
            }

            // Extract phone
            let phoneRegex = /(?:\+91|91|0)?[-\s]?[1-9](?:\d[-\s]?){9}/;
            let phoneMatch = container.textContent.match(phoneRegex);
            phone = phoneMatch ? phoneMatch[0] : '';

            // Extract company website
            let allLinks = Array.from(container.querySelectorAll('a[href]'));
            let filteredLinks = allLinks.filter(a => !a.href.startsWith("https://www.google.com/maps/place/"));
            if (filteredLinks.length > 0) {
                companyUrl = filteredLinks[0].href;
            }

            results.push({
                title: titleText,
                rating,
                reviewCount,
                phone,
                industry,
                address,
                companyUrl,
                href: link.href
            });

            // tiny jitter between scraping individual items. This is being done to mimin more human like behaviour.
            await delay(Math.floor(Math.random() * 200) + 100); 
        }

        // Scroll down
        scrollContainer.scrollBy(0, scrollContainer.scrollHeight);
        await delay(randomDelay());

        // Detect end of results
        let newHeight = scrollContainer.scrollHeight;
        if (newHeight === lastHeight) {
            sameHeightCount++;
        } else {
            sameHeightCount = 0;
        }

        if (sameHeightCount >= 2) {
            console.log("Reached end of results");
            break;
        }

        lastHeight = newHeight;

        // Also check if Google explicitly shows end message
        if (document.querySelector('div[role="status"]')?.textContent.includes("You've reached the end")) {
            break;
        }
    }

    return results;
}

// Convert the table to a CSV string
function tableToCsv(table) {
    var csv = [];
    var rows = table.querySelectorAll('tr');
    
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (var j = 0; j < cols.length; j++) {
            row.push('"' + cols[j].innerText + '"');
        }
        csv.push(row.join(','));
    }
    return csv.join('\n');
}

// Download the CSV file
function downloadCsv(csv, filename) {
    var csvFile;
    var downloadLink;

    csvFile = new Blob([csv], {type: 'text/csv'});
    downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
}