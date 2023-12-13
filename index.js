module.exports = async function (context, IoTHubMessages) {
    context.log(`JavaScript eventhub trigger function for telemetry`);
    const https = require('https');
    await IoTHubMessages.forEach(async (plainMessage) => {
        
        let message = JSON.parse(plainMessage);

        context.log(`Processed message: ${plainMessage}`);

        let bucket = message.client;

        let measurement = message.concept;

        let dbBody = measurement;

        if (Object.keys(message.tags).length > 0) {
            dbBody += ','
            for (const [key, value] of Object.entries(message.tags)) {
                dbBody += `${key}=${value},`;
            }
        }
        dbBody = dbBody.slice(0, -1);
        dbBody += ' ';

        if (Object.keys(message.fields).length < 0) {
            return context.log('Error: Fields not specified');
        }
        for (const [key, value] of Object.entries(message.fields)) {
            dbBody += `${key}=${value},`;
        }
        dbBody = dbBody.slice(0, -1);

        let result = 'void';
        try {
            const request = new Promise((resolve, reject) => {

                const data = dbBody;

                const options = {
                    hostname: `westeurope-1.azure.cloud2.influxdata.com`,
                    path: `/api/v2/write?org=fernandezsobrinoangel@gmail.com&bucket=${bucket}&precision=ns`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': data.length,
                        'Authorization': 'Token ....'
                    }
                };

                const httpReq = https.request(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        resolve('Body: ', data);
                    });

                }).on("error", (err) => {
                    reject({error: "Error: ", data: err.message});
                });

                httpReq.write(data);
                httpReq.end();
            });
            result = await request;
            context.log('Success');
            context.done();
        } catch (error) {
            context.log('Error: DB access');
            context.log(error);
            context.done();
        };
    });

};