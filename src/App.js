import React from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom'

import Profile from './components/Profile'
import Home from './components/Home'

function App() {
  return (
      <Router>
          <div>
              <nav id="navbar">
                      <ul>
                          <li>
                              <Link to="/">Home</Link>
                          </li>
                          <li>
                              <Link to="/profile">profile</Link>
                          </li>
                      </ul>
              </nav>
          </div>
          <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/profile" element={<Profile/>}/>
          </Routes>
      </Router>
  );
}

export default App;
