const axios = require("axios");
const functions = require('@google-cloud/functions-framework');

const JOURNEY_CUSTOMER_LOOKUP = "https://app.journeyid.io/api/system/customers/lookup?unique_id=";

/*
 * HTTP function that supports CORS requests.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
functions.http('journeyUserLookup', (req, res) => { 
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
    } else {
		let callingParty = req.body.sessionInfo.parameters["cust_phone"].substr(1); // Remove +1
		let journeyToken = req.body.sessionInfo.parameters["journeyToken"];
        journeyUserLookup(res, journeyToken, callingParty);
    }
});   

async function journeyUserLookup(res, journeyToken, callingParty) {
    res.set('Content-Type', 'application/json');

	txtResponse = "";
	let jsonResponse = {
		"fulfillment_response": {
			"messages": [{
				"text": {
					"text": [txtResponse]
				}
			}]
		},
		"session_info": {
			"parameters": {
				"journeyEmail": null,
				"journeyType": null,
				"journeyUniqueId": null,
				"journeyFirstName": null,
				"journeyLastName": null
			}
		}
	};

	let JourneyLookupURL = JOURNEY_CUSTOMER_LOOKUP + callingParty;
	let config = {
		method: 'get',
		url: JourneyLookupURL,
		headers: {
			'Authorization': `Bearer ${journeyToken}`,
			'accept': 'application/json',
			'User-Agent': 'Axios 1.1.3'
		}
	};

	try {
		const journeyCustomerLookupResponse = await axios(config);
		console.dir(journeyCustomerLookupResponse.data);
		jsonResponse.session_info.parameters.journeyEmail = journeyCustomerLookupResponse.data.email;
		jsonResponse.session_info.parameters.journeyType = journeyCustomerLookupResponse.data.type;
		jsonResponse.session_info.parameters.journeyUniqueId = journeyCustomerLookupResponse.data.uniqueId;
		jsonResponse.session_info.parameters.journeyFirstName = journeyCustomerLookupResponse.data.firstName;
		jsonResponse.session_info.parameters.journeyLastName = journeyCustomerLookupResponse.data.lastName;

		res.status(200).send(JSON.stringify(jsonResponse));
	} catch (e) {
		console.log("Journey User Lookup Failed! Exception");
		console.log(`Exception : ${e}`);
		res.status(200).send(JSON.stringify(jsonResponse));
	}
}