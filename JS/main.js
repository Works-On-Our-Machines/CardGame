import { setupBoard } from "./controllers/boardController.js";

async function loadBoardView() {
  const appContainer = document.getElementById("app");

  try {
    // 1. Request the raw HTML from board.html
    const response = await fetch("./HTML/board.html");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const boardHTML = await response.text();

    // 2. Mount the HTML directly inside #app
    appContainer.innerHTML = boardHTML;

    // 3. NOW that #deck-pile and #player-hand exist in the DOM, hook up board logic
    setupBoard();
  } catch (error) {
    console.error("Failed to load board view:", error);
  }
}

// Automatically load board view on app start
loadBoardView();
