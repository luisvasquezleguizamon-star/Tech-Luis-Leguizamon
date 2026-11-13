import { useState } from 'react'
import type { AccountNode } from '../types'
import { AccountTreeNode } from './AccountTreeNode'

interface Props {
  nodes: AccountNode[]
}

function codesWithChildren(nodes: AccountNode[]): string[] {
  return nodes.flatMap((n) => (n.children.length ? [n.code, ...codesWithChildren(n.children)] : []))
}

export function AccountTree({ nodes }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const toggle = (code: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })

  return (
    <section>
      <div className="tree-toolbar">
        <button type="button" onClick={() => setExpanded(new Set(codesWithChildren(nodes)))}>
          Expandir todo
        </button>
        <button type="button" onClick={() => setExpanded(new Set())}>
          Colapsar todo
        </button>
      </div>
      <ul className="tree" role="tree">
        {nodes.map((node) => (
          <AccountTreeNode key={node.code} node={node} expanded={expanded} onToggle={toggle} />
        ))}
      </ul>
    </section>
  )
}