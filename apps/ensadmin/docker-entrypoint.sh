#!/bin/sh

# generate runtime-config.js from environment variables and place into nginx html directory
cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__ENSADMIN_RUNTIME_ENVIRONMENT_VARIABLES = {
  NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY: "${NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY}",
};
EOF

# exec docker CMD
exec "$@"
