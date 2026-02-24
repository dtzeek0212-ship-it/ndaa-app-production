const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const form = new FormData();
form.append('document', fs.createReadStream('/Users/David/Desktop/NDAA/Requests/21Feb Request/ARC-Mills FY27 NDAA.pdf'));

fetch('http://localhost:3001/api/extract', {
    method: 'POST',
    body: form,
})
.then(res => res.json())
.then(json => console.log(json))
.catch(err => console.error(err));
