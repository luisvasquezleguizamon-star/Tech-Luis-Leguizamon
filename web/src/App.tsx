import { AccountTree } from './features/accounts/components/AccountTree'
import { useCatalogTree } from './features/accounts/useAccounts'
import './features/accounts/accounts.css'

function App() {
  const tree = useCatalogTree()

  return (
    <main className="app">
      <h1>Catálogo de cuentas</h1>

      {tree.isPending && <p className="status">Cargando catálogo…</p>}

      {tree.isError && (
        <div className="alert" role="alert">
          <p>{tree.error.message}</p>
          <button type="button" onClick={() => tree.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {tree.isSuccess &&
        (tree.data.length === 0 ? (
          <p className="status">El catálogo está vacío.</p>
        ) : (
          <AccountTree nodes={tree.data} />
        ))}
    </main>
  )
}

export default App