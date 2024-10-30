const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;
const agent = new https.Agent({ rejectUnauthorized: false });

app.get('/search/:domainToSearch', async (req, res) => {
    const domainToSearch = req.params.domainToSearch;
    try {
        const initialResponse = await axios.get('https://trustpositif.kominfo.go.id/', {
            httpsAgent: agent,
            timeout: 10000,
        });
        const $ = cheerio.load(initialResponse.data);
        const csrfToken = $('meta[name="csrf-token"]').attr('content');
        console.log(`CSRF Token: ${csrfToken}`);
        const submitData = {
            csrf_token: csrfToken,
            recaptcha_token: '',
            domains: domainToSearch,
        };
        console.log(`Searching for domain: ${domainToSearch}`);
        const submitResponse = await axios.get('https://trustpositif.kominfo.go.id/welcome', {
            httpsAgent: agent,
            params: submitData,
            timeout: 10000,
        });
        const responseHtml = cheerio.load(submitResponse.data);
        const results = [];
        responseHtml('#daftar-block tbody tr').each((index, element) => {
            const domain = responseHtml(element).find('td').eq(0).text().trim();
            const status = responseHtml(element).find('td').eq(1).text().trim();
            results.push({ domain, status });
        });
        console.log('Search Results:', results);
        res.json(results);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});