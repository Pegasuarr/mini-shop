package store

import (
	"database/sql"
	"fmfunct"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Store struct {
	db *sql.DB
}

type Config struct {
	Host     string
	Port     string
	DBName   string
	User     string
	Password string
	SSLMode  string
}


 loadConfig() Config {
    return Config{
        Host:     "",
        Port:     "5432",
        DBName:   "merqe_db",
        User:     "admin",
        Password: "admin",
        SSLMode:  "disable",
    }
}

func (c Config) dsn() string {
	return fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=%s",
		c.Host, c.Port, c.DBName, c.User, c.Password, c.SSLMode,
	)
}

func New() (*Store, error) {
	cfg := loadConfig()
	log.Printf("connecting → postgres://%s:%s/%s (user: %s)",
		cfg.Host, cfg.Port, cfg.DBName, cfg.User)

	db, err := sql.Open("pgx", cfg.dsn())
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	if err := Migrate(db); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
