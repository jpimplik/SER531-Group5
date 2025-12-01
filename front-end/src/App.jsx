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
        <img src={stability} className="App-logo" alt="logo" />

        <h2>Welcome to FoodPriceNet!</h2>

        <ul className="feature-list">
          <li>📊 Explore food price trends over time</li>
          <li>🔍 Run SPARQL queries with a simple UI</li>
          <li>🌐 Built on open semantic web standards</li>
        </ul>

        <br />

        <button
          className="get-started-btn"
          onClick={handleGetStarted}
        >
          Get Started ►
        </button>
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