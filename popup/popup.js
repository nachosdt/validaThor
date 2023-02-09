const API_URL = "https://validator.w3.org/nu/";
let currentTab = null;
let messages = { errors: [], warnings: [], infos: [] };
let selectedTab = null;

async function validateHTML(tabUrl) {
    let url = new URL(API_URL);
    url.searchParams.append("doc", tabUrl);
    url.searchParams.append("out", "json");
    try {
        let response = await fetch(url);
        let data = await response.json();
        transformMessagesText(data.messages);
        return data;
    } catch (error) {
        return null;
    }
}

async function callback(tabs) {
    let interval = setInterval(loading, 200);
    currentTab = tabs[0].url;
    let data = await validateHTML(currentTab);
    if (!data) {
        document.querySelector("#result").style.display = "none";
        document.querySelector("#error-message").style.display = "block";
    } else {
        clearInterval(interval);
        let errors = data.messages.filter(
            (message) => message.type === "error"
        );
        let warnings = data.messages.filter(
            (message) =>
                message.type === "info" && message.subType === "warning"
        );
        let infos = data.messages.filter(
            (message) =>
                message.type === "info" && message.subType === undefined
        );
        messages.errors = errors;
        messages.warnings = warnings;
        messages.infos = infos;
        document.querySelector(".number-errors").textContent = errors.length;
        document.querySelector(".number-warnings").textContent =
            warnings.length;
        document.querySelector(".number-infos").textContent = infos.length;

        let btn = document.querySelector("#btn");
        btn.style.display = "flex";
        btn.addEventListener("click", openW3CTab);

        let sections = document.querySelectorAll("div[class^='validation']");
        sections.forEach((tab) => {
            tab.addEventListener("click", (event) => {
                let index = event.currentTarget.getAttribute("data-index");
                showMessages(+index);
            });
        });
    }
}

function loading() {
    let numbers = document.querySelectorAll("p[class^='number']");
    numbers.forEach((number) => {
        if (number.textContent.trim().length < 3) {
            number.textContent += ".";
        } else {
            number.textContent = ".";
        }
    });
}

function showMessages(index) {
    let table = document.querySelector("#messages-table");
    table.className = "";
    if (selectedTab !== index) {
        selectedTab = index;
        switch (index) {
            case 0:
                table.classList.toggle("error");
                showMessagesInTable(messages.errors);
                break;
            case 1:
                table.classList.toggle("warning");
                showMessagesInTable(messages.warnings);
                break;
            case 2:
                table.classList.toggle("info");
                showMessagesInTable(messages.infos);
                break;
            default:
                break;
        }
    } else {
        selectedTab = null;
    }
}

function showMessagesInTable(messages) {
    let rows = document.querySelector("#messages");
    rows.innerHTML = "";
    messages.forEach((message) => {
        let tr = document.createElement("tr");
        let tdMessage = document.createElement("td");
        tdMessage.innerHTML = message.message;
        let tdLine = document.createElement("td");
        tdLine.textContent = message.lastLine;
        tr.appendChild(tdLine);
        tr.appendChild(tdMessage);
        rows.appendChild(tr);
    });
}

function openW3CTab() {
    console.log("open");
    let url = new URL(API_URL);
    url.searchParams.append("doc", currentTab);
    chrome.tabs.create({ url: url.href });
}

// Turn words witn “” into span with class=code
function transformMessagesText(messages) {
    messages.forEach((message) => {
        let text = message.message;
        let regex = /“(.*?)”/g;
        let match = regex.exec(text);
        while (match) {
            let span = `<span class="code">${match[1]}</span>`;
            text = text.replace(match[0], span);
            match = regex.exec(text);
        }
        message.message = text;
    });
}

chrome.tabs.query({ active: true, currentWindow: true }, callback);
