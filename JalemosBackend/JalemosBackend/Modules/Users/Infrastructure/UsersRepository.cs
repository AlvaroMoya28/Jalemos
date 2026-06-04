// Updated by Claude Sonnet 4.6: profile-photo persistence (get lock flag, update photo URL).
using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Application.DTOs;
using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Infrastructure
{
    public sealed class UsersRepository
    {
        private readonly ApplicationDbContext _dbContext;
        public UsersRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

        private static User MapToDomain(UserEntity e) => new User
        {
            Id              = e.UserId,
            Username        = e.Username,
            Email           = e.Email,
            PasswordHash    = e.PasswordHash,
            FirstName       = e.FirstName,
            LastName        = e.LastName,
            Role            = e.Role,
            MeanRating      = e.MeanRating,
            TotalTrips      = e.TotalTrips,
            Kms             = e.Kms,
            ProfilePhotoUrl = e.ProfilePhotoUrl,
            SuspendedUntil  = e.SuspendedUntil,
            IsActive        = e.IsActive,
            QrToken         = e.QrToken,
            CreatedAt       = e.CreatedAt,
            UpdatedAt       = e.UpdatedAt,
        };

        private static void MapToEntity(UserEntity e, User u)
        {
            e.Username  = u.Username;
            e.Email     = u.Email;
            e.FirstName = u.FirstName;
            e.LastName  = u.LastName;
            e.Role      = u.Role;
            if (!string.IsNullOrWhiteSpace(u.PasswordHash)) e.PasswordHash = u.PasswordHash;
            e.MeanRating     = u.MeanRating;
            e.TotalTrips     = u.TotalTrips;
            e.Kms            = u.Kms;
            e.SuspendedUntil = u.SuspendedUntil;
            e.IsActive       = u.IsActive;
        }

        public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
        {
            var entities = await _dbContext.Users.AsNoTracking().ToListAsync(ct);
            return entities.Select(MapToDomain).ToList();
        }

        public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            var e = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == id, ct);
            return e is null ? null : MapToDomain(e);
        }

        public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
            UserQueryParams p, CancellationToken ct = default)
        {
            var query = _dbContext.Users.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(p.Search))
            {
                var s = p.Search.Trim().ToLower();
                query = query.Where(u =>
                    u.FirstName.ToLower().Contains(s) ||
                    u.LastName.ToLower().Contains(s) ||
                    u.Username.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(p.Role) && Enum.TryParse<UserRole>(p.Role, out var roleEnum))
                query = query.Where(u => u.Role == roleEnum);

            var now = DateTime.UtcNow;
            if (p.Status == "active")
                query = query.Where(u => u.IsActive && (u.SuspendedUntil == null || u.SuspendedUntil < now));
            else if (p.Status == "suspended")
                query = query.Where(u => u.SuspendedUntil != null && u.SuspendedUntil > now);
            else if (p.Status == "deactivated")
                query = query.Where(u => !u.IsActive);

            query = p.SortBy switch
            {
                "name_desc"   => query.OrderByDescending(u => u.FirstName).ThenByDescending(u => u.LastName),
                "rating_asc"  => query.OrderBy(u => u.MeanRating),
                "rating_desc" => query.OrderByDescending(u => u.MeanRating),
                "trips_asc"   => query.OrderBy(u => u.TotalTrips),
                "trips_desc"  => query.OrderByDescending(u => u.TotalTrips),
                "newest"      => query.OrderByDescending(u => u.CreatedAt),
                "oldest"      => query.OrderBy(u => u.CreatedAt),
                _             => query.OrderBy(u => u.FirstName).ThenBy(u => u.LastName),
            };

            var total    = await query.CountAsync(ct);
            var page     = Math.Max(1, p.Page);
            var pageSize = Math.Clamp(p.PageSize, 1, 100);

            var entities = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return (entities.Select(MapToDomain), total);
        }

        public async Task CreateAsync(User user, CancellationToken ct = default)
        {
            var entity = new UserEntity
            {
                UserId       = user.Id == Guid.Empty ? Guid.NewGuid() : user.Id,
                Username     = user.Username,
                Email        = user.Email,
                PasswordHash = user.PasswordHash ?? string.Empty,
                FirstName    = user.FirstName,
                LastName     = user.LastName,
                Role         = user.Role,
                MeanRating   = user.MeanRating,
                TotalTrips   = user.TotalTrips,
                Kms          = user.Kms,
                IsActive     = true,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow,
            };
            _dbContext.Users.Add(entity);
            await _dbContext.SaveChangesAsync(ct);
            user.Id = entity.UserId;
        }

        public async Task UpdateAsync(User user, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == user.Id, ct)
                ?? throw new KeyNotFoundException("User not found");
            MapToEntity(entity, user);
            entity.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task DeleteAsync(Guid id, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct);
            if (entity is null) return;
            _dbContext.Users.Remove(entity);
            await _dbContext.SaveChangesAsync(ct);
        }

        /// <summary>Returns the user's profile-photo lock flag, or null if the user does not exist.</summary>
        public async Task<bool?> GetProfilePhotoLockedAsync(Guid id, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == id, ct);
            return entity?.ProfilePhotoLocked;
        }

        /// <summary>Persists a new profile photo URL for the user.</summary>
        public async Task UpdateProfilePhotoUrlAsync(Guid id, string? url, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct)
                ?? throw new KeyNotFoundException("User not found");
            entity.ProfilePhotoUrl = url;
            entity.UpdatedAt       = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task UpdateRoleAsync(Guid id, UserRole role, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct)
                ?? throw new KeyNotFoundException("User not found");
            entity.Role      = role;
            if (role == UserRole.passenger)
                entity.ProfilePhotoLocked = false;
            entity.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task BanAsync(Guid id, int days, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct)
                ?? throw new KeyNotFoundException("User not found");
            entity.SuspendedUntil = days == 0
                ? new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc)
                : DateTime.UtcNow.AddDays(days);
            entity.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task LiftBanAsync(Guid id, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct)
                ?? throw new KeyNotFoundException("User not found");
            entity.SuspendedUntil = null;
            entity.UpdatedAt      = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task DeactivateAsync(Guid id, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct)
                ?? throw new KeyNotFoundException("User not found");
            entity.IsActive  = false;
            entity.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }

        public async Task ActivateAsync(Guid id, CancellationToken ct = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, ct)
                ?? throw new KeyNotFoundException("User not found");
            entity.IsActive       = true;
            entity.SuspendedUntil = null;
            entity.UpdatedAt      = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
        }
    }
}
