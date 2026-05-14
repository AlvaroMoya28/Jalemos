// Este archivo es el punto de entrada de la API monolítica modular.
// Aquí deberían registrarse los controladores, la base de datos compartida y las dependencias de cada módulo.

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

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ApplicationDbContext>();

builder.Services.AddScoped<ITripsService, TripsService>();
builder.Services.AddScoped<TripsRepository>();

builder.Services.AddScoped<IUsersService, UsersService>();
builder.Services.AddScoped<UsersRepository>();

builder.Services.AddScoped<INotificationsService, NotificationsService>();
builder.Services.AddScoped<NotificationsRepository>();

builder.Services.AddScoped<IBookingsService, BookingsService>();
builder.Services.AddScoped<BookingsRepository>();

builder.Services.AddScoped<IRatingsService, RatingsService>();
builder.Services.AddScoped<RatingsRepository>();

var app = builder.Build();

// Aquí debería ir la configuración de middlewares transversales como autenticación, autorización, logging y manejo global de errores.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
