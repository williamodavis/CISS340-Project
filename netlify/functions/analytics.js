// File: netlify/functions/analytics.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    const queryType = event.queryStringParameters?.query;
    const caCert = `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUMWeWLM4qXLYAkVGdbR8G7txt2H8wDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1ZDc3ZmMzNTYtM2RlMy00ZTU1LWEzZGQtZDEzNmRjZjk2
M2VlIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMTA0MTczMTQwWhcNMzUxMTAyMTcz
MTQwWjBAMT4wPAYDVQQDDDVkNzdmYzM1Ni0zZGUzLTRlNTUtYTNkZC1kMTM2ZGNm
OTYzZWUgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAJP4ucY/wMEr+mQ64c/LfKa7WyId7769gvTh6IJgGl8h39ybUs7S+6yp
PNmxUqkFw0pJ+/rd8s9StdFuUGusQAT1qYwHQ9Z0fcOYYl6yy6eW5vlu89UaR8lP
DiMTrDGCtAd3wcnV704AXeUMoVCPfeNommdGoyt0zYtoxZnf/XuEoCRjCehqQ9ZN
BF1Z7Lh0D/WONYhJlVoXthGK8odzVTNm4WDJk2dsB275BVWUEEjNjMQYv+R+Ovu7
EWeOT5au2cOlyTGrrgWFSOGjsjK5HvZTRmJuioeYphKcHnlKWM4/IGXVZvC4jan6
IKngDab1oVmjoOL3vquQy0xq4palYLod1QMsfHJKPnUfwCPbpEMHNg5JV94mEtLT
yGgeN/3XRYgm11o7Tfklp/oDIr4Em4haeFRs5wbeFnZiO4QSwNacylB2ke51qpeE
75OS0zSnl1V1YhkpGZm1RFCpqzRKSmLHwk5mFAMoREL77LUfRXu6UARTjwjxHmXY
/waE4boajwIDAQABo0IwQDAdBgNVHQ4EFgQUV5W91/uWcF03ZmRrvszZmE7Siaow
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBAEgCU5hIXkq8KIzBB7Na32cowTJUthT+FpTICCvtl+5PlthTd9/VOR4uf2Oq
pfD74pmAdLz2kcj4fw++l6fOhM+fGI2f+CCSHRnLglxOLtoe9y4WnsP7oMv5fQ+I
cbIfFDh2FXSKYLpIvPkBYMhIfNxt+4JBSlyjoDpY15S+7na5QJFngeX95EsvUyF5
1HkUMJ4MnyULYqreLZPSJp4aCxn85XfEemJ4pgTAwwI7P8k0miJQcEKsBYQwnMD5
VR7aQq7Fuod6YvPS0Pn2gBNul/81v1FZ4/DGootp/8CnAWq41gNAMMs4IeON5yQY
lHQA5f+7RFCfrpIzo2HHDRg8ID7ZAnVNHc0nDcebZKBQsDgDmpSm4pssOlQLOzwI
U264oy8YCRg1mHDC8zbGxHem8LCQjxV1eNjZZll8WnDc6ibo1ucE3+3Pqf0dWfn4
0b/dD2IXFi35lhPO9lGVmXzf3oBa+qh4acdycfuh4np+3FrDPijpsz+WdUo7gkUP
O/cAWQ==
-----END CERTIFICATE-----`;
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

        let query = '';

        switch(queryType) {
            case 'top-products':
                // CHANGED: Using correct table names 'product_catalog' and 'order_item_detail'
                query = `
                SELECT
                p.product_name,
                p.category,
                COUNT(DISTINCT oi.order_id) as order_count,
                ROUND(SUM(oi.line_total), 2) as revenue
                FROM product_catalog p
                JOIN order_item_detail oi ON p.product_id = oi.product_id
                GROUP BY p.product_id, p.product_name, p.category
                ORDER BY revenue DESC
                LIMIT 10
                `;
                break;

            case 'segments':
                // CHANGED: Using correct table name 'customer_data'
                query = `
                SELECT
                customer_segment,
                COUNT(*) as customer_count,
                ROUND(AVG(lifetime_value), 2) as avg_ltv,
                ROUND(SUM(lifetime_value), 2) as total_ltv
                FROM customer_data
                WHERE status = 'Active' AND customer_segment IS NOT NULL
                GROUP BY customer_segment
                ORDER BY avg_ltv DESC
                `;
                break;

            case 'revenue':
                // CHANGED: Using correct table names 'product_catalog' and 'order_item_detail'
                query = `
                SELECT
                p.category,
                SUM(oi.quantity) as units_sold,
                ROUND(SUM(oi.line_total), 2) as revenue
                FROM product_catalog p
                JOIN order_item_detail oi ON p.product_id = oi.product_id
                GROUP BY p.category
                ORDER BY revenue DESC
                `;
                break;

            case 'orders':
                // CHANGED: Using correct table name 'order_history'
                query = `
                SELECT
                order_status,
                COUNT(*) as order_count,
                ROUND(SUM(total_amount), 2) as total_value
                FROM order_history
                GROUP BY order_status
                ORDER BY order_count DESC
                `;
                break;

            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid query type' })
                };
        }

        const [rows] = await connection.execute(query);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Analytics error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Analytics query failed', details: error.message })
        };
    } finally {
        if (connection) await connection.end();
    }
};
