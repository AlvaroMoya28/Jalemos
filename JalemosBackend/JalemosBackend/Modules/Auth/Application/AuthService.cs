using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Auth.Application.DTOs;
using JalemosBackend.Modules.Email;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure;

namespace JalemosBackend.Modules.Auth.Application
{
    // Handles credential verification, bcrypt password hashing, and JWT generation.
    // New users always get role=passenger; role upgrades happen via the admin panel.
    public sealed class AuthService : IAuthService
    {
        // How long a verification code stays valid, and the minimum wait between resends.
        private static readonly TimeSpan VerificationValidity = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan ResendCooldown       = TimeSpan.FromSeconds(60);

        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly GoogleTokenValidator _google;
        private readonly ILogger<AuthService> _logger;

        public AuthService(ApplicationDbContext db, IConfiguration config, IEmailService emailService, GoogleTokenValidator google, ILogger<AuthService> logger)
        {
            _db = db;
            _config = config;
            _emailService = emailService;
            _google = google;
            _logger = logger;
        }

        public async Task<AuthResponseDto?> LoginAsync(string identifier, string password, CancellationToken ct = default)
        {
            var lower = identifier.Trim().ToLower();
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == lower || u.Username.ToLower() == lower, ct);

            // Google-only accounts have no password hash — they can't log in this way.
            if (user is null || user.PasswordHash is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            if (!user.IsActive)
                throw new AccountBlockedException(isDeactivated: true);

            if (user.SuspendedUntil.HasValue && user.SuspendedUntil.Value > DateTime.UtcNow)
                throw new AccountBlockedException(isDeactivated: false, suspendedUntil: user.SuspendedUntil.Value);

            if (!user.IsEmailVerified)
                throw new EmailNotVerifiedException(user.UserId, user.Email);

            return BuildResponse(user);
        }

