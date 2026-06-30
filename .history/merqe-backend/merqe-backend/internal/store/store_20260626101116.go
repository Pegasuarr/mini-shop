func loadConfig() Config {
	return Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		DBName:   getEnv("DB_NAME", "merqe_db"),
		User:     getEnv("DB_USER", "admin"),
		Password: getEnv("DB_PASSWORD", "admin"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}
}