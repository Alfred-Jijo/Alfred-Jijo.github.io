let ws;
let serverBaseUrl = "";
const savedUsername = localStorage.getItem("chat_username");
const savedServer = localStorage.getItem("chat_server");

// Pre-fill inputs if we have them saved
if (savedUsername) document.getElementById("username").value = savedUsername;
if (savedServer) document.getElementById("server-url").value = savedServer;

function login() {
    const name = document.getElementById("username").value.trim();
    let server = document.getElementById("server-url").value.trim();

    if (!name || !server) return alert("Please enter both Name and Server URL");

    if (server.endsWith("/")) server = server.slice(0, -1);

    localStorage.setItem("chat_username", name);
    localStorage.setItem("chat_server", server);
    serverBaseUrl = server;

    // Switch Screens
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-screen").classList.remove("hidden-view");
    document.getElementById("app-screen").style.display = "flex";

    connect(server);
}

function connect(serverUrl) {
    // Convert https -> wss
    let wsUrl = serverUrl.replace("https://", "wss://").replace("http://", "ws://");

    ws = new WebSocket(wsUrl + "/ws");

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "log") { addLog(msg.username, msg.content); return; }
        if (msg.type === "clear") {
            document.getElementById("messages").innerHTML = "";
            addLog("SYSTEM", "Chat purged.");
            return;
        }
        renderMessage(msg);
    };

    ws.onopen = () => {
        addLog("SYSTEM", "Connected to " + serverUrl);
    };

    ws.onclose = () => {
        addLog("SYSTEM", "Disconnected. Check Server URL.");
    };
}

function renderMessage(msg) {
    const div = document.createElement("div");
    div.classList.add("message");

	div.classList.add("message");
	if (msg.type === "file") {
		div.innerHTML = `<strong>${msg.username}:</strong> <a href="${serverBaseUrl}${msg.file_url}" target="_blank">${msg.content}</a>`;
	} else {
		div.innerHTML = `<strong>${msg.username}:</strong> ${msg.content}`;
	}

    const container = document.getElementById("messages");
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addLog(prefix, content) {
    const div = document.createElement("div");
    div.classList.add("log-entry");
    div.innerHTML = `<span class="prefix">[${prefix}]</span> ${content}`;
    const container = document.getElementById("server-logs");
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById("msg-input");
    if (!input.value) return;
    ws.send(JSON.stringify({
        username: document.getElementById("username").value,
        content: input.value,
        type: "text"
    }));
    input.value = "";
}

function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", document.getElementById("username").value);

    // Use the dynamic Server URL for uploads
    fetch(serverBaseUrl + "/upload", { method: "POST", body: formData })
        .then(res => {
            if(res.ok) addLog("SYSTEM", "File sent.");
            else addLog("SYSTEM", "Upload failed.");
        })
        .catch(err => addLog("SYSTEM", "Upload Error: " + err));

    fileInput.value = "";
}

function switchTab(tabName) {
    document.getElementById("btn-chat").classList.remove("active");
    document.getElementById("btn-logs").classList.remove("active");
    document.getElementById(`btn-${tabName}`).classList.add("active");

    document.getElementById("chat-view").classList.add("hidden-view");
    document.getElementById("logs-view").classList.add("hidden-view");
    document.getElementById(`${tabName}-view`).classList.remove("hidden-view");

    const controls = document.getElementById("chat-controls");
    if (tabName === "chat") controls.style.display = "flex";
    else controls.style.display = "none";
}

document.getElementById("msg-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});
