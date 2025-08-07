output "internal_connection_string" {
  # Replace is a hack. Normal connection string does not meet Ponder requirements - it expects port to be specified.
  value = replace(render_postgres.database.connection_info.internal_connection_string, "/ensnode_db", ":5432/ensnode_db")
}
