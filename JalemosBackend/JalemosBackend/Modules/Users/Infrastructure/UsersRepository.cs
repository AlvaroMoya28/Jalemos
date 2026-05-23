using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure.Entities;

namespace JalemosBackend.Modules.Users.Infrastructure
{
    public sealed class UsersRepository
    {
        private readonly ApplicationDbContext _dbContext;
        public UsersRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;

        private static User MapToDomain(UserEntity e) => new User
        {
            Id          = e.UserId,
            Username    = e.Username,
            Email       = e.Email,
            PasswordHash = e.PasswordHash,
            FirstName   = e.FirstName,
            LastName    = e.LastName,
            Role        = e.Role,
            MeanRating  = e.MeanRating,
            TotalTrips  = e.TotalTrips,
            Kms         = e.Kms,
            CreatedAt   = e.CreatedAt,
            UpdatedAt   = e.UpdatedAt,
        };

        private static void MapToEntity(UserEntity e, User u)
        {
            e.Username  = u.Username;
            e.Email     = u.Email;
            e.FirstName = u.FirstName;
            e.LastName  = u.LastName;
            e.Role      = u.Role;
            if (!string.IsNullOrWhiteSpace(u.PasswordHash)) e.PasswordHash = u.PasswordHash;
            e.MeanRating = u.MeanRating;
            e.TotalTrips = u.TotalTrips;
            e.Kms        = u.Kms;
        }

        public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default) =>
            await _dbContext.Users.AsNoTracking().Select(e => MapToDomain(e)).ToListAsync(ct);

        public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            var e = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == id, ct);
            return e is null ? null : MapToDomain(e);
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
    }
}
