/**
 * 答案之书 - 数据库初始化脚本
 * 运行：node init-db.js
 * 创建数据库 answer_book 与表 user_questions（字段：id 序号 + detail 详情）
 */

const mysql = require('mysql2/promise');
const config = require('./config');

(async () => {
    let conn;
    try {
        // 不指定 database，先连接 MySQL
        conn = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password
        });

        // 创建数据库
        await conn.query(
            `CREATE DATABASE IF NOT EXISTS \`${config.database}\`
             DEFAULT CHARACTER SET ${config.charset}`
        );
        console.log(`✓ 数据库 [${config.database}] 创建成功或已存在`);

        // 切换数据库
        await conn.query(`USE \`${config.database}\``);

        // 创建表
        await conn.query(
            `CREATE TABLE IF NOT EXISTS \`${config.table}\` (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '序号',
                detail TEXT NOT NULL COMMENT '详情'
            ) ENGINE=InnoDB DEFAULT CHARSET=${config.charset}`
        );
        console.log(`✓ 数据表 [${config.table}] 创建成功或已存在`);
        console.log('');
        console.log('========================================');
        console.log('  初始化完成！');
        console.log('  现在可以运行: node server.js');
        console.log('========================================');
    } catch (e) {
        console.error('✗ 初始化失败：', e.message);
        console.error('');
        console.error('请检查：');
        console.error('  1. MySQL 是否已启动（当前 MySQL80 服务需在运行）');
        console.error(`  2. config.js 中的密码是否正确（当前为: ${config.password}）`);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
})();
