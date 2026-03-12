import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Web3Provider from './web3/Web3Provider'
import { AuthProvider } from './context/AuthContext'
import { CommunityProvider } from './context/CommunityContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CommunityProvider>
      <Web3Provider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Web3Provider>
    </CommunityProvider>
  </StrictMode>,
)
