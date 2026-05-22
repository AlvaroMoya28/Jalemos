// Entry point for the Jalemos modular monolith API.
// All module services, repositories, and shared infrastructure are registered here.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Application;
using JalemosBackend.Modules.Bookings.Infrastructure;
using JalemosBackend.Modules.Notifications.Application;
using JalemosBackend.Modules.Notifications.Infrastructure;
using JalemosBackend.Modules.Ratings.Application;
using JalemosBackend.Modules.Ratings.Infrastructure;
using JalemosBackend.Modules.Rides.Application;
using JalemosBackend.Modules.Rides.Infrastructure;
using JalemosBackend.Modules.Users.Application;
using JalemosBackend.Modules.Users.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Register MVC controllers and Swagger for API documentation
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Shared database context used by all modules
// builder.Services.AddSingleton<ApplicationDbContext>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Trips module — scoped per request so each request gets its own service and repository
builder.Services.AddScoped<ITripsService, TripsService>();
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

var app = builder.Build();

// Enable Swagger UI only in development; production should use auth middleware and structured logging
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
