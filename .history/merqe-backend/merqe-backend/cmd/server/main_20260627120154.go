package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/merqe/backend/internal/handler"
	"github.com/merqe/backend/internal/middleware"
	"github.com/merqe/backend/internal/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"  // Changed from 8080 to 8081
	}

	s, err := store.New()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer s.Close()
	log.Println("connected to PostgreSQL")

	// Start background scheduler to re-sequence customer IDs every 12 hours
	go func() {
		ticker := time.NewTicker(12 * time.Hour)
		log.Println("⏰ Scheduled customer ID re-sequencing initialized (runs every 12 hours)")
		for range ticker.C {
			log.Println("⏰ Running scheduled customer ID re-sequencing...")
			if err := s.ResequenceUserIDs(); err != nil {
				log.Printf("❌ Failed to re-sequence customer IDs: %v", err)
			} else {
				log.Println("✓ Scheduled customer ID re-sequencing complete")
			}
		}
	}()

	h := handler.New(s)
    mux := http.NewServeMux()

    // Serve product images from the frontend images folder
    // Path is relative to the working directory when running: cmd/server/
    // So we go up 4 levels: server -> cmd -> merqe-backend -> merqe-backend -> mini-shop -> merqe-frontend/images
    mux.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("../../../../merqe-frontend/images"))))

    h.RegisterRoutes(mux)

    // Serve frontend HTML/CSS/JS as catch-all (must be last)
    mux.Handle("/", http.FileServer(http.Dir("../../../../merqe-frontend")))

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      middleware.CORS(middleware.Logger(mux)),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🛍  MERQE listening on http://localhost:%s", port)
		log.Printf("📊 Daily report: http://localhost:%s/api/reports/daily", port)
		log.Printf("📦 Products: http://localhost:%s/api/products", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down…")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("goodbye")
}