        public async Task<RegisterPendingDto> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default)
        {
            var emailLower    = dto.Email.Trim().ToLower();
            var usernameLower = dto.Username.Trim().ToLower();

            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct))
                throw new InvalidOperationException("Ya existe una cuenta con ese correo.");

            if (await _db.Users.AnyAsync(u => u.Username.ToLower() == usernameLower, ct))
                throw new InvalidOperationException("Ese nombre de usuario ya está en uso.");

            var code      = Random.Shared.Next(100_000, 999_999).ToString();
            var expiresAt = DateTime.UtcNow.Add(VerificationValidity);

            var entity = new UserEntity
            {
                UserId                      = Guid.NewGuid(),
                Username                    = dto.Username.Trim(),
                Email                       = emailLower,
                PasswordHash                = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FirstName                   = dto.FirstName.Trim(),
                LastName                    = dto.LastName.Trim(),
                Role                        = UserRole.passenger,
                IsActive                    = true,
                IsEmailVerified             = false,
                EmailVerificationCode       = code,
                EmailVerificationExpiresAt  = expiresAt,
                CreatedAt                   = DateTime.UtcNow,
                UpdatedAt                   = DateTime.UtcNow,
            };

            _db.Users.Add(entity);
            await _db.SaveChangesAsync(ct);

            try
            {
                await _emailService.SendVerificationCodeAsync(emailLower, dto.FirstName.Trim(), code, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}", emailLower);
            }

            return new RegisterPendingDto(entity.UserId, emailLower, expiresAt);
        }

        public async Task<AuthResponseDto> VerifyEmailAsync(VerifyEmailRequestDto dto, CancellationToken ct = default)
        {
            var entity = await _db.Users
                .FirstOrDefaultAsync(u => u.UserId == dto.UserId, ct)
                ?? throw new KeyNotFoundException("Usuario no encontrado.");

            if (entity.IsEmailVerified)
                return BuildResponse(entity);

            if (entity.EmailVerificationCode is null || entity.EmailVerificationExpiresAt is null)
                throw new InvalidOperationException("No hay un código de verificación pendiente.");

            if (entity.EmailVerificationExpiresAt < DateTime.UtcNow)
                throw new InvalidOperationException("El código ha expirado. Registrate de nuevo.");

            if (entity.EmailVerificationCode != dto.Code.Trim())
                throw new UnauthorizedAccessException("Código incorrecto.");

            entity.IsEmailVerified            = true;
            entity.EmailVerificationCode      = null;
            entity.EmailVerificationExpiresAt = null;
            entity.UpdatedAt                  = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            // Welcome email with the boarding QR — best-effort, never blocks verification.
            try
            {
                await _emailService.SendWelcomeWithQrAsync(entity.Email, entity.FirstName, entity.QrToken.ToString(), ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", entity.Email);
            }

            return BuildResponse(entity);
        }

        public async Task<DateTime> ResendVerificationAsync(ResendVerificationRequestDto dto, CancellationToken ct = default)
        {
            var entity = await _db.Users
                .FirstOrDefaultAsync(u => u.UserId == dto.UserId, ct)
                ?? throw new KeyNotFoundException("Usuario no encontrado.");

            if (entity.IsEmailVerified)
                throw new InvalidOperationException("Esta cuenta ya está verificada.");

            // Enforce the resend cooldown. The last-sent moment is derived from the
            // current code's expiry (sentAt = expiresAt - validity), so no extra column.
            if (entity.EmailVerificationExpiresAt is DateTime exp)
            {
                var sentAt  = exp - VerificationValidity;
                var elapsed = DateTime.UtcNow - sentAt;
                if (elapsed < ResendCooldown)
                    throw new ResendCooldownException((int)Math.Ceiling((ResendCooldown - elapsed).TotalSeconds));
            }

            var code      = Random.Shared.Next(100_000, 999_999).ToString();
            var expiresAt = DateTime.UtcNow.Add(VerificationValidity);

            entity.EmailVerificationCode      = code;
            entity.EmailVerificationExpiresAt = expiresAt;
            entity.UpdatedAt                  = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            await _emailService.SendVerificationCodeAsync(entity.Email, entity.FirstName, code, ct);

            return expiresAt;
        }

        public async Task<AuthResponseDto?> RefreshAsync(Guid userId, CancellationToken ct = default)
        {
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, ct);

            if (user is null) return null;

            if (!user.IsActive)
                throw new AccountBlockedException(isDeactivated: true);

            if (user.SuspendedUntil.HasValue && user.SuspendedUntil.Value > DateTime.UtcNow)
                throw new AccountBlockedException(isDeactivated: false, suspendedUntil: user.SuspendedUntil.Value);

            return BuildResponse(user);
        }

        // --- Google Sign-In, step 1: validate the token and route the user ---
        public async Task<GoogleSignInResultDto> GoogleSignInAsync(string idToken, CancellationToken ct = default)
        {
            var profile = await _google.ValidateAsync(idToken, ct)
                ?? throw new InvalidOperationException("El token de Google no es válido.");

            var emailLower = profile.Email.Trim().ToLower();

            // Returning Google user (matched by the stable Google id) → log in.
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.GoogleId == profile.Sub, ct);
            if (user is not null)
            {
                if (!user.IsActive)
                    throw new AccountBlockedException(isDeactivated: true);
                if (user.SuspendedUntil.HasValue && user.SuspendedUntil.Value > DateTime.UtcNow)
                    throw new AccountBlockedException(isDeactivated: false, suspendedUntil: user.SuspendedUntil.Value);

                return new GoogleSignInResultDto(false, BuildResponse(user), null);
            }

            // A local (password) account already owns this email → don't silently take it over.
            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct))
                throw new InvalidOperationException("Ese correo ya está registrado con contraseña. Iniciá sesión con tu contraseña.");

            // Brand-new Google user → tell the app to collect a username.
            var suggested = await SuggestUsernameAsync(emailLower, ct);
            var prefill = new GoogleProfilePrefillDto(
                Email:             emailLower,
                FirstName:         profile.FirstName,
                LastName:          profile.LastName,
                SuggestedUsername: suggested,
                PhotoUrl:          profile.Picture);

            return new GoogleSignInResultDto(true, null, prefill);
        }

        // --- Google Sign-In, step 2: create the account with the chosen username ---
        public async Task<AuthResponseDto> GoogleCompleteAsync(GoogleCompleteRequestDto dto, CancellationToken ct = default)
        {
            var profile = await _google.ValidateAsync(dto.IdToken, ct)
                ?? throw new InvalidOperationException("El token de Google no es válido.");

            var emailLower    = profile.Email.Trim().ToLower();
            var usernameLower = dto.Username.Trim().ToLower();

            // If the account was created in the meantime (double-tap, retry), just log in.
            var existing = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == profile.Sub, ct);
            if (existing is not null)
                return BuildResponse(existing);

            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == emailLower, ct))
                throw new InvalidOperationException("Ese correo ya está registrado con contraseña. Iniciá sesión con tu contraseña.");

            if (await _db.Users.AnyAsync(u => u.Username.ToLower() == usernameLower, ct))
                throw new InvalidOperationException("Ese nombre de usuario ya está en uso.");

            var firstName = string.IsNullOrWhiteSpace(dto.FirstName) ? profile.FirstName : dto.FirstName.Trim();
            var lastName  = string.IsNullOrWhiteSpace(dto.LastName) ? profile.LastName : dto.LastName.Trim();

            var entity = new UserEntity
            {
                UserId          = Guid.NewGuid(),
                Username        = dto.Username.Trim(),
                Email           = emailLower,
                PasswordHash    = null,               // Google accounts authenticate through Google.
                GoogleId        = profile.Sub,
                FirstName       = firstName,
                LastName        = lastName,
                Role            = UserRole.passenger,
                IsActive        = true,
                IsEmailVerified = true,               // Google already verified the email.
                ProfilePhotoUrl = profile.Picture,
                CreatedAt       = DateTime.UtcNow,
                UpdatedAt       = DateTime.UtcNow,
            };

            _db.Users.Add(entity);
            await _db.SaveChangesAsync(ct);

            // Welcome email with the boarding QR — best-effort, never blocks signup.
            try
            {
                await _emailService.SendWelcomeWithQrAsync(entity.Email, entity.FirstName, entity.QrToken.ToString(), ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", entity.Email);
            }

            return BuildResponse(entity);
        }

        // Derives a free username from the email local-part, appending a number on collisions.
        private async Task<string> SuggestUsernameAsync(string email, CancellationToken ct)
        {
            var baseName = new string(email.Split('@')[0]
                .Where(c => char.IsLetterOrDigit(c) || c is '_' or '.').ToArray());
            if (baseName.Length < 3) baseName = $"user{baseName}";
            if (baseName.Length > 40) baseName = baseName[..40];

            var candidate = baseName;
            var suffix = 0;
            while (await _db.Users.AnyAsync(u => u.Username.ToLower() == candidate.ToLower(), ct))
            {
                suffix++;
                candidate = $"{baseName}{suffix}";
            }
            return candidate;
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
                Token:               GenerateJwt(user),
                Id:                  user.UserId.ToString(),
                Username:            user.Username,
                Email:               user.Email,
                FirstName:           user.FirstName,
                LastName:            user.LastName,
                Role:                role,
                Avatar:              avatar.ToUpper(),
                ProfilePhotoUrl:     user.ProfilePhotoUrl,
                ProfilePhotoLocked:  user.ProfilePhotoLocked,
                Rating:              user.MeanRating,
                TripsCount:          user.TotalTrips,
                DriverTripsCount:    user.DriverTrips,
                MemberSince:         memberSince,
                LicenseExpiryMonth:  user.LicenseExpiryMonth,
                LicenseExpiryYear:   user.LicenseExpiryYear,
                DekraExpiryMonth:    user.DekraExpiryMonth,
                DekraExpiryYear:     user.DekraExpiryYear
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
