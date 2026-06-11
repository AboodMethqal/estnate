const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
};

http.createServer((req, res) => {
    if (req.url.startsWith('/placeholder/')) {
        const parts = req.url.replace('/placeholder/', '').split('/');
        const w = parseInt(parts[0]) || 600;
        const h = parseInt(parts[1]) || 400;
        const bg = parts[2] || '0F5132';
        const text = parts[3] ? decodeURIComponent(parts[3]) : '';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#${bg}"/>
                    <stop offset="100%" style="stop-color:#0a3d26"/>
                </linearGradient>
            </defs>
            <rect width="${w}" height="${h}" fill="url(#g)"/>
            <rect width="${w}" height="${h}" fill="rgba(212,175,55,0.05)"/>
            <g transform="translate(${w/2},${h/2})">
                <rect x="-40" y="-40" width="80" height="80" rx="12" fill="rgba(212,175,55,0.2)"/>
                <text x="0" y="10" text-anchor="middle" fill="#D4AF37" font-size="32" font-family="Arial">&#9962;</text>
            </g>
            ${text ? `<text x="${w/2}" y="${h-30}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="16" font-family="sans-serif">${text}</text>` : ''}
        </svg>`;

        res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
        res.end(svg);
        return;
    }

    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - الصفحة غير موجودة</h1>');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Placeholder images: http://localhost:${PORT}/placeholder/600/400/0F5132`);
});
