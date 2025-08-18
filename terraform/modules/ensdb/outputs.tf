output "internal_connection_string" {
  # Replace is a hack. Normal connection string does not meet Ponder requirements - it expects port to be specified.
  value = replace(render_postgres.ensdb.connection_info.internal_connection_string, "/ensdb", ":5432/ensdb")
}
