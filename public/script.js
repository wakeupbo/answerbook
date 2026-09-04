/**
 * 答案之书 - 前端脚本
 * 1. 星空背景生成
 * 2. 书本翻页动画（仅结果页执行）
 */

(function () {
    'use strict';

    /* ===== 星空生成 ===== */
    function createStars() {
        var holder = document.getElementById('stars');
        if (!holder) return;
        var count = window.innerWidth < 540 ? 50 : 90;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < count; i++) {
            var s = document.createElement('span');
            s.className = 'star';
            var size = Math.random() * 2 + 1;
            s.style.width = size + 'px';
            s.style.height = size + 'px';
            s.style.left = Math.random() * 100 + '%';
            s.style.top = Math.random() * 100 + '%';
            s.style.animationDelay = Math.random() * 3 + 's';
            s.style.animationDuration = (2 + Math.random() * 3) + 's';
            frag.appendChild(s);
        }
        holder.appendChild(frag);
    }

    /* ===== 翻页动画（仅当结果页存在时执行） ===== */
    function runBookAnimation() {
        var book = document.getElementById('book');
        if (!book) return;

        var pagesHolder = document.getElementById('pages');
        var answerPage = document.getElementById('answerPage');
        var cover = document.getElementById('bookCover');
        if (!pagesHolder || !answerPage) return;

        // 创建翻动页（初始在右半边，绕书脊翻到左半边）
        var pageCount = 5;
        var leaves = [];
        for (var i = 0; i < pageCount; i++) {
            var leaf = document.createElement('div');
            leaf.className = 'page-leaf';
            leaf.style.zIndex = '20'; // 翻动中统一高层
            pagesHolder.appendChild(leaf);
            leaves.push(leaf);
        }

        book.classList.add('flipping');

        // 时序参数
        var t0 = 350;                // 初始停留，让用户看清封面
        var coverOverlap = 750;      // 封面翻到一半时开始翻第一张，衔接更流畅
        var perPageDelay = 620;      // 相邻翻动页错峰（小于单页时长，形成重叠）
        var pageFlipTime = 1150;     // 单页翻转时长（与 CSS transition 一致）

        // 1. 打开封面
        setTimeout(function () {
            if (cover) cover.classList.add('opened');
            // 封面翻开后降低层级，让翻动页能盖在封面背面之上
            setTimeout(function () {
                if (cover) cover.style.zIndex = '1';
            }, 1500);
        }, t0);

        // 2. 依次翻动每一页（封面翻到一半时启动，自然衔接）
        leaves.forEach(function (leaf, idx) {
            var startAt = t0 + coverOverlap + idx * perPageDelay;
            setTimeout(function () {
                leaf.classList.add('flipped');
                // 翻过后调整层级：已翻页在左侧堆叠，后翻的在上（z 递增）
                setTimeout(function () {
                    leaf.style.zIndex = String(5 + idx);
                }, pageFlipTime * 0.65);
            }, startAt);
        });

        // 3. 揭示答案页（最后一页翻完之后）
        var lastStart = t0 + coverOverlap + (pageCount - 1) * perPageDelay;
        var revealAt = lastStart + pageFlipTime + 250;
        setTimeout(function () {
            answerPage.classList.add('show');
            book.classList.remove('flipping');
        }, revealAt);
    }

    /* ===== 启动 ===== */
    function init() {
        createStars();
        runBookAnimation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
