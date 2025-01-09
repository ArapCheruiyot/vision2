const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let CLIENT_ID = '';
let API_KEY = '';
let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.display = 'block';
    }
}

function handleAuthClick() {
    tokenClient.callback = (resp) => {
        if (resp.error) throw resp;
        document.getElementById('authorize_button').style.display = 'none';
        document.getElementById('signout_button').style.display = 'block';
        document.getElementById('uploadSection').classList.remove('hidden');
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    document.getElementById('signout_button').style.display = 'none';
    document.getElementById('authorize_button').style.display = 'block';
    document.getElementById('uploadSection').classList.add('hidden');
}

function handleFileSelection() {
    const files = document.getElementById('file_input').files;
    const fileList = document.getElementById('file_list');
    fileList.innerHTML = '';
    for (let file of files) {
        const listItem = document.createElement('li');
        listItem.textContent = file.name;
        fileList.appendChild(listItem);
    }
}

async function uploadFiles() {
    const files = document.getElementById('file_input').files;
    for (let file of files) {
        const metadata = { name: file.name, mimeType: file.type };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
            body: formData,
        });

        if (response.ok) {
            alert(`Uploaded: ${file.name}`);
        } else {
            alert(`Failed: ${file.name}`);
        }
    }
}

async function listFiles() {
    const response = await gapi.client.drive.files.list({ pageSize: 10, fields: 'files(id, name)' });
    const files = response.result.files;
    const downloadList = document.getElementById('download_list');
    downloadList.innerHTML = '';
    if (!files || files.length === 0) {
        downloadList.innerHTML = '<li>No files found.</li>';
        return;
    }
    files.forEach(file => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${file.name} <a href="https://drive.google.com/uc?id=${file.id}" target="_blank">Download</a>`;
        downloadList.appendChild(listItem);
    });
}

function setCredentials() {
    CLIENT_ID = document.getElementById('clientId').value;
    API_KEY = document.getElementById('apiKey').value;
    initializeGapiClient();
}
