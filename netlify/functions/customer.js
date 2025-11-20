// File: netlify/functions/customer.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    const email = event.queryStringParameters?.email;

    if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
    }

    const caCert = fs.readFileSync(path.resolve(__dirname, 'ca.pem'));
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

        // CHANGED: Querying 'customer_data' instead of 'customers'
        // Also formatting the date to be more readable
        const [rows] = await connection.execute(
            "SELECT first_name, last_name, email, customer_segment, lifetime_value, status, DATE_FORMAT(registration_date, '%Y-%m-%d') as registration_date FROM customer_data WHERE email = ?",
                                                [email.toLowerCase()]
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows[0] || null)
        };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lookup failed' }) };
    } finally {
        if (connection) await connection.end();
    }
};
