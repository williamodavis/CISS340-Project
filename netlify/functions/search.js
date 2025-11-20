// File: netlify/functions/search.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // CHANGED: The frontend sends 'q' for query
    const searchTerm = event.queryStringParameters?.q;

    if (!searchTerm) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Search term required' }) };
    }

    const caCert = fs.readFileSync(path.resolve(process.cwd(), 'ca.pem'));
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: true, ca: caCert }
        });

        // CHANGED: Querying 'product_catalog' instead of 'products'
        const [rows] = await connection.execute(
            `SELECT product_id, product_name, category, price, stock_quantity
            FROM product_catalog
            WHERE (product_name LIKE ? OR category LIKE ?) AND status = 'Active'`,
                                                [`%${searchTerm}%`, `%${searchTerm}%`]
        );

        return { statusCode: 200, headers, body: JSON.stringify(rows) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Search failed' }) };
    } finally {
        if (connection) await connection.end();
    }
};
