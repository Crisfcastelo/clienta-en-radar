#!/usr/bin/env bash
# Crea una cuenta de prueba con el email confirmado en el Supabase LOCAL.
# Los registros están cerrados: en producción las cuentas las crea el servidor al cobrar.
set -euo pipefail
email="${1:-}"
if [[ ! "$email" =~ ^[^@[:space:]\"]+@[^@[:space:]\"]+\.[^@[:space:]\"]+$ ]]; then
  echo "Uso: supabase/dev/crear-cuenta.sh tu@email.es" >&2
  exit 1
fi
eval "$(npx supabase status -o env)"
case "$API_URL" in
  http://127.0.0.1:* | http://localhost:*) ;;
  *) echo "Este script solo funciona con el Supabase local." >&2; exit 1 ;;
esac
curl -fsS -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"email_confirm\":true}" >/dev/null
echo "Cuenta creada: $email"
