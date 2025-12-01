import stability from './assets/stability.png';
import './App.css';

function App() {
  return (
    <>
      <div className="App">
        <header className="App-header">
          <img src={stability} className="App-logo" alt="logo" />
          <h2>
            Welcome to FoodPriceNet!
          </h2>
          <ul className="feature-list">
            <li>📊 Explore food price trends over time</li>
            <li>🔍 Run SPARQL queries with a simple UI</li>
            <li>🌐 Built on open semantic web standards</li>
          </ul>
          <br />
          <a
            className="App-link"
            href="/queryboard"
            target="_blank"
            rel="noopener noreferrer"
            type="button"
          >
            Get Started
          </a>
        </header>
        <footer className="App-footer">
          <small>© 2025 FoodPriceNet. All rights reserved. Made with ❤️ by SER531 Group 5</small>
        </footer>
      </div>
    </>
  );
}

export default App;
