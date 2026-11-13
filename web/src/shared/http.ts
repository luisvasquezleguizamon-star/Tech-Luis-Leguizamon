import { apiUrl } from '../api'

export class ApiError extends Error {
  readonly status: number
  readonly field: string | null
  readonly type: string | null

  constructor(message: string, status: number, field: string | null = null, type: string | null = null) {
    super(message)
    this.status = status
    this.field = field
    this.type = type
  }
}

export async function request<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(apiUrl(ruta), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError(`No se pudo conectar con la API. Revisa que esté corriendo en ${apiUrl('')}.`, 0)
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null)
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join(', ')
      : (cuerpo?.message ?? `Error HTTP ${respuesta.status}`)
    throw new ApiError(mensaje, respuesta.status, cuerpo?.field ?? null, cuerpo?.error ?? null)
  }

  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}