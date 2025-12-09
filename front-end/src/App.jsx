import React, { useEffect, useState } from 'react';
import stability from './assets/stability.png';
import { createBrowserRouter, RouterProvider, useNavigate, Outlet } from "react-router";
import QueryBoard from './content/queryboard.jsx';
import './App.css';
import Loader from './components/loader.jsx';

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGetStarted = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/queryboard");
    }, 3000);
  };

  if (loading) return <Loader />;
  return (
    <div className="App">
      <header className="App-header">
        <div className="hero-card">
          <img src={stability} className="App-logo" alt="logo" />

          <div className="hero-body">
            <h2 className="hero-title">Welcome to FoodPriceNet!</h2>

            <p className="tagline">Run SPARQL queries, visualize trends, and discover relationships in open data.</p>

            <ul className="feature-list">
              <li>📊 Explore food price trends</li>
              <li>🔍 Run SPARQL queries</li>
              <li>🌐 Open semantic web standards</li>
            </ul>

            <div className="hero-actions">
              <button
                className="get-started-btn"
                onClick={handleGetStarted}
                aria-label="Get started"
              >
                <span>Get Started</span>
                <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <footer className="App-footer">
        <small>
          © 2025 FoodPriceNet. All rights reserved. Made with ❤️ by SER531 Group 5
        </small>
      </footer>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const minDelay = 3000;
    let timeoutId = null;

    const clearAndHide = () => {
      timeoutId = setTimeout(() => setLoading(false), minDelay);
    };

    if (document.readyState === 'complete') {
      clearAndHide();
    } else {
      const onLoad = () => clearAndHide();
      window.addEventListener('load', onLoad);
      const fallback = setTimeout(onLoad, 6000);
      return () => {
        window.removeEventListener('load', onLoad);
        clearTimeout(fallback);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, []);

  if (loading) return <Loader />;

  const RootLayout = () => (
  <div>
    <React.Suspense fallback={<Loader />}>
      <Outlet />
    </React.Suspense>
  </div>
);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "queryboard", element: <QueryBoard /> },
      ],
    },
]);

  return <RouterProvider router={router} />;
}

export default App;