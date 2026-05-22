using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using JalemosBackend.Modules.Users.Infrastructure.Entities;

namespace JalemosBackend.Infrastructure.Persistence
{
    // Enums for Postgres enum types.
    public enum TripState { scheduled, in_progress, completed, cancelled }
    public enum BookingState { pending, confirmed, cancelled, completed }
    public enum PlaceType { home, work, other }
    public enum PaymentType { cash, card, sinpe, other }
    public enum NotificationType { booking_received, booking_confirmed, booking_cancelled, trip_starting, trip_completed, rating_received, general }

    // This is the EF Core DBContext that represents the database session and provides access to the tables via DbSet<TEntity>.
    // It is registered in the DI container in Program.cs and injected into repositories, services, and controllers as needed.
    public sealed class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<UserEntity> Users { get; set; } = null!;
        public DbSet<VehicleEntity> Vehicles { get; set; } = null!;
        public DbSet<TripEntity> Trips { get; set; } = null!;
        public DbSet<BookingEntity> Bookings { get; set; } = null!;
        public DbSet<RatingEntity> Ratings { get; set; } = null!;
        public DbSet<FavoritePlaceEntity> FavoritePlaces { get; set; } = null!;
        public DbSet<PaymentMethodEntity> PaymentMethods { get; set; } = null!;
        public DbSet<NotificationEntity> Notifications { get; set; } = null!;

        // Configure the EF Core model and mappings to the database schema using the Fluent API.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Register Postgres enums and extension
            modelBuilder.HasPostgresEnum<TripState>("trip_state");
            modelBuilder.HasPostgresEnum<BookingState>("booking_state");
            modelBuilder.HasPostgresEnum<PlaceType>("place_type");
            modelBuilder.HasPostgresEnum<PaymentType>("payment_type");
            modelBuilder.HasPostgresEnum<NotificationType>("notification_type");
            modelBuilder.HasPostgresExtension("pgcrypto");

            // Users
            modelBuilder.Entity<UserEntity>(e =>
            {
                e.ToTable("users");
                e.HasKey(x => x.UserId).HasName("pk_users");
                e.Property(x => x.UserId).HasColumnName("user_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                e.Property(x => x.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
                e.Property(x => x.Password).HasColumnName("password").HasMaxLength(255).IsRequired();
                e.Property(x => x.MeanRating).HasColumnName("mean_rating").HasColumnType("numeric(3,2)").HasDefaultValue(0.00m);
                e.Property(x => x.TotalTrips).HasColumnName("total_trips").HasDefaultValue(0);
                e.Property(x => x.Kms).HasColumnName("kms").HasColumnType("numeric(10,2)").HasDefaultValue(0);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.Email).IsUnique();
            });

            // Vehicles
            modelBuilder.Entity<VehicleEntity>(e =>
            {
                e.ToTable("vehicles");
                e.HasKey(x => x.VehicleId);
                e.Property(x => x.VehicleId).HasColumnName("vehicle_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                e.Property(x => x.Model).HasColumnName("model").HasMaxLength(100).IsRequired();
                e.Property(x => x.Year).HasColumnName("year").IsRequired();
                e.Property(x => x.NumPlate).HasColumnName("num_plate").HasMaxLength(20).IsRequired();
                e.Property(x => x.Color).HasColumnName("color").HasMaxLength(50).IsRequired();
                e.Property(x => x.Active).HasColumnName("active").HasDefaultValue(true);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.NumPlate).IsUnique();
                e.HasIndex(x => x.UserId).HasDatabaseName("idx_vehicles_user");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            // Trips
            modelBuilder.Entity<TripEntity>(e =>
            {
                e.ToTable("trips");
                e.HasKey(x => x.TripId);
                e.Property(x => x.TripId).HasColumnName("trip_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.DriverUserId).HasColumnName("driver_user_id").IsRequired();
                e.Property(x => x.VehicleId).HasColumnName("vehicle_id").IsRequired();
                e.Property(x => x.Rate).HasColumnName("rate").HasColumnType("numeric(8,2)").IsRequired();
                e.Property(x => x.FromLocation).HasColumnName("from_location").HasMaxLength(255).IsRequired();
                e.Property(x => x.ToLocation).HasColumnName("to_location").HasMaxLength(255).IsRequired();
                e.Property(x => x.StartDateTime).HasColumnName("start_date_time").IsRequired();
                e.Property(x => x.TotalSeats).HasColumnName("total_seats").IsRequired();
                e.Property(x => x.AvailableSeats).HasColumnName("available_seats").IsRequired();
                e.Property(x => x.Notes).HasColumnName("notes");
                e.Property(x => x.State).HasColumnName("state").HasColumnType("trip_state").HasDefaultValue(TripState.scheduled);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.DriverUserId).HasDatabaseName("idx_trips_driver");
                e.HasIndex(x => x.State).HasDatabaseName("idx_trips_state");
                e.HasIndex(x => x.StartDateTime).HasDatabaseName("idx_trips_start_dt");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.DriverUserId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne<VehicleEntity>().WithMany().HasForeignKey(x => x.VehicleId).OnDelete(DeleteBehavior.Restrict);
                e.HasCheckConstraint("chk_seats", "available_seats <= total_seats");
            });

            // Bookings
            modelBuilder.Entity<BookingEntity>(e =>
            {
                e.ToTable("bookings");
                e.HasKey(x => x.BookingId);
                e.Property(x => x.BookingId).HasColumnName("booking_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.TripId).HasColumnName("trip_id").IsRequired();
                e.Property(x => x.PassengerId).HasColumnName("passenger_id").IsRequired();
                e.Property(x => x.SeatsReserved).HasColumnName("seats_reserved").IsRequired();
                e.Property(x => x.EstimatedAmount).HasColumnName("estimated_amount").HasColumnType("numeric(10,2)").IsRequired();
                e.Property(x => x.State).HasColumnName("state").HasColumnType("booking_state").HasDefaultValue(BookingState.pending);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.TripId).HasDatabaseName("idx_bookings_trip");
                e.HasIndex(x => x.PassengerId).HasDatabaseName("idx_bookings_passenger");
                e.HasIndex(x => new { x.TripId, x.PassengerId }).IsUnique().HasDatabaseName("uq_booking_passenger_trip");
                e.HasOne<TripEntity>().WithMany().HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.PassengerId).OnDelete(DeleteBehavior.Restrict);
            });

            // Ratings
            modelBuilder.Entity<RatingEntity>(e =>
            {
                e.ToTable("ratings");
                e.HasKey(x => x.RatingId);
                e.Property(x => x.RatingId).HasColumnName("rating_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.TripId).HasColumnName("trip_id").IsRequired();
                e.Property(x => x.RaterId).HasColumnName("rater_id").IsRequired();
                e.Property(x => x.RatedId).HasColumnName("rated_id").IsRequired();
                e.Property(x => x.Rating).HasColumnName("rating").IsRequired();
                e.Property(x => x.Comment).HasColumnName("comment");
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.RatedId).HasDatabaseName("idx_ratings_rated");
                e.HasIndex(x => new { x.TripId, x.RaterId, x.RatedId }).IsUnique().HasDatabaseName("uq_rating_per_trip");
                e.HasCheckConstraint("chk_no_self_rating", "rater_id <> rated_id");
                e.HasOne<TripEntity>().WithMany().HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.RaterId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.RatedId).OnDelete(DeleteBehavior.Cascade);
            });

