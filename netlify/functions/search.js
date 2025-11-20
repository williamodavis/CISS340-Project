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
