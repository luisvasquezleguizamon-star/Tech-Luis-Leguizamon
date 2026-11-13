import { useState } from 'react'
import type { AccountNode, Level, Nature } from '../types'
import { useDeleteAccount } from '../useAccounts'

const LEVEL_LABEL: Record<Level, string> = {
  CLASE: 'Clase',
  GRUPO: 'Grupo',
  CUENTA: 'Cuenta',
  SUBCUENTA: 'Subcuenta',
}

const NATURE_LABEL: Record<Nature, string> = {
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
}

interface Props {
  node: AccountNode
  expanded: Set<string>
  onToggle: (code: string) => void
}

export function AccountTreeNode({ node, expanded, onToggle }: Props) {
  const [confirming, setConfirming] = useState(false)
  const deleteAccount = useDeleteAccount()
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.code)

  const handleDelete = () => {
    deleteAccount.mutate(node.code, { onSettled: () => setConfirming(false) })
  }

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isOpen : undefined}>
      <div className={`tree-row${node.matched ? ' is-match' : ''}`}>
        {hasChildren ? (
          <button
            type="button"
            className="toggle"
            onClick={() => onToggle(node.code)}
            aria-label={isOpen ? `Colapsar ${node.name}` : `Expandir ${node.name}`}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className="toggle-spacer" />
        )}

        <span className="code">{node.code}</span>
        <span className="name">{node.name}</span>
        <span className="badge">{LEVEL_LABEL[node.level]}</span>
        <span className={`badge nature-${node.nature.toLowerCase()}`}>{NATURE_LABEL[node.nature]}</span>
        {node.acceptsMovements && (
          <span className="badge movements" title="No tiene subcuentas, así que admite movimientos">
            Admite movimientos
          </span>
        )}

        <span className="actions">
          {confirming ? (
            <>
              <span>¿Eliminar {node.code}?</span>
              <button type="button" className="danger" onClick={handleDelete} disabled={deleteAccount.isPending}>
                {deleteAccount.isPending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={deleteAccount.isPending}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                deleteAccount.reset()
                setConfirming(true)
              }}
            >
              Eliminar
            </button>
          )}
        </span>
      </div>

      {deleteAccount.isError && (
        <p className="row-error" role="alert">
          {deleteAccount.error.message}
        </p>
      )}

      {hasChildren && isOpen && (
        <ul role="group">
          {node.children.map((child) => (
            <AccountTreeNode key={child.code} node={child} expanded={expanded} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  )
}