            // Favorite_places
            modelBuilder.Entity<FavoritePlaceEntity>(e =>
            {
                e.ToTable("favorite_places");
                e.HasKey(x => x.FavoritePlaceId);
                e.Property(x => x.FavoritePlaceId).HasColumnName("favorite_place_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                e.Property(x => x.Type).HasColumnName("type").HasColumnType("place_type").HasDefaultValue(PlaceType.other);
                e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                e.Property(x => x.Address).HasColumnName("address").HasMaxLength(255).IsRequired();
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.UserId).HasDatabaseName("idx_favplaces_user");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            // Payment_methods
            modelBuilder.Entity<PaymentMethodEntity>(e =>
            {
                e.ToTable("payment_methods");
                e.HasKey(x => x.PaymentId);
                e.Property(x => x.PaymentId).HasColumnName("payment_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                e.Property(x => x.Type).HasColumnName("type").HasColumnType("payment_type").IsRequired();
                e.Property(x => x.Alias).HasColumnName("alias").HasMaxLength(100).IsRequired();
                e.Property(x => x.Active).HasColumnName("active").HasDefaultValue(true);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.UserId).HasDatabaseName("idx_payment_user");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            // Notifications
            modelBuilder.Entity<NotificationEntity>(e =>
            {
                e.ToTable("notifications");
                e.HasKey(x => x.NotificationId);
                e.Property(x => x.NotificationId).HasColumnName("notification_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                e.Property(x => x.TripId).HasColumnName("trip_id");
                e.Property(x => x.BookingId).HasColumnName("booking_id");
                e.Property(x => x.Type).HasColumnName("type").HasColumnType("notification_type").HasDefaultValue(NotificationType.general);
                e.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
                e.Property(x => x.Read).HasColumnName("read").HasDefaultValue(false);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => new { x.UserId }).HasDatabaseName("idx_notif_user_unread");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne<TripEntity>().WithMany().HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.SetNull);
                e.HasOne<BookingEntity>().WithMany().HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.SetNull);
            });
        }
    }

    // TODO: This classes should be moved to separate files.
    public class VehicleEntity
    {
        public Guid VehicleId { get; set; }
        public Guid UserId { get; set; }
        public string Model { get; set; } = null!;
        public short Year { get; set; }
        public string NumPlate { get; set; } = null!;
        public string Color { get; set; } = null!;
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TripEntity
    {
        public Guid TripId { get; set; }
        public Guid DriverUserId { get; set; }
        public Guid VehicleId { get; set; }
        public decimal Rate { get; set; }
        public string FromLocation { get; set; } = null!;
        public string ToLocation { get; set; } = null!;
        public DateTime StartDateTime { get; set; }
        public short TotalSeats { get; set; }
        public short AvailableSeats { get; set; }
        public string? Notes { get; set; }
        public TripState State { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class BookingEntity
    {
        public Guid BookingId { get; set; }
        public Guid TripId { get; set; }
        public Guid PassengerId { get; set; }
        public short SeatsReserved { get; set; }
        public decimal EstimatedAmount { get; set; }
        public BookingState State { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class RatingEntity
    {
        public Guid RatingId { get; set; }
        public Guid TripId { get; set; }
        public Guid RaterId { get; set; }
        public Guid RatedId { get; set; }
        public short Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class FavoritePlaceEntity
    {
        public Guid FavoritePlaceId { get; set; }
        public Guid UserId { get; set; }
        public PlaceType Type { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    public class PaymentMethodEntity
    {
        public Guid PaymentId { get; set; }
        public Guid UserId { get; set; }
        public PaymentType Type { get; set; }
        public string Alias { get; set; } = null!;
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationEntity
    {
        public Guid NotificationId { get; set; }
        public Guid UserId { get; set; }
        public Guid? TripId { get; set; }
        public Guid? BookingId { get; set; }
        public NotificationType Type { get; set; }
        public string Title { get; set; } = null!;
        public bool Read { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}