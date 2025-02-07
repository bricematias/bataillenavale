const socket = new WebSocket("ws://10.31.39.120:3001");
const peer = new Peer();

let connection;
let playerGrid = createGrid();
let opponentGrid = createGrid();
let playerTurn = true;

function createGrid() {
  const grid = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push({ status: 'empty', x: i, y: j });
    }
    grid.push(row);
  }
  return grid;
}

function renderGrid(grid, gridId) {
  const gridDiv = document.getElementById(gridId);
  gridDiv.innerHTML = '';
  grid.forEach(row => {
    row.forEach(cell => {
      const cellDiv = document.createElement('div');
      cellDiv.dataset.x = cell.x;
      cellDiv.dataset.y = cell.y;

      if (cell.status === 'hit') {
        cellDiv.classList.add('hit');
      } else if (cell.status === 'miss') {
        cellDiv.classList.add('miss');
      } else {
        cellDiv.classList.add('empty');
      }

      gridDiv.appendChild(cellDiv);
    });
  });
}

function attack(x, y) {
  if (opponentGrid[x][y].status === 'empty') {
    opponentGrid[x][y].status = 'miss';
    return 'manqué';
  } else {
    opponentGrid[x][y].status = 'hit';
    return 'touché';
  }
}

document.getElementById("playerGrid").addEventListener("click", (event) => {
  event.preventDefault();

  const x = event.target.dataset.x;
  const y = event.target.dataset.y;

  // Vérifie si l'élément cliqué est bien une case de la grille, si la case est vide et si c'est le tour du joueur
  if (x !== undefined && y !== undefined && playerGrid[x][y].status === 'empty' && playerTurn) {
    playerTurn = false;  // Le joueur a joué, il ne peut pas rejouer tant que l'adversaire n'a pas joué

    if (connection) {
      // Envoie l'attaque à l'adversaire
      connection.send(JSON.stringify({ type: 'move', x: parseInt(x), y: parseInt(y) }));
      playerGrid[x][y].status = 'miss'; // Exemple de mise à jour après un coup
      event.target.classList.add('clicked');
      updateGrids(); // Met à jour l'affichage de la grille
      console.log(`Attaque envoyée aux coordonnées : (${x}, ${y})`);
    }
  } else {
    console.log("Cette case a déjà été touchée ou ce n'est pas votre tour !");
  }
});

peer.on("open", (id) => {
  console.log("Mon ID PeerJS :", id);
  document.getElementById("gameStatus").innerText = `Votre ID: ${id}`;
  socket.send(JSON.stringify({ type: "register", id }));
});

document.getElementById("startGameBtn").addEventListener("click", () => {
  const opponentId = prompt("Entrez l'ID du joueur adverse :");
  if (!opponentId) {
    document.getElementById("gameStatus").innerText = "Aucun ID entré !";
    return;
  }
  document.getElementById("gameStatus").innerText = "Connexion à l'adversaire...";
  connection = peer.connect(opponentId);

  connection.on("open", () => {
    console.log("Connexion établie avec l'adversaire !");
    document.getElementById("gameStatus").innerText = "Partie en cours...";
    connection.send(JSON.stringify({ type: "message", text: "Début de la partie !" }));
  });

  connection.on("data", (data) => {
    const message = JSON.parse(data);
    console.log("Données reçues :", message);
    if (message.type === "move") {
      document.getElementById("gameStatus").innerText = `L'autre joueur a joué : (${message.x}, ${message.y})`;

      if (playerGrid[message.x][message.y].status === 'empty') {
        const result = attack(message.x, message.y);
        connection.send(JSON.stringify({ type: "move", result, x: message.x, y: message.y }));
      }
      updateGrids();
      playerTurn = true;
    } else if (message.type === "message") {
      console.log("Message reçu :", message.text);
    }
  });
});

peer.on("connection", (conn) => {
  connection = conn;

  connection.on("data", (data) => {
    const message = JSON.parse(data);
    console.log("Données reçues :", message);
    if (message.type === "move") {
      document.getElementById("gameStatus").innerText = `L'autre joueur a joué : (${message.x}, ${message.y})`;

      if (playerGrid[message.x][message.y].status === 'empty') {
        const result = attack(message.x, message.y);
        connection.send(JSON.stringify({ type: "move", result, x: message.x, y: message.y }));
      }
      updateGrids();
      playerTurn = true;
    }
  });

  connection.on("open", () => {
    console.log("Connexion entrante établie !");
    document.getElementById("gameStatus").innerText = "Partie en cours...";
    connection.send(JSON.stringify({ type: "message", text: "Début de la partie !" }));
  });
});

function updateGrids() {
  renderGrid(playerGrid, "playerGrid");
  renderGrid(opponentGrid, "opponentGrid");
}

updateGrids();
