// File: netlify/functions/products.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Read the Aiven CA certificate
    const caCert = fs.readFileSync(path.resolve(process.cwd(), 'ca.pem'));

    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                rejectUnauthorized: true,
                ca: caCert // Use the Aiven certificate
            }
        });

        // CHANGED: Querying 'product_catalog' instead of 'products'
        const [rows] = await connection.execute(
            'SELECT product_id, product_name, category, price, stock_quantity FROM product_catalog WHERE status = ?',
            ['Active']
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database connection failed', details: error.message })
        };
    } finally {
        if (connection) await connection.end();
    }
};
