using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Auth.Application.DTOs;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure.Entities;

namespace JalemosBackend.Modules.Auth.Application
{
    // Handles credential verification, bcrypt password hashing, and JWT generation.
    // New users always get role=passenger; role upgrades happen via the admin panel.
    public sealed class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<AuthResponseDto?> LoginAsync(string identifier, string password, CancellationToken ct = default)
        {
            var lower = identifier.Trim().ToLower();
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == lower || u.Username.ToLower() == lower, ct);

            if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            return BuildResponse(user);
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default)
        {
            var emailLower    = dto.Email.Trim().ToLower();
            var usernameLower = dto.Username.Trim().ToLower();

            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct))
                throw new InvalidOperationException("Ya existe una cuenta con ese correo.");

            if (await _db.Users.AnyAsync(u => u.Username.ToLower() == usernameLower, ct))
                throw new InvalidOperationException("Ese nombre de usuario ya está en uso.");

            var entity = new UserEntity
            {
                UserId       = Guid.NewGuid(),
                Username     = dto.Username.Trim(),
                Email        = emailLower,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FirstName    = dto.FirstName.Trim(),
                LastName     = dto.LastName.Trim(),
                Role         = UserRole.passenger,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow,
            };

            _db.Users.Add(entity);
            await _db.SaveChangesAsync(ct);

            return BuildResponse(entity);
        }

        private AuthResponseDto BuildResponse(UserEntity user)
        {
            var avatar = $"{(user.FirstName.Length > 0 ? user.FirstName[0] : '?')}" +
                         $"{(user.LastName.Length > 0 ? user.LastName[0] : '?')}".ToUpper();

            var role = user.Role switch
            {
                UserRole.admin    => "admin",
                UserRole.driver   => "passenger+driver",
                _                 => "passenger",
            };

            var memberSince = user.CreatedAt.ToString(
                "MMMM yyyy",
                new System.Globalization.CultureInfo("es-CR"));

            return new AuthResponseDto(
                Token:       GenerateJwt(user),
                Id:          user.UserId.ToString(),
                Username:    user.Username,
                Email:       user.Email,
                FirstName:   user.FirstName,
                LastName:    user.LastName,
                Role:        role,
                Avatar:      avatar.ToUpper(),
                Rating:      user.MeanRating,
                TripsCount:  user.TotalTrips,
                MemberSince: memberSince
            );
        }

        private string GenerateJwt(UserEntity user)
        {
            var jwtSection = _config.GetSection("Jwt");
            var key        = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
            var creds      = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiry     = DateTime.UtcNow.AddDays(int.Parse(jwtSection["ExpiryDays"] ?? "30"));

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub,   user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("username",                    user.Username),
                new Claim(ClaimTypes.Role,               user.Role.ToString()),
            };

            var token = new JwtSecurityToken(
                issuer:             jwtSection["Issuer"],
                audience:           jwtSection["Audience"],
                claims:             claims,
                expires:            expiry,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
