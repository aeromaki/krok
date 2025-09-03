import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authAtom, store } from './atoms'
import { Provider, useAtomValue } from 'jotai'
import './App.css'

import { Main, Login } from './routes'

const qc = new QueryClient();


function Protected({ children }: { children: React.ReactNode }) {
  const auth = useAtomValue(authAtom);
  return auth ? children : <Navigate to='/login' replace />
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/' element={<Protected><Main /></Protected>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
