// Entry point for the Jalemos modular monolith API.
// All module services, repositories, and shared infrastructure are registered here.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Auth.Application;
using JalemosBackend.Modules.Email;
using JalemosBackend.Modules.Storage;
using JalemosBackend.Modules.Bookings.Application;
using JalemosBackend.Modules.Bookings.Infrastructure;
using JalemosBackend.Modules.DriverApplications.Application;
using JalemosBackend.Modules.DriverApplications.Infrastructure;
using JalemosBackend.Modules.Notifications.Application;
using JalemosBackend.Modules.Notifications.Infrastructure;
using JalemosBackend.Modules.Ratings.Application;
using JalemosBackend.Modules.Ratings.Infrastructure;
using JalemosBackend.Modules.Vehicles.Application;
using JalemosBackend.Modules.Vehicles.Infrastructure;
using JalemosBackend.Modules.Trips.Application;
using JalemosBackend.Modules.Trips.Infrastructure;
using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Infrastructure;
using JalemosBackend.Modules.Payments.Application;
using JalemosBackend.Modules.Payments.Infrastructure;
using JalemosBackend.Modules.TripReports.Application;
using JalemosBackend.Modules.TripReports.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Stripe;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Npgsql.NameTranslation;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Register MVC controllers and Swagger for API documentation
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — allows the Expo app (any origin in dev) to call the API
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// JWT authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSection["Issuer"],
            ValidAudience            = jwtSection["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(jwtSection["Key"]!)),
        };
    });

// Shared database context used by all modules
var dataSourceBuilder = new NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("DefaultConnection"));
dataSourceBuilder.MapEnum<TripState>("trip_state", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<BookingState>("booking_state", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<PlaceType>("place_type", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<PaymentType>("payment_type", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<NotificationType>("notification_type", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<ApplicationStatus>("application_status", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<ReportReason>("report_reason", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<ReportStatus>("report_status", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<AdminActionType>("admin_action_type", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<PaymentStatus>("payment_status", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<TripReportType>("trip_report_type", new NpgsqlSnakeCaseNameTranslator());
dataSourceBuilder.MapEnum<TripReportStatus>("trip_report_status", new NpgsqlSnakeCaseNameTranslator());
var dataSource = dataSourceBuilder.Build();
Console.WriteLine($"DataSource type: {dataSource.GetType().FullName}");

// Push notifications — HttpClient for Expo, the sender, and the EF interceptor that
// dispatches a push whenever new notification rows are saved (covers every trigger).
builder.Services.AddHttpClient(ExpoPushSender.HttpClientName);
builder.Services.AddSingleton<IExpoPushSender, ExpoPushSender>();
builder.Services.AddSingleton<PushNotificationInterceptor>();

builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
    options.UseNpgsql(dataSource, o =>
    {
        o.MapEnum<TripState>("trip_state");
        o.MapEnum<BookingState>("booking_state");
        o.MapEnum<PlaceType>("place_type");
        o.MapEnum<PaymentType>("payment_type");
        o.MapEnum<NotificationType>("notification_type");
        o.MapEnum<ApplicationStatus>("application_status");
        o.MapEnum<ReportReason>("report_reason");
        o.MapEnum<ReportStatus>("report_status");
        o.MapEnum<AdminActionType>("admin_action_type");
        o.MapEnum<PaymentStatus>("payment_status");
        o.MapEnum<TripReportType>("trip_report_type");
        o.MapEnum<TripReportStatus>("trip_report_status");
    })
    .AddInterceptors(sp.GetRequiredService<PushNotificationInterceptor>()));

// Storage — singleton because IAmazonS3 is thread-safe and expensive to create
builder.Services.AddSingleton<IStorageService, S3StorageService>();

// Email module
builder.Services.AddScoped<IEmailService, EmailService>();

// Auth module
builder.Services.AddScoped<IAuthService, AuthService>();

// Trips module — scoped per request so each request gets its own service and repository
builder.Services.AddScoped<ITripsService, TripsService>();
builder.Services.AddScoped<ITripLifecycleService, TripLifecycleService>();
builder.Services.AddScoped<TripsRepository>();

// Users module
builder.Services.AddScoped<IUsersService, UsersService>();
builder.Services.AddScoped<UsersRepository>();

// Notifications module
builder.Services.AddScoped<INotificationsService, NotificationsService>();
builder.Services.AddScoped<NotificationsRepository>();

// Bookings module
builder.Services.AddScoped<IBookingsService, BookingsService>();
builder.Services.AddScoped<BookingsRepository>();

// Ratings module
builder.Services.AddScoped<IRatingsService, RatingsService>();
builder.Services.AddScoped<RatingsRepository>();

// Vehicles module
builder.Services.AddScoped<IVehiclesService, VehiclesService>();
builder.Services.AddScoped<VehiclesRepository>();

// DriverApplications module
builder.Services.AddScoped<IDriverApplicationsService, DriverApplicationsService>();
builder.Services.AddScoped<DriverApplicationsRepository>();

// Payments module
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
builder.Services.AddScoped<IPaymentsService, PaymentsService>();
builder.Services.AddScoped<PaymentsRepository>();

// TripReports module
builder.Services.AddScoped<ITripReportsService, TripReportsService>();
builder.Services.AddScoped<TripReportsRepository>();

var app = builder.Build();

// Enable Swagger UI only in development; production should use auth middleware and structured logging
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
