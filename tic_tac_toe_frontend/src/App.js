import React, { useState, useEffect } from "react";
import "./App.css";

// Config
const API_URL = "https://vscode-internal-113-dev.dev01.cloud.kavia.ai:3001";

// Utilities
function saveToken(token) {
  localStorage.setItem("jwt_token", token);
}
function getToken() {
  return localStorage.getItem("jwt_token");
}
function clearToken() {
  localStorage.removeItem("jwt_token");
}
function apiHeaders() {
  const jwt = getToken();
  if (!jwt) return {};
  return { "Authorization": `Bearer ${jwt}` };
}

// PUBLIC_INTERFACE
function App() {
  // App State
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("login"); // login | register | lobby | game | history
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(getToken());
  // Lobby/game state
  const [games, setGames] = useState([]); // {id, status, player_x_id, player_o_id, ...}
  const [activeGame, setActiveGame] = useState(null); // game object
  const [gameError, setGameError] = useState("");
  const [moveError, setMoveError] = useState("");
  const [gameState, setGameState] = useState(null); // Board and game info
  const [isPolling, setIsPolling] = useState(false); // for real-time updates
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // THEME: adapt to brand colors
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Login status effect
  useEffect(() => {
    if (!jwt) {
      setView("login");
      setUser(null);
      clearToken();
    }
  }, [jwt]);

  // Fetch lobby after login
  useEffect(() => {
    if (jwt && user && view === "lobby") {
      fetchGames();
    }
    // eslint-disable-next-line
  }, [view, jwt, user]);

  // Poll for game state when in-game
  useEffect(() => {
    let interval;
    if (activeGame && view === "game") {
      fetchGameState(activeGame.id);
      setIsPolling(true);
      interval = setInterval(() => {
        fetchGameState(activeGame.id, true);
      }, 2000);
    } else {
      setIsPolling(false);
    }
    return () => interval && clearInterval(interval);
    // eslint-disable-next-line
  }, [activeGame, view]);

  // API: Registration
  // PUBLIC_INTERFACE
  async function handleRegister(username, password) {
    setIsLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      setView("login");
      setAuthError("Registration successful. Please login.");
    } catch (e) {
      setAuthError(e.message);
    }
    setIsLoading(false);
  }

  // API: Login, JWT storage
  // PUBLIC_INTERFACE
  async function handleLogin(username, password) {
    setIsLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        throw new Error(data.detail || "Invalid credentials");
      }
      saveToken(data.access_token);
      setJwt(data.access_token);
      setUser({ username });
      setAuthError("");
      setView("lobby");
    } catch (e) {
      setAuthError(e.message);
      clearToken();
      setJwt(null);
    }
    setIsLoading(false);
  }

  // API: logout
  // PUBLIC_INTERFACE
  function handleLogout() {
    setUser(null);
    setJwt(null);
    clearToken();
    setGames([]);
    setActiveGame(null);
    setHistory([]);
  }

  // API: Fetch list of games (lobby)
  // PUBLIC_INTERFACE
  async function fetchGames() {
    if (!jwt) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me/games`, {
        headers: { ...apiHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch games");
      setGames(data);
    } catch (e) {
      setGameError(e.message);
    }
    setIsLoading(false);
  }

  // API: Create Game
  // PUBLIC_INTERFACE
  async function handleCreateGame() {
    setGameError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create game");
      setActiveGame(data);
      setView("game");
    } catch (e) {
      setGameError(e.message);
    }
    setIsLoading(false);
  }

  // API: Join Game
  // PUBLIC_INTERFACE
  async function handleJoinGame(gameId) {
    setGameError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/${gameId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to join game");
      setActiveGame(data);
      setView("game");
    } catch (e) {
      setGameError(e.message);
    }
    setIsLoading(false);
  }

  // API: Fetch Game State
  // PUBLIC_INTERFACE
  async function fetchGameState(gameId, poll = false) {
    try {
      const res = await fetch(`${API_URL}/games/${gameId}`, {
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (res.ok && data && data.state) {
        setGameState(data);
      } else if (!poll) {
        setMoveError(data.detail || "Failed to fetch game state");
      }
    } catch (e) {
      if (!poll)
        setMoveError(e.message);
    }
  }

  // API: Submit Move
  // PUBLIC_INTERFACE
  async function handleMove(x, y) {
    if (!activeGame) return;
    setMoveError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/${activeGame.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiHeaders() },
        body: JSON.stringify({ x, y }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid move");
      await fetchGameState(activeGame.id);
    } catch (e) {
      setMoveError(e.message);
    }
    setIsLoading(false);
  }

  // API: Game History
  // PUBLIC_INTERFACE
  async function handleViewHistory() {
    setIsLoading(true);
    setHistory([]);
    try {
      const res = await fetch(`${API_URL}/users/me/games`, {
        headers: { ...apiHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch game history");
      setHistory(data);
      setView("history");
    } catch (e) {
      setGameError(e.message);
      setHistory([]);
    }
    setIsLoading(false);
  }

  // API: View Game from history
  // PUBLIC_INTERFACE
  async function handleViewGameDetails(gameId) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/${gameId}`, {
        headers: apiHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load game");
      setActiveGame(data);
      setGameState(data);
      setView("game");
    } catch (e) {
      setGameError(e.message);
    }
    setIsLoading(false);
  }

  // UI COMPONENTS

  // Authentication Forms
  function AuthForm({ type, onSubmit, loading, error, switchMode }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    return (
      <div className="auth-form">
        <h2>{type === "register" ? "Register" : "Login"}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit(username, password);
          }}
          className="form-box"
        >
          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete={type === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Please Wait..." : (type === "register" ? "Register" : "Login")}
          </button>
          <button
            type="button"
            className="btn btn-text"
            onClick={switchMode}
            disabled={loading}
          >
            {type === "register"
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>
    );
  }

  // Lobby List
  function Lobby() {
    return (
      <section className="lobby-section container">
        <h2>Game Lobby</h2>
        <button className="btn btn-large" onClick={handleCreateGame} disabled={isLoading}>
          + New Game
        </button>
        <button className="btn" onClick={handleViewHistory} style={{ float: "right" }}>
          View My History
        </button>
        <div style={{ margin: "1em 0" }}>
          <h3>Active Games</h3>
          {games.length === 0 && <div>No active games found.</div>}
          <ul className="game-list">
            {games.map(g =>
              <li key={g.id} className="game-list-item">
                <span>
                  Game <b>#{g.id}</b> ({g.status})<br/>
                  <small>
                    X: {g.player_x_id || "-"} | O: {g.player_o_id || "-"}
                  </small>
                </span>
                {(g.status === "ongoing" && !g.player_o_id) ? (
                  <button className="btn" onClick={() => handleJoinGame(g.id)}>
                    Join as O
                  </button>
                ) : (
                  <button className="btn btn-text" onClick={() => handleViewGameDetails(g.id)}>
                    View
                  </button>
                )}
              </li>
            )}
          </ul>
        </div>
        {gameError && <div className="error-msg">{gameError}</div>}
      </section>
    );
  }

  // Game Board
  function GameBoard() {
    const board = (gameState && gameState.state && Array.isArray(gameState.state.board))
      ? gameState.state.board
      : Array(3).fill("").map(() => Array(3).fill(""));

    const turn = gameState?.state?.turn;
    const winner = gameState?.winner;
    const status = gameState?.status;
    const userMark = user && (
      (gameState?.player_x_username === user.username && "X") ||
      (gameState?.player_o_username === user.username && "O") ||
      null
    );

    // Checks if the current user can move
    function isMyTurn() {
      return userMark && turn && status === "ongoing" && turn.toUpperCase() === userMark;
    }

    return (
      <section className="game-section container">
        <h2>Tic Tac Toe - Game #{gameState?.id}</h2>
        <div>
          <strong>
            {userMark
              ? `You are ${userMark}`
              : `Spectating (not a player in this game)`}
          </strong>
        </div>
        <div style={{margin:"1em 0"}}>
          {status === "finished" ? (
            winner
              ? <span className="winner-text">{winner === "draw" ? "Draw!" : `Winner: ${winner}`}</span>
              : "Game Over"
          ) : (
            isMyTurn()
              ? <span className="yourturn-text">Your turn ({userMark})</span>
              : <span>Waiting for {turn}'s move...</span>
          )}
        </div>
        <BoardGrid
          board={board}
          canMove={isMyTurn()}
          onMove={handleMove}
        />
        <div className="controls-row">
          <button className="btn" onClick={() => {
            setView("lobby");
            setActiveGame(null);
            setGameState(null);
            setMoveError("");
          }}>
            Back to Lobby
          </button>
          <button className="btn" onClick={() => fetchGameState(gameState.id)}>
            Refresh State
          </button>
        </div>
        {moveError && <div className="error-msg">{moveError}</div>}
      </section>
    );
  }

  // Game Board Grid
  function BoardGrid({ board, canMove, onMove }) {
    return (
      <table className="ttt-board" aria-label="Tic Tac Toe board">
        <tbody>
          {board.map((row, i) =>
            <tr key={i}>
              {row.map((cell, j) =>
                <td
                  key={j}
                  className={"ttt-cell" + (cell ? " ttt-cell-filled" : "")}
                  onClick={() => canMove && !cell && onMove(i, j)}
                  tabIndex={canMove && !cell ? 0 : -1}
                  aria-label={`cell ${i+1},${j+1}${cell ? " " + cell : ""}`}
                >
                  {cell}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  // Game History
  function HistoryView() {
    return (
      <section className="history-section container">
        <h2>Your Game History</h2>
        <button className="btn" onClick={() => setView("lobby")}>
          Back to Lobby
        </button>
        <ul className="history-list">
          {history.length === 0 && <li>No games played yet.</li>}
          {history.map(g =>
            <li key={g.id} className="history-list-item">
              <span>
                Game #{g.id} | Status: {g.status} <br/>
                <small>
                  X: {g.player_x_id || "-"} | O: {g.player_o_id || "-"}
                  {g.winner && <span> | Winner: <b>{g.winner}</b></span>}
                </small>
              </span>
              <button className="btn btn-text" onClick={() => handleViewGameDetails(g.id)}>
                View
              </button>
            </li>
          )}
        </ul>
      </section>
    );
  }

  // Header navigation
  function Header() {
    return (
      <div className="navbar">
        <span className="title" style={{ color: "var(--text-secondary)", fontWeight: 900 }}>
          <span style={{ color: "#1976d2" }}>Tic</span>
          <span style={{ color: "#424242" }}>Tac</span>
          <span style={{ color: "#fbc02d" }}>Toe</span>
        </span>
        <span className="subtitle" style={{ marginLeft: "2em" }}>
          {user ? `@${user.username}` : ""}
        </span>
        <button
          className="theme-toggle"
          onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          style={{ float: "right" }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {user && (
          <button
            className="btn btn-small"
            onClick={handleLogout}
            style={{ float: "right", marginRight: "1em" }}
          >
            Logout
          </button>
        )}
      </div>
    );
  }

  // Main view switch
  let mainView;
  if (!jwt || !user) {
    if (view === "register") {
      mainView = (
        <AuthForm
          type="register"
          onSubmit={handleRegister}
          loading={isLoading}
          error={authError}
          switchMode={() => { setView("login"); setAuthError(""); }}
        />
      );
    } else {
      mainView = (
        <AuthForm
          type="login"
          onSubmit={handleLogin}
          loading={isLoading}
          error={authError}
          switchMode={() => { setView("register"); setAuthError(""); }}
        />
      );
    }
  } else if (view === "lobby") {
    mainView = <Lobby />;
  } else if (view === "game") {
    mainView = <GameBoard />;
  } else if (view === "history") {
    mainView = <HistoryView />;
  } else {
    mainView = <div>Not found</div>;
  }

  // PUBLIC_INTERFACE
  return (
    <div className="App">
      <Header />
      <main style={{ marginTop: "5em" }}>
        {mainView}
      </main>
    </div>
  );
}

export default App;
