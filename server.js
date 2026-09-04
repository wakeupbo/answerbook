/**
 * 答案之书 - Node.js 服务器
 * 依赖：mysql2
 * 启动：node server.js  （首次启动前先 node init-db.js 初始化数据库）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');
const answers = require('./answers');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

/* ===== 工具函数 ===== */
function readPublic(file) {
    return fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function render(html, vars) {
    return html.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        vars[k] != null ? vars[k] : ''
    );
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

/* 解析页码：支持 "第3页"、"3"、"page 5" 等 */
function parsePageNumber(input) {
    const m = String(input).match(/\d+/);
    let n = m ? parseInt(m[0], 10) : 1;
    if (n < 1) n = 1;
    const total = answers.length;
    return ((n - 1) % total) + 1; // 循环页码
}

/* 保存到 MySQL（失败不影响答案展示） */
async function saveQuestion(detail) {
    try {
        const conn = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            charset: config.charset
        });
        await conn.execute(
            `INSERT INTO \`${config.table}\` (detail) VALUES (?)`,
            [detail]
        );
        await conn.end();
        return true;
    } catch (e) {
        console.error('[MySQL] 保存失败：', e.message);
        return false;
    }
}

/* 读取请求体 */
function readBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => resolve(data));
    });
}

/* ===== 路由处理 ===== */
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    // 静态资源
    if (['/style.css', '/script.js', '/favicon.ico'].includes(pathname)) {
        const filePath = path.join(PUBLIC_DIR, pathname);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(pathname);
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404); res.end('Not Found');
        }
        return;
    }

    // 首页（输入表单）
    if (req.method === 'GET' && pathname === '/') {
        const html = render(readPublic('index.html'), { ERROR_BLOCK: '' });
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(html);
        return;
    }

    // 表单提交
    if (req.method === 'POST' && pathname === '/submit') {
        const body = await readBody(req);
        const params = new URLSearchParams(body);
        const question = (params.get('question') || '').trim();
        const pageInput = (params.get('page') || '').trim();

        // 校验
        if (!question || !pageInput) {
            const err = !question ? '请输入你心里想的事情' : '请输入页码';
            const errorBlock = `<div class="alert">${escapeHtml(err)}</div>`;
            const html = render(readPublic('index.html'), { ERROR_BLOCK: errorBlock });
            res.writeHead(200, { 'Content-Type': MIME['.html'] });
            res.end(html);
            return;
        }

        const pageNum = parsePageNumber(pageInput);
        const answer = answers[pageNum - 1];
        const saved = await saveQuestion(question);

        const warnBlock = saved
            ? ''
            : '<p class="warn-tip">（数据库尚未初始化，仅展示答案，未保存到 MySQL）</p>';

        const resultHtml = render(readPublic('result.html'), {
            PAGE: escapeHtml(pageInput),
            ANSWER: escapeHtml(answer),
            WARN_BLOCK: warnBlock
        });
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(resultHtml);
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
});

server.listen(PORT, () => {
    console.log('========================================');
    console.log('  答案之书已启动');
    console.log('  访问地址: http://localhost:' + PORT);
    console.log('  停止服务: Ctrl + C');
    console.log('========================================');
});
