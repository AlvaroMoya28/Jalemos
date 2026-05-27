using Microsoft.EntityFrameworkCore;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure.Entities;

namespace JalemosBackend.Infrastructure.Persistence
{
    // Enums for Postgres enum types.
    public enum TripState { Scheduled, InProgress, Completed, Cancelled }
    public enum BookingState { Pending, Confirmed, Cancelled, Completed }
    public enum PlaceType { Home, Work, Other }
    public enum PaymentType { Cash, Card, Sinpe, Other }
    public enum NotificationType { BookingReceived, BookingConfirmed, BookingCancelled, TripStarting, TripCompleted, RatingReceived, General }
    public enum ApplicationStatus { pending, under_review, needs_correction, approved, rejected }
    public enum ReportReason { bad_behavior, dangerous_driving, no_show, late_cancellation, harassment, vehicle_condition, other }
    public enum ReportStatus { pending, resolved, dismissed }
    public enum AdminActionType { suspended, deactivated, dismissed }

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
        public DbSet<DriverApplicationEntity> DriverApplications { get; set; } = null!;
        public DbSet<UserReportEntity> UserReports { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Register Postgres enums and extension
            modelBuilder.HasPostgresEnum<TripState>("trip_state");
            modelBuilder.HasPostgresEnum<BookingState>("booking_state");
            modelBuilder.HasPostgresEnum<PlaceType>("place_type");
            modelBuilder.HasPostgresEnum<PaymentType>("payment_type");
            modelBuilder.HasPostgresEnum<NotificationType>("notification_type");
            modelBuilder.HasPostgresEnum<ApplicationStatus>("application_status");
            modelBuilder.HasPostgresEnum<ReportReason>("report_reason");
            modelBuilder.HasPostgresEnum<ReportStatus>("report_status");
            modelBuilder.HasPostgresEnum<AdminActionType>("admin_action_type");
            modelBuilder.HasPostgresExtension("pgcrypto");

            // Users
            modelBuilder.Entity<UserEntity>(e =>
            {
                e.ToTable("users");
                e.HasKey(x => x.UserId).HasName("pk_users");
                e.Property(x => x.UserId).HasColumnName("user_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
                e.Property(x => x.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
                e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
                e.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
                e.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
                e.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).HasDefaultValueSql("'passenger'");
                e.Property(x => x.MeanRating).HasColumnName("mean_rating").HasColumnType("numeric(3,2)").HasDefaultValue(5.00m);
                e.Property(x => x.TotalTrips).HasColumnName("total_trips").HasDefaultValue(0);
                e.Property(x => x.DriverTrips).HasColumnName("driver_trips").HasDefaultValue(0);
                e.Property(x => x.Kms).HasColumnName("kms").HasColumnType("numeric(10,2)").HasDefaultValue(0);
                e.Property(x => x.ProfilePhotoUrl).HasColumnName("profile_photo_url");
                e.Property(x => x.ProfilePhotoLocked).HasColumnName("profile_photo_locked").HasDefaultValue(false);
                e.Property(x => x.LicenseExpiryMonth).HasColumnName("license_expiry_month");
                e.Property(x => x.LicenseExpiryYear).HasColumnName("license_expiry_year");
                e.Property(x => x.DekraExpiryMonth).HasColumnName("dekra_expiry_month");
                e.Property(x => x.DekraExpiryYear).HasColumnName("dekra_expiry_year");
                e.Property(x => x.SuspendedUntil).HasColumnName("suspended_until");
                e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.Email).IsUnique();
                e.HasIndex(x => x.Username).IsUnique();
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
                e.Property(x => x.FromLatitude).HasColumnName("from_latitude").HasColumnType("numeric(18,15)").IsRequired();
                e.Property(x => x.FromLongitude).HasColumnName("from_longitude").HasColumnType("numeric(18,15)").IsRequired();
                e.Property(x => x.ToLatitude).HasColumnName("to_latitude").HasColumnType("numeric(18,15)").IsRequired();
                e.Property(x => x.ToLongitude).HasColumnName("to_longitude").HasColumnType("numeric(18,15)").IsRequired();
                e.Property(x => x.StartDateTime).HasColumnName("start_date_time").IsRequired();
                e.Property(x => x.TotalSeats).HasColumnName("total_seats").IsRequired();
                e.Property(x => x.AvailableSeats).HasColumnName("available_seats").IsRequired();
                e.Property(x => x.Notes).HasColumnName("notes");
                e.Property(x => x.State).HasColumnName("state").HasColumnType("trip_state").HasDefaultValue(TripState.Scheduled);
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
                e.Property(x => x.State).HasColumnName("state").HasColumnType("booking_state").HasDefaultValue(BookingState.Pending);
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
                e.Property(x => x.Type).HasColumnName("type").HasColumnType("place_type").HasDefaultValue(PlaceType.Other);
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
                e.Property(x => x.Type).HasColumnName("type").HasColumnType("notification_type").HasDefaultValue(NotificationType.General);
                e.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
                e.Property(x => x.Read).HasColumnName("read").HasDefaultValue(false);
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => new { x.UserId }).HasDatabaseName("idx_notif_user_unread");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne<TripEntity>().WithMany().HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.SetNull);
                e.HasOne<BookingEntity>().WithMany().HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.SetNull);
            });

            // DriverApplications
            modelBuilder.Entity<DriverApplicationEntity>(e =>
            {
                e.ToTable("driver_applications");
                e.HasKey(x => x.ApplicationId);
                e.Property(x => x.ApplicationId).HasColumnName("application_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                e.Property(x => x.Status).HasColumnName("status").HasColumnType("application_status").HasDefaultValue(ApplicationStatus.pending);
                e.Property(x => x.Attempts).HasColumnName("attempts").HasDefaultValue((short)1);
                e.Property(x => x.Cedula).HasColumnName("cedula").HasMaxLength(20).IsRequired();
                e.Property(x => x.Address).HasColumnName("address").IsRequired();
                e.Property(x => x.VehicleBrand).HasColumnName("vehicle_brand").HasMaxLength(100).IsRequired();
                e.Property(x => x.VehicleModel).HasColumnName("vehicle_model").HasMaxLength(100).IsRequired();
                e.Property(x => x.VehicleYear).HasColumnName("vehicle_year").IsRequired();
                e.Property(x => x.VehiclePlate).HasColumnName("vehicle_plate").HasMaxLength(20).IsRequired();
                e.Property(x => x.VehicleColor).HasColumnName("vehicle_color").HasMaxLength(50).IsRequired();
                e.Property(x => x.FacePhoto).HasColumnName("face_photo");
                e.Property(x => x.LicensePhotoFront).HasColumnName("license_photo_front");
                e.Property(x => x.LicensePhotoBack).HasColumnName("license_photo_back");
                e.Property(x => x.DekraPhoto).HasColumnName("dekra_photo");
                e.Property(x => x.LicenseExpiryMonth).HasColumnName("license_expiry_month");
                e.Property(x => x.LicenseExpiryYear).HasColumnName("license_expiry_year");
                e.Property(x => x.DekraExpiryMonth).HasColumnName("dekra_expiry_month");
                e.Property(x => x.DekraExpiryYear).HasColumnName("dekra_expiry_year");
                e.Property(x => x.IsRenewal).HasColumnName("is_renewal").HasDefaultValue(false);
                e.Property(x => x.AdminIssueIds).HasColumnName("admin_issue_ids").HasColumnType("text[]");
                e.Property(x => x.AdminNotes).HasColumnName("admin_notes");
                e.Property(x => x.ReviewedAt).HasColumnName("reviewed_at");
                e.Property(x => x.SubmittedAt).HasColumnName("submitted_at").HasDefaultValueSql("NOW()");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.UserId).HasDatabaseName("idx_driver_app_user");
                e.HasIndex(x => x.Status).HasDatabaseName("idx_driver_app_status");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            // UserReports
            modelBuilder.Entity<UserReportEntity>(e =>
            {
                e.ToTable("user_reports");
                e.HasKey(x => x.ReportId);
                e.Property(x => x.ReportId).HasColumnName("report_id").HasDefaultValueSql("gen_random_uuid()");
                e.Property(x => x.ReportedUserId).HasColumnName("reported_user_id").IsRequired();
                e.Property(x => x.ReportedById).HasColumnName("reported_by_id").IsRequired();
                e.Property(x => x.Reason).HasColumnName("reason").HasColumnType("report_reason").IsRequired();
                e.Property(x => x.Details).HasColumnName("details");
                e.Property(x => x.Status).HasColumnName("status").HasColumnType("report_status").HasDefaultValue(ReportStatus.pending);
                e.Property(x => x.AdminAction).HasColumnName("admin_action").HasColumnType("admin_action_type");
                e.Property(x => x.SuspensionDays).HasColumnName("suspension_days");
                e.Property(x => x.ResolvedAt).HasColumnName("resolved_at");
                e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
                e.HasIndex(x => x.ReportedUserId).HasDatabaseName("idx_reports_reported");
                e.HasIndex(x => x.Status).HasDatabaseName("idx_reports_status");
                e.HasCheckConstraint("chk_no_self_report", "reported_user_id <> reported_by_id");
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.ReportedUserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne<UserEntity>().WithMany().HasForeignKey(x => x.ReportedById).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }

    // TODO: These classes should be moved to separate files.
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

        public decimal FromLatitude { get; set; }
        public decimal FromLongitude { get; set; }
        public decimal ToLatitude { get; set; }
        public decimal ToLongitude { get; set; }

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

    public class DriverApplicationEntity
    {
        public Guid ApplicationId { get; set; }
        public Guid UserId { get; set; }
        public ApplicationStatus Status { get; set; }
        public short Attempts { get; set; }
        public string Cedula { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string VehicleBrand { get; set; } = null!;
        public string VehicleModel { get; set; } = null!;
        public short VehicleYear { get; set; }
        public string VehiclePlate { get; set; } = null!;
        public string VehicleColor { get; set; } = null!;
        public string? FacePhoto { get; set; }
        public string? LicensePhotoFront { get; set; }
        public string? LicensePhotoBack { get; set; }
        public string? DekraPhoto { get; set; }
        public short? LicenseExpiryMonth { get; set; }
        public short? LicenseExpiryYear { get; set; }
        public short? DekraExpiryMonth { get; set; }
        public short? DekraExpiryYear { get; set; }
        public bool IsRenewal { get; set; }
        public string[]? AdminIssueIds { get; set; }
        public string? AdminNotes { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UserReportEntity
    {
        public Guid ReportId { get; set; }
        public Guid ReportedUserId { get; set; }
        public Guid ReportedById { get; set; }
        public ReportReason Reason { get; set; }
        public string? Details { get; set; }
        public ReportStatus Status { get; set; }
        public AdminActionType? AdminAction { get; set; }
        public short? SuspensionDays { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
